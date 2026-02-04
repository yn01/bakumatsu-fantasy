/**
 * バトル型定義
 */

import type { Character, CharacterState } from './character'

/** バトルフェーズ */
export enum BattlePhase {
  INIT = 'init', // 初期化
  COMMAND_SELECT = 'command_select', // コマンド選択
  ACTION_EXECUTE = 'action_execute', // アクション実行
  RESULT = 'result', // 結果表示
  VICTORY = 'victory', // 勝利
  DEFEAT = 'defeat', // 敗北
  ESCAPE = 'escape', // 逃走
}

/** バトルコマンド */
export type BattleCommand = 'attack' | 'skill' | 'defend' | 'item' | 'escape'

/** バトルアクション */
export interface BattleAction {
  actorId: string
  command: BattleCommand
  targetIds: string[]
  skillId?: string
  itemId?: string
}

/** バトル参加者 */
export interface BattleParticipant {
  character: Character
  currentHp: number
  currentMp: number
  state: CharacterState[] // 状態異常配列
  isDefending: boolean
}

/** バトル状態 */
export interface BattleState {
  phase: BattlePhase
  turn: number
  party: BattleParticipant[]
  enemies: BattleParticipant[]
  actionQueue: BattleAction[]
  currentActorId: string | null
}

/** バトル結果 */
export interface BattleResult {
  victory: boolean
  exp: number
  gold: number
  items: string[] // 獲得アイテムID配列
}

/** ダメージ結果 */
export interface DamageResult {
  targetId: string
  damage: number
  isCritical: boolean
  isWeak: boolean
  isResist: boolean
}
