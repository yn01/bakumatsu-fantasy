/**
 * EquipmentManager - 装備管理システム
 */

import type { Character, Stats } from '@/types/character'
import type { Item, Equipment } from '@/types/item'
import { usePartyStore } from '@/stores/partyStore'

export interface EquipResult {
  success: boolean
  itemName: string
  error?: string
}

export interface EquipAbility {
  canEquip: boolean
  reason?: string
  item: Equipment
}

export class EquipmentManager {
  private items: Map<string, Item> = new Map()
  private loaded = false

  /**
   * データ読み込み
   */
  async loadData(): Promise<void> {
    if (this.loaded) {
      return
    }

    try {
      const basePath = import.meta.env.BASE_URL || '/'
      const response = await fetch(`${basePath}data/items.json`)
      if (!response.ok) {
        throw new Error(`Failed to fetch items.json: ${response.status}`)
      }
      const data = await response.json()

      // ランタイム検証
      if (!data || !Array.isArray(data.items)) {
        throw new Error('Invalid items.json format: missing items array')
      }

      data.items.forEach((item: Item) => {
        if (!item.id || !item.name || !item.type) {
          console.warn('Invalid item data:', item)
          return
        }
        this.items.set(item.id, item)
      })
      this.loaded = true
    } catch (error) {
      console.error('Failed to load item data:', error)
      throw error
    }
  }

  /**
   * 装備可能判定
   */
  canEquip(character: Character, itemId: string): EquipAbility | null {
    const item = this.items.get(itemId)
    if (!item) {
      return null
    }

    // 装備品でない場合
    if (item.type !== 'weapon' && item.type !== 'armor') {
      return null
    }

    const equipment = item as Equipment

    // レベル制限チェック
    if (equipment.requiredLevel && character.level < equipment.requiredLevel) {
      return {
        canEquip: false,
        reason: `レベル${equipment.requiredLevel}以上で装備可能`,
        item: equipment,
      }
    }

    // キャラクター制限チェック
    if (equipment.equipableBy && !equipment.equipableBy.includes(character.id)) {
      return {
        canEquip: false,
        reason: 'このキャラクターは装備できません',
        item: equipment,
      }
    }

    return {
      canEquip: true,
      item: equipment,
    }
  }

  /**
   * 装備変更実行
   */
  equipItem(character: Character, itemId: string): EquipResult {
    const ability = this.canEquip(character, itemId)

    if (!ability) {
      return {
        success: false,
        itemName: itemId,
        error: 'アイテムが見つかりません',
      }
    }

    if (!ability.canEquip) {
      return {
        success: false,
        itemName: ability.item.name,
        error: ability.reason,
      }
    }

    // 所持品チェック
    const { items } = usePartyStore.getState()
    if (!items.includes(itemId)) {
      return {
        success: false,
        itemName: ability.item.name,
        error: 'このアイテムを所持していません',
      }
    }

    const equipment = ability.item
    const slot = equipment.type === 'weapon' ? 'weapon' : 'armor'

    // 装備スロットを更新
    usePartyStore.getState().updateMember(character.id, {
      equipment: {
        ...character.equipment,
        [slot]: itemId,
      },
    })

    return {
      success: true,
      itemName: equipment.name,
    }
  }

  /**
   * 装備を外す
   */
  unequipItem(character: Character, slot: 'weapon' | 'armor'): EquipResult {
    const currentItemId = character.equipment[slot]
    if (!currentItemId) {
      return {
        success: false,
        itemName: '',
        error: '装備されていません',
      }
    }

    const item = this.items.get(currentItemId)
    const itemName = item?.name ?? currentItemId

    usePartyStore.getState().updateMember(character.id, {
      equipment: {
        ...character.equipment,
        [slot]: null,
      },
    })

    return {
      success: true,
      itemName,
    }
  }

  /**
   * 装備込みステータス計算
   */
  calculateEquippedStats(character: Character): Stats {
    const baseStats = character.stats
    let equippedStats = { ...baseStats }

    // 武器の効果
    if (character.equipment.weapon) {
      const weapon = this.items.get(character.equipment.weapon) as Equipment | undefined
      if (weapon?.equipStats) {
        equippedStats = this.applyEquipStats(equippedStats, weapon.equipStats)
      }
    }

    // 防具の効果
    if (character.equipment.armor) {
      const armor = this.items.get(character.equipment.armor) as Equipment | undefined
      if (armor?.equipStats) {
        equippedStats = this.applyEquipStats(equippedStats, armor.equipStats)
      }
    }

    return equippedStats
  }

  /**
   * 装備ステータスを適用
   */
  private applyEquipStats(baseStats: Stats, equipStats: Partial<Stats>): Stats {
    const result = { ...baseStats }

    // 各ステータスに加算（最小値クランプ）
    if (equipStats.maxHp !== undefined) {
      result.maxHp = Math.max(1, result.maxHp + equipStats.maxHp)
      // HPも増加させる（現在値を最大値の範囲内にクランプ）
      const hpDelta = equipStats.maxHp
      result.hp = Math.max(0, Math.min(result.hp + hpDelta, result.maxHp))
    }
    if (equipStats.maxMp !== undefined) {
      result.maxMp = Math.max(0, result.maxMp + equipStats.maxMp)
      const mpDelta = equipStats.maxMp
      result.mp = Math.max(0, Math.min(result.mp + mpDelta, result.maxMp))
    }
    if (equipStats.attack !== undefined) {
      result.attack = Math.max(0, result.attack + equipStats.attack)
    }
    if (equipStats.defense !== undefined) {
      result.defense = Math.max(0, result.defense + equipStats.defense)
    }
    if (equipStats.speed !== undefined) {
      result.speed = Math.max(1, result.speed + equipStats.speed)
    }
    if (equipStats.luck !== undefined) {
      result.luck = Math.max(0, result.luck + equipStats.luck)
    }

    return result
  }

  /**
   * アイテム情報取得
   */
  getItem(itemId: string): Item | undefined {
    return this.items.get(itemId)
  }

  /**
   * 装備品取得
   */
  getEquipment(itemId: string): Equipment | undefined {
    const item = this.items.get(itemId)
    if (item && (item.type === 'weapon' || item.type === 'armor')) {
      return item as Equipment
    }
    return undefined
  }

  /**
   * 全アイテム取得
   */
  getAllItems(): Item[] {
    return Array.from(this.items.values())
  }

  /**
   * タイプ別アイテム取得
   */
  getItemsByType(type: 'weapon' | 'armor' | 'consumable' | 'key'): Item[] {
    return this.getAllItems().filter((item) => item.type === type)
  }

  /**
   * 装備可能アイテム取得（所持品のみ）
   */
  getEquippableItems(character: Character, type: 'weapon' | 'armor'): Equipment[] {
    const { items: partyItems } = usePartyStore.getState()

    // 所持品から該当タイプのアイテムを取得
    const ownedItems = partyItems
      .map((itemId) => this.getItem(itemId))
      .filter((item): item is Equipment =>
        item !== undefined && (item.type === 'weapon' || item.type === 'armor') && item.type === type
      )

    // 装備可能条件でフィルタリング
    return ownedItems.filter((item) => {
      const ability = this.canEquip(character, item.id)
      return ability?.canEquip ?? false
    })
  }
}

// シングルトンインスタンス
export const equipmentManager = new EquipmentManager()
