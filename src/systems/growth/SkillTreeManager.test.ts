import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SkillTreeManager } from './SkillTreeManager'
import { createMockCharacter, resetAllStores } from '@/test/helpers'
import { usePartyStore } from '@/stores/partyStore'
import type { Skill, SkillTree } from '@/types/skill'

const mockSkill: Skill = {
  id: 'basic_slash',
  name: '基本斬り',
  description: '基本の斬り攻撃',
  mpCost: 0,
  power: 1.2,
  type: 'physical',
  target: 'single',
  effects: [],
  animation: 'slash',
}

const advancedSkill: Skill = {
  id: 'dragon_sword',
  name: '龍の剣',
  description: '強力な斬撃',
  mpCost: 10,
  power: 2.0,
  type: 'physical',
  target: 'single',
  effects: [],
  animation: 'dragon',
}

const autoSkill: Skill = {
  id: 'auto_skill',
  name: '自動習得スキル',
  description: '自動習得',
  mpCost: 0,
  power: 1.0,
  type: 'physical',
  target: 'single',
  effects: [],
  animation: 'none',
}

const mockSkillTree: SkillTree = {
  characterClass: 'swordsman',
  nodes: [
    {
      skillId: 'basic_slash',
      requiredLevel: 1,
      requiredPoints: 1,
      position: { x: 0, y: 0 },
    },
    {
      skillId: 'dragon_sword',
      requiredLevel: 5,
      requiredPoints: 2,
      prerequisiteSkills: ['basic_slash'],
      position: { x: 1, y: 0 },
    },
    {
      skillId: 'auto_skill',
      requiredLevel: 3,
      requiredPoints: 0, // auto-learn
      position: { x: 0, y: 1 },
    },
  ],
}

function createLoadedManager(): SkillTreeManager {
  const manager = new SkillTreeManager()
  const m = manager as unknown as {
    skills: Map<string, Skill>
    skillTrees: Map<string, SkillTree>
    loaded: boolean
  }
  m.skills.set('basic_slash', mockSkill)
  m.skills.set('dragon_sword', advancedSkill)
  m.skills.set('auto_skill', autoSkill)
  m.skillTrees.set('swordsman', mockSkillTree)
  m.loaded = true
  return manager
}

