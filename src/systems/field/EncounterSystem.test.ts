import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EncounterSystem } from './EncounterSystem'

describe('EncounterSystem', () => {
  let system: EncounterSystem

  beforeEach(() => {
    system = new EncounterSystem()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('onStep', () => {
    it('returns false for first two steps (not yet at 3)', () => {
      expect(system.onStep()).toBe(false)
      expect(system.onStep()).toBe(false)
    })

    it('checks encounter on every 3rd step', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0) // 0 < 0.05 => encounter
      system.onStep()
      system.onStep()
      const result = system.onStep()
      expect(result).toBe(true)
    })

    it('returns false on 3rd step if random above encounter rate', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9) // 0.9 >= 0.05 => no encounter
      system.onStep()
      system.onStep()
      const result = system.onStep()
      expect(result).toBe(false)
    })

    it('resets step count after 3rd step', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9)
      system.onStep()
      system.onStep()
      system.onStep() // 3rd step, resets
      // 4th and 5th step should return false (not the 3rd again)
      expect(system.onStep()).toBe(false)
      expect(system.onStep()).toBe(false)
    })
  })

  describe('setEncounterRate', () => {
    it('sets encounter rate between 0 and 1', () => {
      system.setEncounterRate(0.2)
      vi.spyOn(Math, 'random').mockReturnValue(0.1) // 0.1 < 0.2 => encounter
      system.onStep()
      system.onStep()
      expect(system.onStep()).toBe(true)
    })

    it('clamps rate to 0 minimum', () => {
      system.setEncounterRate(-1)
      vi.spyOn(Math, 'random').mockReturnValue(0) // rate=0, 0 < 0 = false
      system.onStep()
      system.onStep()
      expect(system.onStep()).toBe(false)
    })

    it('clamps rate to 1 maximum (always encounter)', () => {
      system.setEncounterRate(2)
      vi.spyOn(Math, 'random').mockReturnValue(0.99) // 0.99 < 1.0 => encounter
      system.onStep()
      system.onStep()
      expect(system.onStep()).toBe(true)
    })
  })

  describe('getEnemyGroup', () => {
    it('returns empty array for empty enemy list', () => {
      expect(system.getEnemyGroup([])).toEqual([])
    })

    it('returns 1-3 enemies from the provided list', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0) // count = floor(0*3)+1 = 1, index = 0
      const enemies = ['enemy_a', 'enemy_b', 'enemy_c']
      const group = system.getEnemyGroup(enemies)
      expect(group.length).toBeGreaterThanOrEqual(1)
      expect(group.length).toBeLessThanOrEqual(3)
    })

    it('only returns enemies from the provided list', () => {
      const enemies = ['wolf', 'bandit']
      const group = system.getEnemyGroup(enemies)
      group.forEach((e) => expect(enemies).toContain(e))
    })

    it('returns 1 enemy when random is 0', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0) // floor(0*3)+1=1
      const enemies = ['enemy_a']
      const group = system.getEnemyGroup(enemies)
      expect(group).toHaveLength(1)
    })

    it('works with single enemy in list', () => {
      const enemies = ['only_enemy']
      const group = system.getEnemyGroup(enemies)
      group.forEach((e) => expect(e).toBe('only_enemy'))
    })
  })

  describe('reset', () => {
    it('resets step count so encounter check restarts at 3', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9)
      system.onStep()
      system.onStep()
      system.reset()
      // After reset, need 3 more steps before encounter check
      expect(system.onStep()).toBe(false)
      expect(system.onStep()).toBe(false)
      // 3rd step after reset triggers check
      const result = system.onStep()
      expect(typeof result).toBe('boolean')
    })
  })
})
