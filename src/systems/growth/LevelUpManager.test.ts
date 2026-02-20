import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LevelUpManager } from './LevelUpManager'
import { createMockCharacter, resetAllStores } from '@/test/helpers'
import { usePartyStore } from '@/stores/partyStore'

// Mock SkillTreeManager to avoid fetch calls
vi.mock('./SkillTreeManager', () => ({
  skillTreeManager: {
    checkAutoLearnSkills: vi.fn(() => []),
  },
}))

describe('LevelUpManager', () => {
  let manager: LevelUpManager

  beforeEach(() => {
    resetAllStores()
    manager = new LevelUpManager()
  })

  describe('checkAndLevelUp', () => {
    it('returns null when exp is not enough for level up', () => {
      const char = createMockCharacter({ level: 1, exp: 0 })
      usePartyStore.getState().addMember(char)
      // Need 30 exp for Lv2, adding 10 is not enough
      const result = manager.checkAndLevelUp(char, 10)
      expect(result).toBeNull()
    })

    it('returns LevelUpResult when enough exp to level up', () => {
      const char = createMockCharacter({ level: 1, exp: 0 })
      usePartyStore.getState().addMember(char)
      // 30 exp needed for Lv2
      const result = manager.checkAndLevelUp(char, 30)
      expect(result).not.toBeNull()
      expect(result!.oldLevel).toBe(1)
      expect(result!.newLevel).toBe(2)
    })

    it('handles multiple level ups at once', () => {
      const char = createMockCharacter({ level: 1, exp: 0 })
      usePartyStore.getState().addMember(char)
      // Give enough for Lv3 (80 exp needed)
      const result = manager.checkAndLevelUp(char, 80)
      expect(result).not.toBeNull()
      expect(result!.newLevel).toBe(3)
    })

    it('calculates stat changes based on growth rate', () => {
      const char = createMockCharacter({
        level: 1,
        exp: 0,
        growthRate: { hp: 10, mp: 5, attack: 3, defense: 2, speed: 2, luck: 1 },
      })
      usePartyStore.getState().addMember(char)
      const result = manager.checkAndLevelUp(char, 30)
      expect(result).not.toBeNull()
      expect(result!.statChanges.maxHp).toBe(10)
      expect(result!.statChanges.maxMp).toBe(5)
      expect(result!.statChanges.attack).toBe(3)
    })

    it('updates partyStore member on level up', () => {
      const char = createMockCharacter({ level: 1, exp: 0 })
      usePartyStore.getState().addMember(char)
      manager.checkAndLevelUp(char, 30)
      const updated = usePartyStore.getState().getMember('ryoma')
      expect(updated?.level).toBe(2)
    })

    it('grants skill points equal to levels gained', () => {
      const char = createMockCharacter({ level: 1, exp: 0, skillPoints: 0 })
      usePartyStore.getState().addMember(char)
      manager.checkAndLevelUp(char, 80) // Lv1->Lv3 = 2 levels
      const updated = usePartyStore.getState().getMember('ryoma')
      expect(updated?.skillPoints).toBe(2)
    })

    it('does not level up beyond 50', () => {
      const char = createMockCharacter({ level: 49, exp: 94700 })
      usePartyStore.getState().addMember(char)
      const result = manager.checkAndLevelUp(char, 100000)
      expect(result!.newLevel).toBeLessThanOrEqual(50)
    })

    it('uses class default growth rate when no growthRate defined', () => {
      const char = createMockCharacter({ level: 1, exp: 0, growthRate: undefined })
      usePartyStore.getState().addMember(char)
      const result = manager.checkAndLevelUp(char, 30)
      expect(result).not.toBeNull()
      // swordsman default: hp=5
      expect(result!.statChanges.maxHp).toBe(5)
    })
  })

  describe('getExpForNextLevel', () => {
    it('returns 30 for level 1 (need 30 for Lv2)', () => {
      expect(LevelUpManager.getExpForNextLevel(1)).toBe(30)
    })

    it('returns 80 for level 2 (need 80 for Lv3)', () => {
      expect(LevelUpManager.getExpForNextLevel(2)).toBe(80)
    })

    it('returns 0 for max level 50', () => {
      expect(LevelUpManager.getExpForNextLevel(50)).toBe(0)
    })
  })

  describe('getExpToNextLevel', () => {
    it('returns remaining exp to next level', () => {
      // Lv1 needs 30 exp; if currently at 10, need 20 more
      expect(LevelUpManager.getExpToNextLevel(1, 10)).toBe(20)
    })

    it('returns 0 when already at max level', () => {
      expect(LevelUpManager.getExpToNextLevel(50, 100200)).toBe(0)
    })

    it('returns 0 when current exp equals required', () => {
      expect(LevelUpManager.getExpToNextLevel(1, 30)).toBe(0)
    })

    it('clamps to 0 when exp exceeds threshold', () => {
      expect(LevelUpManager.getExpToNextLevel(1, 100)).toBe(0)
    })
  })
})
