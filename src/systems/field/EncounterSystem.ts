/**
 * エンカウントシステム
 * フィールド歩行中のランダムエンカウント判定を管理
 */
export class EncounterSystem {
  private stepCount: number = 0
  private encounterRate: number = 0.05

  /**
   * 1歩進んだときの処理
   * @returns エンカウント発生したかどうか
   */
  onStep(): boolean {
    this.stepCount++
    if (this.stepCount >= 3) {
      this.stepCount = 0
      return Math.random() < this.encounterRate
    }
    return false
  }

  /**
   * エンカウント率を設定
   * @param rate エンカウント率（0.0〜1.0）
   */
  setEncounterRate(rate: number): void {
    this.encounterRate = Math.max(0, Math.min(1, rate))
  }

  /**
   * 敵グループをランダム選択
   * @param enemies 敵ID配列
   * @returns ランダム選択された敵ID配列（1〜3体）
   */
  getEnemyGroup(enemies: string[]): string[] {
    if (enemies.length === 0) {
      return []
    }

    const count = Math.floor(Math.random() * 3) + 1
    return Array.from({ length: count }, () => {
      const index = Math.floor(Math.random() * enemies.length)
      return enemies[index]!
    })
  }

  /**
   * 歩数カウンターをリセット
   * マップ切り替え時などに使用
   */
  reset(): void {
    this.stepCount = 0
  }
}
