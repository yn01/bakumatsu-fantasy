import { describe, it, expect, beforeEach } from 'vitest'
import { useProgressStore } from '@/stores/progressStore'
import { resetAllStores } from '@/test/helpers'

describe('progressStore', () => {
  beforeEach(() => {
    resetAllStores()
  })

  describe('setChapter', () => {
    it('sets the current chapter', () => {
      useProgressStore.getState().setChapter('chapter1')
      expect(useProgressStore.getState().chapter).toBe('chapter1')
    })
  })

  describe('setCurrentMap', () => {
    it('changes the current map id', () => {
      useProgressStore.getState().setCurrentMap('kochi_town')
      expect(useProgressStore.getState().currentMapId).toBe('kochi_town')
    })

    it('updates position when provided', () => {
      useProgressStore.getState().setCurrentMap('kochi_town', { x: 10, y: 20 })
      expect(useProgressStore.getState().currentPosition).toEqual({ x: 10, y: 20 })
    })

    it('keeps existing position when not provided', () => {
      useProgressStore.getState().setCurrentPosition({ x: 5, y: 8 })
      useProgressStore.getState().setCurrentMap('kochi_town')
      expect(useProgressStore.getState().currentPosition).toEqual({ x: 5, y: 8 })
    })
  })

  describe('setCurrentPosition', () => {
    it('updates position', () => {
      useProgressStore.getState().setCurrentPosition({ x: 3, y: 7 })
      expect(useProgressStore.getState().currentPosition).toEqual({ x: 3, y: 7 })
    })
  })

  describe('setFlag / getFlag', () => {
    it('sets and gets a boolean flag', () => {
      useProgressStore.getState().setFlag('met_takechi', true)
      expect(useProgressStore.getState().getFlag('met_takechi')).toBe(true)
    })

    it('sets and gets a numeric flag', () => {
      useProgressStore.getState().setFlag('quest_count', 3)
      expect(useProgressStore.getState().getFlag('quest_count')).toBe(3)
    })

    it('sets and gets a string flag', () => {
      useProgressStore.getState().setFlag('current_quest', 'find_sword')
      expect(useProgressStore.getState().getFlag('current_quest')).toBe('find_sword')
    })

    it('returns undefined for unset flag', () => {
      expect(useProgressStore.getState().getFlag('nonexistent')).toBeUndefined()
    })

    it('can overwrite an existing flag', () => {
      useProgressStore.getState().setFlag('met_takechi', false)
      useProgressStore.getState().setFlag('met_takechi', true)
      expect(useProgressStore.getState().getFlag('met_takechi')).toBe(true)
    })
  })

  describe('hasFlag', () => {
    it('returns true when flag exists', () => {
      useProgressStore.getState().setFlag('flag_a', false)
      expect(useProgressStore.getState().hasFlag('flag_a')).toBe(true)
    })

    it('returns false when flag does not exist', () => {
      expect(useProgressStore.getState().hasFlag('missing_flag')).toBe(false)
    })
  })

  describe('visitMap / hasVisitedMap', () => {
    it('marks a map as visited', () => {
      useProgressStore.getState().visitMap('kochi_town')
      expect(useProgressStore.getState().hasVisitedMap('kochi_town')).toBe(true)
    })

    it('returns false for unvisited map', () => {
      expect(useProgressStore.getState().hasVisitedMap('kyoto')).toBe(false)
    })

    it('does not add duplicates', () => {
      useProgressStore.getState().visitMap('kochi_town')
      useProgressStore.getState().visitMap('kochi_town')
      expect(useProgressStore.getState().visitedMaps).toHaveLength(1)
    })
  })

  describe('incrementPlayTime', () => {
    it('increments play time', () => {
      useProgressStore.getState().incrementPlayTime(60)
      expect(useProgressStore.getState().playTime).toBe(60)
    })

    it('accumulates play time', () => {
      useProgressStore.getState().incrementPlayTime(30)
      useProgressStore.getState().incrementPlayTime(30)
      expect(useProgressStore.getState().playTime).toBe(60)
    })
  })

  describe('resetProgress', () => {
    it('resets all progress to initial state', () => {
      useProgressStore.getState().setChapter('chapter5')
      useProgressStore.getState().setCurrentMap('kyoto', { x: 20, y: 30 })
      useProgressStore.getState().setFlag('met_ryoma', true)
      useProgressStore.getState().visitMap('kyoto')
      useProgressStore.getState().incrementPlayTime(1000)

      useProgressStore.getState().resetProgress()

      const state = useProgressStore.getState()
      expect(state.chapter).toBe('prologue')
      expect(state.currentMapId).toBe('saigaitaya')
      expect(state.currentPosition).toEqual({ x: 15, y: 5 })
      expect(state.flags).toEqual({})
      expect(state.visitedMaps).toHaveLength(0)
      expect(state.playTime).toBe(0)
    })
  })
})
