/**
 * SkillTreeManager - スキルツリー管理システム
 */

import type { Character } from '@/types/character'
import type { Skill, SkillTree, SkillTreeNode } from '@/types/skill'
import { usePartyStore } from '@/stores/partyStore'

export interface SkillLearnResult {
  success: boolean
  skillId: string
  skillName: string
  error?: string
}

export interface SkillLearnability {
  canLearn: boolean
  reason?: string
  node: SkillTreeNode
  skill: Skill
}

export class SkillTreeManager {
  private skillTrees: Map<string, SkillTree> = new Map()
  private skills: Map<string, Skill> = new Map()
  private loaded = false

  /**
   * データ読み込み
   */
  async loadData(): Promise<void> {
    if (this.loaded) {
      return
    }

    try {
      const basePath = import.meta.env.BASE_URL || '/'

      // スキルマスタデータ読み込み
      const skillsResponse = await fetch(`${basePath}data/skills.json`)
      if (!skillsResponse.ok) {
        throw new Error(`Failed to fetch skills.json: ${skillsResponse.status}`)
      }
      const skillsData = await skillsResponse.json()

      // ランタイム検証
      if (!skillsData || !Array.isArray(skillsData.skills)) {
        throw new Error('Invalid skills.json format: missing skills array')
      }

      skillsData.skills.forEach((skill: Skill) => {
        if (!skill.id || !skill.name) {
          console.warn('Invalid skill data:', skill)
          return
        }
        this.skills.set(skill.id, skill)
      })

      // スキルツリーデータ読み込み
      const treesResponse = await fetch(`${basePath}data/skill_trees.json`)
      if (!treesResponse.ok) {
        throw new Error(`Failed to fetch skill_trees.json: ${treesResponse.status}`)
      }
      const treesData = await treesResponse.json()

      // ランタイム検証
      if (!treesData || !Array.isArray(treesData.skillTrees)) {
        throw new Error('Invalid skill_trees.json format: missing skillTrees array')
      }

      treesData.skillTrees.forEach((tree: SkillTree) => {
        if (!tree.characterClass || !Array.isArray(tree.nodes)) {
          console.warn('Invalid skill tree data:', tree)
          return
        }
        this.skillTrees.set(tree.characterClass, tree)
      })

      this.loaded = true
    } catch (error) {
      console.error('Failed to load skill data:', error)
      throw error
    }
  }

  /**
   * スキル習得可能判定
   */
  canLearnSkill(character: Character, skillId: string): SkillLearnability | null {
    const tree = this.skillTrees.get(character.class)
    if (!tree) {
      return null
    }

    const node = tree.nodes.find((n) => n.skillId === skillId)
    if (!node) {
      return null
    }

    const skill = this.skills.get(skillId)
    if (!skill) {
      return null
    }

    // 既に習得済み
    if (character.skills.includes(skillId)) {
      return {
        canLearn: false,
        reason: 'すでに習得済みです',
        node,
        skill,
      }
    }

    // レベル要件チェック
    if (character.level < node.requiredLevel) {
      return {
        canLearn: false,
        reason: `レベル${node.requiredLevel}以上で習得可能`,
        node,
        skill,
      }
    }

    // スキルポイント要件チェック
    const skillPoints = character.skillPoints ?? 0
    if (skillPoints < node.requiredPoints) {
      return {
        canLearn: false,
        reason: `スキルポイントが${node.requiredPoints}必要（現在: ${skillPoints}）`,
        node,
        skill,
      }
    }

    // 前提スキルチェック
    if (node.prerequisiteSkills && node.prerequisiteSkills.length > 0) {
      const missingSkills = node.prerequisiteSkills.filter(
        (prereqId) => !character.skills.includes(prereqId)
      )
      if (missingSkills.length > 0) {
        const missingNames = missingSkills
          .map((id) => this.skills.get(id)?.name ?? id)
          .join('、')
        return {
          canLearn: false,
          reason: `前提スキルが必要: ${missingNames}`,
          node,
          skill,
        }
      }
    }

    // 習得可能
    return {
      canLearn: true,
      node,
      skill,
    }
  }

