/**
 * SkillTreeWindow - スキルツリーUI
 */

import { useState, useEffect } from 'react'
import { useKeyboard } from '@/hooks/useKeyboard'
import type { Character } from '@/types/character'
import {
  skillTreeManager,
  type SkillLearnability,
} from '@/systems/growth/SkillTreeManager'

interface SkillTreeWindowProps {
  character: Character
  onClose: () => void
}

export const SkillTreeWindow = ({ character, onClose }: SkillTreeWindowProps) => {
  const [learnableSkills, setLearnableSkills] = useState<SkillLearnability[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [message, setMessage] = useState<string>('')

  // スキルツリーデータを読み込み
  useEffect(() => {
    const loadSkills = async () => {
      try {
        await skillTreeManager.loadData()
        const skills = skillTreeManager.getLearnableSkills(character)
        setLearnableSkills(skills)
      } catch (error) {
        console.error('Failed to load skill tree:', error)
        setMessage('スキルデータの読み込みに失敗しました')
      }
    }
    loadSkills()
  }, [character])

  // キーボード入力
  useKeyboard({
    enabled: true,
    onKeyDown: (key) => {
      if (key === 'cancel') {
        onClose()
        return
      }

      if (key === 'up') {
        setSelectedIndex((prev) => Math.max(0, prev - 1))
        setMessage('')
      } else if (key === 'down') {
        setSelectedIndex((prev) => Math.min(learnableSkills.length - 1, prev + 1))
        setMessage('')
      } else if (key === 'confirm') {
        handleLearnSkill()
      }
    },
  })

  // スキル習得実行
  const handleLearnSkill = () => {
    const selected = learnableSkills[selectedIndex]
    if (!selected) return

    if (!selected.canLearn) {
      setMessage(selected.reason ?? '習得できません')
      return
    }

    const result = skillTreeManager.learnSkill(character, selected.node.skillId)
    if (result.success) {
      setMessage(`「${result.skillName}」を習得しました！`)
      // スキル一覧を再読み込み
      setTimeout(() => {
        const skills = skillTreeManager.getLearnableSkills(character)
        setLearnableSkills(skills)
        setMessage('')
      }, 1500)
    } else {
      setMessage(result.error ?? '習得に失敗しました')
    }
  }

  // スキルポイント
  const skillPoints = character.skillPoints ?? 0

  // ノードのスタイルを取得
  const getNodeStyle = (learnability: SkillLearnability) => {
    if (character.skills.includes(learnability.node.skillId)) {
      return 'bg-green-700 border-green-500 text-white' // 習得済み
    } else if (learnability.canLearn) {
      return 'bg-blue-700 border-blue-500 text-white' // 習得可能
    } else {
      return 'bg-gray-700 border-gray-600 text-gray-400' // 未習得
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="bg-gray-900 border-4 border-blue-400 rounded-lg p-8 w-11/12 max-w-4xl h-5/6 overflow-y-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-blue-400 mb-2">
            {character.name} - スキルツリー
          </h2>
          <div className="flex justify-between items-center">
            <p className="text-white">
              クラス: <span className="text-blue-300">{character.class}</span>
            </p>
            <p className="text-white">
              スキルポイント: <span className="text-yellow-400 font-bold">{skillPoints}</span>
            </p>
          </div>
        </div>

        {/* スキルリスト */}
        <div className="mb-6 space-y-3">
          {learnableSkills.map((learnability, index) => {
            const isSelected = index === selectedIndex
            const isLearned = character.skills.includes(learnability.node.skillId)

            return (
              <div
                key={learnability.node.skillId}
                className={`p-4 rounded border-2 transition-all ${
                  isSelected ? 'border-white scale-105' : 'border-transparent'
                } ${getNodeStyle(learnability)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">
                      {isLearned && '✓ '}
                      {learnability.skill.name}
                    </h3>
                    <p className="text-sm mt-1 opacity-90">{learnability.skill.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm">
                      必要Lv: {learnability.node.requiredLevel}
                    </p>
                    <p className="text-sm">
                      必要SP: {learnability.node.requiredPoints}
                    </p>
                  </div>
                </div>

                {/* スキル効果 */}
                <div className="flex gap-4 text-sm">
                  <p>消費MP: {learnability.skill.mpCost}</p>
                  <p>威力: {learnability.skill.power}倍</p>
                  <p>対象: {getTargetText(learnability.skill.target)}</p>
                </div>

                {/* 前提スキル */}
                {learnability.node.prerequisiteSkills &&
                  learnability.node.prerequisiteSkills.length > 0 && (
                    <div className="mt-2 text-sm opacity-75">
                      前提スキル:{' '}
                      {learnability.node.prerequisiteSkills
                        .map((id) => skillTreeManager.getSkill(id)?.name ?? id)
                        .join('、')}
                    </div>
                  )}

                {/* 習得不可理由 */}
                {!isLearned && !learnability.canLearn && learnability.reason && (
                  <div className="mt-2 text-sm text-red-300">
                    {learnability.reason}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* メッセージ */}
        {message && (
          <div className="mb-4 p-3 bg-yellow-900 border border-yellow-600 rounded text-yellow-200 text-center">
            {message}
          </div>
        )}

        {/* 操作説明 */}
        <div className="text-center text-gray-400 text-sm space-y-1">
          <p>↑↓: スキル選択 | Enter / Space / Z: 習得</p>
          <p>Escape / X: 閉じる</p>
        </div>
      </div>
    </div>
  )
}

// ターゲット表示テキスト
function getTargetText(target: string): string {
  switch (target) {
    case 'single':
      return '敵単体'
    case 'all':
      return '敵全体'
    case 'self':
      return '自分'
    case 'ally':
      return '味方単体'
    case 'allies':
      return '味方全体'
    default:
      return target
  }
}
