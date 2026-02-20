import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ShopManager } from './ShopManager'
import { resetAllStores } from '@/test/helpers'
import { usePartyStore } from '@/stores/partyStore'
import type { Item } from '@/types/item'

// Mock equipmentManager so we don't need fetch
vi.mock('./EquipmentManager', () => {
  const mockItems: Map<string, Item> = new Map()

  const mockEquipmentManager = {
    getItem: vi.fn((id: string) => mockItems.get(id)),
    getAllItems: vi.fn(() => Array.from(mockItems.values())),
    loadData: vi.fn(),
  }

  // Pre-populate some test items
  const herb: Item = {
    id: 'herb',
    name: '薬',
    type: 'consumable',
    description: 'HPを30回復',
    price: 50,
    effect: { type: 'heal_hp', value: 30 },
    usableInBattle: true,
    usableInField: true,
  }
  const sword: Item = {
    id: 'bokuto',
    name: '木刀',
    type: 'weapon',
    description: '木製の刀',
    price: 100,
    usableInBattle: false,
    usableInField: false,
  }
  mockItems.set('herb', herb)
  mockItems.set('bokuto', sword)

  return {
    equipmentManager: mockEquipmentManager,
    EquipmentManager: vi.fn(),
  }
})

describe('ShopManager', () => {
  let manager: ShopManager

  beforeEach(() => {
    resetAllStores()
    manager = new ShopManager()
  })

  describe('purchaseItem', () => {
    it('fails when item not found', () => {
      const result = manager.purchaseItem('nonexistent')
      expect(result.success).toBe(false)
      expect(result.error).toContain('見つかりません')
    })

    it('fails when not enough gold', () => {
      usePartyStore.setState({ ...usePartyStore.getState(), gold: 10 })
      const result = manager.purchaseItem('herb')
      expect(result.success).toBe(false)
      expect(result.error).toContain('足りません')
    })

    it('succeeds with enough gold', () => {
      usePartyStore.setState({ ...usePartyStore.getState(), gold: 100 })
      const result = manager.purchaseItem('herb')
      expect(result.success).toBe(true)
      expect(result.itemName).toBe('薬')
    })

    it('deducts gold on purchase', () => {
      usePartyStore.setState({ ...usePartyStore.getState(), gold: 100 })
      manager.purchaseItem('herb') // costs 50
      expect(usePartyStore.getState().gold).toBe(50)
    })

    it('adds item to inventory on purchase', () => {
      usePartyStore.setState({ ...usePartyStore.getState(), gold: 100 })
      manager.purchaseItem('herb')
      expect(usePartyStore.getState().items).toContain('herb')
    })
  })

  describe('sellItem', () => {
    it('fails when item not found', () => {
      const result = manager.sellItem('nonexistent')
      expect(result.success).toBe(false)
    })

    it('fails when not in inventory', () => {
      const result = manager.sellItem('herb')
      expect(result.success).toBe(false)
      expect(result.error).toContain('所持していません')
    })

    it('succeeds when item is in inventory', () => {
      usePartyStore.getState().addItem('herb')
      const result = manager.sellItem('herb')
      expect(result.success).toBe(true)
      expect(result.itemName).toBe('薬')
    })

    it('sells at 50% price', () => {
      usePartyStore.getState().addItem('herb')
      const result = manager.sellItem('herb')
      expect(result.price).toBe(25) // 50 * 0.5
    })

    it('adds gold on sell', () => {
      usePartyStore.getState().addItem('herb')
      manager.sellItem('herb')
      expect(usePartyStore.getState().gold).toBe(25)
    })

    it('removes item from inventory on sell', () => {
      usePartyStore.getState().addItem('herb')
      manager.sellItem('herb')
      expect(usePartyStore.getState().items).not.toContain('herb')
    })
  })

  describe('canPurchase', () => {
    it('returns canPurchase=false for unknown item', () => {
      const result = manager.canPurchase('nonexistent')
      expect(result.canPurchase).toBe(false)
    })

    it('returns canPurchase=false when gold insufficient', () => {
      usePartyStore.setState({ ...usePartyStore.getState(), gold: 0 })
      const result = manager.canPurchase('herb')
      expect(result.canPurchase).toBe(false)
    })

    it('returns canPurchase=true when gold sufficient', () => {
      usePartyStore.setState({ ...usePartyStore.getState(), gold: 200 })
      const result = manager.canPurchase('herb')
      expect(result.canPurchase).toBe(true)
    })
  })

  describe('canSell', () => {
    it('returns canSell=false for unknown item', () => {
      const result = manager.canSell('nonexistent')
      expect(result.canSell).toBe(false)
    })

    it('returns canSell=false when not in inventory', () => {
      const result = manager.canSell('herb')
      expect(result.canSell).toBe(false)
    })

    it('returns canSell=true when in inventory', () => {
      usePartyStore.getState().addItem('herb')
      const result = manager.canSell('herb')
      expect(result.canSell).toBe(true)
    })
  })

  describe('getSellPrice', () => {
    it('returns 0 for unknown item', () => {
      expect(manager.getSellPrice('nonexistent')).toBe(0)
    })

    it('returns 50% of purchase price', () => {
      expect(manager.getSellPrice('herb')).toBe(25)
      expect(manager.getSellPrice('bokuto')).toBe(50)
    })
  })

  describe('getShopItems', () => {
    it('returns all items for "all" type', () => {
      const items = manager.getShopItems('all')
      expect(items.length).toBeGreaterThanOrEqual(2)
    })

    it('returns only weapons for "weapon" type', () => {
      const items = manager.getShopItems('weapon')
      items.forEach((i) => expect(i.type).toBe('weapon'))
    })

    it('returns only armor for "armor" type', () => {
      const items = manager.getShopItems('armor')
      items.forEach((i) => expect(i.type).toBe('armor'))
    })

    it('returns only consumables for "item" type', () => {
      const items = manager.getShopItems('item')
      items.forEach((i) => expect(i.type).toBe('consumable'))
    })
  })
})
