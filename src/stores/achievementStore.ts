/**
 * 実績管理ストア
 */

import { create } from 'zustand'

interface AchievementState {
  // 解除済み実績ID
  unlockedAchievements: string[]

  // 実績解除
  unlockAchievement: (achievementId: string) => void

  // 実績が解除済みか確認
  isUnlocked: (achievementId: string) => boolean

  // 実績リセット
  resetAchievements: () => void
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  unlockedAchievements: [],

  unlockAchievement: (achievementId) =>
    set((state) => {
      if (state.unlockedAchievements.includes(achievementId)) {
        return state
      }
      return {
        unlockedAchievements: [...state.unlockedAchievements, achievementId],
      }
    }),

  isUnlocked: (achievementId) => {
    return get().unlockedAchievements.includes(achievementId)
  },

  resetAchievements: () => set({ unlockedAchievements: [] }),
}))
