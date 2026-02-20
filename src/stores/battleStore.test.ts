import { describe, it, expect, beforeEach } from 'vitest'
import { useBattleStore } from '@/stores/battleStore'
import { BattlePhase } from '@/types'
import type { BattleParticipant } from '@/types'
import { createMockCharacter, createMockEnemy, resetAllStores } from '@/test/helpers'

function makeParticipant(overrides: Partial<BattleParticipant> = {}): BattleParticipant {
  return {
    character: createMockCharacter(),
    currentHp: 100,
    currentMp: 30,
    state: [],
    isDefending: false,
    ...overrides,
  }
}

function makeEnemyParticipant(overrides: Partial<BattleParticipant> = {}): BattleParticipant {
  return {
    character: createMockEnemy(),
    currentHp: 50,
    currentMp: 0,
    state: [],
    isDefending: false,
    ...overrides,
  }
}

describe('battleStore', () => {
  beforeEach(() => {
    resetAllStores()
  })

  describe('initBattle', () => {
    it('initializes battle with party and enemies', () => {
      const party = [makeParticipant()]
      const enemies = [makeEnemyParticipant()]
      useBattleStore.getState().initBattle(party, enemies)

      const state = useBattleStore.getState()
      expect(state.party).toHaveLength(1)
      expect(state.enemies).toHaveLength(1)
      expect(state.phase).toBe(BattlePhase.COMMAND_SELECT)
      expect(state.turn).toBe(1)
      expect(state.actionQueue).toHaveLength(0)
      expect(state.currentActorId).toBeNull()
      expect(state.result).toBeNull()
    })
  })

  describe('setPhase', () => {
    it('sets the battle phase', () => {
      useBattleStore.getState().setPhase(BattlePhase.ACTION_EXECUTE)
      expect(useBattleStore.getState().phase).toBe(BattlePhase.ACTION_EXECUTE)
    })
  })

  describe('addAction / executeNextAction', () => {
    it('adds an action to the queue', () => {
      const action = { actorId: 'ryoma', command: 'attack' as const, targetIds: ['bandit'] }
      useBattleStore.getState().addAction(action)
      expect(useBattleStore.getState().actionQueue).toHaveLength(1)
    })

    it('executeNextAction removes and returns the first action', () => {
      const action1 = { actorId: 'ryoma', command: 'attack' as const, targetIds: ['bandit'] }
      const action2 = { actorId: 'takechi', command: 'defend' as const, targetIds: [] }
      useBattleStore.getState().addAction(action1)
      useBattleStore.getState().addAction(action2)

      const executed = useBattleStore.getState().executeNextAction()
      expect(executed?.actorId).toBe('ryoma')
      expect(useBattleStore.getState().actionQueue).toHaveLength(1)
      expect(useBattleStore.getState().currentActorId).toBe('ryoma')
    })

    it('executeNextAction returns null for empty queue', () => {
      const result = useBattleStore.getState().executeNextAction()
      expect(result).toBeNull()
    })
  })

  describe('updateParticipant', () => {
    it('updates a party participant', () => {
      const participant = makeParticipant()
      useBattleStore.getState().initBattle([participant], [])
      useBattleStore.getState().updateParticipant('ryoma', { currentHp: 50 })
      expect(useBattleStore.getState().party[0]!.currentHp).toBe(50)
    })

    it('updates an enemy participant', () => {
      const enemy = makeEnemyParticipant()
      useBattleStore.getState().initBattle([], [enemy])
      useBattleStore.getState().updateParticipant('bandit', { currentHp: 10 })
      expect(useBattleStore.getState().enemies[0]!.currentHp).toBe(10)
    })
  })

  describe('setCurrentActor', () => {
    it('sets the current actor id', () => {
      useBattleStore.getState().setCurrentActor('ryoma')
      expect(useBattleStore.getState().currentActorId).toBe('ryoma')
    })

    it('can clear the current actor', () => {
      useBattleStore.getState().setCurrentActor('ryoma')
      useBattleStore.getState().setCurrentActor(null)
      expect(useBattleStore.getState().currentActorId).toBeNull()
    })
  })

  describe('nextTurn', () => {
    it('increments turn and resets to COMMAND_SELECT', () => {
      const party = [makeParticipant()]
      useBattleStore.getState().initBattle(party, [])
      useBattleStore.getState().setPhase(BattlePhase.ACTION_EXECUTE)
      useBattleStore.getState().nextTurn()

      const state = useBattleStore.getState()
      expect(state.turn).toBe(2)
      expect(state.phase).toBe(BattlePhase.COMMAND_SELECT)
      expect(state.actionQueue).toHaveLength(0)
    })
  })

  describe('endBattle', () => {
    it('sets phase to VICTORY on victory', () => {
      useBattleStore.getState().endBattle({ victory: true, exp: 100, gold: 50, items: [] })
      expect(useBattleStore.getState().phase).toBe(BattlePhase.VICTORY)
      expect(useBattleStore.getState().result?.victory).toBe(true)
    })

    it('sets phase to DEFEAT on defeat', () => {
      useBattleStore.getState().endBattle({ victory: false, exp: 0, gold: 0, items: [] })
      expect(useBattleStore.getState().phase).toBe(BattlePhase.DEFEAT)
      expect(useBattleStore.getState().result?.victory).toBe(false)
    })

    it('stores result data', () => {
      useBattleStore.getState().endBattle({ victory: true, exp: 200, gold: 100, items: ['herb'] })
      const result = useBattleStore.getState().result
      expect(result?.exp).toBe(200)
      expect(result?.gold).toBe(100)
      expect(result?.items).toContain('herb')
    })
  })

  describe('resetBattle', () => {
    it('resets all battle state to initial values', () => {
      const party = [makeParticipant()]
      const enemies = [makeEnemyParticipant()]
      useBattleStore.getState().initBattle(party, enemies)
      useBattleStore.getState().resetBattle()

      const state = useBattleStore.getState()
      expect(state.phase).toBe(BattlePhase.INIT)
      expect(state.turn).toBe(0)
      expect(state.party).toHaveLength(0)
      expect(state.enemies).toHaveLength(0)
      expect(state.actionQueue).toHaveLength(0)
      expect(state.currentActorId).toBeNull()
      expect(state.result).toBeNull()
    })
  })
})
