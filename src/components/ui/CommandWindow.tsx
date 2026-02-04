/**
 * CommandWindow - バトルコマンド選択ウィンドウ
 */

import { useEffect, useState } from 'react'
import type { BattleCommand } from '@/types/battle'

interface CommandWindowProps {
  /** 表示中フラグ */
  isVisible: boolean
  /** コマンド選択コールバック */
  onSelect: (command: BattleCommand) => void
  /** キャンセルコールバック */
  onCancel?: () => void
}

const COMMANDS: { command: BattleCommand; label: string; icon: string }[] = [
  { command: 'attack', label: '攻撃', icon: '⚔️' },
  { command: 'skill', label: '技', icon: '✨' },
  { command: 'defend', label: '防御', icon: '🛡️' },
  { command: 'item', label: 'アイテム', icon: '💊' },
]

export const CommandWindow = ({ isVisible, onSelect, onCancel }: CommandWindowProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // リセット
  useEffect(() => {
    if (isVisible) {
      setSelectedIndex(0)
    }
  }, [isVisible])

  // キーボード入力
  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 上キー
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : COMMANDS.length - 1))
      }
      // 下キー
      else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev < COMMANDS.length - 1 ? prev + 1 : 0))
      }
      // 決定キー（Enter, Space, Z）
      else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z') {
        e.preventDefault()
        const selected = COMMANDS[selectedIndex]
        if (selected) {
          onSelect(selected.command)
        }
      }
      // キャンセルキー（Escape, X）
      else if (e.key === 'Escape' || e.key === 'x') {
        e.preventDefault()
        onCancel?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, selectedIndex, onSelect, onCancel])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 w-64 bg-gray-900 border-4 border-primary rounded-lg p-4 shadow-2xl">
      {/* タイトル */}
      <div className="mb-3">
        <span className="inline-block bg-primary text-white px-3 py-1 rounded text-sm font-bold">
          コマンド
        </span>
      </div>

      {/* コマンドリスト */}
      <div className="space-y-2">
        {COMMANDS.map((cmd, index) => (
          <button
            key={cmd.command}
            className={`w-full text-left px-4 py-2 rounded transition-colors ${
              index === selectedIndex
                ? 'bg-primary text-white font-bold'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => onSelect(cmd.command)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className="mr-2">{cmd.icon}</span>
            {cmd.label}
          </button>
        ))}
      </div>

      {/* 操作ヒント */}
      <div className="mt-3 text-xs text-gray-400 text-center">
        <span>↑↓: 選択 / Enter: 決定 / Escape: キャンセル</span>
      </div>
    </div>
  )
}
