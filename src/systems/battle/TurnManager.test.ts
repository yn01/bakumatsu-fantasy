import { describe, it, expect } from 'vitest'
import { TurnManager } from '@/systems/battle/TurnManager'
import type { BattleParticipant } from '@/types/battle'
import { createMockCharacter, createMockEnemy } from '@/test/helpers'

function makeParticipant(speed: number, luck = 5, id = 'p1', dead = false): BattleParticipant {
  return {
    character: createMockCharacter({ id, stats: { hp: 100, maxHp: 100, mp: 30, maxMp: 30, attack: 10, defense: 5, speed, luck } }),
    currentHp: dead ? 0 : 100,
    currentMp: 30,
    state: dead ? ['dead'] : [],
    isDefending: false,
  }
}

function makeEnemyParticipant(speed: number, id = 'e1'): BattleParticipant {
  return {
    character: createMockEnemy({ id, stats: { hp: 50, maxHp: 50, mp: 0, maxMp: 0, attack: 10, defense: 5, speed, luck: 3 } }),
    currentHp: 50,
    currentMp: 0,
    state: [],
    isDefending: false,
  }
}

describe('TurnManager', () => {
  const manager = new TurnManager()

  describe('calculateTurnOrder', () => {
    it('sorts participants by speed descending', () => {
      const party = [makeParticipant(10, 5, 'slow')]
      const enemies = [makeEnemyParticipant(20, 'fast')]
      const order = manager.calculateTurnOrder(party, enemies)
      expect(order[0]!.character.id).toBe('fast')
      expect(order[1]!.character.id).toBe('slow')
    })

    it('uses luck as tiebreaker when speeds are equal', () => {
      const p1 = makeParticipant(10, 8, 'highLuck')
      const p2 = makeParticipant(10, 3, 'lowLuck')
      const order = manager.calculateTurnOrder([p1], [p2])
      expect(order[0]!.character.id).toBe('highLuck')
    })

    it('excludes dead participants', () => {
      const alive = makeParticipant(10, 5, 'alive')
      const dead = makeParticipant(20, 5, 'dead', true)
      const order = manager.calculateTurnOrder([alive, dead], [])
      expect(order).toHaveLength(1)
      expect(order[0]!.character.id).toBe('alive')
    })

    it('handles empty party and enemies', () => {
      const order = manager.calculateTurnOrder([], [])
      expect(order).toHaveLength(0)
    })

    it('combines party and enemies in turn order', () => {
      const party = [makeParticipant(15, 5, 'p1'), makeParticipant(5, 5, 'p2')]
      const enemies = [makeEnemyParticipant(10, 'e1')]
      const order = manager.calculateTurnOrder(party, enemies)
      expect(order.map(p => p.character.id)).toEqual(['p1', 'e1', 'p2'])
    })
  })

  describe('getNextActor', () => {
    it('returns the next actor in turn order', () => {
      const p1 = makeParticipant(15, 5, 'p1')
      const p2 = makeParticipant(5, 5, 'p2')
      const order = [p1, p2]
      const next = manager.getNextActor(order, 0)
      expect(next?.character.id).toBe('p2')
    })

    it('returns null when at the last actor', () => {
      const p1 = makeParticipant(10, 5, 'p1')
      const order = [p1]
      const next = manager.getNextActor(order, 0)
      expect(next).toBeNull()
    })

    it('returns null for empty turn order', () => {
      const next = manager.getNextActor([], 0)
      expect(next).toBeNull()
    })
  })

  describe('findActorIndex', () => {
    it('returns the correct index of an actor', () => {
      const p1 = makeParticipant(15, 5, 'p1')
      const p2 = makeParticipant(10, 5, 'p2')
      const order = [p1, p2]
      expect(manager.findActorIndex(order, 'p2')).toBe(1)
    })

    it('returns -1 when actor not found', () => {
      const p1 = makeParticipant(10, 5, 'p1')
      expect(manager.findActorIndex([p1], 'unknown')).toBe(-1)
    })
  })
})
