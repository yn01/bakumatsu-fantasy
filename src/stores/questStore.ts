/**
 * クエスト管理ストア
 */

import { create } from 'zustand'

export interface Quest {
  id: string
  name: string
  description: string
  status: 'available' | 'active' | 'completed'
  objectives: string[]
  rewards: {
    exp?: number
    gold?: number
    items?: string[]
  }
  requiredFlag?: string // クエスト受注条件
  completionFlag: string // 完了時に立てるフラグ
}

interface QuestState {
  // 受注中のクエスト
  activeQuests: string[]

  // 完了済みクエスト
  completedQuests: string[]

  // アクション
  acceptQuest: (questId: string) => void
  completeQuest: (questId: string) => void
  getQuestStatus: (questId: string) => 'available' | 'active' | 'completed' | 'unavailable'
  resetQuests: () => void
}

export const useQuestStore = create<QuestState>((set, get) => ({
  // 初期状態
  activeQuests: [],
  completedQuests: [],

  // アクション
  acceptQuest: (questId) =>
    set((state) => {
      if (state.activeQuests.includes(questId) || state.completedQuests.includes(questId)) {
        return state
      }
      return {
        activeQuests: [...state.activeQuests, questId],
      }
    }),

  completeQuest: (questId) =>
    set((state) => {
      if (!state.activeQuests.includes(questId)) {
        return state
      }
      return {
        activeQuests: state.activeQuests.filter((id) => id !== questId),
        completedQuests: [...state.completedQuests, questId],
      }
    }),

  getQuestStatus: (questId) => {
    const state = get()
    if (state.completedQuests.includes(questId)) {
      return 'completed'
    }
    if (state.activeQuests.includes(questId)) {
      return 'active'
    }
    return 'available'
  },

  resetQuests: () =>
    set({
      activeQuests: [],
      completedQuests: [],
    }),
}))
