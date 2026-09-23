/**
 * AchievementManager - 実績管理システム
 */

import { useAchievementStore } from '@/stores/achievementStore'
import { useProgressStore } from '@/stores/progressStore'
import { usePartyStore } from '@/stores/partyStore'
import { equipmentManager } from '@/systems/growth/EquipmentManager'
import type { Character } from '@/types/character'
import { devLog } from '@/utils/logger'

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
      devLog(`[AchievementManager] Loaded ${this.achievements.size} achievements`)
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
        devLog(`[AchievementManager] Unlocked achievement: ${achievement.name}`)
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
        // 実績の説明「○種類の防具を入手」に合わせ、入手済み防具の種類数をカウント
        // （所持品 + 各メンバーの装備中防具を、重複なしで集計）
        const armorIds = new Set<string>()

        for (const itemId of partyStore.items) {
          if (equipmentManager.getItem(itemId)?.type === 'armor') {
            armorIds.add(itemId)
          }
        }

        for (const member of partyStore.members) {
          const armorId = member.equipment?.armor
          if (armorId) {
            armorIds.add(armorId)
          }
        }

        return armorIds.size >= (condition.value as number)
      }

      case 'boss_count': {
        // ボス撃破数は recordBossDefeat() で boss_defeated_count フラグに加算される
        const bossCount = (progressStore.getFlag('boss_defeated_count') as number) || 0
        return bossCount >= (condition.value as number)
      }

      default:
        console.warn(`[AchievementManager] Unknown condition type: ${condition.type}`)
        return false
    }
  }

  /**
   * ボス撃破を記録（boss_count 実績用）
   * 同じボスの再撃破は加算しない
   */
  recordBossDefeat(enemies: Character[]): void {
    const progressStore = useProgressStore.getState()

    for (const enemy of enemies) {
      if (!enemy.isBoss) continue

      const defeatedFlag = `boss_defeated_${enemy.id}`
      if (progressStore.getFlag(defeatedFlag) === true) continue

      progressStore.setFlag(defeatedFlag, true)
      const current = (progressStore.getFlag('boss_defeated_count') as number) || 0
      progressStore.setFlag('boss_defeated_count', current + 1)
      devLog(`[AchievementManager] Boss defeated: ${enemy.id} (total: ${current + 1})`)
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
