/**
 * 図鑑管理ストア
 */

import { create } from 'zustand'

interface EncyclopediaState {
  // 発見済み敵ID
  discoveredEnemies: string[]

  // 発見済みアイテムID
  discoveredItems: string[]

  // 発見済みスキルID
  discoveredSkills: string[]

  // 敵を発見
  discoverEnemy: (enemyId: string) => void

  // アイテムを発見
  discoverItem: (itemId: string) => void

  // スキルを発見
  discoverSkill: (skillId: string) => void

  // 発見済みか確認
  isEnemyDiscovered: (enemyId: string) => boolean
  isItemDiscovered: (itemId: string) => boolean
  isSkillDiscovered: (skillId: string) => boolean

  // 図鑑リセット
  resetEncyclopedia: () => void
}

export const useEncyclopediaStore = create<EncyclopediaState>((set, get) => ({
  discoveredEnemies: [],
  discoveredItems: [],
  discoveredSkills: [],

  discoverEnemy: (enemyId) =>
    set((state) => {
      if (state.discoveredEnemies.includes(enemyId)) {
        return state
      }
      return {
        discoveredEnemies: [...state.discoveredEnemies, enemyId],
      }
    }),

  discoverItem: (itemId) =>
    set((state) => {
      if (state.discoveredItems.includes(itemId)) {
        return state
      }
      return {
        discoveredItems: [...state.discoveredItems, itemId],
      }
    }),

  discoverSkill: (skillId) =>
    set((state) => {
      if (state.discoveredSkills.includes(skillId)) {
        return state
      }
      return {
        discoveredSkills: [...state.discoveredSkills, skillId],
      }
    }),

  isEnemyDiscovered: (enemyId) => {
    return get().discoveredEnemies.includes(enemyId)
  },

  isItemDiscovered: (itemId) => {
    return get().discoveredItems.includes(itemId)
  },

  isSkillDiscovered: (skillId) => {
    return get().discoveredSkills.includes(skillId)
  },

  resetEncyclopedia: () =>
    set({
      discoveredEnemies: [],
      discoveredItems: [],
      discoveredSkills: [],
    }),
}))
