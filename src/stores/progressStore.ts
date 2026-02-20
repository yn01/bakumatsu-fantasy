/**
 * 進行状況管理
 */

import { create } from 'zustand'

interface Position {
  x: number
  y: number
}

interface ProgressState {
  // 現在の章
  chapter: string

  // 現在のマップID
  currentMapId: string

  // 現在の位置
  currentPosition: Position

  // イベントフラグ
  flags: { [flagName: string]: boolean | number | string }

  // 訪問済みマップ
  visitedMaps: string[]

  // プレイ時間（秒）
  playTime: number

  // アクション
  setChapter: (chapter: string) => void
  setCurrentMap: (mapId: string, position?: Position) => void
  setCurrentPosition: (position: Position) => void
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
  currentMapId: 'saigaitaya',
  currentPosition: { x: 15, y: 5 },
  flags: {},
  visitedMaps: [],
  playTime: 0,

  // アクション
  setChapter: (chapter) => set({ chapter }),

  setCurrentMap: (mapId, position) =>
    set((state) => ({
      currentMapId: mapId,
      currentPosition: position || state.currentPosition,
    })),

  setCurrentPosition: (position) => set({ currentPosition: position }),

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
      currentMapId: 'saigaitaya',
      currentPosition: { x: 15, y: 5 },
      flags: {},
      visitedMaps: [],
      playTime: 0,
    }),
}))
