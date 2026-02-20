import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SaveManager } from '@/utils/saveManager'
import { usePartyStore } from '@/stores/partyStore'
import { useProgressStore } from '@/stores/progressStore'
import { useGameStore } from '@/stores/gameStore'
import { resetAllStores } from '@/test/helpers'
import type { SaveData } from '@/types/save'

function buildMinimalSaveData(overrides: Partial<SaveData> = {}): SaveData {
  return {
    version: '1.0.0',
    timestamp: Date.now(),
    playTime: 0,
    chapter: 'prologue',
    currentMap: 'saigaitaya',
    playerPosition: { x: 15, y: 5 },
    party: { members: [], formation: [] },
    characters: {},
    inventory: { items: {}, money: 0 },
    flags: {},
    visitedMaps: [],
    settings: { bgmVolume: 0.5, seVolume: 0.7, messageSpeed: 2 },
    difficulty: 'normal',
    quests: { activeQuests: [], completedQuests: [] },
    achievements: { unlockedAchievements: [] },
    encyclopedia: { discoveredEnemies: [], discoveredItems: [], discoveredSkills: [] },
    ...overrides,
  } as SaveData
}

describe('SaveManager', () => {
  beforeEach(() => {
    resetAllStores()
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('save', () => {
    it('saves data to localStorage for a valid slot', () => {
      const result = SaveManager.save(0)
      expect(result).toBe(true)
      expect(localStorage.setItem).toHaveBeenCalled()
    })

    it('returns false for invalid slot numbers', () => {
      expect(SaveManager.save(-1)).toBe(false)
      expect(SaveManager.save(3)).toBe(false)
    })

    it('saves with auto slot', () => {
      const result = SaveManager.save('auto')
      expect(result).toBe(true)
    })

    it('includes current party gold in save data', () => {
      usePartyStore.getState().addGold(500)
      SaveManager.save(0)
      const saved = SaveManager.getSaveInfo(0)
      expect(saved?.inventory.money).toBe(500)
    })

    it('includes current map position in save data when provided', () => {
      SaveManager.save(0, 'kochi_town', { x: 10, y: 20 })
      const saved = SaveManager.getSaveInfo(0)
      expect(saved?.currentMap).toBe('kochi_town')
      expect(saved?.playerPosition).toEqual({ x: 10, y: 20 })
    })

    it('includes progress flags in save data', () => {
      useProgressStore.getState().setFlag('prologue_completed', true)
      SaveManager.save(0)
      const saved = SaveManager.getSaveInfo(0)
      expect(saved?.flags['prologue_completed']).toBe(true)
    })
  })

  describe('hasSave', () => {
    it('returns false when no save exists', () => {
      expect(SaveManager.hasSave(0)).toBe(false)
    })

    it('returns true after saving', () => {
      SaveManager.save(0)
      expect(SaveManager.hasSave(0)).toBe(true)
    })

    it('returns true for auto slot after saving', () => {
      SaveManager.save('auto')
      expect(SaveManager.hasSave('auto')).toBe(true)
    })
  })

  describe('getSaveInfo', () => {
    it('returns null when no save exists', () => {
      expect(SaveManager.getSaveInfo(0)).toBeNull()
    })

    it('returns save data when save exists', () => {
      SaveManager.save(1)
      const info = SaveManager.getSaveInfo(1)
      expect(info).not.toBeNull()
      expect(info?.version).toBe('1.0.0')
    })

    it('returns null for invalid/corrupt data', () => {
      localStorage.setItem('bakumatsu-fantasy:save-0', 'invalid json{')
      expect(SaveManager.getSaveInfo(0)).toBeNull()
    })
  })

  describe('deleteSave', () => {
    it('deletes a save slot', () => {
      SaveManager.save(0)
      expect(SaveManager.hasSave(0)).toBe(true)
      SaveManager.deleteSave(0)
      expect(SaveManager.hasSave(0)).toBe(false)
    })

    it('deletes auto save slot', () => {
      SaveManager.save('auto')
      SaveManager.deleteSave('auto')
      expect(SaveManager.hasSave('auto')).toBe(false)
    })
  })

  describe('getAllSaveSlots', () => {
    it('returns 3 slots', () => {
      const slots = SaveManager.getAllSaveSlots()
      expect(slots).toHaveLength(3)
    })

    it('returns null data for empty slots', () => {
      const slots = SaveManager.getAllSaveSlots()
      slots.forEach((s) => expect(s.data).toBeNull())
    })

    it('returns data for saved slots', () => {
      SaveManager.save(1)
      const slots = SaveManager.getAllSaveSlots()
      expect(slots[1]!.data).not.toBeNull()
    })
  })

  describe('load', () => {
    it('returns false when slot is empty', async () => {
      const result = await SaveManager.load(0)
      expect(result).toBe(false)
    })

    it('returns false for invalid slot', async () => {
      expect(await SaveManager.load(-1)).toBe(false)
      expect(await SaveManager.load(3)).toBe(false)
    })

    it('loads save data and restores gold', async () => {
      // Setup: mock fetch for characters.json
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      usePartyStore.getState().addGold(999)
      SaveManager.save(0)

      // Reset and load
      resetAllStores()
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response)

      const result = await SaveManager.load(0)
      expect(result).toBe(true)
      expect(usePartyStore.getState().gold).toBe(999)
    })

    it('loads save data and restores progress flags', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      useProgressStore.getState().setFlag('prologue_completed', true)
      SaveManager.save(0)

      resetAllStores()
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)

      await SaveManager.load(0)
      expect(useProgressStore.getState().flags['prologue_completed']).toBe(true)
    })

    it('loads save data and sets scene to field', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)
      SaveManager.save(0)

      resetAllStores()
      vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [] } as Response)

      await SaveManager.load(0)
      expect(useGameStore.getState().scene).toBe('field')
    })

    it('returns false for corrupt save data', async () => {
      localStorage.setItem('bakumatsu-fantasy:save-0', JSON.stringify({ invalid: true }))
      const result = await SaveManager.load(0)
      expect(result).toBe(false)
    })
  })

  describe('validateSaveData (via getSaveInfo)', () => {
    it('rejects save data missing required fields', () => {
      // Missing version
      const bad = { timestamp: 123, playTime: 0 }
      localStorage.setItem('bakumatsu-fantasy:save-0', JSON.stringify(bad))
      expect(SaveManager.getSaveInfo(0)).toBeNull()
    })

    it('accepts well-formed save data', () => {
      const good = buildMinimalSaveData()
      localStorage.setItem('bakumatsu-fantasy:save-0', JSON.stringify(good))
      expect(SaveManager.getSaveInfo(0)).not.toBeNull()
    })
  })
})
