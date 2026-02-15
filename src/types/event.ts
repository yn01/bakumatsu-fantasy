/**
 * イベント型定義
 */

import type { Direction } from './common'

/** イベントコマンドタイプ */
export type EventCommandType =
  | 'message' // メッセージ表示
  | 'choice' // 選択肢
  | 'move' // キャラクター移動
  | 'wait' // 待機
  | 'setFlag' // フラグ設定
  | 'checkFlag' // フラグチェック
  | 'addItem' // アイテム追加
  | 'removeItem' // アイテム削除
  | 'addMember' // パーティメンバー追加
  | 'removeMember' // パーティメンバー削除
  | 'battle' // バトル開始
  | 'changeMap' // マップ切替
  | 'playBGM' // BGM再生
  | 'playSE' // SE再生
  | 'fadeIn' // フェードイン
  | 'fadeOut' // フェードアウト
  | 'startQuest' // クエスト受注
  | 'completeQuest' // クエスト完了
  | 'openShop' // ショップ開く

/** イベントコマンド基底 */
interface BaseEventCommand {
  type: EventCommandType
}

/** メッセージコマンド */
export interface MessageCommand extends BaseEventCommand {
  type: 'message'
  speaker?: string // 話者名
  text: string
}

/** 選択肢コマンド */
export interface ChoiceCommand extends BaseEventCommand {
  type: 'choice'
  choices: string[]
  branchEvents: string[] // 選択肢ごとのイベントID
}

/** 移動コマンド */
export interface MoveCommand extends BaseEventCommand {
  type: 'move'
  target: string // 'player' or キャラクターID
  direction: Direction
  steps: number
}

/** 待機コマンド */
export interface WaitCommand extends BaseEventCommand {
  type: 'wait'
  duration: number // ミリ秒
}

/** フラグ設定コマンド */
export interface SetFlagCommand extends BaseEventCommand {
  type: 'setFlag'
  flag: string
  value: boolean | number | string
}

/** フラグチェックコマンド */
export interface CheckFlagCommand extends BaseEventCommand {
  type: 'checkFlag'
  flag: string
  value: boolean | number | string
  trueEventId: string
  falseEventId?: string
}

/** アイテム追加コマンド */
export interface AddItemCommand extends BaseEventCommand {
  type: 'addItem'
  itemId: string
  count: number
}

/** アイテム削除コマンド */
export interface RemoveItemCommand extends BaseEventCommand {
  type: 'removeItem'
  itemId: string
  count: number
}

/** パーティメンバー追加コマンド */
export interface AddMemberCommand extends BaseEventCommand {
  type: 'addMember'
  characterId: string
}

/** パーティメンバー削除コマンド */
export interface RemoveMemberCommand extends BaseEventCommand {
  type: 'removeMember'
  characterId: string
}

/** バトル開始コマンド */
export interface BattleEventCommand extends BaseEventCommand {
  type: 'battle'
  enemyIds: string[]
  canEscape: boolean
  victoryEventId?: string
  defeatEventId?: string
}

/** マップ切替コマンド */
export interface ChangeMapCommand extends BaseEventCommand {
  type: 'changeMap'
  mapId: string
  position: { x: number; y: number }
}

/** BGM再生コマンド */
export interface PlayBGMCommand extends BaseEventCommand {
  type: 'playBGM'
  bgmId: string
  volume?: number
  loop?: boolean
}

/** SE再生コマンド */
export interface PlaySECommand extends BaseEventCommand {
  type: 'playSE'
  seId: string
  volume?: number
}

/** フェードインコマンド */
export interface FadeInCommand extends BaseEventCommand {
  type: 'fadeIn'
  duration: number
}

/** フェードアウトコマンド */
export interface FadeOutCommand extends BaseEventCommand {
  type: 'fadeOut'
  duration: number
}

/** クエスト受注コマンド */
export interface StartQuestCommand extends BaseEventCommand {
  type: 'startQuest'
  questId: string
}

/** クエスト完了コマンド */
export interface CompleteQuestCommand extends BaseEventCommand {
  type: 'completeQuest'
  questId: string
}

/** ショップ開くコマンド */
export interface OpenShopCommand extends BaseEventCommand {
  type: 'openShop'
  shopId: string
  items?: string[] // オプション: 商品リスト
}

/** イベントコマンド（Union型） */
export type EventCommand =
  | MessageCommand
  | ChoiceCommand
  | MoveCommand
  | WaitCommand
  | SetFlagCommand
  | CheckFlagCommand
  | AddItemCommand
  | RemoveItemCommand
  | AddMemberCommand
  | RemoveMemberCommand
  | BattleEventCommand
  | ChangeMapCommand
  | PlayBGMCommand
  | PlaySECommand
  | FadeInCommand
  | FadeOutCommand
  | StartQuestCommand
  | CompleteQuestCommand
  | OpenShopCommand

/** ゲームイベント */
export interface GameEvent {
  id: string
  name: string
  commands: EventCommand[]
}

/** 会話データ */
export interface Dialogue {
  id: string
  speaker: string
  messages: string[]
}

/** イベントフラグ */
export interface EventFlag {
  name: string
  value: boolean | number | string
}
