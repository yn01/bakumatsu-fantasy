/**
 * RewardManager - バトル報酬分配システム
 */

import { usePartyStore } from '@/stores/partyStore'
import { LevelUpManager } from '@/systems/growth/LevelUpManager'
import type { BattleResult } from '@/types/battle'
import type { Character } from '@/types/character'
import type { LevelUpResult } from '@/systems/growth/LevelUpManager'

export interface RewardDistribution {
  memberId: string
  memberName: string
  exp: number
  levelUp: boolean
  newLevel?: number
  levelUpResult?: LevelUpResult
}

export class RewardManager {
  /**
   * 報酬を分配してpartyStoreに反映
   */
  distributeRewards(result: BattleResult): RewardDistribution[] {
    const { members } = usePartyStore.getState()
    const aliveMembers = members.filter((m) => m.stats.hp > 0)

    if (aliveMembers.length === 0) {
      // 全滅の場合は報酬なし
      return []
    }

    // 経験値を生存メンバーで均等分配
    const expPerMember = Math.floor(result.exp / aliveMembers.length)

    const distributions: RewardDistribution[] = aliveMembers.map((member) => {
      // レベルアップチェック（経験値反映前にチェック）
      const levelUpCheck = this.checkLevelUp(member, expPerMember)

      // 経験値をpartyStoreに反映（LevelUpManagerが既に更新している場合がある）
      if (!levelUpCheck.levelUp) {
        usePartyStore.getState().addExp(member.id, expPerMember)
      }

      return {
        memberId: member.id,
        memberName: member.name,
        exp: expPerMember,
        levelUp: levelUpCheck.levelUp,
        newLevel: levelUpCheck.newLevel,
        levelUpResult: levelUpCheck.result,
      }
    })

    // ゴールド追加
    usePartyStore.getState().addGold(result.gold)

    // アイテム追加（Phase 4 Task #20で実装）
    result.items.forEach((itemId) => {
      usePartyStore.getState().addItem(itemId)
    })

    return distributions
  }

  /**
   * レベルアップチェック
   */
  private checkLevelUp(
    member: Character,
    addedExp: number
  ): {
    levelUp: boolean
    newLevel?: number
    result?: LevelUpResult
  } {
    const levelUpManager = new LevelUpManager()
    const result = levelUpManager.checkAndLevelUp(member, addedExp)

    if (result) {
      return {
        levelUp: true,
        newLevel: result.newLevel,
        result,
      }
    }

    return { levelUp: false }
  }
}
