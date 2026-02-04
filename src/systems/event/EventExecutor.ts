/**
 * イベント実行エンジン
 * イベントコマンドを順次実行する
 */

import type { GameEvent, EventCommand } from '../../types/event'
import type { EventManager } from './EventManager'
import type { CharacterController } from '../field/CharacterController'
import { useProgressStore } from '../../stores/progressStore'
import { usePartyStore } from '../../stores/partyStore'

export interface EventExecutorOptions {
  eventManager: EventManager
  playerController: CharacterController
  onMessage: (speaker: string | undefined, text: string) => Promise<void>
  onChoice: (choices: string[], callback: (index: number) => void) => void
  onBattle: (enemyIds: string[], canEscape: boolean) => Promise<'victory' | 'defeat'>
  onChangeMap: (mapId: string, x: number, y: number) => Promise<void>
  onFadeIn: (duration: number) => Promise<void>
  onFadeOut: (duration: number) => Promise<void>
  onPlayBGM?: (bgmId: string, volume?: number, loop?: boolean) => Promise<void>
  onPlaySE?: (seId: string, volume?: number) => Promise<void>
  onComplete: () => void
}

export class EventExecutor {
  private eventManager: EventManager
  private playerController: CharacterController
  private options: EventExecutorOptions

  private currentEvent: GameEvent | null = null
  private commandIndex: number = 0
  private isExecuting: boolean = false
  private isPaused: boolean = false
  private eventStack: Array<{ event: GameEvent; commandIndex: number }> = []

  constructor(options: EventExecutorOptions) {
    this.eventManager = options.eventManager
    this.playerController = options.playerController
    this.options = options
  }

  /**
   * イベント開始
   */
  async startEvent(eventId: string): Promise<void> {
    if (this.isExecuting) {
      console.warn('[EventExecutor] Event is already executing:', this.currentEvent?.id)
      this.options.onComplete() // 入力ロック解除
      return
    }

    const event = this.eventManager.getEvent(eventId)
    if (!event) {
      console.error(`[EventExecutor] Event not found: ${eventId}`)
      this.options.onComplete() // 入力ロック解除
      return
    }

    console.log(`[EventExecutor] Starting event: ${event.id} (${event.name})`)

    this.currentEvent = event
    this.commandIndex = 0
    this.isExecuting = true
    this.isPaused = false

    try {
      await this.executeCommands()
    } catch (error) {
      console.error('[EventExecutor] Event execution error:', error)
      this.isExecuting = false
      this.currentEvent = null
      this.options.onComplete()
    }
  }

  /**
   * コマンド実行ループ
   */
  private async executeCommands(): Promise<void> {
    while (this.currentEvent && this.commandIndex < this.currentEvent.commands.length) {
      if (this.isPaused) {
        // ポーズ中は待機
        await new Promise((resolve) => setTimeout(resolve, 100))
        continue
      }

      const command = this.currentEvent.commands[this.commandIndex]
      if (!command) {
        console.error('[EventExecutor] Command is undefined at index:', this.commandIndex)
        this.commandIndex++
        continue
      }

      console.log(`[EventExecutor] Executing command #${this.commandIndex}:`, command.type)

      try {
        await this.executeCommand(command)
      } catch (error) {
        console.error('[EventExecutor] Command execution error:', error)
      }

      this.commandIndex++
    }

    // イベント完了
    this.finishEvent()
  }

  /**
   * イベント完了処理
   */
  private finishEvent(): void {
    console.log('[EventExecutor] Event completed:', this.currentEvent?.id)

    // スタックからイベントを復帰
    if (this.eventStack.length > 0) {
      const restored = this.eventStack.pop()!
      this.currentEvent = restored.event
      this.commandIndex = restored.commandIndex
      this.isPaused = false

      console.log('[EventExecutor] Resuming parent event:', this.currentEvent.id)

      // 親イベントを再開
      this.executeCommands()
    } else {
      this.isExecuting = false
      this.currentEvent = null
      this.options.onComplete()
    }
  }

  /**
   * 分岐イベント実行
   */
  private async executeBranchEvent(eventId: string): Promise<void> {
    if (!eventId) {
      return
    }

    const branchEvent = this.eventManager.getEvent(eventId)
    if (!branchEvent) {
      console.error(`[EventExecutor] Branch event not found: ${eventId}`)
      return
    }

    // 現在のイベントをスタックに保存
    if (this.currentEvent) {
      this.eventStack.push({
        event: this.currentEvent,
        commandIndex: this.commandIndex + 1, // 次のコマンドから再開
      })
    }

    // 分岐イベントを実行
    this.currentEvent = branchEvent
    // -1にセットすることで、メインループでインクリメントされて0になる
    this.commandIndex = -1
    this.isPaused = false

    console.log('[EventExecutor] Executing branch event:', branchEvent.id)
  }

