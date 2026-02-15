/**
 * EncyclopediaManager - 図鑑管理システム
 */

import { useEncyclopediaStore } from '@/stores/encyclopediaStore'

export class EncyclopediaManager {
  /**
   * 敵遭遇時の処理
   */
  onEncounterEnemy(enemyId: string): void {
    const store = useEncyclopediaStore.getState()
    store.discoverEnemy(enemyId)
    console.log(`[EncyclopediaManager] Discovered enemy: ${enemyId}`)
  }

  /**
   * アイテム入手時の処理
   */
  onObtainItem(itemId: string): void {
    const store = useEncyclopediaStore.getState()
    store.discoverItem(itemId)
    console.log(`[EncyclopediaManager] Discovered item: ${itemId}`)
  }

  /**
   * スキル習得時の処理
   */
  onLearnSkill(skillId: string): void {
    const store = useEncyclopediaStore.getState()
    store.discoverSkill(skillId)
    console.log(`[EncyclopediaManager] Discovered skill: ${skillId}`)
  }

  /**
   * 複数敵遭遇時の処理
   */
  onEncounterEnemies(enemyIds: string[]): void {
    enemyIds.forEach((id) => this.onEncounterEnemy(id))
  }
}

export const encyclopediaManager = new EncyclopediaManager()
