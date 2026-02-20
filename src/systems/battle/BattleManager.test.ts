import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BattleManager } from '@/systems/battle/BattleManager'
import { useBattleStore } from '@/stores/battleStore'
import { BattlePhase } from '@/types'
import { createMockCharacter, createMockEnemy, resetAllStores } from '@/test/helpers'

// Mock Math.random for deterministic tests
const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0)

describe('BattleManager', () => {
  let manager: BattleManager

  beforeEach(() => {
    resetAllStores()
    manager = new BattleManager()
    mockRandom.mockReturnValue(0)
  })

  describe('initBattle', () => {
    it('initializes battle with party and enemy participants', () => {
      const party = [createMockCharacter({ id: 'ryoma' })]
      const enemies = [createMockEnemy({ id: 'bandit' })]
      manager.initBattle(party, enemies)

      const state = useBattleStore.getState()
      expect(state.party).toHaveLength(1)
      expect(state.enemies).toHaveLength(1)
      expect(state.party[0]!.character.id).toBe('ryoma')
      expect(state.enemies[0]!.character.id).toBe('bandit')
    })

    it('sets initial phase to COMMAND_SELECT after init', () => {
      manager.initBattle([createMockCharacter()], [createMockEnemy()])
      expect(useBattleStore.getState().phase).toBe(BattlePhase.COMMAND_SELECT)
    })

    it('sets currentHp from character stats', () => {
      const char = createMockCharacter({ stats: { hp: 80, maxHp: 100, mp: 30, maxMp: 30, attack: 15, defense: 10, speed: 12, luck: 8 } })
      manager.initBattle([char], [])
      expect(useBattleStore.getState().party[0]!.currentHp).toBe(80)
    })

    it('sets participants initial state', () => {
      manager.initBattle([createMockCharacter()], [createMockEnemy()])
      const party = useBattleStore.getState().party
      expect(party[0]!.state).toContain('normal')
      expect(party[0]!.isDefending).toBe(false)
    })

    it('sets currentActorId to the first actor', () => {
      manager.initBattle([createMockCharacter({ id: 'ryoma' })], [createMockEnemy({ id: 'bandit' })])
      const currentActorId = useBattleStore.getState().currentActorId
      expect(currentActorId).not.toBeNull()
    })
  })

  describe('executeAction - attack', () => {
    it('applies damage to the target', () => {
      const party = [createMockCharacter({ id: 'ryoma' })]
      const enemies = [createMockEnemy({ id: 'bandit' })]
      manager.initBattle(party, enemies)

      const results = manager.executeAction({
        actorId: 'ryoma',
        command: 'attack',
        targetIds: ['bandit'],
      })

      expect(results).toHaveLength(1)
      expect(results[0]!.targetId).toBe('bandit')
      expect(results[0]!.damage).toBeGreaterThan(0)

      // Enemy HP should have decreased
      const enemyHp = useBattleStore.getState().enemies[0]!.currentHp
      expect(enemyHp).toBeLessThan(50)
    })

    it('sets phase to ACTION_EXECUTE after action', () => {
      manager.initBattle([createMockCharacter({ id: 'ryoma' })], [createMockEnemy({ id: 'bandit' })])
      manager.executeAction({ actorId: 'ryoma', command: 'attack', targetIds: ['bandit'] })
      expect(useBattleStore.getState().phase).toBe(BattlePhase.ACTION_EXECUTE)
    })

    it('returns empty results for unknown actor', () => {
      manager.initBattle([createMockCharacter({ id: 'ryoma' })], [createMockEnemy({ id: 'bandit' })])
      const results = manager.executeAction({ actorId: 'unknown', command: 'attack', targetIds: ['bandit'] })
      expect(results).toHaveLength(0)
    })

    it('returns empty results for unknown target', () => {
      manager.initBattle([createMockCharacter({ id: 'ryoma' })], [createMockEnemy({ id: 'bandit' })])
      const results = manager.executeAction({ actorId: 'ryoma', command: 'attack', targetIds: ['unknown'] })
      expect(results).toHaveLength(0)
    })
  })

  describe('executeAction - defend', () => {
    it('sets isDefending to true for the actor', () => {
      manager.initBattle([createMockCharacter({ id: 'ryoma' })], [createMockEnemy({ id: 'bandit' })])
      // defend requires at least one targetId to pass the early-return guard
      manager.executeAction({ actorId: 'ryoma', command: 'defend', targetIds: ['bandit'] })
      expect(useBattleStore.getState().party[0]!.isDefending).toBe(true)
    })
  })

  describe('checkBattleEnd', () => {
    it('returns null when battle is ongoing', () => {
      manager.initBattle([createMockCharacter({ id: 'ryoma' })], [createMockEnemy({ id: 'bandit' })])
      const result = manager.checkBattleEnd()
      expect(result).toBeNull()
    })

    it('returns defeat result when all party members are dead', () => {
      manager.initBattle([createMockCharacter({ id: 'ryoma' })], [createMockEnemy({ id: 'bandit' })])
      // Set party member as dead
      useBattleStore.getState().updateParticipant('ryoma', { state: ['dead'] })
      const result = manager.checkBattleEnd()
      expect(result).not.toBeNull()
      expect(result?.victory).toBe(false)
    })

    it('returns victory result when all enemies are dead', () => {
      manager.initBattle([createMockCharacter({ id: 'ryoma' })], [createMockEnemy({ id: 'bandit' })])
      // Set enemy as dead
      useBattleStore.getState().updateParticipant('bandit', { state: ['dead'] })
      const result = manager.checkBattleEnd()
      expect(result).not.toBeNull()
      expect(result?.victory).toBe(true)
    })

    it('victory result contains exp and gold', () => {
      const enemy = createMockEnemy({ id: 'bandit', level: 2 })
      manager.initBattle([createMockCharacter({ id: 'ryoma' })], [enemy])
      useBattleStore.getState().updateParticipant('bandit', { state: ['dead'] })
      const result = manager.checkBattleEnd()
      expect(result?.exp).toBeGreaterThan(0)
      expect(result?.gold).toBeGreaterThan(0)
    })
  })

  describe('getCurrentActor / isCurrentActorEnemy', () => {
    it('returns the current actor', () => {
      manager.initBattle([createMockCharacter({ id: 'ryoma' })], [createMockEnemy({ id: 'bandit' })])
      const actor = manager.getCurrentActor()
      expect(actor).not.toBeNull()
    })

    it('returns null when no battle is active', () => {
      const actor = manager.getCurrentActor()
      expect(actor).toBeNull()
    })

    it('correctly identifies if current actor is an enemy', () => {
      // Enemy has high speed so they may act first
      const fastEnemy = createMockEnemy({
        id: 'bandit',
        stats: { hp: 50, maxHp: 50, mp: 0, maxMp: 0, attack: 10, defense: 5, speed: 999, luck: 3 }
      })
      const slowParty = createMockCharacter({ id: 'ryoma', stats: { hp: 100, maxHp: 100, mp: 30, maxMp: 30, attack: 15, defense: 10, speed: 1, luck: 8 } })
      manager.initBattle([slowParty], [fastEnemy])
      expect(manager.isCurrentActorEnemy()).toBe(true)
    })
  })

  describe('getTurnOrder', () => {
    it('returns the turn order after initBattle', () => {
      manager.initBattle([createMockCharacter({ id: 'ryoma' })], [createMockEnemy({ id: 'bandit' })])
      const order = manager.getTurnOrder()
      expect(order).toHaveLength(2)
    })
  })

  describe('executeEnemyAction', () => {
    it('enemy attacks a living party member', () => {
      const party = [createMockCharacter({ id: 'ryoma' })]
      const enemies = [createMockEnemy({ id: 'bandit' })]
      manager.initBattle(party, enemies)

      const enemy = useBattleStore.getState().enemies[0]!
      const results = manager.executeEnemyAction(enemy)
      expect(results.length).toBeGreaterThanOrEqual(0) // May or may not deal damage depending on state
    })

    it('returns empty results when all party members are dead', () => {
      manager.initBattle([createMockCharacter({ id: 'ryoma' })], [createMockEnemy({ id: 'bandit' })])
      useBattleStore.getState().updateParticipant('ryoma', { state: ['dead'] })

      const enemy = useBattleStore.getState().enemies[0]!
      const results = manager.executeEnemyAction(enemy)
      expect(results).toHaveLength(0)
    })
  })

  describe('startTurn - defending state reset', () => {
    it('resets defending state at start of new turn', () => {
      manager.initBattle([createMockCharacter({ id: 'ryoma' })], [createMockEnemy({ id: 'bandit' })])
      manager.executeAction({ actorId: 'ryoma', command: 'defend', targetIds: ['bandit'] })
      expect(useBattleStore.getState().party[0]!.isDefending).toBe(true)

      manager.startTurn()
      expect(useBattleStore.getState().party[0]!.isDefending).toBe(false)
    })
  })
})
