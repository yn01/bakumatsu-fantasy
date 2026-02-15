/**
 * DifficultySelectWindow - 難易度選択UIコンポーネント
 */

import { useState } from 'react'
import { useKeyboard } from '@/hooks/useKeyboard'
import { DifficultyManager, type DifficultyLevel } from '@/systems/difficulty/DifficultyManager'

interface DifficultySelectWindowProps {
  isVisible: boolean
  onSelect: (difficulty: DifficultyLevel) => void
  onCancel: () => void
}

export const DifficultySelectWindow = ({
  isVisible,
  onSelect,
  onCancel,
}: DifficultySelectWindowProps) => {
  const difficulties = DifficultyManager.getAllSettings()
  const [selectedIndex, setSelectedIndex] = useState(1) // デフォルトはNormal

  useKeyboard({
    enabled: isVisible,
    onKeyDown: (key) => {
      if (key === 'up') {
        setSelectedIndex((prev) => (prev - 1 + difficulties.length) % difficulties.length)
      } else if (key === 'down') {
        setSelectedIndex((prev) => (prev + 1) % difficulties.length)
      } else if (key === 'confirm') {
        const selected = difficulties[selectedIndex]
        if (selected) {
          onSelect(selected.id)
        }
      } else if (key === 'cancel') {
        onCancel()
      }
    },
  })

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="w-[500px] rounded-lg border-4 border-amber-600 bg-gray-800 p-6 shadow-xl">
        {/* タイトル */}
        <h2 className="mb-6 text-center text-2xl font-bold text-amber-400">
          難易度を選択してください
        </h2>

        {/* 難易度リスト */}
        <div className="mb-6 space-y-3">
          {difficulties.map((difficulty, index) => (
            <div
              key={difficulty.id}
              className={`
                cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
                ${
                  index === selectedIndex
                    ? 'border-amber-500 bg-amber-900 bg-opacity-30 scale-105'
                    : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    {index === selectedIndex && (
                      <span className="text-amber-400">▶</span>
                    )}
                    <span className="text-xl font-bold text-amber-300">
                      {difficulty.name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{difficulty.description}</p>
                </div>
              </div>

              {/* 倍率表示 */}
              <div className="mt-2 flex gap-4 text-xs text-gray-400">
                <span>敵HP: {Math.floor(difficulty.enemyHpMultiplier * 100)}%</span>
                <span>敵攻撃力: {Math.floor(difficulty.enemyAtkMultiplier * 100)}%</span>
                <span>経験値: {Math.floor(difficulty.expMultiplier * 100)}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* 操作説明 */}
        <div className="text-center text-sm text-gray-400">
          <p>↑↓: 選択 | Enter/Space/Z: 決定 | Escape/X: 戻る</p>
        </div>
      </div>
    </div>
  )
}
