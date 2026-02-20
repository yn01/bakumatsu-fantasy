import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ScenarioManager } from '@/systems/scenario/ScenarioManager'
import { useProgressStore } from '@/stores/progressStore'
import { usePartyStore } from '@/stores/partyStore'
import { useGameStore } from '@/stores/gameStore'
import { resetAllStores } from '@/test/helpers'

describe('ScenarioManager', () => {
  let manager: ScenarioManager

  beforeEach(() => {
    resetAllStores()
    manager = new ScenarioManager()
  })

  describe('getCurrentChapter', () => {
    it('returns prologue when no flags are set', () => {
      expect(manager.getCurrentChapter()).toBe('prologue')
    })

    it('returns chapter1 after prologue_completed', () => {
      useProgressStore.getState().setFlag('prologue_completed', true)
      expect(manager.getCurrentChapter()).toBe('chapter1')
    })

    it('returns chapter2 after chapter1_completed', () => {
      useProgressStore.getState().setFlag('prologue_completed', true)
      useProgressStore.getState().setFlag('chapter1_completed', true)
      expect(manager.getCurrentChapter()).toBe('chapter2')
    })

    it('returns chapter3 after chapter2_completed', () => {
      useProgressStore.getState().setFlag('prologue_completed', true)
      useProgressStore.getState().setFlag('chapter1_completed', true)
      useProgressStore.getState().setFlag('chapter2_completed', true)
      expect(manager.getCurrentChapter()).toBe('chapter3')
    })

    it('returns epilogue after tosa_arc check', () => {
      useProgressStore.getState().setFlag('prologue_completed', true)
      useProgressStore.getState().setFlag('chapter1_completed', true)
      useProgressStore.getState().setFlag('chapter2_completed', true)
      useProgressStore.getState().setFlag('chapter3_completed', true)
      expect(manager.getCurrentChapter()).toBe('epilogue')
    })

    it('returns chapter4 after tosa_arc_completed', () => {
      useProgressStore.getState().setFlag('prologue_completed', true)
      useProgressStore.getState().setFlag('chapter1_completed', true)
      useProgressStore.getState().setFlag('chapter2_completed', true)
      useProgressStore.getState().setFlag('chapter3_completed', true)
      useProgressStore.getState().setFlag('tosa_arc_completed', true)
      expect(manager.getCurrentChapter()).toBe('chapter4')
    })

    it('returns ending after all chapters completed', () => {
      const flags = [
        'prologue_completed', 'chapter1_completed', 'chapter2_completed',
        'chapter3_completed', 'tosa_arc_completed', 'chapter4_completed',
        'chapter5_completed', 'chapter6_completed', 'chapter7_completed',
        'final_chapter_completed',
      ]
      flags.forEach(f => useProgressStore.getState().setFlag(f, true))
      expect(manager.getCurrentChapter()).toBe('ending')
    })
  })

  describe('getNextChapter', () => {
    it('returns chapter1 after prologue', () => {
      expect(manager.getNextChapter('prologue')).toBe('chapter1')
    })

    it('returns chapter2 after chapter1', () => {
      expect(manager.getNextChapter('chapter1')).toBe('chapter2')
    })

    it('returns chapter4 after epilogue', () => {
      expect(manager.getNextChapter('epilogue')).toBe('chapter4')
    })

    it('returns final_chapter after chapter7', () => {
      expect(manager.getNextChapter('chapter7')).toBe('final_chapter')
    })

    it('returns epilogue for unknown chapter', () => {
      expect(manager.getNextChapter('unknown')).toBe('epilogue')
    })

    it('returns epilogue when at the end (ending)', () => {
      expect(manager.getNextChapter('ending')).toBe('epilogue')
    })
  })

  describe('checkMapEvent', () => {
    it('returns null when no trigger conditions are met', () => {
      const result = manager.checkMapEvent('saigaitaya', { x: 0, y: 0 })
      expect(result).toBeNull()
    })

    it('triggers chapter1 at kochi_town x=25, y=20 after prologue', () => {
      useProgressStore.getState().setFlag('prologue_completed', true)
      const result = manager.checkMapEvent('kochi_town', { x: 25, y: 20 })
      expect(result).toBe('chapter1')
    })

    it('does not trigger chapter1 if chapter1_started is already set', () => {
      useProgressStore.getState().setFlag('prologue_completed', true)
      useProgressStore.getState().setFlag('chapter1_started', true)
      const result = manager.checkMapEvent('kochi_town', { x: 25, y: 20 })
      expect(result).toBeNull()
    })

    it('does not trigger chapter1 if prologue not completed', () => {
      const result = manager.checkMapEvent('kochi_town', { x: 25, y: 20 })
      expect(result).toBeNull()
    })

    it('triggers chapter2 at yodo_dojo x=12, y=3 after chapter1', () => {
      useProgressStore.getState().setFlag('chapter1_completed', true)
      const result = manager.checkMapEvent('yodo_dojo', { x: 12, y: 3 })
      expect(result).toBe('chapter2')
    })

    it('triggers chapter3 at kochi_town x=30, y=25 after chapter2', () => {
      useProgressStore.getState().setFlag('chapter2_completed', true)
      const result = manager.checkMapEvent('kochi_town', { x: 30, y: 25 })
      expect(result).toBe('chapter3')
    })

    it('triggers chapter4 at kobe_port x=5, y=17 after tosa_arc_completed', () => {
      useProgressStore.getState().setFlag('tosa_arc_completed', true)
      const result = manager.checkMapEvent('kobe_port', { x: 5, y: 17 })
      expect(result).toBe('chapter4')
    })

    it('triggers final_chapter at omiya x=10, y=7 after chapter7', () => {
      useProgressStore.getState().setFlag('chapter7_completed', true)
      const result = manager.checkMapEvent('omiya', { x: 10, y: 7 })
      expect(result).toBe('final_chapter')
    })

    it('does not trigger at wrong coordinates', () => {
      useProgressStore.getState().setFlag('prologue_completed', true)
      const result = manager.checkMapEvent('kochi_town', { x: 0, y: 0 })
      expect(result).toBeNull()
    })

    it('triggers hidden dungeon entrance event', () => {
      const result = manager.checkMapEvent('hidden_dungeon', { x: 2, y: 26 })
      expect(result).toBe('dungeon_entrance')
    })

    it('does not trigger hidden dungeon entrance if already entered', () => {
      useProgressStore.getState().setFlag('hidden_dungeon_entered', true)
      const result = manager.checkMapEvent('hidden_dungeon', { x: 2, y: 26 })
      expect(result).toBeNull()
    })
  })

  describe('startNewGame', () => {
    it('resets progress store', async () => {
      useProgressStore.getState().setFlag('some_flag', true)
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      await manager.startNewGame()
      expect(useProgressStore.getState().flags).toEqual({})
    })

    it('clears existing party members', async () => {
      const { createMockCharacter } = await import('@/test/helpers')
      usePartyStore.getState().addMember(createMockCharacter())
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      await manager.startNewGame()
      // Members may only be ryoma if found, or empty if not in master data
      // Since we mock fetch to return [], ryoma won't be found
      expect(usePartyStore.getState().members).toHaveLength(0)
    })

    it('sets scene to field', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      await manager.startNewGame()
      expect(useGameStore.getState().scene).toBe('field')
    })

    it('gives initial gold of 100', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      await manager.startNewGame()
      expect(usePartyStore.getState().gold).toBe(100)
    })

    it('sets starting map to saigaitaya', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      await manager.startNewGame()
      expect(useProgressStore.getState().currentMapId).toBe('saigaitaya')
    })

    it('loads ryoma from characters.json if present', async () => {
      const ryomaMaster = {
        id: 'ryoma',
        name: '坂本龍馬',
        class: 'swordsman',
        initialLevel: 1,
        initialStats: { maxHp: 100, maxMp: 30, attack: 15, defense: 10, speed: 12, luck: 8 },
        equipment: { weapon: null, armor: null },
        skills: [],
        growthRate: {},
        sprite: 'characters/ryoma.png',
      }
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [ryomaMaster],
      } as Response)
      await manager.startNewGame()
      expect(usePartyStore.getState().members).toHaveLength(1)
      expect(usePartyStore.getState().members[0]!.id).toBe('ryoma')
    })
  })
})
