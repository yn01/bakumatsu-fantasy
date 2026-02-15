/**
 * ゲーム全体状態管理
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameScene } from '@/types'
import type { DifficultyLevel } from '@/systems/difficulty/DifficultyManager'

interface GameSettings {
  bgmVolume: number
  seVolume: number
  messageSpeed: number
}

interface GameState {
  // 現在のシーン
  scene: GameScene

  // ゲーム状態
  paused: boolean

  // ショップ状態
  shopOpen: boolean
  shopType: 'weapon' | 'armor' | 'item' | 'all' | null
  shopId: string | null

  // 設定
  settings: GameSettings

  // 難易度
  difficulty: DifficultyLevel

  // アクション
  setScene: (scene: GameScene) => void
  setPaused: (paused: boolean) => void
  openShop: (shopType: 'weapon' | 'armor' | 'item' | 'all', shopId?: string) => void
  closeShop: () => void
  updateSettings: (settings: Partial<GameSettings>) => void
  setDifficulty: (difficulty: DifficultyLevel) => void
  resetGame: () => void
}

const defaultSettings: GameSettings = {
  bgmVolume: 0.5,
  seVolume: 0.7,
  messageSpeed: 2,
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      // 初期状態
      scene: 'title',
      paused: false,
      shopOpen: false,
      shopType: null,
      shopId: null,
      settings: defaultSettings,
      difficulty: 'normal',

      // アクション
      setScene: (scene) => set({ scene }),

      setPaused: (paused) => set({ paused }),

      openShop: (shopType, shopId) => set({ shopOpen: true, shopType, shopId: shopId || null }),

      closeShop: () => set({ shopOpen: false, shopType: null, shopId: null }),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      setDifficulty: (difficulty) => set({ difficulty }),

      resetGame: () =>
        set({
          scene: 'title',
          paused: false,
          shopOpen: false,
          shopType: null,
          shopId: null,
          settings: defaultSettings,
          difficulty: 'normal',
        }),
    }),
    {
      name: 'bakumatsu-fantasy:game',
      partialize: (state) => ({ settings: state.settings, difficulty: state.difficulty }),
    }
  )
)
