/**
 * 進行状況管理
 */

import { create } from 'zustand'

interface ProgressState {
  // 現在の章
  chapter: string

  // イベントフラグ
  flags: { [flagName: string]: boolean | number | string }

  // 訪問済みマップ
  visitedMaps: string[]

  // プレイ時間（秒）
  playTime: number

  // アクション
  setChapter: (chapter: string) => void
  setFlag: (flagName: string, value: boolean | number | string) => void
  getFlag: (flagName: string) => boolean | number | string | undefined
  hasFlag: (flagName: string) => boolean
  visitMap: (mapId: string) => void
  hasVisitedMap: (mapId: string) => boolean
  incrementPlayTime: (seconds: number) => void
  resetProgress: () => void
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  // 初期状態
  chapter: 'prologue',
  flags: {},
  visitedMaps: [],
  playTime: 0,

  // アクション
  setChapter: (chapter) => set({ chapter }),

  setFlag: (flagName, value) =>
    set((state) => ({
      flags: {
        ...state.flags,
        [flagName]: value,
      },
    })),

  getFlag: (flagName) => {
    return get().flags[flagName]
  },

  hasFlag: (flagName) => {
    return flagName in get().flags
  },

  visitMap: (mapId) =>
    set((state) => {
      if (state.visitedMaps.includes(mapId)) {
        return state
      }
      return {
        visitedMaps: [...state.visitedMaps, mapId],
      }
    }),

  hasVisitedMap: (mapId) => {
    return get().visitedMaps.includes(mapId)
  },

  incrementPlayTime: (seconds) =>
    set((state) => ({
      playTime: state.playTime + seconds,
    })),

  resetProgress: () =>
    set({
      chapter: 'prologue',
      flags: {},
      visitedMaps: [],
      playTime: 0,
    }),
}))
