/**
 * TitleScreen - タイトル画面コンポーネント
 */

import { useState } from 'react'
import { useInput } from '@/hooks/useInput'
import { SaveLoadWindow } from '@/components/ui/SaveLoadWindow'
import { DifficultySelectWindow } from '@/components/ui/DifficultySelectWindow'
import { SettingsScreen } from '@/components/screens/SettingsScreen'
import { ScenarioManager } from '@/systems/scenario/ScenarioManager'
import { useGameStore } from '@/stores/gameStore'
import type { DifficultyLevel } from '@/systems/difficulty/DifficultyManager'

const TITLE_OPTIONS = ['New Game', 'Load Game', 'Settings'] as const

export const TitleScreen = () => {
  const [selectedOption, setSelectedOption] = useState(0)
  const [showLoadWindow, setShowLoadWindow] = useState(false)
  const [showDifficultyWindow, setShowDifficultyWindow] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const setDifficulty = useGameStore((state) => state.setDifficulty)

  // キーボード操作
  useInput({
    enabled: !showLoadWindow && !showDifficultyWindow && !showSettings,
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

  const handleNewGame = () => {
    console.log('[TitleScreen] New game selected, showing difficulty selection...')
    setShowDifficultyWindow(true)
  }

  const handleDifficultySelect = async (difficulty: DifficultyLevel) => {
    console.log(`[TitleScreen] Difficulty selected: ${difficulty}`)
    setDifficulty(difficulty)
    setShowDifficultyWindow(false)

    // ScenarioManagerを使用してNew Game処理を実行
    const scenarioManager = new ScenarioManager()
    await scenarioManager.startNewGame()
  }

  const handleDifficultyCancel = () => {
    console.log('[TitleScreen] Difficulty selection cancelled')
    setShowDifficultyWindow(false)
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
    setShowSettings(true)
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
                    ? 'bg-amber-500 text-gray-900 shadow-lg scale-105 animate-pulse-subtle'
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
          v3.0.0
        </div>
      </div>

      {/* ロード画面 */}
      <SaveLoadWindow
        mode="load"
        isVisible={showLoadWindow}
        onClose={() => setShowLoadWindow(false)}
        onComplete={handleLoadComplete}
      />

      {/* 難易度選択画面 */}
      <DifficultySelectWindow
        isVisible={showDifficultyWindow}
        onSelect={handleDifficultySelect}
        onCancel={handleDifficultyCancel}
      />

      {/* 設定画面 */}
      <SettingsScreen
        isVisible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  )
}
