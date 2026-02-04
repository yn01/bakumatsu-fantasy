/**
 * スキル型定義
 */

/** スキルタイプ */
export type SkillType =
  | 'physical' // 物理攻撃
  | 'magical' // 魔法攻撃
  | 'heal' // 回復
  | 'buff' // 強化
  | 'debuff' // 弱体化

/** スキルターゲット */
export type SkillTarget =
  | 'single' // 単体
  | 'all' // 全体
  | 'self' // 自分
  | 'ally' // 味方単体
  | 'allies' // 味方全体

/** スキル効果 */
export interface SkillEffect {
  type: 'damage' | 'heal' | 'buff' | 'debuff'
  stat?: 'attack' | 'defense' | 'speed' // buff/debuff対象ステータス
  value: number // 効果値
  duration?: number // 効果ターン数（buff/debuffのみ）
}

/** スキル */
export interface Skill {
  id: string
  name: string
  description: string
  mpCost: number
  power: number // 威力倍率（1.0 = 100%）
  type: SkillType
  target: SkillTarget
  effects: SkillEffect[]
  animation: string // アニメーションID
}

/** スキルツリーノード */
export interface SkillTreeNode {
  skillId: string
  requiredLevel: number
  requiredPoints: number
  prerequisiteSkills?: string[] // 前提スキルID配列
  position: {
    x: number
    y: number
  }
}

/** スキルツリー */
export interface SkillTree {
  characterClass: string
  nodes: SkillTreeNode[]
}
