/**
 * TargetSelector - ターゲット選択UI
 */

import { useEffect, useState } from 'react'
import type { BattleParticipant } from '@/types/battle'

interface TargetSelectorProps {
  /** 表示中フラグ */
  isVisible: boolean
  /** 選択可能なターゲット配列 */
  targets: BattleParticipant[]
  /** ターゲット種別（敵/味方） */
  targetType: 'enemy' | 'ally'
  /** ターゲット選択コールバック */
  onSelect: (targetId: string) => void
  /** キャンセルコールバック */
  onCancel: () => void
}

export const TargetSelector = ({
  isVisible,
  targets,
  targetType,
  onSelect,
  onCancel,
}: TargetSelectorProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // 生存しているターゲットのみフィルタ
  const aliveTargets = targets.filter((t) => !t.state.includes('dead'))

  // リセット
  useEffect(() => {
    if (isVisible) {
      setSelectedIndex(0)
    }
  }, [isVisible])

  // キーボード入力
  useEffect(() => {
    if (!isVisible || aliveTargets.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 左キー
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : aliveTargets.length - 1))
      }
      // 右キー
      else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev < aliveTargets.length - 1 ? prev + 1 : 0))
      }
      // 決定キー（Enter, Space, Z）
      else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z') {
        e.preventDefault()
        const selected = aliveTargets[selectedIndex]
        if (selected) {
          onSelect(selected.character.id)
        }
      }
      // キャンセルキー（Escape, X）
      else if (e.key === 'Escape' || e.key === 'x') {
        e.preventDefault()
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, selectedIndex, aliveTargets, onSelect, onCancel])

  if (!isVisible || aliveTargets.length === 0) return null

  return (
    <div className="fixed top-4 right-4 w-80 bg-gray-900 border-4 border-primary rounded-lg p-4 shadow-2xl">
      {/* タイトル */}
      <div className="mb-3">
        <span className="inline-block bg-primary text-white px-3 py-1 rounded text-sm font-bold">
          {targetType === 'enemy' ? '敵を選択' : '味方を選択'}
        </span>
      </div>

      {/* ターゲットリスト */}
      <div className="space-y-2">
        {aliveTargets.map((target, index) => {
          const isSelected = index === selectedIndex
          const hpPercent = (target.currentHp / target.character.stats.maxHp) * 100

          return (
            <div
              key={target.character.id}
              className={`p-3 rounded border-2 transition-colors cursor-pointer ${
                isSelected
                  ? 'border-primary bg-primary bg-opacity-20'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
              onClick={() => onSelect(target.character.id)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {/* 名前 */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`font-bold ${isSelected ? 'text-primary' : 'text-white'}`}
                >
                  {isSelected && '▶ '}
                  {target.character.name}
                </span>
                <span className="text-xs text-gray-400">Lv.{target.character.level}</span>
              </div>

              {/* HPバー */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">HP</span>
                  <span className="text-white">
                    {target.currentHp} / {target.character.stats.maxHp}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      hpPercent > 50
                        ? 'bg-green-500'
                        : hpPercent > 25
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </div>

              {/* 状態異常表示 */}
              {target.state.length > 1 && (
                <div className="mt-2 flex gap-1">
                  {target.state
                    .filter((s) => s !== 'normal')
                    .map((state) => (
                      <span
                        key={state}
                        className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded"
                      >
                        {state}
                      </span>
                    ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 操作ヒント */}
      <div className="mt-3 text-xs text-gray-400 text-center">
        <span>←→: 選択 / Enter: 決定 / Escape: 戻る</span>
      </div>
    </div>
  )
}
