/**
 * SettingsScreen - 設定画面コンポーネント
 */

import { useState, useCallback } from 'react'
import { useKeyboard } from '@/hooks/useKeyboard'
import { useGameStore } from '@/stores/gameStore'
import { inputManager } from '@/systems/input/InputManager'
import type { GameAction } from '@/systems/input/InputManager'

export type WindowSkin = 'default' | 'gold' | 'blue'

interface SettingsScreenProps {
  isVisible: boolean
  onClose: () => void
}

type SettingItem =
  | 'bgmVolume'
  | 'seVolume'
  | 'messageSpeed'
  | 'windowSkin'
  | 'fullscreen'
  | 'controls'

const SETTING_ITEMS: SettingItem[] = [
  'bgmVolume',
  'seVolume',
  'messageSpeed',
  'windowSkin',
  'fullscreen',
  'controls',
]

const SETTING_LABELS: Record<SettingItem, string> = {
  bgmVolume: 'BGM音量',
  seVolume: 'SE音量',
  messageSpeed: 'メッセージ速度',
  windowSkin: 'ウィンドウスキン',
  fullscreen: 'フルスクリーン',
  controls: '操作設定',
}

const MESSAGE_SPEED_LABELS: Record<number, string> = {
  1: '遅い',
  2: '普通',
  3: '速い',
}

const WINDOW_SKIN_LABELS: Record<WindowSkin, string> = {
  default: 'Default（暗）',
  gold: 'Gold（暖）',
  blue: 'Blue（涼）',
}

const WINDOW_SKINS: WindowSkin[] = ['default', 'gold', 'blue']

const ACTION_LABELS: Record<GameAction, string> = {
  up: '上',
  down: '下',
  left: '左',
  right: '右',
  confirm: '決定',
  cancel: 'キャンセル',
  menu: 'メニュー',
}

