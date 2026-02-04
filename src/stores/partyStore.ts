/**
 * パーティ状態管理
 */

import { create } from 'zustand'
import type { Character } from '@/types'

interface PartyState {
  // パーティメンバー
  members: Character[]

  // 編成順（メンバーのインデックス）
  formation: number[]

  // ゴールド
  gold: number

  // アイテム（アイテムID配列）
  items: string[]

  // アクション
  addMember: (character: Character) => void
  removeMember: (characterId: string) => void
  updateMember: (characterId: string, updates: Partial<Character>) => void
  setFormation: (formation: number[]) => void
  getMember: (characterId: string) => Character | undefined
  getLeader: () => Character | undefined

  // 経験値追加
  addExp: (characterId: string, exp: number) => void

  // ゴールド追加/減少
  addGold: (amount: number) => void

  // アイテム追加/削除
  addItem: (itemId: string) => void
  removeItem: (itemId: string) => void
}

export const usePartyStore = create<PartyState>((set, get) => ({
  // 初期状態
  members: [],
  formation: [],
  gold: 0,
  items: [],

  // アクション
  addMember: (character) =>
    set((state) => ({
      members: [...state.members, character],
      formation: [...state.formation, state.members.length],
    })),

  removeMember: (characterId) =>
    set((state) => {
      const index = state.members.findIndex((m) => m.id === characterId)
      if (index === -1) return state

      return {
        members: state.members.filter((m) => m.id !== characterId),
        formation: state.formation
          .filter((i) => i !== index)
          .map((i) => (i > index ? i - 1 : i)),
      }
    }),

  updateMember: (characterId, updates) =>
    set((state) => ({
      members: state.members.map((member) =>
        member.id === characterId ? { ...member, ...updates } : member
      ),
    })),

  setFormation: (formation) => set({ formation }),

  getMember: (characterId) => {
    return get().members.find((m) => m.id === characterId)
  },

  getLeader: () => {
    const { members, formation } = get()
    const leaderIndex = formation[0]
    return leaderIndex !== undefined ? members[leaderIndex] : undefined
  },

  // 経験値追加
  addExp: (characterId, exp) =>
    set((state) => ({
      members: state.members.map((member) =>
        member.id === characterId ? { ...member, exp: member.exp + exp } : member
      ),
    })),

  // ゴールド追加/減少
  addGold: (amount) =>
    set((state) => ({
      gold: Math.max(0, state.gold + amount),
    })),

  // アイテム追加
  addItem: (itemId) =>
    set((state) => ({
      items: [...state.items, itemId],
    })),

  // アイテム削除（最初に見つかった1つを削除）
  removeItem: (itemId) =>
    set((state) => {
      const index = state.items.findIndex((id) => id === itemId)
      if (index === -1) return state

      return {
        items: state.items.filter((_, i) => i !== index),
      }
    }),
}))
