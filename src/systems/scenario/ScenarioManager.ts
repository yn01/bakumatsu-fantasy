/**
 * ScenarioManager - シナリオ進行管理システム
 */

import { useProgressStore } from '../../stores/progressStore'
import { usePartyStore } from '../../stores/partyStore'
import { useGameStore } from '../../stores/gameStore'

export class ScenarioManager {
  /**
   * 現在のチャプターを取得
   */
  getCurrentChapter(): string {
    const progress = useProgressStore.getState()

    // プロローグ未完了
    if (!progress.getFlag('prologue_cleared')) {
      return 'prologue'
    }

    // Chapter 1 未完了
    if (!progress.getFlag('chapter1_cleared')) {
      return 'chapter1'
    }

    // Chapter 2 未完了
    if (!progress.getFlag('chapter2_cleared')) {
      return 'chapter2'
    }

    // Chapter 3 未完了
    if (!progress.getFlag('chapter3_cleared')) {
      return 'chapter3'
    }

    // 全チャプター完了
    return 'epilogue'
  }

  /**
   * 次のチャプターを取得
   */
  getNextChapter(currentChapter: string): string {
    const chapterOrder: string[] = ['prologue', 'chapter1', 'chapter2', 'chapter3', 'epilogue']
    const currentIndex = chapterOrder.indexOf(currentChapter)

    if (currentIndex === -1 || currentIndex === chapterOrder.length - 1) {
      return 'epilogue'
    }

    const nextChapter = chapterOrder[currentIndex + 1]
    return nextChapter || 'epilogue'
  }

  /**
   * New Game処理
   */
  async startNewGame(): Promise<void> {
    // プログレスをリセット
    useProgressStore.getState().resetProgress()

    // パーティをリセット（メンバーを空にする）
    const partyStore = usePartyStore.getState()
    // membersを直接空にすることはできないので、すべてのメンバーを削除
    const currentMembers = partyStore.members
    currentMembers.forEach((member) => {
      partyStore.removeMember(member.id)
    })

    // ゴールドとアイテムをリセット
    const currentGold = partyStore.gold
    if (currentGold > 0) {
      partyStore.addGold(-currentGold)
    }

    // 坂本龍馬を追加（characters.jsonから読み込み）
    try {
      const response = await fetch('/data/characters.json')
      if (!response.ok) {
        throw new Error('Failed to load characters.json')
      }
      const characters = await response.json()
      const ryomaMaster = characters.find((c: { id: string }) => c.id === 'ryoma')

      if (ryomaMaster) {
        // CharacterMaster → Character変換
        partyStore.addMember({
          id: ryomaMaster.id,
          name: ryomaMaster.name,
          class: ryomaMaster.class,
          level: ryomaMaster.initialLevel,
          exp: 0,
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
          skills: [],
          skillPoints: 0,
          growthRate: ryomaMaster.growthRate,
          sprite: ryomaMaster.sprite,
        })
      }
    } catch (error) {
      console.error('Failed to load Ryoma:', error)
    }

    // 初期ゴールドを設定（100両）
    partyStore.addGold(100)

    // 才谷屋マップに移動
    useProgressStore.getState().setCurrentMap('saigaitaya', { x: 15, y: 5 })

    // フィールドシーンに遷移
    useGameStore.getState().setScene('field')
  }

  /**
   * マップイベントトリガーをチェック
   */
  checkMapEvent(mapId: string, position: { x: number; y: number }): string | null {
    const progress = useProgressStore.getState()

    // Chapter 1: 城下町入口で上士に絡まれる
    if (
      mapId === 'kochi_town' &&
      position.x === 25 &&
      position.y === 20 &&
      progress.getFlag('prologue_cleared') &&
      !progress.getFlag('chapter1_started')
    ) {
      return 'chapter1'
    }

    // Chapter 2: 道場前で武市半平太と出会う
    if (
      mapId === 'yodo_dojo' &&
      position.x === 12 &&
      position.y === 3 &&
      progress.getFlag('chapter1_cleared') &&
      !progress.getFlag('chapter2_started')
    ) {
      return 'chapter2'
    }

    // Chapter 3: 城下町で守旧派イベント
    if (
      mapId === 'kochi_town' &&
      position.x === 30 &&
      position.y === 25 &&
      progress.getFlag('chapter2_cleared') &&
      !progress.getFlag('chapter3_started')
    ) {
      return 'chapter3'
    }

    return null
  }
}
