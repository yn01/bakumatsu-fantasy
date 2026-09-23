/**
 * SaveManager - セーブ/ロード管理システム
 */

import type { SaveData } from '@/types/save'
import { usePartyStore } from '@/stores/partyStore'
import { useProgressStore } from '@/stores/progressStore'
import { useGameStore } from '@/stores/gameStore'
import { useQuestStore } from '@/stores/questStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { useEncyclopediaStore } from '@/stores/encyclopediaStore'
import type { DifficultyLevel } from '@/systems/difficulty/DifficultyManager'
import { devLog } from '@/utils/logger'

const DIFFICULTY_LEVELS: readonly DifficultyLevel[] = ['easy', 'normal', 'hard', 'veryHard']

/** セーブデータ由来の文字列が有効な難易度かどうかを判定する型ガード */
function isDifficultyLevel(value: string): value is DifficultyLevel {
  return DIFFICULTY_LEVELS.some((level) => level === value)
}

export class SaveManager {
  private static readonly STORAGE_KEY = 'bakumatsu-fantasy:save-'
  private static readonly MAX_SLOTS = 3
  private static readonly VERSION = '1.0.0'

  /**
   * セーブデータを保存
   * @param slot セーブスロット番号（0-2）または'auto'
   * @param currentMap 現在のマップID（フィールドから渡す）
   * @param playerPosition プレイヤー位置（フィールドから渡す）
   * @returns 成功/失敗
   */
  static save(
    slot: number | 'auto',
    currentMap?: string,
    playerPosition?: { x: number; y: number }
  ): boolean {
    try {
      // スロット番号検証
      if (typeof slot === 'number' && (slot < 0 || slot >= this.MAX_SLOTS)) {
        console.error(`[SaveManager] Invalid slot: ${slot}`)
        return false
      }

      const saveData = this.serializeSaveData(currentMap, playerPosition)
      const key = this.STORAGE_KEY + slot

      try {
        localStorage.setItem(key, JSON.stringify(saveData))
      } catch (quotaError) {
        // QuotaExceededError: localStorage容量不足
        console.error('[SaveManager] localStorage quota exceeded:', quotaError)

        // オートセーブを削除して再試行
        if (slot !== 'auto' && this.hasSave('auto')) {
          console.warn('[SaveManager] Deleting auto-save to free space...')
          this.deleteSave('auto')
          localStorage.setItem(key, JSON.stringify(saveData))
        } else {
          throw quotaError
        }
      }

      devLog(`[SaveManager] Game saved to slot ${slot}`)
      return true
    } catch (error) {
      console.error('[SaveManager] Save failed:', error)
      return false
    }
  }

  /**
   * セーブデータを読み込み
   * @param slot セーブスロット番号（0-2）または'auto'
   * @returns 成功/失敗
   */
  static async load(slot: number | 'auto'): Promise<boolean> {
    try {
      // スロット番号検証
      if (typeof slot === 'number' && (slot < 0 || slot >= this.MAX_SLOTS)) {
        console.error(`[SaveManager] Invalid slot: ${slot}`)
        return false
      }

      const key = this.STORAGE_KEY + slot
      const data = localStorage.getItem(key)
      if (!data) {
        console.warn(`[SaveManager] No save data in slot ${slot}`)
        return false
      }

      const saveData: SaveData = JSON.parse(data)
      if (!this.validateSaveData(saveData)) {
        console.error('[SaveManager] Invalid save data')
        return false
      }

      await this.deserializeSaveData(saveData)
      devLog(`[SaveManager] Game loaded from slot ${slot}`)
      return true
    } catch (error) {
      console.error('[SaveManager] Load failed:', error)
      return false
    }
  }

  /**
   * セーブ情報を取得（ロードせずにメタデータのみ取得）
   * @param slot セーブスロット番号（0-2）または'auto'
   * @returns セーブデータまたはnull
   */
  static getSaveInfo(slot: number | 'auto'): SaveData | null {
    try {
      const key = this.STORAGE_KEY + slot
      const data = localStorage.getItem(key)
      if (!data) return null

      const saveData: SaveData = JSON.parse(data)
      return this.validateSaveData(saveData) ? saveData : null
    } catch (error) {
      console.error('[SaveManager] Failed to get save info:', error)
      return null
    }
  }

