/**
 * LevelUpManager - レベルアップシステム
 */

import { usePartyStore } from '@/stores/partyStore'
import type { Character, Stats, GrowthRate } from '@/types/character'
import { skillTreeManager } from './SkillTreeManager'

// 経験値テーブル（レベルN到達に必要な累計経験値）
const EXP_TABLE: number[] = [
  0, // Lv1
  100, // Lv2
  250, // Lv3
  450, // Lv4
  700, // Lv5
  1000, // Lv6
  1350, // Lv7
  1750, // Lv8
  2200, // Lv9
  2700, // Lv10
  3250, // Lv11
  3850, // Lv12
  4500, // Lv13
  5200, // Lv14
  5950, // Lv15
  6750, // Lv16
  7600, // Lv17
  8500, // Lv18
  9450, // Lv19
  10450, // Lv20
  11550, // Lv21
  12750, // Lv22
  14050, // Lv23
  15450, // Lv24
  16950, // Lv25
  18550, // Lv26
  20250, // Lv27
  22050, // Lv28
  23950, // Lv29
  25950, // Lv30
  28100, // Lv31
  30400, // Lv32
  32850, // Lv33
  35450, // Lv34
  38200, // Lv35
  41100, // Lv36
  44150, // Lv37
  47350, // Lv38
  50700, // Lv39
  54200, // Lv40
  57900, // Lv41
  61800, // Lv42
  65900, // Lv43
  70200, // Lv44
  74700, // Lv45
  79400, // Lv46
  84300, // Lv47
  89400, // Lv48
  94700, // Lv49
  100200, // Lv50
]

export interface LevelUpResult {
  oldLevel: number
  newLevel: number
  statChanges: {
    maxHp: number
    maxMp: number
    attack: number
    defense: number
    speed: number
    luck: number
  }
  newSkills: string[]
}

export class LevelUpManager {
  /**
   * レベルアップ判定と実行
   */
  checkAndLevelUp(character: Character, addedExp: number): LevelUpResult | null {
    const newExp = character.exp + addedExp
    let newLevel = character.level

    // 複数レベルアップ対応
    while (newLevel < 50) {
      const requiredExp = EXP_TABLE[newLevel]
      if (requiredExp === undefined || newExp < requiredExp) {
        break
      }
      newLevel++
    }

    if (newLevel === character.level) {
      return null // レベルアップなし
    }

    // ステータス成長計算
    const growthRate = this.getGrowthRate(character)
    const newStats = this.calculateStatGrowth(
      character.stats,
      growthRate,
      character.level,
      newLevel
    )

    // ステータス変化量
    const statChanges = {
      maxHp: newStats.maxHp - character.stats.maxHp,
      maxMp: newStats.maxMp - character.stats.maxMp,
      attack: newStats.attack - character.stats.attack,
      defense: newStats.defense - character.stats.defense,
      speed: newStats.speed - character.stats.speed,
      luck: newStats.luck - character.stats.luck,
    }

    // スキルポイント付与（1レベルにつき1ポイント）
    const levelDiff = newLevel - character.level
    const currentSkillPoints = character.skillPoints ?? 0
    const newSkillPoints = currentSkillPoints + levelDiff

    // partyStoreを更新
    usePartyStore.getState().updateMember(character.id, {
      level: newLevel,
      exp: newExp,
      stats: {
        ...newStats,
        // HPとMPも増加分だけ回復
        hp: character.stats.hp + statChanges.maxHp,
        mp: character.stats.mp + statChanges.maxMp,
      },
      skillPoints: newSkillPoints,
    })

    // 習得スキルチェック（自動習得スキル）
    const newSkills = this.checkNewSkills(character, newLevel)

    return {
      oldLevel: character.level,
      newLevel,
      statChanges,
      newSkills,
    }
  }

  /**
   * ステータス成長計算
   */
  private calculateStatGrowth(
    currentStats: Stats,
    growthRate: GrowthRate,
    oldLevel: number,
    newLevel: number
  ): Stats {
    const levelDiff = newLevel - oldLevel

    return {
      hp: currentStats.hp,
      maxHp: currentStats.maxHp + Math.floor(growthRate.hp * levelDiff),
      mp: currentStats.mp,
      maxMp: currentStats.maxMp + Math.floor(growthRate.mp * levelDiff),
      attack: currentStats.attack + Math.floor(growthRate.attack * levelDiff),
      defense: currentStats.defense + Math.floor(growthRate.defense * levelDiff),
      speed: currentStats.speed + Math.floor(growthRate.speed * levelDiff),
      luck: currentStats.luck + Math.floor(growthRate.luck * levelDiff),
    }
  }

  /**
   * キャラクターの成長率を取得
   */
  private getGrowthRate(character: Character): GrowthRate {
    // キャラクターに成長率が設定されている場合はそれを使用
    if (character.growthRate) {
      return character.growthRate
    }

    // クラスごとのデフォルト成長率
    const defaultGrowthRates: Record<string, GrowthRate> = {
      swordsman: { hp: 5, mp: 1, attack: 3, defense: 2, speed: 2, luck: 1 },
      strategist: { hp: 3, mp: 3, attack: 2, defense: 1, speed: 3, luck: 2 },
      mage: { hp: 3, mp: 4, attack: 1, defense: 1, speed: 2, luck: 2 },
      healer: { hp: 4, mp: 3, attack: 1, defense: 2, speed: 2, luck: 2 },
      ronin: { hp: 6, mp: 1, attack: 4, defense: 1, speed: 2, luck: 1 },
    }

    // デフォルト値（剣士）を明示的に設定
    const defaultSwordsman: GrowthRate = {
      hp: 5,
      mp: 1,
      attack: 3,
      defense: 2,
      speed: 2,
      luck: 1,
    }

    return defaultGrowthRates[character.class] || defaultSwordsman
  }

  /**
   * 自動習得スキルチェック
   */
  private checkNewSkills(character: Character, newLevel: number): string[] {
    // SkillTreeManagerを使用して自動習得スキルをチェック
    try {
      return skillTreeManager.checkAutoLearnSkills(character, newLevel)
    } catch (error) {
      console.error('Failed to check auto-learn skills:', error)
      return []
    }
  }

  /**
   * 次のレベルに必要な経験値を取得
   */
  static getExpForNextLevel(currentLevel: number): number {
    if (currentLevel >= 50) {
      return 0 // 最大レベル
    }
    // currentLevelの次のレベル（currentLevel + 1）に必要な経験値
    const nextLevelExp = EXP_TABLE[currentLevel]
    return nextLevelExp !== undefined ? nextLevelExp : 0
  }

  /**
   * レベルアップまでの残り経験値を取得
   */
  static getExpToNextLevel(currentLevel: number, currentExp: number): number {
    const nextLevelExp = this.getExpForNextLevel(currentLevel)
    if (nextLevelExp === 0) {
      return 0 // 最大レベル
    }
    return Math.max(0, nextLevelExp - currentExp)
  }
}
