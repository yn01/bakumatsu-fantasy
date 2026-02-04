/**
 * ShopManager - ショップ管理システム
 */

import type { Item } from '@/types/item'
import { equipmentManager } from './EquipmentManager'
import { usePartyStore } from '@/stores/partyStore'

export interface ShopItem {
  itemId: string
  item: Item
  stock?: number // undefined = 無限
}

export interface PurchaseResult {
  success: boolean
  itemName: string
  error?: string
}

export interface SellResult {
  success: boolean
  itemName: string
  price: number
  error?: string
}

export class ShopManager {
  /**
   * アイテム購入
   */
  purchaseItem(itemId: string): PurchaseResult {
    const item = equipmentManager.getItem(itemId)
    if (!item) {
      return {
        success: false,
        itemName: itemId,
        error: 'アイテムが見つかりません',
      }
    }

    const { gold, addGold, addItem } = usePartyStore.getState()

    // ゴールド不足チェック
    if (gold < item.price) {
      return {
        success: false,
        itemName: item.name,
        error: `ゴールドが足りません（必要: ${item.price}両）`,
      }
    }

    // ゴールド消費
    addGold(-item.price)

    // アイテム追加
    addItem(itemId)

    return {
      success: true,
      itemName: item.name,
    }
  }

  /**
   * アイテム売却
   */
  sellItem(itemId: string): SellResult {
    const item = equipmentManager.getItem(itemId)
    if (!item) {
      return {
        success: false,
        itemName: itemId,
        price: 0,
        error: 'アイテムが見つかりません',
      }
    }

    const { items, addGold, removeItem } = usePartyStore.getState()

    // 所持チェック
    if (!items.includes(itemId)) {
      return {
        success: false,
        itemName: item.name,
        price: 0,
        error: 'このアイテムを所持していません',
      }
    }

    // 売却価格（購入価格の50%）
    const sellPrice = Math.floor(item.price * 0.5)

    // アイテム削除
    removeItem(itemId)

    // ゴールド追加
    addGold(sellPrice)

    return {
      success: true,
      itemName: item.name,
      price: sellPrice,
    }
  }

  /**
   * アイテムを購入可能かチェック
   */
  canPurchase(itemId: string): { canPurchase: boolean; reason?: string } {
    const item = equipmentManager.getItem(itemId)
    if (!item) {
      return { canPurchase: false, reason: 'アイテムが見つかりません' }
    }

    const { gold } = usePartyStore.getState()

    if (gold < item.price) {
      return {
        canPurchase: false,
        reason: `ゴールドが足りません（必要: ${item.price}両、所持: ${gold}両）`,
      }
    }

    return { canPurchase: true }
  }

  /**
   * アイテムを売却可能かチェック
   */
  canSell(itemId: string): { canSell: boolean; reason?: string } {
    const item = equipmentManager.getItem(itemId)
    if (!item) {
      return { canSell: false, reason: 'アイテムが見つかりません' }
    }

    const { items } = usePartyStore.getState()

    if (!items.includes(itemId)) {
      return { canSell: false, reason: 'このアイテムを所持していません' }
    }

    return { canSell: true }
  }

  /**
   * 売却価格を取得
   */
  getSellPrice(itemId: string): number {
    const item = equipmentManager.getItem(itemId)
    if (!item) return 0
    return Math.floor(item.price * 0.5)
  }

  /**
   * ショップの商品リストを取得
   */
  getShopItems(shopType: 'weapon' | 'armor' | 'item' | 'all'): Item[] {
    const allItems = equipmentManager.getAllItems()

    if (shopType === 'all') {
      return allItems
    }

    if (shopType === 'weapon') {
      return allItems.filter((item) => item.type === 'weapon')
    }

    if (shopType === 'armor') {
      return allItems.filter((item) => item.type === 'armor')
    }

    if (shopType === 'item') {
      return allItems.filter((item) => item.type === 'consumable')
    }

    return []
  }
}

// シングルトンインスタンス
export const shopManager = new ShopManager()