  /**
   * セーブデータの存在確認
   * @param slot セーブスロット番号（0-2）または'auto'
   * @returns 存在するかどうか
   */
  static hasSave(slot: number | 'auto'): boolean {
    const key = this.STORAGE_KEY + slot
    return localStorage.getItem(key) !== null
  }

  /**
   * セーブデータを削除
   * @param slot セーブスロット番号（0-2）または'auto'
   */
  static deleteSave(slot: number | 'auto'): void {
    const key = this.STORAGE_KEY + slot
    localStorage.removeItem(key)
    devLog(`[SaveManager] Deleted save slot ${slot}`)
  }

  /**
   * すべてのセーブスロット情報を取得
   * @returns セーブスロット情報配列
   */
  static getAllSaveSlots(): Array<{ slot: number; data: SaveData | null }> {
    const slots = []
    for (let i = 0; i < this.MAX_SLOTS; i++) {
      slots.push({
        slot: i,
        data: this.getSaveInfo(i),
      })
    }
    return slots
  }

  /**
   * ゲーム状態をセーブデータに変換
   * @param currentMap 現在のマップID
   * @param playerPosition プレイヤー位置
   * @returns セーブデータ
   */
  private static serializeSaveData(
    currentMap?: string,
    playerPosition?: { x: number; y: number }
  ): SaveData {
    const party = usePartyStore.getState()
    const progress = useProgressStore.getState()
    const game = useGameStore.getState()
    const quest = useQuestStore.getState()
    const achievement = useAchievementStore.getState()
    const encyclopedia = useEncyclopediaStore.getState()

    // キャラクター状態を変換
    const characters: SaveData['characters'] = {}
    party.members.forEach((char) => {
      characters[char.id] = {
        level: char.level,
        exp: char.exp,
        hp: char.stats.hp,
        mp: char.stats.mp,
        maxHp: char.stats.maxHp,
        maxMp: char.stats.maxMp,
        skills: char.skills,
        equipment: char.equipment,
        skillPoints: char.skillPoints || 0,
      }
    })

    // アイテムを数量化
    const items: { [itemId: string]: number } = {}
    party.items.forEach((itemId) => {
      items[itemId] = (items[itemId] || 0) + 1
    })

    return {
      version: this.VERSION,
      timestamp: Date.now(),
      playTime: progress.playTime,
      chapter: progress.chapter,
      currentMap: currentMap || progress.currentMapId || 'test_map',
      playerPosition: playerPosition || progress.currentPosition || { x: 10, y: 7 },
      party: {
        members: party.members.map((m) => m.id),
        formation: party.formation,
      },
      characters,
      inventory: {
        items,
        money: party.gold,
      },
      flags: progress.flags,
      visitedMaps: progress.visitedMaps,
      settings: game.settings,
      difficulty: game.difficulty,
      quests: {
        activeQuests: quest.activeQuests,
        completedQuests: quest.completedQuests,
      },
      achievements: {
        unlockedAchievements: achievement.unlockedAchievements,
      },
      encyclopedia: {
        discoveredEnemies: encyclopedia.discoveredEnemies,
        discoveredItems: encyclopedia.discoveredItems,
        discoveredSkills: encyclopedia.discoveredSkills,
      },
    }
  }

