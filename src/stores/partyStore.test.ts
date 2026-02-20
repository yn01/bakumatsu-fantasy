import { describe, it, expect, beforeEach } from 'vitest'
import { usePartyStore } from '@/stores/partyStore'
import { createMockCharacter, resetAllStores } from '@/test/helpers'

describe('partyStore', () => {
  beforeEach(() => {
    resetAllStores()
  })

  describe('addMember', () => {
    it('adds a member to an empty party', () => {
      const char = createMockCharacter()
      usePartyStore.getState().addMember(char)
      expect(usePartyStore.getState().members).toHaveLength(1)
      expect(usePartyStore.getState().members[0]!.id).toBe('ryoma')
    })

    it('adds multiple members', () => {
      const char1 = createMockCharacter({ id: 'ryoma' })
      const char2 = createMockCharacter({ id: 'takechi' })
      usePartyStore.getState().addMember(char1)
      usePartyStore.getState().addMember(char2)
      expect(usePartyStore.getState().members).toHaveLength(2)
    })

    it('updates formation when adding member', () => {
      const char1 = createMockCharacter({ id: 'ryoma' })
      const char2 = createMockCharacter({ id: 'takechi' })
      usePartyStore.getState().addMember(char1)
      usePartyStore.getState().addMember(char2)
      expect(usePartyStore.getState().formation).toEqual([0, 1])
    })
  })

  describe('removeMember', () => {
    it('removes a member by id', () => {
      const char1 = createMockCharacter({ id: 'ryoma' })
      const char2 = createMockCharacter({ id: 'takechi' })
      usePartyStore.getState().addMember(char1)
      usePartyStore.getState().addMember(char2)
      usePartyStore.getState().removeMember('ryoma')
      expect(usePartyStore.getState().members).toHaveLength(1)
      expect(usePartyStore.getState().members[0]!.id).toBe('takechi')
    })

    it('does nothing if member not found', () => {
      const char = createMockCharacter()
      usePartyStore.getState().addMember(char)
      usePartyStore.getState().removeMember('nonexistent')
      expect(usePartyStore.getState().members).toHaveLength(1)
    })
  })

  describe('updateMember', () => {
    it('updates a member by id', () => {
      const char = createMockCharacter({ id: 'ryoma' })
      usePartyStore.getState().addMember(char)
      usePartyStore.getState().updateMember('ryoma', { level: 5 })
      expect(usePartyStore.getState().members[0]!.level).toBe(5)
    })

    it('does not affect other members', () => {
      const char1 = createMockCharacter({ id: 'ryoma' })
      const char2 = createMockCharacter({ id: 'takechi' })
      usePartyStore.getState().addMember(char1)
      usePartyStore.getState().addMember(char2)
      usePartyStore.getState().updateMember('ryoma', { level: 5 })
      expect(usePartyStore.getState().members[1]!.level).toBe(1)
    })
  })

  describe('addExp', () => {
    it('adds experience to a member', () => {
      const char = createMockCharacter({ id: 'ryoma', exp: 0 })
      usePartyStore.getState().addMember(char)
      usePartyStore.getState().addExp('ryoma', 100)
      expect(usePartyStore.getState().members[0]!.exp).toBe(100)
    })

    it('accumulates experience across multiple calls', () => {
      const char = createMockCharacter({ id: 'ryoma', exp: 50 })
      usePartyStore.getState().addMember(char)
      usePartyStore.getState().addExp('ryoma', 100)
      expect(usePartyStore.getState().members[0]!.exp).toBe(150)
    })
  })

  describe('addGold', () => {
    it('adds gold', () => {
      usePartyStore.getState().addGold(500)
      expect(usePartyStore.getState().gold).toBe(500)
    })

    it('accumulates gold', () => {
      usePartyStore.getState().addGold(300)
      usePartyStore.getState().addGold(200)
      expect(usePartyStore.getState().gold).toBe(500)
    })

    it('reduces gold with negative amount', () => {
      usePartyStore.getState().addGold(500)
      usePartyStore.getState().addGold(-200)
      expect(usePartyStore.getState().gold).toBe(300)
    })

    it('does not go below zero', () => {
      usePartyStore.getState().addGold(100)
      usePartyStore.getState().addGold(-500)
      expect(usePartyStore.getState().gold).toBe(0)
    })
  })

  describe('addItem / removeItem', () => {
    it('adds an item', () => {
      usePartyStore.getState().addItem('herb')
      expect(usePartyStore.getState().items).toContain('herb')
    })

    it('allows duplicate items', () => {
      usePartyStore.getState().addItem('herb')
      usePartyStore.getState().addItem('herb')
      expect(usePartyStore.getState().items).toHaveLength(2)
    })

    it('removes the first occurrence of an item', () => {
      usePartyStore.getState().addItem('herb')
      usePartyStore.getState().addItem('herb')
      usePartyStore.getState().removeItem('herb')
      expect(usePartyStore.getState().items).toHaveLength(1)
    })

    it('does nothing when removing a non-existent item', () => {
      usePartyStore.getState().addItem('herb')
      usePartyStore.getState().removeItem('potion')
      expect(usePartyStore.getState().items).toHaveLength(1)
    })
  })

  describe('getMember', () => {
    it('returns the member by id', () => {
      const char = createMockCharacter({ id: 'ryoma' })
      usePartyStore.getState().addMember(char)
      const found = usePartyStore.getState().getMember('ryoma')
      expect(found?.id).toBe('ryoma')
    })

    it('returns undefined for unknown id', () => {
      const found = usePartyStore.getState().getMember('unknown')
      expect(found).toBeUndefined()
    })
  })

  describe('getLeader', () => {
    it('returns the leader (first formation member)', () => {
      const char1 = createMockCharacter({ id: 'ryoma' })
      const char2 = createMockCharacter({ id: 'takechi' })
      usePartyStore.getState().addMember(char1)
      usePartyStore.getState().addMember(char2)
      const leader = usePartyStore.getState().getLeader()
      expect(leader?.id).toBe('ryoma')
    })

    it('returns undefined for empty party', () => {
      const leader = usePartyStore.getState().getLeader()
      expect(leader).toBeUndefined()
    })
  })
})
