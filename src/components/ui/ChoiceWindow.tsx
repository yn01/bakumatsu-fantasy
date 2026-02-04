/**
 * ChoiceWindow - 選択肢ウィンドウコンポーネント
 */

import { useEffect, useState } from 'react'
import { useKeyboard } from '@/hooks/useKeyboard'
import type { GameKey } from '@/hooks/useKeyboard'

interface ChoiceWindowProps {
  choices: string[]
  isVisible: boolean
  onSelect: (index: number) => void
}

export const ChoiceWindow = ({ choices, isVisible, onSelect }: ChoiceWindowProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // 選択肢が変わったらリセット
  useEffect(() => {
    setSelectedIndex(0)
  }, [choices])

  // キーボード入力
  useKeyboard({
    enabled: isVisible,
    onKeyDown: (key: GameKey) => {
      switch (key) {
        case 'up':
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : choices.length - 1))
          break
        case 'down':
          setSelectedIndex((prev) => (prev < choices.length - 1 ? prev + 1 : 0))
          break
        case 'confirm':
          onSelect(selectedIndex)
          break
        case 'cancel':
          // キャンセルは最後の選択肢を選ぶ（通常は「やめる」など）
          onSelect(choices.length - 1)
          break
      }
    },
  })

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-gray-900 border-4 border-white rounded-lg p-6 w-[400px] pointer-events-auto">
        <div className="space-y-2">
          {choices.map((choice, index) => (
            <div
              key={index}
              className={`
                px-4 py-3 rounded flex items-center
                ${
                  index === selectedIndex
                    ? 'bg-primary text-black font-bold'
                    : 'bg-gray-800 text-white'
                }
              `}
            >
              {index === selectedIndex && (
                <span className="mr-3 text-lg">▶</span>
              )}
              <span className={index === selectedIndex ? '' : 'ml-8'}>
                {choice}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
