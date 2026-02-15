/**
 * AchievementWindow - 実績表示UI
 */

import { useEffect, useState } from 'react'
import { useAchievementStore } from '@/stores/achievementStore'
import { achievementManager, type Achievement } from '@/systems/achievement/AchievementManager'

interface AchievementWindowProps {
  onClose: () => void
}

export const AchievementWindow = ({ onClose }: AchievementWindowProps) => {
  const { unlockedAchievements } = useAchievementStore()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [achievements, setAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    // 実績データ読み込み
    const loadAchievements = async () => {
      await achievementManager.loadData()
      setAchievements(achievementManager.getAllAchievements())
    }
    loadAchievements()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(0, prev - 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(achievements.length - 1, prev + 1))
          break
        case 'Escape':
        case 'x':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [achievements.length, onClose])

  const selectedAchievement = achievements[selectedIndex]
  const isUnlocked = selectedAchievement
    ? unlockedAchievements.includes(selectedAchievement.id)
    : false

  const unlockedCount = achievements.filter((a) => unlockedAchievements.includes(a.id)).length
  const completionRate =
    achievements.length > 0 ? ((unlockedCount / achievements.length) * 100).toFixed(1) : '0'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-4 border-yellow-600 rounded-lg w-[90%] h-[90%] max-w-7xl max-h-[800px] flex flex-col">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-yellow-700 to-yellow-600 p-4 rounded-t-md">
          <h2 className="text-3xl font-bold text-white text-center">実績</h2>
          <p className="text-center text-yellow-100 text-sm mt-1">
            達成率: {unlockedCount} / {achievements.length} ({completionRate}%)
          </p>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 左側: 実績リスト */}
          <div className="w-1/2 border-r border-gray-700 overflow-y-auto">
            <div className="p-4">
              {achievements.map((achievement, index) => {
                const unlocked = unlockedAchievements.includes(achievement.id)
                const selected = index === selectedIndex

                return (
                  <div
                    key={achievement.id}
                    className={`
                      p-3 mb-2 rounded cursor-pointer transition-all
                      ${selected ? 'bg-yellow-600 border-2 border-yellow-400' : 'bg-gray-800 border-2 border-gray-700'}
                      ${unlocked ? '' : 'opacity-60'}
                    `}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-center gap-3">
                      {/* アイコン */}
                      <div
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center text-xl
                          ${unlocked ? 'bg-yellow-500 text-white' : 'bg-gray-600 text-gray-400'}
                        `}
                      >
                        {unlocked ? '✓' : '?'}
                      </div>

                      {/* 実績名 */}
                      <div className="flex-1">
                        <h3 className={`font-bold ${selected ? 'text-white' : 'text-gray-200'}`}>
                          {unlocked ? achievement.name : '???'}
                        </h3>
                        <p className={`text-xs ${selected ? 'text-yellow-100' : 'text-gray-400'}`}>
                          {unlocked ? achievement.description : '未解除'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 右側: 実績詳細 */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {selectedAchievement ? (
              <div>
                <div className="mb-6">
                  <div
                    className={`
                      w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl
                      ${isUnlocked ? 'bg-yellow-500 text-white' : 'bg-gray-600 text-gray-400'}
                    `}
                  >
                    {isUnlocked ? '✓' : '?'}
                  </div>

                  <h2 className="text-2xl font-bold text-white text-center mb-2">
                    {isUnlocked ? selectedAchievement.name : '???'}
                  </h2>

                  <p className="text-gray-300 text-center mb-4">
                    {isUnlocked ? selectedAchievement.description : 'この実績はまだ解除されていません'}
                  </p>

                  {isUnlocked && (
                    <div className="bg-green-900 border-2 border-green-600 rounded p-3 text-center">
                      <p className="text-green-200 font-bold">✅ 解除済み</p>
                    </div>
                  )}

                  {!isUnlocked && (
                    <div className="bg-gray-800 border-2 border-gray-600 rounded p-3">
                      <p className="text-gray-400 text-sm text-center">
                        解除条件: {getConditionText(selectedAchievement.condition)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-20">
                <p>実績を選択してください</p>
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="bg-gray-800 p-3 rounded-b-md text-center text-sm text-gray-400">
          <p>↑↓: 選択 | Escape/X: 閉じる</p>
        </div>
      </div>
    </div>
  )
}

/**
 * 条件テキスト変換
 */
function getConditionText(condition: { type: string; value: string | number }): string {
  switch (condition.type) {
    case 'flag':
      return `ストーリーフラグ: ${condition.value}`
    case 'level':
      return `レベル${condition.value}に到達`
    case 'gold':
      return `${condition.value}両を所持`
    case 'party_size':
      return `パーティメンバー${condition.value}人`
    case 'map_count':
      return `${condition.value}箇所のマップを訪問`
    case 'skill_count':
      return `${condition.value}個のスキルを習得`
    case 'item':
      return `アイテム「${condition.value}」を入手`
    case 'item_count':
      return `${condition.value}個のアイテムを入手`
    case 'battle_win':
      return `${condition.value}回のバトルに勝利`
    case 'max_damage':
      return `${condition.value}以上のダメージを与える`
    case 'boss_count':
      return `${condition.value}体のボスを倒す`
    case 'weapon_count':
      return `${condition.value}種類の武器を入手`
    case 'armor_count':
      return `${condition.value}種類の防具を入手`
    case 'playtime':
      return `プレイ時間${Math.floor((condition.value as number) / 3600)}時間以内`
    case 'no_damage_win':
      return 'ノーダメージでバトルに勝利'
    default:
      return '???'
  }
}
