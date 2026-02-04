/**
 * バトル統合制御システム
 * ターン管理、アクション実行、勝敗判定を統括
 */

import { useBattleStore } from '@/stores/battleStore'
import { TurnManager } from './TurnManager'
import { DamageCalculator } from './DamageCalculator'
import { BattlePhase } from '@/types'
import type {
  BattleParticipant,
  BattleAction,
  BattleResult,
  DamageResult,
} from '@/types/battle'
import type { Character, CharacterState } from '@/types/character'

export class BattleManager {
  private turnManager: TurnManager
  private damageCalculator: DamageCalculator
  private turnOrder: BattleParticipant[] = []
  private currentActorIndex: number = 0

  constructor() {
    this.turnManager = new TurnManager()
    this.damageCalculator = new DamageCalculator()
  }

  /**
   * バトル初期化
   * @param partyCharacters パーティキャラクター配列
   * @param enemyCharacters 敵キャラクター配列
   */
  initBattle(partyCharacters: Character[], enemyCharacters: Character[]): void {
    // キャラクターをBattleParticipantに変換
    const party: BattleParticipant[] = partyCharacters.map((char) => ({
      character: char,
      currentHp: char.stats.hp,
      currentMp: char.stats.mp,
      state: ['normal'],
      isDefending: false,
    }))

    const enemies: BattleParticipant[] = enemyCharacters.map((char) => ({
      character: char,
      currentHp: char.stats.hp,
      currentMp: char.stats.mp,
      state: ['normal'],
      isDefending: false,
    }))

    // battleStoreを初期化
    useBattleStore.getState().initBattle(party, enemies)

    // 最初のターン開始
    this.startTurn()
  }

  /**
   * ターン開始
   */
  startTurn(): void {
    const { party, enemies, setPhase, setCurrentActor } = useBattleStore.getState()

    // 防御状態をリセット（ターン開始時）
    this.resetDefendingStates()

    // ターン順序を計算
    this.turnOrder = this.turnManager.calculateTurnOrder(party, enemies)
    this.currentActorIndex = 0

    // 最初の行動者を設定
    const firstActor = this.getCurrentActor()
    if (firstActor) {
      setCurrentActor(firstActor.character.id)
    }

    // コマンド選択フェーズへ
    setPhase(BattlePhase.COMMAND_SELECT)
  }

  /**
   * アクション実行
   * @param action バトルアクション
   * @returns ダメージ結果配列
   */
  executeAction(action: BattleAction): DamageResult[] {
    const { party, enemies, updateParticipant, setPhase } = useBattleStore.getState()

    // 行動者を取得
    const actor = this.findParticipant(action.actorId, party, enemies)
    if (!actor) {
      console.error('Actor not found:', action.actorId)
      return []
    }

    // ターゲットを取得
    const targets = action.targetIds
      .map((id) => this.findParticipant(id, party, enemies))
      .filter((p): p is BattleParticipant => p !== null)

    if (targets.length === 0) {
      console.error('No targets found')
      return []
    }

    const results: DamageResult[] = []

    // コマンド実行
    switch (action.command) {
      case 'attack': {
        // 通常攻撃
        const result = this.damageCalculator.calculateDamage(actor, targets[0]!)
        this.applyDamage(result, updateParticipant)
        results.push(result)
        break
      }

      case 'skill': {
        // スキル使用（Phase 4で実装）
        // 仮実装: 通常攻撃と同じ
        const result = this.damageCalculator.calculateDamage(actor, targets[0]!)
        this.applyDamage(result, updateParticipant)
        results.push(result)
        break
      }

      case 'defend': {
        // 防御
        updateParticipant(action.actorId, { isDefending: true })
        break
      }

      case 'item': {
        // アイテム使用（Phase 4で実装）
        console.log('Item use not implemented yet')
        break
      }

      case 'escape': {
        // 逃走（Phase 4で実装）
        console.log('Escape not implemented yet')
        break
      }
    }

    // アクション実行フェーズへ
    setPhase(BattlePhase.ACTION_EXECUTE)

    return results
  }

