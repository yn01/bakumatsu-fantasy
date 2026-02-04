/**
 * LevelUpWindow - レベルアップ演出UI
 */

import { useKeyboard } from '@/hooks/useKeyboard'
import type { LevelUpResult } from '@/systems/growth/LevelUpManager'
import { skillTreeManager } from '@/systems/growth/SkillTreeManager'

interface LevelUpWindowProps {
  characterName: string
  result: LevelUpResult
  onClose: () => void
}

export const LevelUpWindow = ({ characterName, result, onClose }: LevelUpWindowProps) => {
  // キーボード入力（Enterで次へ）
  useKeyboard({
    enabled: true,
    onKeyDown: (key) => {
      if (key === 'confirm') {
        onClose()
      }
    },
  })

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="bg-gray-900 border-4 border-yellow-400 rounded-lg p-8 w-3/4 max-w-2xl">
        <h2 className="text-4xl font-bold text-yellow-400 mb-6 text-center animate-pulse">
          レベルアップ！
        </h2>

        {/* キャラクター名とレベル変化 */}
        <div className="mb-6 text-center">
          <p className="text-2xl text-white mb-2">{characterName}</p>
          <p className="text-3xl font-bold text-primary">
            Lv.{result.oldLevel} → Lv.{result.newLevel}
          </p>
        </div>

        {/* ステータス増加量表示 */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-3 border-b border-gray-700 pb-2">
            ステータス上昇
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {result.statChanges.maxHp > 0 && (
              <div className="flex justify-between items-center bg-gray-800 p-3 rounded">
                <span className="text-white">最大HP</span>
                <span className="text-green-400 font-bold">+{result.statChanges.maxHp}</span>
              </div>
            )}
            {result.statChanges.maxMp > 0 && (
              <div className="flex justify-between items-center bg-gray-800 p-3 rounded">
                <span className="text-white">最大MP</span>
                <span className="text-green-400 font-bold">+{result.statChanges.maxMp}</span>
              </div>
            )}
            {result.statChanges.attack > 0 && (
              <div className="flex justify-between items-center bg-gray-800 p-3 rounded">
                <span className="text-white">攻撃力</span>
                <span className="text-green-400 font-bold">+{result.statChanges.attack}</span>
              </div>
            )}
            {result.statChanges.defense > 0 && (
              <div className="flex justify-between items-center bg-gray-800 p-3 rounded">
                <span className="text-white">防御力</span>
                <span className="text-green-400 font-bold">+{result.statChanges.defense}</span>
              </div>
            )}
            {result.statChanges.speed > 0 && (
              <div className="flex justify-between items-center bg-gray-800 p-3 rounded">
                <span className="text-white">素早さ</span>
                <span className="text-green-400 font-bold">+{result.statChanges.speed}</span>
              </div>
            )}
            {result.statChanges.luck > 0 && (
              <div className="flex justify-between items-center bg-gray-800 p-3 rounded">
                <span className="text-white">運</span>
                <span className="text-green-400 font-bold">+{result.statChanges.luck}</span>
              </div>
            )}
          </div>
        </div>

        {/* 習得スキル表示 */}
        {result.newSkills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-3 border-b border-gray-700 pb-2">
              習得スキル
            </h3>
            <div className="space-y-2">
              {result.newSkills.map((skillId) => {
                const skill = skillTreeManager.getSkill(skillId)
                return (
                  <div key={skillId} className="bg-blue-900 p-3 rounded">
                    <p className="text-blue-300 font-bold">
                      {skill?.name ?? skillId}
                    </p>
                    {skill?.description && (
                      <p className="text-blue-200 text-sm mt-1">{skill.description}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 操作説明 */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">Enter / Space / Z: 次へ</p>
        </div>
      </div>
    </div>
  )
}
