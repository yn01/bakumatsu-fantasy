/**
 * AchievementManager - 実績管理システム
 */

import { useAchievementStore } from '@/stores/achievementStore'
import { useProgressStore } from '@/stores/progressStore'
import { usePartyStore } from '@/stores/partyStore'

export interface Achievement {
  id: string
  name: string
  description: string
  condition: {
    type: string
    value: string | number
  }
}

export class AchievementManager {
  private achievements: Map<string, Achievement> = new Map()
  private loaded = false

  /**
   * データ読み込み
   */
  async loadData(): Promise<void> {
    if (this.loaded) return

    try {
      const basePath = import.meta.env.BASE_URL || '/'
      const response = await fetch(`${basePath}data/achievements.json`)

      if (!response.ok) {
        throw new Error('Failed to load achievements.json')
      }

      const data = await response.json()

      if (!Array.isArray(data.achievements)) {
        throw new Error('Invalid achievements.json format')
      }

      // 実績をMapに登録
      for (const achievement of data.achievements) {
        this.achievements.set(achievement.id, achievement)
      }

      this.loaded = true
      console.log(`[AchievementManager] Loaded ${this.achievements.size} achievements`)
    } catch (error) {
      console.error('[AchievementManager] Failed to load achievements:', error)
    }
  }

  /**
   * 実績チェック
   */
  checkAchievements(): string[] {
    const unlocked: string[] = []
    const achievementStore = useAchievementStore.getState()
    // TODO: progressStore and partyStore will be used for achievement conditions
    // const progressStore = useProgressStore.getState()
    // const partyStore = usePartyStore.getState()

    for (const [id, achievement] of this.achievements) {
      // 既に解除済みならスキップ
      if (achievementStore.isUnlocked(id)) {
        continue
      }

      // 条件チェック
      if (this.checkCondition(achievement.condition)) {
        achievementStore.unlockAchievement(id)
        unlocked.push(id)
        console.log(`[AchievementManager] Unlocked achievement: ${achievement.name}`)
      }
    }

    return unlocked
  }

  /**
   * 条件チェック
   */
  private checkCondition(condition: { type: string; value: string | number }): boolean {
    const progressStore = useProgressStore.getState()
    const partyStore = usePartyStore.getState()

    switch (condition.type) {
      case 'flag':
        return progressStore.getFlag(condition.value as string) === true

      case 'level': {
        const maxLevel = Math.max(...partyStore.members.map((m) => m.level))
        return maxLevel >= (condition.value as number)
      }

      case 'gold':
        return partyStore.gold >= (condition.value as number)

      case 'party_size':
        return partyStore.members.length >= (condition.value as number)

      case 'map_count':
        return progressStore.visitedMaps.length >= (condition.value as number)

      case 'skill_count': {
        const totalSkills = partyStore.members.reduce((sum, m) => sum + m.skills.length, 0)
        return totalSkills >= (condition.value as number)
      }

      case 'item':
        return partyStore.items.includes(condition.value as string)

      case 'item_count':
        return partyStore.items.length >= (condition.value as number)

      case 'armor_count': {
        // TODO: 装備中の防具数をカウント（現在は未実装、将来対応）
        const armorCount = partyStore.members.filter((m) => m.equipment?.armor).length
        return armorCount >= (condition.value as number)
      }

      case 'boss_count': {
        // TODO: ボス撃破数をprogressStoreに記録する必要がある（将来対応）
        // 現在はフラグベースで代替（例: boss_defeated_count フラグ）
        const bossCount = progressStore.getFlag('boss_defeated_count') as number || 0
        return bossCount >= (condition.value as number)
      }

      default:
        console.warn(`[AchievementManager] Unknown condition type: ${condition.type}`)
        return false
    }
  }

  /**
   * 実績取得
   */
  getAchievement(id: string): Achievement | undefined {
    return this.achievements.get(id)
  }

  /**
   * 全実績取得
   */
  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values())
  }
}

export const achievementManager = new AchievementManager()
