/**
 * インベントリ状態管理
 */

import { create } from 'zustand'

interface InventoryState {
  // 所持アイテム（アイテムID → 所持数）
  items: { [itemId: string]: number }

  // 所持金（両）
  money: number

  // アクション
  addItem: (itemId: string, count?: number) => void
  removeItem: (itemId: string, count?: number) => void
  hasItem: (itemId: string, count?: number) => boolean
  getItemCount: (itemId: string) => number
  addMoney: (amount: number) => void
  removeMoney: (amount: number) => boolean
  hasMoney: (amount: number) => boolean
  clearInventory: () => void
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  // 初期状態
  items: {},
  money: 0,

  // アクション
  addItem: (itemId, count = 1) =>
    set((state) => ({
      items: {
        ...state.items,
        [itemId]: (state.items[itemId] || 0) + count,
      },
    })),

  removeItem: (itemId, count = 1) =>
    set((state) => {
      const currentCount = state.items[itemId] || 0
      const newCount = Math.max(0, currentCount - count)

      if (newCount === 0) {
        const { [itemId]: _, ...rest } = state.items
        return { items: rest }
      }

      return {
        items: {
          ...state.items,
          [itemId]: newCount,
        },
      }
    }),

  hasItem: (itemId, count = 1) => {
    const currentCount = get().items[itemId] || 0
    return currentCount >= count
  },

  getItemCount: (itemId) => {
    return get().items[itemId] || 0
  },

  addMoney: (amount) =>
    set((state) => ({
      money: state.money + amount,
    })),

  removeMoney: (amount) => {
    const currentMoney = get().money
    if (currentMoney < amount) {
      return false
    }
    set({ money: currentMoney - amount })
    return true
  },

  hasMoney: (amount) => {
    return get().money >= amount
  },

  clearInventory: () =>
    set({
      items: {},
      money: 0,
    }),
}))