  /**
   * セーブデータをゲーム状態に復元
   * @param data セーブデータ
   */
  private static async deserializeSaveData(data: SaveData): Promise<void> {
    // characters.jsonを読み込み
    const basePath = import.meta.env.BASE_URL || '/'
    const response = await fetch(`${basePath}data/characters.json`)
    if (!response.ok) {
      throw new Error('Failed to load characters.json')
    }
    const characterMasterData = await response.json()

    // パーティをリセット
    const partyStore = usePartyStore.getState()
    partyStore.members.forEach((member) => {
      partyStore.removeMember(member.id)
    })

    // キャラクターを復元
    for (const charId of data.party.members) {
      const masterChar = characterMasterData.find((c: { id: string }) => c.id === charId)
      if (!masterChar) {
        console.warn(`[SaveManager] Character ${charId} not found in master data`)
        continue
      }

      const saveChar = data.characters[charId]
      if (!saveChar) {
        console.warn(`[SaveManager] Character ${charId} not found in save data`)
        continue
      }

      // マスタデータとセーブデータを統合
      const character = {
        ...masterChar,
        level: saveChar.level,
        exp: saveChar.exp,
        stats: {
          hp: saveChar.hp,
          mp: saveChar.mp,
          maxHp: saveChar.maxHp,
          maxMp: saveChar.maxMp,
          attack: masterChar.initialStats.attack, // 装備込みで再計算される
          defense: masterChar.initialStats.defense,
          speed: masterChar.initialStats.speed,
          luck: masterChar.initialStats.luck,
        },
        skills: saveChar.skills,
        equipment: saveChar.equipment,
        skillPoints: saveChar.skillPoints,
      }

      partyStore.addMember(character)
    }

    // 編成を復元
    partyStore.setFormation(data.party.formation)

    // アイテムを復元
    const items: string[] = []
    Object.entries(data.inventory.items).forEach(([itemId, count]) => {
      for (let i = 0; i < count; i++) {
        items.push(itemId)
      }
    })
    usePartyStore.setState({ items, gold: data.inventory.money })

    // プログレスを復元
    useProgressStore.setState({
      chapter: data.chapter,
      flags: data.flags,
      visitedMaps: data.visitedMaps,
      playTime: data.playTime,
      currentMapId: data.currentMap,
      currentPosition: data.playerPosition,
    })

    // 設定を復元
    useGameStore.getState().updateSettings(data.settings)

    // 難易度を復元（存在しない場合はnormalをデフォルトに）
    if (data.difficulty) {
      if (isDifficultyLevel(data.difficulty)) {
        useGameStore.getState().setDifficulty(data.difficulty)
      }
    }

    // Phase 9: クエスト、実績、図鑑を復元
    if (data.quests) {
      useQuestStore.setState({
        activeQuests: data.quests.activeQuests,
        completedQuests: data.quests.completedQuests,
      })
    }
    if (data.achievements) {
      useAchievementStore.setState({
        unlockedAchievements: data.achievements.unlockedAchievements,
      })
    }
    if (data.encyclopedia) {
      useEncyclopediaStore.setState({
        discoveredEnemies: data.encyclopedia.discoveredEnemies,
        discoveredItems: data.encyclopedia.discoveredItems,
        discoveredSkills: data.encyclopedia.discoveredSkills,
      })
    }

    // シーンをフィールドに設定
    useGameStore.getState().setScene('field')
  }

  /**
   * セーブデータの検証
   * @param data セーブデータ
   * @returns 有効かどうか
   */
  private static validateSaveData(data: unknown): data is SaveData {
    if (typeof data !== 'object' || data === null) return false

    const d = data as Partial<SaveData>

    // 必須フィールドをチェック
    if (typeof d.version !== 'string') return false
    if (typeof d.timestamp !== 'number') return false
    if (typeof d.playTime !== 'number') return false
    if (typeof d.chapter !== 'string') return false
    if (typeof d.currentMap !== 'string') return false
    if (typeof d.playerPosition !== 'object') return false
    if (typeof d.playerPosition?.x !== 'number') return false
    if (typeof d.playerPosition?.y !== 'number') return false
    if (!Array.isArray(d.party?.members)) return false
    if (!Array.isArray(d.party?.formation)) return false
    if (typeof d.characters !== 'object') return false
    if (typeof d.inventory !== 'object') return false
    if (typeof d.inventory?.items !== 'object') return false
    if (typeof d.inventory?.money !== 'number') return false
    if (typeof d.flags !== 'object') return false
    if (!Array.isArray(d.visitedMaps)) return false
    if (typeof d.settings !== 'object') return false

    devLog('[SaveManager] Save data validation passed')
    return true
  }
}
