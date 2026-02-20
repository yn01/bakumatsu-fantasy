import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EquipmentManager } from './EquipmentManager'
import { createMockCharacter, resetAllStores } from '@/test/helpers'
import { usePartyStore } from '@/stores/partyStore'
import type { Equipment } from '@/types/item'

const mockWeapon: Equipment = {
  id: 'bokuto',
  name: '木刀',
  type: 'weapon',
  description: '木製の刀',
  price: 100,
  equipStats: { attack: 5 },
  usableInBattle: false,
  usableInField: false,
}

const mockArmor: Equipment = {
  id: 'cloth',
  name: '布の着物',
  type: 'armor',
  description: '基本的な着物',
  price: 80,
  equipStats: { defense: 3 },
  usableInBattle: false,
  usableInField: false,
}

const mockWeaponHighLevel: Equipment = {
  id: 'katana',
  name: '刀',
  type: 'weapon',
  description: '高レベル刀',
  price: 500,
  equipStats: { attack: 15 },
  requiredLevel: 10,
  usableInBattle: false,
  usableInField: false,
}

const mockWeaponRestricted: Equipment = {
  id: 'special_sword',
  name: '特殊刀',
  type: 'weapon',
  description: '特定キャラのみ',
  price: 1000,
  equipStats: { attack: 20 },
  equipableBy: ['ryoma'],
  usableInBattle: false,
  usableInField: false,
}

function createManagerWithItems(): EquipmentManager {
  const manager = new EquipmentManager()
  // Access private items map via type cast
  const m = manager as unknown as { items: Map<string, Equipment>; loaded: boolean }
  m.items.set('bokuto', mockWeapon)
  m.items.set('cloth', mockArmor)
  m.items.set('katana', mockWeaponHighLevel)
  m.items.set('special_sword', mockWeaponRestricted)
  m.loaded = true
  return manager
}

