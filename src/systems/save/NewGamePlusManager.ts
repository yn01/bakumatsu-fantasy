/**
 * NewGamePlusManager - New Game+ システム
 */

import { usePartyStore } from '@/stores/partyStore'
import { useProgressStore } from '@/stores/progressStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { useEncyclopediaStore } from '@/stores/encyclopediaStore'
import { useGameStore } from '@/stores/gameStore'
import { devLog } from '@/utils/logger'

export interface NewGamePlusData {
  // 引き継ぎデータ
  members: Array<{
    id: string
    level: number
    exp: number
    skills: string[]
    skillPoints: number
  }>
  achievements: string[]
  encyclopedia: {
    enemies: string[]
    items: string[]
    skills: string[]
  }
  playCount: number
}

export class NewGamePlusManager {
  /**
   * クリアデータが存在するか確認
   */
  hasClearData(): boolean {
    try {
      const data = localStorage.getItem('bakumatsu_fantasy_clear_data')
      return data !== null
    } catch {
      return false
    }
  }

  /**
   * クリアデータを保存
   */
  saveClearData(): void {
    try {
      const partyStore = usePartyStore.getState()
      const achievementStore = useAchievementStore.getState()
      const encyclopediaStore = useEncyclopediaStore.getState()

      const clearData: NewGamePlusData = {
        members: partyStore.members.map((m) => ({
          id: m.id,
          level: m.level,
          exp: m.exp,
          skills: m.skills,
          skillPoints: m.skillPoints || 0,
        })),
        achievements: achievementStore.unlockedAchievements,
        encyclopedia: {
          enemies: encyclopediaStore.discoveredEnemies,
          items: encyclopediaStore.discoveredItems,
          skills: encyclopediaStore.discoveredSkills,
        },
        playCount: this.getPlayCount() + 1,
      }

      localStorage.setItem('bakumatsu_fantasy_clear_data', JSON.stringify(clearData))
      devLog('[NewGamePlusManager] Clear data saved')
    } catch (error) {
      console.error('[NewGamePlusManager] Failed to save clear data:', error)
    }
  }

  /**
   * New Game+ を開始
   */
  async startNewGamePlus(): Promise<void> {
    try {
      const data = localStorage.getItem('bakumatsu_fantasy_clear_data')
      if (!data) {
        console.error('[NewGamePlusManager] No clear data found')
        return
      }

      const clearData: NewGamePlusData = JSON.parse(data)

      // プログレスをリセット
      useProgressStore.getState().resetProgress()

      // パーティをリセット
      const partyStore = usePartyStore.getState()
      // 全メンバーを削除
      const currentMembers = [...partyStore.members]
      currentMembers.forEach((member) => {
        partyStore.removeMember(member.id)
      })
      const currentGold = partyStore.gold
      if (currentGold > 0) {
        partyStore.addGold(-currentGold)
      }
      partyStore.clearItems()

      // 坂本龍馬を引き継ぎデータで追加
      const response = await fetch('/data/characters.json')
      if (!response.ok) {
        throw new Error('Failed to load characters.json')
      }
      const characters = await response.json()
      const ryomaMaster = characters.find((c: { id: string }) => c.id === 'ryoma')
      const ryomaClearData = clearData.members.find((m) => m.id === 'ryoma')

      if (ryomaMaster && ryomaClearData) {
        // 引き継ぎデータでキャラクター作成
        partyStore.addMember({
          id: ryomaMaster.id,
          name: ryomaMaster.name,
          class: ryomaMaster.class,
          level: ryomaClearData.level,
          exp: ryomaClearData.exp,
          stats: {
            hp: ryomaMaster.initialStats.maxHp,
            maxHp: ryomaMaster.initialStats.maxHp,
            mp: ryomaMaster.initialStats.maxMp,
            maxMp: ryomaMaster.initialStats.maxMp,
            attack: ryomaMaster.initialStats.attack,
            defense: ryomaMaster.initialStats.defense,
            speed: ryomaMaster.initialStats.speed,
            luck: ryomaMaster.initialStats.luck,
          },
          equipment: {
            weapon: null,
            armor: null,
          },
          skills: ryomaClearData.skills,
          skillPoints: ryomaClearData.skillPoints,
          growthRate: ryomaMaster.growthRate,
          sprite: ryomaMaster.sprite,
        })
      }

      // 実績を引き継ぎ
      const achievementStore = useAchievementStore.getState()
      achievementStore.resetAchievements()
      clearData.achievements.forEach((id) => {
        achievementStore.unlockAchievement(id)
      })

      // 図鑑を引き継ぎ
      const encyclopediaStore = useEncyclopediaStore.getState()
      encyclopediaStore.resetEncyclopedia()
      clearData.encyclopedia.enemies.forEach((id) => {
        encyclopediaStore.discoverEnemy(id)
      })
      clearData.encyclopedia.items.forEach((id) => {
        encyclopediaStore.discoverItem(id)
      })
      clearData.encyclopedia.skills.forEach((id) => {
        encyclopediaStore.discoverSkill(id)
      })

      // 初期ゴールドを設定
      partyStore.addGold(100)

      // New Game+ フラグを設定
      useProgressStore.getState().setFlag('new_game_plus', true)
      useProgressStore.getState().setFlag('play_count', clearData.playCount)

      // 才谷屋マップに移動
      useProgressStore.getState().setCurrentMap('saigaitaya', { x: 15, y: 5 })

      // フィールドシーンに遷移
      useGameStore.getState().setScene('field')

      devLog('[NewGamePlusManager] New Game+ started')
    } catch (error) {
      console.error('[NewGamePlusManager] Failed to start New Game+:', error)
    }
  }

  /**
   * プレイ回数を取得
   */
  private getPlayCount(): number {
    try {
      const data = localStorage.getItem('bakumatsu_fantasy_clear_data')
      if (!data) return 0
      const clearData: NewGamePlusData = JSON.parse(data)
      return clearData.playCount || 0
    } catch {
      return 0
    }
  }

  /**
   * 敵ステータスを強化（New Game+）
   */
  enhanceEnemyStats(baseStats: {
    hp: number
    maxHp: number
    mp: number
    maxMp: number
    attack: number
    defense: number
    speed: number
    luck: number
  }): typeof baseStats {
    const progressStore = useProgressStore.getState()
    const isNewGamePlus = progressStore.getFlag('new_game_plus')

    if (!isNewGamePlus) {
      return baseStats
    }

    // 1.3倍に強化
    return {
      hp: Math.floor(baseStats.hp * 1.3),
      maxHp: Math.floor(baseStats.maxHp * 1.3),
      mp: Math.floor(baseStats.mp * 1.3),
      maxMp: Math.floor(baseStats.maxMp * 1.3),
      attack: Math.floor(baseStats.attack * 1.3),
      defense: Math.floor(baseStats.defense * 1.3),
      speed: Math.floor(baseStats.speed * 1.3),
      luck: Math.floor(baseStats.luck * 1.3),
    }
  }
}

export const newGamePlusManager = new NewGamePlusManager()
