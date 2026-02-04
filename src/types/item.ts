/**
 * アイテム型定義
 */

import type { Stats } from './character'

/** アイテムタイプ */
export type ItemType = 'consumable' | 'weapon' | 'armor' | 'key'

/** アイテム効果タイプ */
export type EffectType =
  | 'heal_hp' // HP回復
  | 'heal_mp' // MP回復
  | 'cure_poison' // 毒治療
  | 'cure_paralysis' // 麻痺治療
  | 'cure_all' // 全状態異常治療
  | 'revive' // 蘇生

/** アイテム効果 */
export interface ItemEffect {
  type: EffectType
  value: number // 回復量や効果値
}

/** アイテム */
export interface Item {
  id: string
  name: string
  type: ItemType
  description: string
  price: number
  effect?: ItemEffect
  equipStats?: Partial<Stats> // 装備時のステータス補正
  usableInBattle: boolean
  usableInField: boolean
}

/** 装備品 */
export interface Equipment extends Item {
  type: 'weapon' | 'armor'
  equipStats: Partial<Stats>
  requiredLevel?: number
  equipableBy?: string[] // 装備可能キャラID配列
}

/** 消費アイテム */
export interface ConsumableItem extends Item {
  type: 'consumable'
  effect: ItemEffect
}

/** キーアイテム */
export interface KeyItem extends Item {
  type: 'key'
  usableInBattle: false
  usableInField: false
}