  /**
   * バトル終了判定
   * @returns バトル結果（終了していない場合はnull）
   */
  checkBattleEnd(): BattleResult | null {
    const { party, enemies } = useBattleStore.getState()

    // パーティ全滅判定
    const partyAlive = party.some((p) => !p.state.includes('dead'))
    if (!partyAlive) {
      return {
        victory: false,
        exp: 0,
        gold: 0,
        items: [],
      }
    }

    // 敵全滅判定
    const enemiesAlive = enemies.some((e) => !e.state.includes('dead'))
    if (!enemiesAlive) {
      // 経験値・ゴールド計算（仮実装）
      const exp = enemies.reduce((sum, e) => sum + (e.character.level * 10), 0)
      const gold = enemies.reduce((sum, e) => sum + (e.character.level * 20), 0)

      return {
        victory: true,
        exp,
        gold,
        items: [],
      }
    }

    return null // バトル継続
  }

  /**
   * ターン順序を取得
   */
  getTurnOrder(): BattleParticipant[] {
    return this.turnOrder
  }

  /**
   * ダメージを適用
   */
  private applyDamage(
    result: DamageResult,
    updateParticipant: (id: string, updates: Partial<BattleParticipant>) => void
  ): void {
    const { party, enemies } = useBattleStore.getState()
    const target = this.findParticipant(result.targetId, party, enemies)

    if (!target) return

    const newHp = Math.max(0, target.currentHp - result.damage)
    const newState: CharacterState[] = newHp === 0 ? [...target.state, 'dead'] : target.state

    updateParticipant(result.targetId, {
      currentHp: newHp,
      state: newState,
    })
  }

  /**
   * 参加者を検索
   */
  private findParticipant(
    id: string,
    party: BattleParticipant[],
    enemies: BattleParticipant[]
  ): BattleParticipant | null {
    return (
      party.find((p) => p.character.id === id) ||
      enemies.find((e) => e.character.id === id) ||
      null
    )
  }

  /**
   * 防御状態をリセット
   */
  private resetDefendingStates(): void {
    const { party, enemies, updateParticipant } = useBattleStore.getState()

    // 味方の防御状態をリセット
    party.forEach((p) => {
      if (p.isDefending) {
        updateParticipant(p.character.id, { isDefending: false })
      }
    })

    // 敵の防御状態をリセット
    enemies.forEach((e) => {
      if (e.isDefending) {
        updateParticipant(e.character.id, { isDefending: false })
      }
    })
  }

  /**
   * 現在の行動者を取得
   */
  getCurrentActor(): BattleParticipant | null {
    if (this.turnOrder.length === 0) return null
    return this.turnOrder[this.currentActorIndex] || null
  }

  /**
   * 次の行動者に進む
   */
  advanceTurn(): void {
    this.currentActorIndex++

    // 全員の行動が終わったらターン終了
    if (this.currentActorIndex >= this.turnOrder.length) {
      this.currentActorIndex = 0
      const { nextTurn } = useBattleStore.getState()
      nextTurn()
      this.startTurn()
    } else {
      // 次の行動者へ
      const { setPhase, setCurrentActor } = useBattleStore.getState()
      const nextActor = this.getCurrentActor()
      if (nextActor) {
        setCurrentActor(nextActor.character.id)
        setPhase(BattlePhase.COMMAND_SELECT)
      }
    }
  }

  /**
   * 敵の自動行動を実行（簡易AI）
   */
  executeEnemyAction(enemy: BattleParticipant): DamageResult[] {
    const { party } = useBattleStore.getState()

    // 生存している味方をターゲットにランダム選択
    const aliveParty = party.filter((p) => !p.state.includes('dead'))
    if (aliveParty.length === 0) return []

    const target = aliveParty[Math.floor(Math.random() * aliveParty.length)]

    // 通常攻撃を実行
    const action: BattleAction = {
      actorId: enemy.character.id,
      command: 'attack',
      targetIds: [target!.character.id],
    }

    return this.executeAction(action)
  }

  /**
   * 現在の行動者が敵かどうか
   */
  isCurrentActorEnemy(): boolean {
    const actor = this.getCurrentActor()
    if (!actor) return false

    const { enemies } = useBattleStore.getState()
    return enemies.some((e) => e.character.id === actor.character.id)
  }
}