export const SettingsScreen = ({ isVisible, onClose }: SettingsScreenProps) => {
  const settings = useGameStore((state) => state.settings)
  const updateSettings = useGameStore((state) => state.updateSettings)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleAdjust = useCallback(
    (direction: 'left' | 'right') => {
      const item = SETTING_ITEMS[selectedIndex]
      if (!item) return

      const delta = direction === 'right' ? 1 : -1

      switch (item) {
        case 'bgmVolume': {
          const newVol = Math.max(0, Math.min(1, settings.bgmVolume + delta * 0.1))
          updateSettings({ bgmVolume: Math.round(newVol * 10) / 10 })
          break
        }
        case 'seVolume': {
          const newVol = Math.max(0, Math.min(1, settings.seVolume + delta * 0.1))
          updateSettings({ seVolume: Math.round(newVol * 10) / 10 })
          break
        }
        case 'messageSpeed': {
          const newSpeed = Math.max(1, Math.min(3, settings.messageSpeed + delta))
          updateSettings({ messageSpeed: newSpeed })
          break
        }
        case 'windowSkin': {
          const currentSkin = (settings.windowSkin as WindowSkin) || 'default'
          const currentIdx = WINDOW_SKINS.indexOf(currentSkin)
          const newIdx = (currentIdx + delta + WINDOW_SKINS.length) % WINDOW_SKINS.length
          updateSettings({ windowSkin: WINDOW_SKINS[newIdx] })
          break
        }
        case 'fullscreen': {
          toggleFullscreen()
          break
        }
        case 'controls':
          // No left/right adjustment for controls
          break
      }
    },
    [selectedIndex, settings, updateSettings]
  )

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        // Ignore errors (e.g., not in fullscreen)
      })
    } else {
      document.documentElement.requestFullscreen().catch(() => {
        console.warn('[SettingsScreen] Fullscreen request denied')
      })
    }
    // Force re-render by updating a setting
    updateSettings({ fullscreen: !document.fullscreenElement ? true : false })
  }, [updateSettings])

  useKeyboard({
    enabled: isVisible,
    onKeyDown: (key) => {
      switch (key) {
        case 'up':
          setSelectedIndex((prev) =>
            (prev - 1 + SETTING_ITEMS.length) % SETTING_ITEMS.length
          )
          break
        case 'down':
          setSelectedIndex((prev) => (prev + 1) % SETTING_ITEMS.length)
          break
        case 'left':
          handleAdjust('left')
          break
        case 'right':
          handleAdjust('right')
          break
        case 'confirm': {
          const item = SETTING_ITEMS[selectedIndex]
          if (item === 'fullscreen') {
            toggleFullscreen()
          }
          break
        }
        case 'cancel':
          onClose()
          break
      }
    },
  })

  if (!isVisible) return null

  const currentWindowSkin = (settings.windowSkin as WindowSkin) || 'default'
  const isFullscreen = !!document.fullscreenElement

  // Get current keyboard bindings from InputManager
  const bindings = inputManager.getBindings()
  const keyboardBindingsByAction = new Map<GameAction, string[]>()
  for (const [key, action] of Object.entries(bindings.keyboard)) {
    const existing = keyboardBindingsByAction.get(action) || []
    existing.push(key)
    keyboardBindingsByAction.set(action, existing)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-[60]">
      <div className="bg-gray-900 border-4 border-amber-400 rounded-lg w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b-2 border-gray-700 p-4 text-center">
          <h2 className="text-2xl font-bold text-amber-400">設定</h2>
        </div>

        {/* Settings List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {SETTING_ITEMS.map((item, index) => (
            <div
              key={item}
              className={`flex items-center justify-between p-3 rounded transition-all ${
                selectedIndex === index
                  ? 'bg-gray-700 border-2 border-amber-400'
                  : 'bg-gray-800 border-2 border-transparent'
              }`}
            >
              <span className="text-white font-semibold w-40">
                {selectedIndex === index && '▶ '}
                {SETTING_LABELS[item]}
              </span>

              <div className="flex-1 flex items-center justify-end">
                {/* BGM Volume */}
                {item === 'bgmVolume' && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-8">
                      {selectedIndex === index ? '◀' : ''}
                    </span>
                    <div className="w-32 bg-gray-700 rounded-full h-3 relative">
                      <div
                        className="bg-amber-400 h-3 rounded-full transition-all"
                        style={{ width: `${settings.bgmVolume * 100}%` }}
                      />
                    </div>
                    <span className="text-white text-sm w-10 text-right">
                      {Math.round(settings.bgmVolume * 100)}%
                    </span>
                    <span className="text-gray-400 text-sm w-8 text-right">
                      {selectedIndex === index ? '▶' : ''}
                    </span>
                  </div>
                )}

                {/* SE Volume */}
                {item === 'seVolume' && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-8">
                      {selectedIndex === index ? '◀' : ''}
                    </span>
                    <div className="w-32 bg-gray-700 rounded-full h-3 relative">
                      <div
                        className="bg-amber-400 h-3 rounded-full transition-all"
                        style={{ width: `${settings.seVolume * 100}%` }}
                      />
                    </div>
                    <span className="text-white text-sm w-10 text-right">
                      {Math.round(settings.seVolume * 100)}%
                    </span>
                    <span className="text-gray-400 text-sm w-8 text-right">
                      {selectedIndex === index ? '▶' : ''}
                    </span>
                  </div>
                )}

                {/* Message Speed */}
                {item === 'messageSpeed' && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-8">
                      {selectedIndex === index ? '◀' : ''}
                    </span>
                    <span className="text-white text-lg w-20 text-center">
                      {MESSAGE_SPEED_LABELS[settings.messageSpeed] || '普通'}
                    </span>
                    <span className="text-gray-400 text-sm w-8 text-right">
                      {selectedIndex === index ? '▶' : ''}
                    </span>
                  </div>
                )}

                {/* Window Skin */}
                {item === 'windowSkin' && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-8">
                      {selectedIndex === index ? '◀' : ''}
                    </span>
                    <span className="text-white text-lg w-32 text-center">
                      {WINDOW_SKIN_LABELS[currentWindowSkin]}
                    </span>
                    <span className="text-gray-400 text-sm w-8 text-right">
                      {selectedIndex === index ? '▶' : ''}
                    </span>
                  </div>
                )}

                {/* Fullscreen */}
                {item === 'fullscreen' && (
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-lg ${
                        isFullscreen ? 'text-green-400' : 'text-gray-400'
                      }`}
                    >
                      {isFullscreen ? 'ON' : 'OFF'}
                    </span>
                  </div>
                )}

                {/* Controls */}
                {item === 'controls' && (
                  <span className="text-gray-400 text-sm">
                    現在のバインディング表示
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Controls Detail (shown when controls row selected) */}
          {SETTING_ITEMS[selectedIndex] === 'controls' && (
            <div className="bg-gray-800 rounded p-4 mt-2 border border-gray-700">
              <p className="text-amber-400 font-semibold mb-3">キーボード設定</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  ['up', 'down', 'left', 'right', 'confirm', 'cancel', 'menu'] as GameAction[]
                ).map((action) => {
                  const keys = keyboardBindingsByAction.get(action) || []
                  return (
                    <div
                      key={action}
                      className="flex justify-between bg-gray-700 rounded px-3 py-2"
                    >
                      <span className="text-white">{ACTION_LABELS[action]}</span>
                      <span className="text-gray-300 text-sm">
                        {keys
                          .map((k) => k.replace('Key', '').replace('Arrow', ''))
                          .slice(0, 3)
                          .join(' / ')}
                      </span>
                    </div>
                  )
                })}
              </div>

              {inputManager.getGamepadProvider().isConnected() && (
                <>
                  <p className="text-amber-400 font-semibold mt-4 mb-3">ゲームパッド</p>
                  <p className="text-green-400 text-sm">
                    接続中: {inputManager.getGamepadProvider().getGamepadName() || '不明'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(bindings.gamepad).map(([button, action]) => (
                      <div
                        key={button}
                        className="flex justify-between bg-gray-700 rounded px-3 py-2"
                      >
                        <span className="text-white">
                          {ACTION_LABELS[action as GameAction]}
                        </span>
                        <span className="text-gray-300 text-sm">Button {button}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {!inputManager.getGamepadProvider().isConnected() && (
                <p className="text-gray-500 text-sm mt-4">
                  ゲームパッド: 未接続
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 border-t-2 border-gray-700 p-3 text-center text-gray-400 text-sm">
          <p>↑↓: 項目選択 | ←→: 値変更 | Escape: 閉じる</p>
        </div>
      </div>
    </div>
  )
}