  /**
   * スキル習得実行
   */
  learnSkill(character: Character, skillId: string): SkillLearnResult {
    // 最新のキャラクター状態を取得（競合対策）
    const latestCharacter = usePartyStore.getState().getMember(character.id)
    if (!latestCharacter) {
      return {
        success: false,
        skillId,
        skillName: skillId,
        error: 'キャラクターが見つかりません',
      }
    }

    const learnability = this.canLearnSkill(latestCharacter, skillId)

    if (!learnability) {
      return {
        success: false,
        skillId,
        skillName: skillId,
        error: 'スキルが見つかりません',
      }
    }

    if (!learnability.canLearn) {
      return {
        success: false,
        skillId,
        skillName: learnability.skill.name,
        error: learnability.reason,
      }
    }

    // スキルポイント消費
    const newSkillPoints = (latestCharacter.skillPoints ?? 0) - learnability.node.requiredPoints

    // キャラクター更新（原子的に実行）
    usePartyStore.getState().updateMember(latestCharacter.id, {
      skills: [...latestCharacter.skills, skillId],
      skillPoints: newSkillPoints,
    })

    return {
      success: true,
      skillId,
      skillName: learnability.skill.name,
    }
  }

  /**
   * キャラクターのスキルツリー取得
   */
  getSkillTree(characterClass: string): SkillTree | undefined {
    return this.skillTrees.get(characterClass)
  }

  /**
   * スキル情報取得
   */
  getSkill(skillId: string): Skill | undefined {
    return this.skills.get(skillId)
  }

  /**
   * 全スキル取得
   */
  getAllSkills(): Skill[] {
    return Array.from(this.skills.values())
  }

  /**
   * レベルアップ時の自動習得スキルチェック
   * （現在のレベルで自動習得できるスキルを返す）
   */
  checkAutoLearnSkills(character: Character, newLevel: number): string[] {
    const tree = this.skillTrees.get(character.class)
    if (!tree) {
      return []
    }

    const autoLearnedSkills: string[] = []

    // 自動習得スキル: requiredPoints=0かつレベル要件を満たすスキル
    tree.nodes.forEach((node) => {
      // 既に習得済みならスキップ
      if (character.skills.includes(node.skillId)) {
        return
      }

      // requiredPoints=0のスキルは自動習得
      if (node.requiredPoints === 0 && newLevel >= node.requiredLevel) {
        // 前提スキルチェック
        if (node.prerequisiteSkills && node.prerequisiteSkills.length > 0) {
          const allPrereqsMet = node.prerequisiteSkills.every(
            (prereqId) =>
              character.skills.includes(prereqId) || autoLearnedSkills.includes(prereqId)
          )
          if (!allPrereqsMet) {
            return
          }
        }

        autoLearnedSkills.push(node.skillId)
      }
    })

    // キャラクターに自動習得スキルを追加
    if (autoLearnedSkills.length > 0) {
      usePartyStore.getState().updateMember(character.id, {
        skills: [...character.skills, ...autoLearnedSkills],
      })
    }

    return autoLearnedSkills
  }

  /**
   * 習得済みスキル一覧取得
   */
  getLearnedSkills(character: Character): Skill[] {
    return character.skills
      .map((skillId) => this.skills.get(skillId))
      .filter((skill): skill is Skill => skill !== undefined)
  }

  /**
   * 習得可能なスキル一覧取得
   */
  getLearnableSkills(character: Character): SkillLearnability[] {
    const tree = this.skillTrees.get(character.class)
    if (!tree) {
      return []
    }

    return tree.nodes
      .map((node) => this.canLearnSkill(character, node.skillId))
      .filter((result): result is SkillLearnability => result !== null)
  }
}

// シングルトンインスタンス
export const skillTreeManager = new SkillTreeManager()
