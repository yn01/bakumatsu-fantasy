/**
 * 共通型定義
 */

/** 座標 */
export interface Position {
  x: number
  y: number
}

/** サイズ */
export interface Size {
  width: number
  height: number
}

/** 方向 */
export type Direction = 'up' | 'down' | 'left' | 'right'

/** ゲームシーン */
export type GameScene =
  | 'title' // タイトル画面
  | 'field' // フィールド画面
  | 'battle' // バトル画面
  | 'menu' // メニュー画面
  | 'shop' // ショップ画面
  | 'dialogue' // 会話画面

/** 矩形領域 */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** 色（RGB） */
export interface Color {
  r: number
  g: number
  b: number
  a?: number
}
