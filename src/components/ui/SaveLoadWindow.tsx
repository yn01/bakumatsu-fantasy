/**
 * SaveLoadWindow - セーブ/ロードUIコンポーネント
 */

import { useState, useEffect } from 'react'
import { useKeyboard } from '@/hooks/useKeyboard'
import { SaveManager } from '@/utils/saveManager'
import type { SaveData } from '@/types/save'

interface SaveLoadWindowProps {
  mode: 'save' | 'load'
  isVisible: boolean
  onClose: () => void
  onComplete?: () => void
  currentMap?: string
  playerPosition?: { x: number; y: number }
}

export const SaveLoadWindow = ({
  mode,
  isVisible,
  onClose,
  onComplete,
  currentMap,
  playerPosition,
}: SaveLoadWindowProps) => {
  const [selectedSlot, setSelectedSlot] = useState(0)
  const [saveSlots, setSaveSlots] = useState<Array<{ slot: number | 'auto'; data: SaveData | null }>>([])
  const [showConfirm, setShowConfirm] = useState(false)

  // セーブスロット情報を読み込み
  useEffect(() => {
    if (isVisible) {
      const slots: Array<{ slot: number | 'auto'; data: SaveData | null }> = SaveManager.getAllSaveSlots()
      // ロードモードではオートセーブスロットも表示
      if (mode === 'load') {
        const autoSave = SaveManager.getSaveInfo('auto')
        if (autoSave) {
          slots.unshift({ slot: 'auto', data: autoSave })
        }
      }
      setSaveSlots(slots)
    }
  }, [isVisible, mode])

  // キーボード操作
  useKeyboard({
    enabled: isVisible && !showConfirm,
    onKeyDown: (key) => {
      if (key === 'up') {
        setSelectedSlot((prev) => (prev - 1 + saveSlots.length) % saveSlots.length)
      } else if (key === 'down') {
        setSelectedSlot((prev) => (prev + 1) % saveSlots.length)
      } else if (key === 'confirm') {
        handleConfirm()
      } else if (key === 'cancel') {
        onClose()
      }
    },
  })

  // 確認ダイアログの操作
  useKeyboard({
    enabled: showConfirm,
    onKeyDown: (key) => {
      if (key === 'confirm') {
        executeAction()
      } else if (key === 'cancel') {
        setShowConfirm(false)
      }
    },
  })

  const handleConfirm = () => {
    if (mode === 'save') {
      // 上書き確認を表示
      const existingData = saveSlots[selectedSlot]?.data
      if (existingData) {
        setShowConfirm(true)
      } else {
        executeAction()
      }
    } else {
      // ロードの場合は確認不要
      executeAction()
    }
  }

  const executeAction = async () => {
    const slotInfo = saveSlots[selectedSlot]
    if (!slotInfo) return

    const slotId = slotInfo.slot

    if (mode === 'save') {
      const success = SaveManager.save(slotId, currentMap, playerPosition)
      if (success) {
        console.log(`[SaveLoadWindow] Saved to slot ${slotId}`)
        onComplete?.()
        onClose()
      } else {
        alert('セーブに失敗しました')
      }
    } else {
      const success = await SaveManager.load(slotId)
      if (success) {
        console.log(`[SaveLoadWindow] Loaded from slot ${slotId}`)
        onComplete?.()
        onClose()
      } else {
        alert('ロードに失敗しました')
      }
    }
    setShowConfirm(false)
  }

  const formatPlayTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}:${minutes.toString().padStart(2, '0')}`
  }

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-800 rounded-lg p-6 w-[600px] border-2 border-gray-600">
        {/* ヘッダー */}
        <h2 className="text-2xl font-bold mb-4 text-amber-400">
          {mode === 'save' ? 'セーブ' : 'ロード'}
        </h2>

        {/* セーブスロット一覧 */}
        <div className="space-y-3 mb-4">
          {saveSlots.map((slot, index) => (
            <div
              key={slot.slot}
              className={`
                p-4 rounded border-2 cursor-pointer transition-all
                ${
                  index === selectedSlot
                    ? 'border-amber-500 bg-gray-700'
                    : 'border-gray-600 bg-gray-750'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {index === selectedSlot && (
                      <span className="text-amber-400">▶</span>
                    )}
                    <span className="font-bold text-lg">
                      {slot.slot === 'auto' ? 'オートセーブ' : `スロット ${slot.slot + 1}`}
                    </span>
                  </div>

                  {slot.data ? (
                    <div className="text-sm text-gray-300 space-y-1">
                      <div className="flex gap-4">
                        <span>章: {slot.data.chapter}</span>
                        <span>
                          プレイ時間: {formatPlayTime(slot.data.playTime)}
                        </span>
                      </div>
                      <div className="flex gap-4">
                        <span>マップ: {slot.data.currentMap}</span>
                        <span>保存日時: {formatTimestamp(slot.data.timestamp)}</span>
                      </div>
                      <div className="text-gray-400">
                        パーティ: {slot.data.party.members.length}人 | 所持金:{' '}
                        {slot.data.inventory.money}両
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 italic">空きスロット</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 操作説明 */}
        <div className="text-center text-sm text-gray-400">
          <p>↑↓: 選択 | Enter/Space/Z: 決定 | Escape/X: 閉じる</p>
        </div>
      </div>

      {/* 上書き確認ダイアログ */}
      {showConfirm && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-800 rounded-lg p-6 border-2 border-amber-500">
            <p className="text-lg mb-4">
              {saveSlots[selectedSlot]?.slot === 'auto'
                ? 'オートセーブに上書きしますか？'
                : `スロット ${(saveSlots[selectedSlot]?.slot as number) + 1} に上書きしますか？`}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={executeAction}
                className="px-6 py-2 bg-amber-500 text-gray-900 rounded font-bold hover:bg-amber-400"
              >
                はい (Enter)
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded font-bold hover:bg-gray-500"
              >
                いいえ (Escape)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
