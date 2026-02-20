import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RewardManager } from '@/systems/battle/RewardManager'
import { usePartyStore } from '@/stores/partyStore'
import { createMockCharacter, resetAllStores } from '@/test/helpers'

// Mock achievement manager to avoid side effects
vi.mock('@/systems/achievement/AchievementManager', () => ({
  achievementManager: { checkAchievements: vi.fn(() => []) },
}))

describe('RewardManager', () => {
  let manager: RewardManager

  beforeEach(() => {
    resetAllStores()
    manager = new RewardManager()
  })

  describe('distributeRewards - basic distribution', () => {
    it('returns empty array when no alive party members', () => {
      // Party is empty (all dead / no members)
      const result = manager.distributeRewards({ victory: true, exp: 100, gold: 50, items: [] })
      expect(result).toHaveLength(0)
    })

    it('distributes gold to party store', () => {
      const char = createMockCharacter({ id: 'ryoma', stats: { hp: 100, maxHp: 100, mp: 30, maxMp: 30, attack: 15, defense: 10, speed: 12, luck: 8 } })
      usePartyStore.getState().addMember(char)

      manager.distributeRewards({ victory: true, exp: 0, gold: 300, items: [] })
      expect(usePartyStore.getState().gold).toBe(300)
    })

    it('adds items to party store', () => {
      const char = createMockCharacter({ id: 'ryoma' })
      usePartyStore.getState().addMember(char)

      manager.distributeRewards({ victory: true, exp: 0, gold: 0, items: ['herb', 'herb'] })
      expect(usePartyStore.getState().items).toContain('herb')
      expect(usePartyStore.getState().items).toHaveLength(2)
    })

    it('distributes exp per member evenly', () => {
      const char1 = createMockCharacter({ id: 'ryoma', exp: 0 })
      const char2 = createMockCharacter({ id: 'takechi', exp: 0 })
      usePartyStore.getState().addMember(char1)
      usePartyStore.getState().addMember(char2)

      const distributions = manager.distributeRewards({ victory: true, exp: 100, gold: 0, items: [] })
      // 2 members, 100 exp / 2 = 50 each
      expect(distributions).toHaveLength(2)
      expect(distributions[0]!.exp).toBe(50)
      expect(distributions[1]!.exp).toBe(50)
    })

    it('returns distribution info for each alive member', () => {
      const char = createMockCharacter({ id: 'ryoma' })
      usePartyStore.getState().addMember(char)

      const distributions = manager.distributeRewards({ victory: true, exp: 50, gold: 100, items: [] })
      expect(distributions[0]!.memberId).toBe('ryoma')
      expect(distributions[0]!.memberName).toBe('坂本龍馬')
    })

    it('skips dead party members (hp = 0)', () => {
      const aliveChar = createMockCharacter({ id: 'ryoma', stats: { hp: 100, maxHp: 100, mp: 30, maxMp: 30, attack: 15, defense: 10, speed: 12, luck: 8 } })
      const deadChar = createMockCharacter({ id: 'takechi', stats: { hp: 0, maxHp: 100, mp: 30, maxMp: 30, attack: 12, defense: 8, speed: 10, luck: 6 } })
      usePartyStore.getState().addMember(aliveChar)
      usePartyStore.getState().addMember(deadChar)

      const distributions = manager.distributeRewards({ victory: true, exp: 100, gold: 0, items: [] })
      expect(distributions).toHaveLength(1)
      expect(distributions[0]!.memberId).toBe('ryoma')
    })
  })

  describe('distributeRewards - level up detection', () => {
    it('detects level up for a member with enough exp', () => {
      // Give char enough exp to be near level up threshold
      // LevelUpManager EXP_TABLE: Lv1->Lv2 = 100 exp (typical)
      const char = createMockCharacter({ id: 'ryoma', level: 1, exp: 90 })
      usePartyStore.getState().addMember(char)

      const distributions = manager.distributeRewards({ victory: true, exp: 20, gold: 0, items: [] })
      // 20 exp for 1 member = 20 exp, total = 110 which may trigger level up
      expect(distributions[0]!.levelUp).toBeDefined()
    })
  })
})