  /**
   * 個別コマンド実行
   */
  private async executeCommand(command: EventCommand): Promise<void> {
    switch (command.type) {
      case 'message': {
        await this.options.onMessage(command.speaker, command.text)
        break
      }

      case 'choice': {
        // 選択肢は非同期コールバックで処理
        await new Promise<void>((resolve) => {
          this.options.onChoice(command.choices, async (choiceIndex: number) => {
            const nextEventId = command.branchEvents[choiceIndex]
            if (nextEventId) {
              await this.executeBranchEvent(nextEventId)
            }
            resolve()
          })
        })
        break
      }

      case 'move': {
        // プレイヤー移動（複数ステップ対応）
        for (let i = 0; i < command.steps; i++) {
          const success = this.playerController.startMove(command.direction)
          if (!success) {
            console.warn('[EventExecutor] Move failed:', command.direction)
            break
          }

          // 移動完了を待つ
          await this.waitForMovement()
        }
        break
      }

      case 'wait': {
        await new Promise((resolve) => setTimeout(resolve, command.duration))
        break
      }

      case 'setFlag': {
        useProgressStore.getState().setFlag(command.flag, command.value)
        break
      }

      case 'checkFlag': {
        const currentValue = useProgressStore.getState().getFlag(command.flag)
        const matches = currentValue === command.value

        if (matches && command.trueEventId) {
          await this.executeBranchEvent(command.trueEventId)
        } else if (!matches && command.falseEventId) {
          await this.executeBranchEvent(command.falseEventId)
        }
        break
      }

      case 'addItem': {
        // アイテム追加
        for (let i = 0; i < command.count; i++) {
          usePartyStore.getState().addItem(command.itemId)
        }
        console.log(`[EventExecutor] Added ${command.count}x ${command.itemId}`)
        break
      }

      case 'removeItem': {
        // アイテム削除
        for (let i = 0; i < command.count; i++) {
          usePartyStore.getState().removeItem(command.itemId)
        }
        console.log(`[EventExecutor] Removed ${command.count}x ${command.itemId}`)
        break
      }

      case 'addMember': {
        // パーティメンバー追加
        // キャラクターデータを読み込んで追加
        try {
          const basePath = import.meta.env.BASE_URL || '/'
          const response = await fetch(`${basePath}data/characters.json`)
          if (!response.ok) {
            throw new Error(`Failed to load character data: ${response.statusText}`)
          }

          const data = await response.json()

          // characters.json は配列形式
          const characterData = Array.isArray(data)
            ? data.find((c: { id: string }) => c.id === command.characterId)
            : data.characters?.find((c: { id: string }) => c.id === command.characterId)

          if (!characterData) {
            console.error(`[EventExecutor] Character not found: ${command.characterId}`)
            break
          }

          // Character型に変換（初期ステータスを設定）
          const character = {
            id: characterData.id,
            name: characterData.name,
            class: characterData.class,
            level: characterData.initialLevel || 1,
            exp: 0,
            stats: {
              hp: characterData.initialStats.maxHp,
              maxHp: characterData.initialStats.maxHp,
              mp: characterData.initialStats.maxMp,
              maxMp: characterData.initialStats.maxMp,
              attack: characterData.initialStats.attack,
              defense: characterData.initialStats.defense,
              speed: characterData.initialStats.speed,
              luck: characterData.initialStats.luck,
            },
            equipment: {
              weapon: null,
              armor: null,
            },
            skills: [],
            skillPoints: 0,
            growthRate: characterData.growthRate,
            sprite: characterData.sprite,
          }

          usePartyStore.getState().addMember(character)
          console.log(`[EventExecutor] Added member: ${character.name}`)
        } catch (error) {
          console.error('[EventExecutor] Failed to add member:', error)
        }
        break
      }

      case 'removeMember': {
        console.log('[EventExecutor] removeMember:', command.characterId)
        // TODO: パーティメンバー削除
        break
      }

      case 'battle': {
        const result = await this.options.onBattle(command.enemyIds, command.canEscape)
        if (result === 'victory' && command.victoryEventId) {
          await this.executeBranchEvent(command.victoryEventId)
        } else if (result === 'defeat' && command.defeatEventId) {
          await this.executeBranchEvent(command.defeatEventId)
        }
        break
      }

      case 'changeMap': {
        await this.options.onChangeMap(command.mapId, command.position.x, command.position.y)
        break
      }

      case 'fadeIn': {
        await this.options.onFadeIn(command.duration)
        break
      }

      case 'fadeOut': {
        await this.options.onFadeOut(command.duration)
        break
      }

      case 'playBGM': {
        if (this.options.onPlayBGM) {
          await this.options.onPlayBGM(
            command.bgmId,
            command.volume,
            command.loop ?? true
          )
        } else {
          console.warn('[EventExecutor] playBGM callback not provided')
        }
        break
      }

      case 'playSE': {
        if (this.options.onPlaySE) {
          await this.options.onPlaySE(command.seId, command.volume)
        } else {
          console.warn('[EventExecutor] playSE callback not provided')
        }
        break
      }

      default: {
        console.warn('[EventExecutor] Unknown command type:', (command as EventCommand).type)
      }
    }
  }

  /**
   * キャラクター移動完了を待つ
   */
  private async waitForMovement(): Promise<void> {
    return new Promise<void>((resolve) => {
      const checkComplete = () => {
        if (!this.playerController.isMoving()) {
          resolve()
        } else {
          requestAnimationFrame(checkComplete)
        }
      }
      checkComplete()
    })
  }

  /**
   * 実行中かチェック
   */
  isRunning(): boolean {
    return this.isExecuting
  }

  /**
   * ポーズ中かチェック
   */
  isPausedState(): boolean {
    return this.isPaused
  }

  /**
   * 実行をポーズ
   */
  pauseExecution(): void {
    this.isPaused = true
  }

  /**
   * 実行を再開
   */
  resumeExecution(): void {
    this.isPaused = false
  }
}
