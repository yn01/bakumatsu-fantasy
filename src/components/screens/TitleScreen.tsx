/**
 * TitleScreen - タイトル画面コンポーネント
 */

import { useState } from 'react'
import { useKeyboard } from '@/hooks/useKeyboard'
import { SaveLoadWindow } from '@/components/ui/SaveLoadWindow'
import { ScenarioManager } from '@/systems/scenario/ScenarioManager'

const TITLE_OPTIONS = ['New Game', 'Load Game', 'Settings'] as const

export const TitleScreen = () => {
  const [selectedOption, setSelectedOption] = useState(0)
  const [showLoadWindow, setShowLoadWindow] = useState(false)

  // キーボード操作
  useKeyboard({
    enabled: !showLoadWindow,
    onKeyDown: (key) => {
      if (key === 'up') {
        setSelectedOption((prev) => (prev - 1 + TITLE_OPTIONS.length) % TITLE_OPTIONS.length)
      } else if (key === 'down') {
        setSelectedOption((prev) => (prev + 1) % TITLE_OPTIONS.length)
      } else if (key === 'confirm') {
        handleSelect()
      }
    },
  })

  const handleSelect = () => {
    const option = TITLE_OPTIONS[selectedOption]

    switch (option) {
      case 'New Game':
        handleNewGame()
        break
      case 'Load Game':
        handleLoadGame()
        break
      case 'Settings':
        handleSettings()
        break
    }
  }

  const handleNewGame = async () => {
    console.log('[TitleScreen] Starting new game...')

    // ScenarioManagerを使用してNew Game処理を実行
    const scenarioManager = new ScenarioManager()
    await scenarioManager.startNewGame()
  }

  const handleLoadGame = () => {
    console.log('[TitleScreen] Load game selected')
    setShowLoadWindow(true)
  }

  const handleLoadComplete = () => {
    // ロード成功時はシーンがfieldに変わるので、ここでは何もしない
    console.log('[TitleScreen] Load completed')
  }

  const handleSettings = () => {
    console.log('[TitleScreen] Settings selected')
    // TODO: 設定画面実装（Phase 6後半）
    alert('設定画面は未実装です')
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="flex flex-col items-center gap-12">
        {/* タイトルロゴ */}
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-6xl font-bold text-amber-400 drop-shadow-lg">
            幕末ファンタジーRPG
          </h1>
          <p className="text-xl text-gray-300">
            ～龍馬がゆく～
          </p>
        </div>

        {/* メニューオプション */}
        <div className="flex flex-col gap-3">
          {TITLE_OPTIONS.map((option, index) => (
            <div
              key={option}
              className={`
                cursor-pointer rounded-lg px-12 py-3 text-center text-2xl font-semibold
                transition-all duration-200
                ${
                  index === selectedOption
                    ? 'bg-amber-500 text-gray-900 shadow-lg scale-105'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              {index === selectedOption && '▶ '}
              {option}
            </div>
          ))}
        </div>

        {/* 操作説明 */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>↑↓: 選択 | Enter/Space/Z: 決定</p>
        </div>

        {/* バージョン情報 */}
        <div className="absolute bottom-4 right-4 text-xs text-gray-500">
          v1.0.0 Demo
        </div>
      </div>

      {/* ロード画面 */}
      <SaveLoadWindow
        mode="load"
        isVisible={showLoadWindow}
        onClose={() => setShowLoadWindow(false)}
        onComplete={handleLoadComplete}
      />
    </div>
  )
}
