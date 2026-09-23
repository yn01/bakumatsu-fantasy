/**
 * QuestManager - クエスト管理システム
 */

import type { Quest } from '@/stores/questStore'
import { useQuestStore } from '@/stores/questStore'
import { useProgressStore } from '@/stores/progressStore'
import { usePartyStore } from '@/stores/partyStore'
import { devLog } from '@/utils/logger'

export class QuestManager {
  private quests: Map<string, Quest> = new Map()
  private loaded = false

  /**
   * クエストデータ読み込み
   */
  async loadData(): Promise<void> {
    if (this.loaded) return

    try {
      const basePath = import.meta.env.BASE_URL || '/'
      const response = await fetch(`${basePath}data/events/side_quests.json`)

      if (!response.ok) {
        throw new Error(`Failed to load quest data: ${response.statusText}`)
      }

      const data = await response.json()

      // ランタイム検証
      if (!Array.isArray(data)) {
        console.warn('[QuestManager] Invalid quest data format (not an array)')
        return
      }

      // クエストデータをMapに格納
      for (const quest of data) {
        if (!quest.id || !quest.name) {
          console.warn('[QuestManager] Invalid quest entry:', quest)
          continue
        }
        this.quests.set(quest.id, quest as Quest)
      }

      this.loaded = true
      devLog(`[QuestManager] Loaded ${this.quests.size} quests`)
    } catch (error) {
      console.error('[QuestManager] Failed to load quest data:', error)
    }
  }

  /**
   * クエスト情報を取得
   */
  getQuest(questId: string): Quest | undefined {
    return this.quests.get(questId)
  }

  /**
   * すべてのクエストを取得
   */
  getAllQuests(): Quest[] {
    return Array.from(this.quests.values())
  }

  /**
   * クエスト受注可能判定
   */
  canAcceptQuest(questId: string): boolean {
    const quest = this.quests.get(questId)
    if (!quest) return false

    const questStatus = useQuestStore.getState().getQuestStatus(questId)
    if (questStatus !== 'available') return false

    // 必須フラグチェック
    if (quest.requiredFlag) {
      const flagValue = useProgressStore.getState().getFlag(quest.requiredFlag)
      if (!flagValue) return false
    }

    return true
  }

  /**
   * クエスト受注
   */
  acceptQuest(questId: string): boolean {
    if (!this.canAcceptQuest(questId)) {
      return false
    }

    useQuestStore.getState().acceptQuest(questId)
    devLog(`[QuestManager] Accepted quest: ${questId}`)
    return true
  }

  /**
   * クエスト完了判定
   */
  canCompleteQuest(questId: string): boolean {
    const quest = this.quests.get(questId)
    if (!quest) return false

    const questStatus = useQuestStore.getState().getQuestStatus(questId)
    if (questStatus !== 'active') return false

    // 完了フラグチェック
    const completionFlag = useProgressStore.getState().getFlag(quest.completionFlag)
    return !!completionFlag
  }

  /**
   * クエスト完了
   */
  completeQuest(questId: string): boolean {
    const quest = this.quests.get(questId)
    if (!quest) return false

    if (!this.canCompleteQuest(questId)) {
      return false
    }

    // 報酬付与
    const { members, addExp, addGold, addItem } = usePartyStore.getState()

    if (quest.rewards.exp) {
      // 経験値を全メンバーに分配
      members.forEach((member) => {
        addExp(member.id, quest.rewards.exp || 0)
      })
    }

    if (quest.rewards.gold) {
      addGold(quest.rewards.gold)
    }

    if (quest.rewards.items) {
      for (const itemId of quest.rewards.items) {
        addItem(itemId)
      }
    }

    // クエスト完了
    useQuestStore.getState().completeQuest(questId)
    devLog(`[QuestManager] Completed quest: ${questId}`)
    return true
  }

  /**
   * 受注中のクエストを取得
   */
  getActiveQuests(): Quest[] {
    const activeQuestIds = useQuestStore.getState().activeQuests
    return activeQuestIds
      .map((id) => this.quests.get(id))
      .filter((q): q is Quest => q !== undefined)
  }

  /**
   * 完了済みクエストを取得
   */
  getCompletedQuests(): Quest[] {
    const completedQuestIds = useQuestStore.getState().completedQuests
    return completedQuestIds
      .map((id) => this.quests.get(id))
      .filter((q): q is Quest => q !== undefined)
  }

  /**
   * 受注可能なクエストを取得
   */
  getAvailableQuests(): Quest[] {
    return this.getAllQuests().filter((quest) => this.canAcceptQuest(quest.id))
  }
}

// シングルトンインスタンス
export const questManager = new QuestManager()
