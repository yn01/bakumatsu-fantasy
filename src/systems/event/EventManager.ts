/**
 * イベントマネージャー
 * イベントスクリプトの読み込みと管理を行う
 */

import type { GameEvent } from '../../types/event'

export class EventManager {
  private events: Map<string, GameEvent> = new Map()
  private loaded = false
  private failedFiles: string[] = []

  /**
   * イベントデータを読み込む
   */
  async loadData(): Promise<void> {
    if (this.loaded) return

    const basePath = import.meta.env.BASE_URL || '/'
    const scenarioFiles = [
      'data/events/test_events.json', // テスト用イベント
      'data/events/prologue.json',
      'data/events/chapter1.json',
      'data/events/chapter2.json',
      'data/events/chapter3.json',
      'data/events/epilogue.json',
      'data/events/chapter4.json',
      'data/events/chapter5.json',
      'data/events/chapter6.json',
      'data/events/chapter7.json',
      'data/events/final_chapter.json',
    ]

    for (const filePath of scenarioFiles) {
      try {
        const response = await fetch(`${basePath}${filePath}`)

        if (!response.ok) {
          // ファイルが存在しない場合はスキップ（開発中の場合を考慮）
          console.warn(`[EventManager] Scenario file not found: ${filePath}`)
          continue
        }

        const data = await response.json()

        // データ検証
        if (!Array.isArray(data.events)) {
          console.error(`[EventManager] Invalid scenario file format: ${filePath}`)
          continue
        }

        // イベントをMapに登録
        for (const event of data.events) {
          if (!this.validateEvent(event)) {
            console.error(`[EventManager] Invalid event in ${filePath}:`, event)
            continue
          }

          if (this.events.has(event.id)) {
            console.warn(`[EventManager] Duplicate event ID: ${event.id}`)
          }

          this.events.set(event.id, event)
        }

        console.log(`[EventManager] Loaded ${data.events.length} events from ${filePath}`)
      } catch (error) {
        console.error(`[EventManager] Failed to load ${filePath}:`, error)
        this.failedFiles.push(filePath)
      }
    }

    this.loaded = true
    console.log(`[EventManager] Total events loaded: ${this.events.size}`)

    if (this.failedFiles.length > 0) {
      console.warn(`[EventManager] Failed to load ${this.failedFiles.length} scenario files:`, this.failedFiles)
    }
  }

  /**
   * イベントを取得
   */
  getEvent(eventId: string): GameEvent | null {
    return this.events.get(eventId) || null
  }

  /**
   * イベントが存在するかチェック
   */
  hasEvent(eventId: string): boolean {
    return this.events.has(eventId)
  }

  /**
   * 読み込みに失敗したファイルのリストを取得
   */
  getFailedFiles(): string[] {
    return [...this.failedFiles]
  }

  /**
   * すべてのシナリオが正常に読み込まれたかチェック
   */
  isFullyLoaded(): boolean {
    return this.loaded && this.failedFiles.length === 0
  }

  /**
   * イベントのバリデーション
   */
  private validateEvent(event: unknown): event is GameEvent {
    if (typeof event !== 'object' || event === null) return false

    const e = event as Partial<GameEvent>

    if (typeof e.id !== 'string' || e.id.trim() === '') {
      console.error('[EventManager] Event ID is required')
      return false
    }

    if (typeof e.name !== 'string') {
      console.error(`[EventManager] Event name is required for ${e.id}`)
      return false
    }

    if (!Array.isArray(e.commands)) {
      console.error(`[EventManager] Event commands must be an array for ${e.id}`)
      return false
    }

    // 各コマンドの基本バリデーション
    for (let i = 0; i < e.commands.length; i++) {
      const command = e.commands[i]
      if (typeof command !== 'object' || command === null || !('type' in command)) {
        console.error(`[EventManager] Invalid command #${i} in event ${e.id}:`, command)
        return false
      }

      // コマンドタイプ別の必須フィールドチェック
      if (!this.validateCommandFields(command, e.id, i)) {
        return false
      }
    }

    return true
  }

  /**
   * コマンドの必須フィールドをバリデーション
   */
  private validateCommandFields(command: any, eventId: string, commandIndex: number): boolean {
    const type = command.type

    switch (type) {
      case 'message':
        if (typeof command.text !== 'string') {
          console.error(`[EventManager] Command #${commandIndex} in event ${eventId}: message requires 'text' field`)
          return false
        }
        break

      case 'choice':
        if (!Array.isArray(command.choices) || !Array.isArray(command.branchEvents)) {
          console.error(`[EventManager] Command #${commandIndex} in event ${eventId}: choice requires 'choices' and 'branchEvents' arrays`)
          return false
        }
        if (command.choices.length !== command.branchEvents.length) {
          console.error(`[EventManager] Command #${commandIndex} in event ${eventId}: choices and branchEvents must have same length`)
          return false
        }
        break

      case 'move':
        if (typeof command.direction !== 'string' || typeof command.steps !== 'number') {
          console.error(`[EventManager] Command #${commandIndex} in event ${eventId}: move requires 'direction' and 'steps'`)
          return false
        }
        break

      case 'wait':
        if (typeof command.duration !== 'number') {
          console.error(`[EventManager] Command #${commandIndex} in event ${eventId}: wait requires 'duration'`)
          return false
        }
        break

      case 'setFlag':
      case 'checkFlag':
        if (typeof command.flag !== 'string') {
          console.error(`[EventManager] Command #${commandIndex} in event ${eventId}: ${type} requires 'flag' field`)
          return false
        }
        break

      case 'addItem':
      case 'removeItem':
        if (typeof command.itemId !== 'string' || typeof command.count !== 'number') {
          console.error(`[EventManager] Command #${commandIndex} in event ${eventId}: ${type} requires 'itemId' and 'count'`)
          return false
        }
        break

      case 'addMember':
      case 'removeMember':
        if (typeof command.characterId !== 'string') {
          console.error(`[EventManager] Command #${commandIndex} in event ${eventId}: ${type} requires 'characterId'`)
          return false
        }
        break

      case 'battle':
        if (!Array.isArray(command.enemyIds) || typeof command.canEscape !== 'boolean') {
          console.error(`[EventManager] Command #${commandIndex} in event ${eventId}: battle requires 'enemyIds' array and 'canEscape' boolean`)
          return false
        }
        break

      case 'changeMap':
        if (typeof command.mapId !== 'string' || !command.position || typeof command.position.x !== 'number' || typeof command.position.y !== 'number') {
          console.error(`[EventManager] Command #${commandIndex} in event ${eventId}: changeMap requires 'mapId' and 'position' {x, y}`)
          return false
        }
        break

      case 'fadeIn':
      case 'fadeOut':
        if (typeof command.duration !== 'number') {
          console.error(`[EventManager] Command #${commandIndex} in event ${eventId}: ${type} requires 'duration'`)
          return false
        }
        break

      case 'playBGM':
      case 'playSE':
        if (typeof command.bgmId !== 'string' && typeof command.seId !== 'string') {
          console.error(`[EventManager] Command #${commandIndex} in event ${eventId}: ${type} requires 'bgmId' or 'seId'`)
          return false
        }
        break

      default:
        console.warn(`[EventManager] Command #${commandIndex} in event ${eventId}: unknown command type '${type}'`)
        // 未知のコマンドは警告のみで続行
        break
    }

    return true
  }
}
