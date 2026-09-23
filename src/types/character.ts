/**
 * キャラクター型定義
 */

/** ステータス */
export interface Stats {
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  attack: number
  defense: number
  speed: number
  luck: number
}

/** キャラクター */
export interface Character {
  id: string
  name: string
  class: string
  level: number
  exp: number
  stats: Stats
  equipment: {
    weapon: string | null
    armor: string | null
  }
  skills: string[] // スキルID配列
  sprite: string // スプライト画像パス
  growthRate?: GrowthRate // 成長率（オプション、マスタデータから取得）
  skillPoints?: number // スキルポイント（レベルアップで獲得、スキル習得で消費）
  isBoss?: boolean // ボス敵フラグ（敵マスタデータのみ使用）
}

/** キャラクター状態 */
export type CharacterState =
  | 'normal' // 通常
  | 'poison' // 毒
  | 'paralysis' // 麻痺
  | 'sleep' // 睡眠
  | 'confused' // 混乱
  | 'dead' // 戦闘不能

/** キャラクター成長率 */
export interface GrowthRate {
  hp: number
  mp: number
  attack: number
  defense: number
  speed: number
  luck: number
}
