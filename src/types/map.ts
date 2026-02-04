/**
 * マップ型定義
 */

import type { Direction } from './common'

/** タイルタイプ */
export type TileType =
  | 'ground' // 地面
  | 'wall' // 壁
  | 'water' // 水
  | 'door' // 扉
  | 'stairs' // 階段

/** タイル */
export interface Tile {
  id: number
  type: TileType
  passable: boolean
  sprite: string
}

/** NPC */
export interface NPC {
  id: string
  name: string
  sprite: string
  position: { x: number; y: number }
  direction: Direction
  dialogue: string | string[] // 会話ID or 会話内容配列
  movementPattern?: 'stationary' | 'random' | 'patrol'
  patrolPoints?: { x: number; y: number }[]
}

/** マップ遷移 */
export interface MapTransition {
  id: string
  fromPosition: { x: number; y: number } // トリガー座標
  toMapId: string // 遷移先マップID
  toPosition: { x: number; y: number } // 遷移先座標
  direction?: Direction // 必要な向き
  transitionType: 'walk' | 'door' | 'stairs' // 遷移タイプ
}

/** マップイベント */
export interface MapEvent {
  id: string
  position: { x: number; y: number }
  trigger: 'step' | 'interact' | 'auto' // トリガータイプ
  eventId: string // イベントスクリプトID
  condition?: string // 実行条件（フラグ名）
}

/** マップデータ */
export interface MapData {
  id: string
  name: string
  width: number
  height: number
  tileSize: number
  layers: {
    background: number[][] // タイルID配列
    collision: number[][] // 0=通行可, 1=通行不可
    events: number[][] // イベントID（0=なし）
  }
  tileset: string // タイルセット画像パス
  bgm: string // BGMファイルパス
  encounters?: {
    enemies: string[] // 敵ID配列
    rate: number // エンカウント率（0.0〜1.0）
  }
  npcs: NPC[]
  transitions: MapTransition[]
  events: MapEvent[]
}
