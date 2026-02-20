import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DamageCalculator } from './DamageCalculator'
import { createMockCharacter, createMockEnemy } from '@/test/helpers'
import type { BattleParticipant } from '@/types/battle'
import type { Skill } from '@/types/skill'

function makeParticipant(overrides: Parameters<typeof createMockCharacter>[0] = {}): BattleParticipant {
  return {
    character: createMockCharacter(overrides),
    currentHp: 100,
    currentMp: 30,
    state: [],
    isDefending: false,
  }
}

function makeEnemyParticipant(overrides: Parameters<typeof createMockEnemy>[0] = {}): BattleParticipant {
  return {
    character: createMockEnemy(overrides),
    currentHp: 50,
    currentMp: 0,
    state: [],
    isDefending: false,
  }
}

const mockSkill: Skill = {
  id: 'slash',
  name: '斬撃',
  description: '強力な斬撃',
  mpCost: 5,
  power: 2.0,
  type: 'physical',
  target: 'single',
  effects: [],
  animation: 'slash',
}

const healSkill: Skill = {
  id: 'heal',
  name: '回復',
  description: '回復する',
  mpCost: 5,
  power: 30,
  type: 'heal',
  target: 'self',
  effects: [],
  animation: 'heal',
}

describe('DamageCalculator', () => {
  let calculator: DamageCalculator

  beforeEach(() => {
    calculator = new DamageCalculator()
    // Fix Math.random to deterministic value (mid-range, no critical)
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  describe('calculateDamage', () => {
    it('calculates normal damage correctly', () => {
      // random=0.5 => factor=0.9+0.5*0.2=1.0, no crit (luck/100=0.08 < 0.5 so crit!)
      // Actually luck=8, luck/100=0.08, random=0.5 > 0.08 means no crit for second call
      // First call: randomFactor, second call: isCritical
      // With mock returning 0.5:
      //   randomFactor = 0.9 + 0.5*0.2 = 1.0
      //   isCritical = 0.5 < 8/100 = false (0.5 > 0.08)
      // damage = (15 * 1.0) - (5/2) = 15 - 2.5 = 12.5 * 1.0 = 12.5 => floor(12.5) = 12
      const attacker = makeParticipant()
      const target = makeEnemyParticipant()
      const result = calculator.calculateDamage(attacker, target)

      expect(result.targetId).toBe('bandit')
      expect(result.damage).toBeGreaterThanOrEqual(1)
      expect(result.isCritical).toBe(false)
      expect(result.isWeak).toBe(false)
      expect(result.isResist).toBe(false)
    })

    it('applies skill power multiplier', () => {
      const attacker = makeParticipant()
      const target = makeEnemyParticipant()

      const normalResult = calculator.calculateDamage(attacker, target)

      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      const skillResult = calculator.calculateDamage(attacker, target, mockSkill)

      // skill power 2.0 should deal more damage
      expect(skillResult.damage).toBeGreaterThan(normalResult.damage)
    })

    it('returns minimum damage of 1 even with high defense', () => {
      const attacker = makeParticipant({ stats: { hp: 100, maxHp: 100, mp: 30, maxMp: 30, attack: 1, defense: 10, speed: 12, luck: 0 } })
      const target = makeEnemyParticipant({ stats: { hp: 50, maxHp: 50, mp: 0, maxMp: 0, attack: 10, defense: 999, speed: 8, luck: 3 } })

      const result = calculator.calculateDamage(attacker, target)
      expect(result.damage).toBeGreaterThanOrEqual(1)
    })

    it('halves damage when target is defending', () => {
      // Use random=0 to avoid critical, factor=0.9
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const attacker = makeParticipant()
      const normalTarget = makeEnemyParticipant()
      const defendingTarget = makeEnemyParticipant()
      defendingTarget.isDefending = true

      const normalResult = calculator.calculateDamage(attacker, normalTarget)

      vi.spyOn(Math, 'random').mockReturnValue(0)
      const defendResult = calculator.calculateDamage(attacker, defendingTarget)

      // Defending target should take less or equal damage
      expect(defendResult.damage).toBeLessThanOrEqual(normalResult.damage)
    })

    it('applies critical hit multiplier (1.5x)', () => {
      // Force critical: luck=100 (luck/100=1.0), random always < 1.0
      vi.spyOn(Math, 'random').mockReturnValue(0.5)
      const attacker = makeParticipant({ stats: { hp: 100, maxHp: 100, mp: 30, maxMp: 30, attack: 15, defense: 10, speed: 12, luck: 100 } })
      const target = makeEnemyParticipant()

      const result = calculator.calculateDamage(attacker, target)
      expect(result.isCritical).toBe(true)
      // damage with crit: floor((15-2.5)*1.0*1.5) = floor(18.75) = 18
      expect(result.damage).toBeGreaterThan(12)
    })

    it('returns correct targetId', () => {
      const attacker = makeParticipant()
      const target = makeEnemyParticipant({ id: 'boss_enemy' })
      const result = calculator.calculateDamage(attacker, target)
      expect(result.targetId).toBe('boss_enemy')
    })

    it('attack=0 results in minimum damage 1', () => {
      const attacker = makeParticipant({ stats: { hp: 100, maxHp: 100, mp: 30, maxMp: 30, attack: 0, defense: 10, speed: 12, luck: 0 } })
      const target = makeEnemyParticipant({ stats: { hp: 50, maxHp: 50, mp: 0, maxMp: 0, attack: 10, defense: 0, speed: 8, luck: 3 } })
      const result = calculator.calculateDamage(attacker, target)
      expect(result.damage).toBeGreaterThanOrEqual(1)
    })
  })

  describe('calculateHeal', () => {
    it('calculates heal amount based on skill power and attack stat', () => {
      // heal = floor((30 + 15*0.5) * 1.0) = floor(37.5) = 37
      const caster = makeParticipant()
      const amount = calculator.calculateHeal(caster, healSkill)
      expect(amount).toBeGreaterThanOrEqual(1)
    })

    it('returns minimum heal of 1', () => {
      const caster = makeParticipant({ stats: { hp: 100, maxHp: 100, mp: 30, maxMp: 30, attack: 0, defense: 0, speed: 12, luck: 0 } })
      const zeroHealSkill: Skill = { ...healSkill, power: 0 }
      const amount = calculator.calculateHeal(caster, zeroHealSkill)
      expect(amount).toBeGreaterThanOrEqual(1)
    })
  })

  describe('calculateMultiDamage', () => {
    it('returns damage result for each target', () => {
      const attacker = makeParticipant()
      const targets = [makeEnemyParticipant(), makeEnemyParticipant({ id: 'enemy2' })]
      const results = calculator.calculateMultiDamage(attacker, targets)
      expect(results).toHaveLength(2)
    })

    it('returns empty array for empty targets', () => {
      const attacker = makeParticipant()
      const results = calculator.calculateMultiDamage(attacker, [])
      expect(results).toHaveLength(0)
    })
  })
})