describe('SkillTreeManager', () => {
  let manager: SkillTreeManager

  beforeEach(() => {
    resetAllStores()
    manager = createLoadedManager()
  })

  describe('loadData', () => {
    it('loads skills and skill trees from JSON', async () => {
      const freshManager = new SkillTreeManager()
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ skills: [mockSkill] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ skillTrees: [mockSkillTree] }),
        } as Response)

      await freshManager.loadData()
      expect(freshManager.getSkill('basic_slash')).toBeDefined()
      expect(freshManager.getSkillTree('swordsman')).toBeDefined()
    })

    it('throws when skills fetch fails', async () => {
      const freshManager = new SkillTreeManager()
      vi.mocked(global.fetch).mockResolvedValueOnce({ ok: false, status: 404 } as Response)
      await expect(freshManager.loadData()).rejects.toThrow()
    })
  })

  describe('canLearnSkill', () => {
    it('returns null when no tree for character class', () => {
      const char = createMockCharacter({ class: 'unknown_class' })
      expect(manager.canLearnSkill(char, 'basic_slash')).toBeNull()
    })

    it('returns null when skill not in tree', () => {
      const char = createMockCharacter({ class: 'swordsman' })
      expect(manager.canLearnSkill(char, 'nonexistent')).toBeNull()
    })

    it('returns canLearn=false if already learned', () => {
      const char = createMockCharacter({ class: 'swordsman', skills: ['basic_slash'], skillPoints: 5, level: 5 })
      const result = manager.canLearnSkill(char, 'basic_slash')
      expect(result?.canLearn).toBe(false)
      expect(result?.reason).toContain('習得済み')
    })

    it('returns canLearn=false if level too low', () => {
      const char = createMockCharacter({ class: 'swordsman', level: 1, skillPoints: 5, skills: ['basic_slash'] })
      const result = manager.canLearnSkill(char, 'dragon_sword')
      expect(result?.canLearn).toBe(false)
      expect(result?.reason).toContain('レベル5')
    })

    it('returns canLearn=false if not enough skill points', () => {
      const char = createMockCharacter({ class: 'swordsman', level: 5, skillPoints: 0, skills: ['basic_slash'] })
      const result = manager.canLearnSkill(char, 'dragon_sword')
      expect(result?.canLearn).toBe(false)
      expect(result?.reason).toContain('スキルポイント')
    })

    it('returns canLearn=false if prerequisite skill missing', () => {
      const char = createMockCharacter({ class: 'swordsman', level: 10, skillPoints: 5, skills: [] })
      const result = manager.canLearnSkill(char, 'dragon_sword')
      expect(result?.canLearn).toBe(false)
      expect(result?.reason).toContain('前提スキル')
    })

    it('returns canLearn=true when all requirements met', () => {
      const char = createMockCharacter({
        class: 'swordsman',
        level: 5,
        skillPoints: 2,
        skills: ['basic_slash'],
      })
      const result = manager.canLearnSkill(char, 'dragon_sword')
      expect(result?.canLearn).toBe(true)
    })

    it('returns canLearn=true for simple skill', () => {
      const char = createMockCharacter({ class: 'swordsman', level: 1, skillPoints: 1, skills: [] })
      const result = manager.canLearnSkill(char, 'basic_slash')
      expect(result?.canLearn).toBe(true)
    })
  })

  describe('learnSkill', () => {
    it('fails when character not in store', () => {
      const char = createMockCharacter({ id: 'not_in_store', class: 'swordsman', level: 1, skillPoints: 1, skills: [] })
      const result = manager.learnSkill(char, 'basic_slash')
      expect(result.success).toBe(false)
      expect(result.error).toContain('見つかりません')
    })

    it('succeeds and adds skill to character', () => {
      const char = createMockCharacter({ class: 'swordsman', level: 1, skillPoints: 1, skills: [] })
      usePartyStore.getState().addMember(char)
      const result = manager.learnSkill(char, 'basic_slash')
      expect(result.success).toBe(true)
      const updated = usePartyStore.getState().getMember('ryoma')
      expect(updated?.skills).toContain('basic_slash')
    })

    it('consumes skill points on learn', () => {
      const char = createMockCharacter({ class: 'swordsman', level: 1, skillPoints: 3, skills: [] })
      usePartyStore.getState().addMember(char)
      manager.learnSkill(char, 'basic_slash') // costs 1 point
      const updated = usePartyStore.getState().getMember('ryoma')
      expect(updated?.skillPoints).toBe(2)
    })

    it('fails when requirements not met', () => {
      const char = createMockCharacter({ class: 'swordsman', level: 1, skillPoints: 0, skills: [] })
      usePartyStore.getState().addMember(char)
      const result = manager.learnSkill(char, 'basic_slash')
      expect(result.success).toBe(false)
    })
  })

  describe('checkAutoLearnSkills', () => {
    it('returns empty array when no tree for class', () => {
      const char = createMockCharacter({ class: 'unknown', skills: [] })
      expect(manager.checkAutoLearnSkills(char, 5)).toEqual([])
    })

    it('auto-learns skills with requiredPoints=0 at appropriate level', () => {
      const char = createMockCharacter({ class: 'swordsman', level: 1, skills: [] })
      usePartyStore.getState().addMember(char)
      const learned = manager.checkAutoLearnSkills(char, 3)
      expect(learned).toContain('auto_skill')
    })

    it('does not auto-learn if level not met', () => {
      const char = createMockCharacter({ class: 'swordsman', level: 1, skills: [] })
      usePartyStore.getState().addMember(char)
      const learned = manager.checkAutoLearnSkills(char, 1)
      // auto_skill requires level 3
      expect(learned).not.toContain('auto_skill')
    })

    it('skips already learned skills', () => {
      const char = createMockCharacter({ class: 'swordsman', level: 5, skills: ['auto_skill'] })
      usePartyStore.getState().addMember(char)
      const learned = manager.checkAutoLearnSkills(char, 5)
      expect(learned).not.toContain('auto_skill')
    })

    it('does not auto-learn skills with requiredPoints > 0', () => {
      const char = createMockCharacter({ class: 'swordsman', level: 10, skills: [] })
      usePartyStore.getState().addMember(char)
      const learned = manager.checkAutoLearnSkills(char, 10)
      // basic_slash has requiredPoints=1, should NOT be auto-learned
      expect(learned).not.toContain('basic_slash')
    })
  })

  describe('getSkill / getSkillTree / getAllSkills', () => {
    it('getSkill returns skill by id', () => {
      expect(manager.getSkill('basic_slash')).toBeDefined()
      expect(manager.getSkill('nonexistent')).toBeUndefined()
    })

    it('getSkillTree returns tree by class', () => {
      expect(manager.getSkillTree('swordsman')).toBeDefined()
      expect(manager.getSkillTree('unknown')).toBeUndefined()
    })

    it('getAllSkills returns all loaded skills', () => {
      const all = manager.getAllSkills()
      expect(all.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('getLearnedSkills', () => {
    it('returns skills the character has learned', () => {
      const char = createMockCharacter({ skills: ['basic_slash'] })
      const learned = manager.getLearnedSkills(char)
      expect(learned).toHaveLength(1)
      expect(learned[0]!.id).toBe('basic_slash')
    })

    it('filters out unknown skill ids', () => {
      const char = createMockCharacter({ skills: ['nonexistent'] })
      const learned = manager.getLearnedSkills(char)
      expect(learned).toHaveLength(0)
    })
  })

  describe('getLearnableSkills', () => {
    it('returns empty for unknown class', () => {
      const char = createMockCharacter({ class: 'unknown' })
      expect(manager.getLearnableSkills(char)).toEqual([])
    })

    it('returns learnability for all nodes in tree', () => {
      const char = createMockCharacter({ class: 'swordsman', level: 1, skillPoints: 1, skills: [] })
      const learnable = manager.getLearnableSkills(char)
      expect(learnable.length).toBeGreaterThan(0)
    })
  })
})
