/**
 * DifficultyManager - 難易度管理システム
 */

export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'veryHard'

export interface DifficultySettings {
  id: DifficultyLevel
  name: string
  description: string
  enemyHpMultiplier: number
  enemyAtkMultiplier: number
  expMultiplier: number
}

export const DIFFICULTY_SETTINGS: Record<DifficultyLevel, DifficultySettings> = {
  easy: {
    id: 'easy',
    name: '簡単',
    description: '敵が弱く、経験値が多くもらえる（初心者向け）',
    enemyHpMultiplier: 0.7,
    enemyAtkMultiplier: 0.7,
    expMultiplier: 1.5,
  },
  normal: {
    id: 'normal',
    name: '普通',
    description: '通常のバランス（推奨）',
    enemyHpMultiplier: 1.0,
    enemyAtkMultiplier: 1.0,
    expMultiplier: 1.0,
  },
  hard: {
    id: 'hard',
    name: '難しい',
    description: '敵が強く、やりごたえがある',
    enemyHpMultiplier: 1.5,
    enemyAtkMultiplier: 1.5,
    expMultiplier: 1.2,
  },
  veryHard: {
    id: 'veryHard',
    name: '超難関',
    description: '敵が非常に強い（上級者向け）',
    enemyHpMultiplier: 2.0,
    enemyAtkMultiplier: 2.0,
    expMultiplier: 1.0,
  },
}

export class DifficultyManager {
  /**
   * 難易度設定を取得
   */
  static getSettings(difficulty: DifficultyLevel): DifficultySettings {
    return DIFFICULTY_SETTINGS[difficulty]
  }

  /**
   * 敵のHPに難易度倍率を適用
   */
  static applyEnemyHp(baseHp: number, difficulty: DifficultyLevel): number {
    const settings = this.getSettings(difficulty)
    return Math.floor(baseHp * settings.enemyHpMultiplier)
  }

  /**
   * 敵の攻撃力に難易度倍率を適用
   */
  static applyEnemyAtk(baseAtk: number, difficulty: DifficultyLevel): number {
    const settings = this.getSettings(difficulty)
    return Math.floor(baseAtk * settings.enemyAtkMultiplier)
  }

  /**
   * 経験値に難易度倍率を適用
   */
  static applyExp(baseExp: number, difficulty: DifficultyLevel): number {
    const settings = this.getSettings(difficulty)
    return Math.floor(baseExp * settings.expMultiplier)
  }

  /**
   * すべての難易度設定を取得（UI表示用）
   */
  static getAllSettings(): DifficultySettings[] {
    return Object.values(DIFFICULTY_SETTINGS)
  }
}