describe('EquipmentManager', () => {
  let manager: EquipmentManager

  beforeEach(() => {
    resetAllStores()
    manager = createManagerWithItems()
  })

  describe('loadData', () => {
    it('fetches and loads item data from JSON', async () => {
      const freshManager = new EquipmentManager()
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [mockWeapon, mockArmor],
        }),
      } as Response)

      await freshManager.loadData()
      expect(freshManager.getItem('bokuto')).toBeDefined()
    })

    it('throws when fetch fails', async () => {
      const freshManager = new EquipmentManager()
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response)

      await expect(freshManager.loadData()).rejects.toThrow()
    })

    it('throws when data format is invalid', async () => {
      const freshManager = new EquipmentManager()
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ wrong: 'format' }),
      } as Response)

      await expect(freshManager.loadData()).rejects.toThrow()
    })

    it('does not reload if already loaded', async () => {
      // manager is already loaded (set in createManagerWithItems)
      vi.mocked(global.fetch).mockClear()
      await manager.loadData() // should not call fetch since already loaded
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('canEquip', () => {
    it('returns null for unknown item', () => {
      const char = createMockCharacter()
      expect(manager.canEquip(char, 'nonexistent')).toBeNull()
    })

    it('returns canEquip=true for valid weapon', () => {
      const char = createMockCharacter({ level: 1 })
      const result = manager.canEquip(char, 'bokuto')
      expect(result?.canEquip).toBe(true)
    })

    it('returns canEquip=false when level too low', () => {
      const char = createMockCharacter({ level: 1 })
      const result = manager.canEquip(char, 'katana')
      expect(result?.canEquip).toBe(false)
      expect(result?.reason).toContain('レベル10')
    })

    it('returns canEquip=false for restricted item wrong character', () => {
      const char = createMockCharacter({ id: 'other_char' })
      const result = manager.canEquip(char, 'special_sword')
      expect(result?.canEquip).toBe(false)
    })

    it('returns canEquip=true for restricted item correct character', () => {
      const char = createMockCharacter({ id: 'ryoma' })
      const result = manager.canEquip(char, 'special_sword')
      expect(result?.canEquip).toBe(true)
    })
  })

  describe('equipItem', () => {
    it('fails when item not found', () => {
      const char = createMockCharacter()
      usePartyStore.getState().addMember(char)
      const result = manager.equipItem(char, 'nonexistent')
      expect(result.success).toBe(false)
    })

    it('fails when not in party inventory', () => {
      const char = createMockCharacter()
      usePartyStore.getState().addMember(char)
      // Not adding 'bokuto' to party items
      const result = manager.equipItem(char, 'bokuto')
      expect(result.success).toBe(false)
      expect(result.error).toContain('所持していません')
    })

    it('succeeds when item is in inventory and equippable', () => {
      const char = createMockCharacter()
      usePartyStore.getState().addMember(char)
      usePartyStore.getState().addItem('bokuto')
      const result = manager.equipItem(char, 'bokuto')
      expect(result.success).toBe(true)
      expect(result.itemName).toBe('木刀')
    })

    it('updates character equipment slot in store', () => {
      const char = createMockCharacter()
      usePartyStore.getState().addMember(char)
      usePartyStore.getState().addItem('bokuto')
      manager.equipItem(char, 'bokuto')
      const updated = usePartyStore.getState().getMember('ryoma')
      expect(updated?.equipment.weapon).toBe('bokuto')
    })
  })

  describe('unequipItem', () => {
    it('fails when nothing equipped in slot', () => {
      const char = createMockCharacter()
      usePartyStore.getState().addMember(char)
      const result = manager.unequipItem(char, 'weapon')
      expect(result.success).toBe(false)
      expect(result.error).toContain('装備されていません')
    })

    it('succeeds and clears slot', () => {
      const char = createMockCharacter({ equipment: { weapon: 'bokuto', armor: null } })
      usePartyStore.getState().addMember(char)
      const result = manager.unequipItem(char, 'weapon')
      expect(result.success).toBe(true)
      const updated = usePartyStore.getState().getMember('ryoma')
      expect(updated?.equipment.weapon).toBeNull()
    })
  })

  describe('calculateEquippedStats', () => {
    it('returns base stats when nothing equipped', () => {
      const char = createMockCharacter()
      const stats = manager.calculateEquippedStats(char)
      expect(stats.attack).toBe(15)
      expect(stats.defense).toBe(10)
    })

    it('adds weapon attack bonus', () => {
      const char = createMockCharacter({ equipment: { weapon: 'bokuto', armor: null } })
      const stats = manager.calculateEquippedStats(char)
      expect(stats.attack).toBe(20) // 15 base + 5 from bokuto
    })

    it('adds armor defense bonus', () => {
      const char = createMockCharacter({ equipment: { weapon: null, armor: 'cloth' } })
      const stats = manager.calculateEquippedStats(char)
      expect(stats.defense).toBe(13) // 10 base + 3 from cloth
    })

    it('clamps stats to minimum values', () => {
      // armor with huge negative defense
      const negativeArmor: Equipment = {
        id: 'neg_armor',
        name: 'Bad Armor',
        type: 'armor',
        description: 'test',
        price: 0,
        equipStats: { defense: -999 },
        usableInBattle: false,
        usableInField: false,
      }
      const m = manager as unknown as { items: Map<string, Equipment> }
      m.items.set('neg_armor', negativeArmor)

      const char = createMockCharacter({ equipment: { weapon: null, armor: 'neg_armor' } })
      const stats = manager.calculateEquippedStats(char)
      expect(stats.defense).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getItem / getEquipment / getAllItems / getItemsByType', () => {
    it('getItem returns item by id', () => {
      expect(manager.getItem('bokuto')).toBeDefined()
      expect(manager.getItem('nonexistent')).toBeUndefined()
    })

    it('getEquipment returns equipment for weapon/armor', () => {
      expect(manager.getEquipment('bokuto')).toBeDefined()
    })

    it('getEquipment returns undefined for non-equipment', () => {
      expect(manager.getEquipment('nonexistent')).toBeUndefined()
    })

    it('getAllItems returns all loaded items', () => {
      const all = manager.getAllItems()
      expect(all.length).toBeGreaterThanOrEqual(2)
    })

    it('getItemsByType filters by type', () => {
      const weapons = manager.getItemsByType('weapon')
      weapons.forEach((w) => expect(w.type).toBe('weapon'))
    })
  })
})
