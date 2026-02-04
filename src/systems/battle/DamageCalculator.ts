/**
 * ダメージ計算エンジン
 * 攻撃・スキルのダメージ計算、回復計算、クリティカル判定を実装
 */

import type { BattleParticipant, DamageResult } from '@/types/battle'
import type { Skill } from '@/types/skill'

export class DamageCalculator {
  /**
   * ダメージ計算
   * @param attacker 攻撃者
   * @param target 対象
   * @param skill スキル（省略時は通常攻撃）
   * @returns ダメージ結果
   */
  calculateDamage(
    attacker: BattleParticipant,
    target: BattleParticipant,
    skill?: Skill
  ): DamageResult {
    // スキル倍率（通常攻撃は1.0）
    const power = skill?.power || 1.0

    // 基本ダメージ = (攻撃力 × スキル倍率) - (防御力 / 2)
    let damage = attacker.character.stats.attack * power - target.character.stats.defense / 2

    // 防御中はダメージ半減
    if (target.isDefending) {
      damage *= 0.5
    }

    // 乱数: 0.9〜1.1倍
    const randomFactor = 0.9 + Math.random() * 0.2
    damage *= randomFactor

    // クリティカル判定: luck/100の確率で1.5倍
    const isCritical = Math.random() < attacker.character.stats.luck / 100
    if (isCritical) {
      damage *= 1.5
    }

    // 最低ダメージは1
    damage = Math.max(1, Math.floor(damage))

    return {
      targetId: target.character.id,
      damage,
      isCritical,
      isWeak: false, // Phase 3では属性相性なし
      isResist: false, // Phase 3では属性相性なし
    }
  }

  /**
   * 回復量計算
   * @param caster 使用者
   * @param skill スキル
   * @returns 回復量
   */
  calculateHeal(caster: BattleParticipant, skill: Skill): number {
    // 回復量 = スキル効果値 + (使用者の攻撃力 × 0.5)
    // ※ 回復スキルのpowerは固定値、攻撃力は回復力として扱う
    const baseHeal = skill.power + caster.character.stats.attack * 0.5

    // 乱数: 0.9〜1.1倍
    const randomFactor = 0.9 + Math.random() * 0.2
    const heal = Math.floor(baseHeal * randomFactor)

    return Math.max(1, heal)
  }

  /**
   * 複数対象へのダメージ計算
   * @param attacker 攻撃者
   * @param targets 対象配列
   * @param skill スキル（省略時は通常攻撃）
   * @returns ダメージ結果配列
   */
  calculateMultiDamage(
    attacker: BattleParticipant,
    targets: BattleParticipant[],
    skill?: Skill
  ): DamageResult[] {
    return targets.map((target) => this.calculateDamage(attacker, target, skill))
  }
}
