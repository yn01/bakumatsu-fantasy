/**
 * ターン管理システム
 * ターン順序決定ロジックを管理
 */

import type { BattleParticipant } from '@/types/battle'

export class TurnManager {
  /**
   * ターン順序を計算
   * @param party 味方パーティ
   * @param enemies 敵グループ
   * @returns ターン順序（速度降順）
   */
  calculateTurnOrder(
    party: BattleParticipant[],
    enemies: BattleParticipant[]
  ): BattleParticipant[] {
    // 全参加者を結合
    const allParticipants = [...party, ...enemies]

    // 戦闘不能者を除外
    const alive = allParticipants.filter((p) => !p.state.includes('dead'))

    // 速度でソート（降順）
    const sorted = alive.sort((a, b) => {
      const speedDiff = b.character.stats.speed - a.character.stats.speed

      // 速度が同じ場合はluckで判定（将来実装）
      if (speedDiff === 0) {
        return b.character.stats.luck - a.character.stats.luck
      }

      return speedDiff
    })

    return sorted
  }

  /**
   * 次に行動するキャラクターを取得
   * @param turnOrder ターン順序
   * @param currentIndex 現在のインデックス
   * @returns 次のキャラクター（存在しない場合はnull）
   */
  getNextActor(
    turnOrder: BattleParticipant[],
    currentIndex: number
  ): BattleParticipant | null {
    if (currentIndex >= turnOrder.length - 1) {
      return null // ターン終了
    }

    return turnOrder[currentIndex + 1] || null
  }

  /**
   * 指定したキャラクターのターン順序インデックスを取得
   * @param turnOrder ターン順序
   * @param characterId キャラクターID
   * @returns インデックス（見つからない場合は-1）
   */
  findActorIndex(turnOrder: BattleParticipant[], characterId: string): number {
    return turnOrder.findIndex((p) => p.character.id === characterId)
  }
}
