/**
 * ゲーム全体状態管理
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameScene } from '@/types'

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

  // 設定
  settings: GameSettings

  // アクション
  setScene: (scene: GameScene) => void
  setPaused: (paused: boolean) => void
  updateSettings: (settings: Partial<GameSettings>) => void
  resetGame: () => void
}

const defaultSettings: GameSettings = {
  bgmVolume: 0.7,
  seVolume: 0.8,
  messageSpeed: 2,
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      // 初期状態
      scene: 'title',
      paused: false,
      settings: defaultSettings,

      // アクション
      setScene: (scene) => set({ scene }),

      setPaused: (paused) => set({ paused }),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetGame: () =>
        set({
          scene: 'title',
          paused: false,
          settings: defaultSettings,
        }),
    }),
    {
      name: 'bakumatsu-fantasy:game',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
)
