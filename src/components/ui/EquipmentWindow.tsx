/**
 * EquipmentWindow - 装備画面UI
 */

import { useState, useEffect } from 'react'
import { useKeyboard } from '@/hooks/useKeyboard'
import type { Character, Stats } from '@/types/character'
import type { Equipment } from '@/types/item'
import { equipmentManager } from '@/systems/growth/EquipmentManager'

interface EquipmentWindowProps {
  character: Character
  onClose: () => void
}

type EquipSlot = 'weapon' | 'armor'

export const EquipmentWindow = ({ character, onClose }: EquipmentWindowProps) => {
  const [selectedSlot, setSelectedSlot] = useState<EquipSlot>('weapon')
  const [availableItems, setAvailableItems] = useState<Equipment[]>([])
  const [selectedItemIndex, setSelectedItemIndex] = useState(0)
  const [message, setMessage] = useState<string>('')
  const [mode, setMode] = useState<'slot' | 'item'>('slot')

  // 装備データを読み込み
  useEffect(() => {
    const loadItems = async () => {
      try {
        await equipmentManager.loadData()
        loadAvailableItems()
      } catch (error) {
        console.error('Failed to load equipment data:', error)
        setMessage('装備データの読み込みに失敗しました')
      }
    }
    loadItems()
  }, [character, selectedSlot])

  // 装備可能アイテムを読み込み
  const loadAvailableItems = () => {
    const items = equipmentManager.getEquippableItems(character, selectedSlot)
    setAvailableItems(items)
    setSelectedItemIndex(0)
  }

  // キーボード入力
  useKeyboard({
    enabled: true,
    onKeyDown: (key) => {
      if (key === 'cancel') {
        if (mode === 'item') {
          setMode('slot')
          setMessage('')
        } else {
          onClose()
        }
        return
      }

      if (mode === 'slot') {
        handleSlotInput(key)
      } else {
        handleItemInput(key)
      }
    },
  })

  // スロット選択モードの入力処理
  const handleSlotInput = (key: string) => {
    if (key === 'up') {
      setSelectedSlot('weapon')
      setMessage('')
    } else if (key === 'down') {
      setSelectedSlot('armor')
      setMessage('')
    } else if (key === 'confirm') {
      setMode('item')
      loadAvailableItems()
      setMessage('')
    }
  }

  // アイテム選択モードの入力処理
  const handleItemInput = (key: string) => {
    if (key === 'up') {
      setSelectedItemIndex((prev) => Math.max(0, prev - 1))
      setMessage('')
    } else if (key === 'down') {
      setSelectedItemIndex((prev) => Math.min(availableItems.length, prev + 1))
      setMessage('')
    } else if (key === 'confirm') {
      handleEquip()
    }
  }

  // 装備実行
  const handleEquip = () => {
    // 装備を外す（インデックス0）
    if (selectedItemIndex === 0) {
      const currentItem = character.equipment[selectedSlot]
      if (!currentItem) {
        setMessage('装備されていません')
        return
      }

      const result = equipmentManager.unequipItem(character, selectedSlot)
      if (result.success) {
        setMessage(`「${result.itemName}」を外しました`)
        setTimeout(() => {
          setMode('slot')
          setMessage('')
        }, 1000)
      } else {
        setMessage(result.error ?? '装備を外せませんでした')
      }
      return
    }

    // 装備を変更
    const item = availableItems[selectedItemIndex - 1]
    if (!item) return

    const result = equipmentManager.equipItem(character, item.id)
    if (result.success) {
      setMessage(`「${result.itemName}」を装備しました`)
      setTimeout(() => {
        setMode('slot')
        setMessage('')
      }, 1000)
    } else {
      setMessage(result.error ?? '装備できませんでした')
    }
  }

  // 現在の装備情報を取得
  const getCurrentEquipment = (slot: EquipSlot): Equipment | null => {
    const itemId = character.equipment[slot]
    if (!itemId) return null
    return equipmentManager.getEquipment(itemId) ?? null
  }

  // 装備込みステータスを取得
  const equippedStats = equipmentManager.calculateEquippedStats(character)

  // 選択中のアイテムでのステータス変化を計算
  const getStatComparison = (): Partial<Stats> | null => {
    if (mode !== 'item' || selectedItemIndex === 0) return null
    const item = availableItems[selectedItemIndex - 1]
    if (!item?.equipStats) return null

    const currentEquip = getCurrentEquipment(selectedSlot)
    const currentStats = currentEquip?.equipStats ?? {}

    const diff: Partial<Stats> = {}
    const keys: (keyof Stats)[] = ['maxHp', 'maxMp', 'attack', 'defense', 'speed', 'luck']

    keys.forEach((key) => {
      const newValue = item.equipStats?.[key] ?? 0
      const oldValue = currentStats[key] ?? 0
      const change = newValue - oldValue
      if (change !== 0) {
        diff[key] = change
      }
    })

    return Object.keys(diff).length > 0 ? diff : null
  }

  const statComparison = getStatComparison()

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="bg-gray-900 border-4 border-purple-400 rounded-lg p-8 w-11/12 max-w-4xl h-5/6 overflow-y-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-purple-400 mb-2">
            {character.name} - 装備
          </h2>
          <p className="text-white text-sm">Lv.{character.level}</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* 左側: 現在の装備 */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
              現在の装備
            </h3>

            {/* 武器スロット */}
            <div
              className={`p-4 rounded border-2 mb-3 ${
                mode === 'slot' && selectedSlot === 'weapon'
                  ? 'border-white bg-gray-800'
                  : 'border-gray-700 bg-gray-900'
              }`}
            >
              <p className="text-yellow-400 font-bold mb-2">武器</p>
              {getCurrentEquipment('weapon') ? (
                <div>
                  <p className="text-white">{getCurrentEquipment('weapon')!.name}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {getCurrentEquipment('weapon')!.description}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">装備なし</p>
              )}
            </div>

            {/* 防具スロット */}
            <div
              className={`p-4 rounded border-2 ${
                mode === 'slot' && selectedSlot === 'armor'
                  ? 'border-white bg-gray-800'
                  : 'border-gray-700 bg-gray-900'
              }`}
            >
              <p className="text-blue-400 font-bold mb-2">防具</p>
              {getCurrentEquipment('armor') ? (
                <div>
                  <p className="text-white">{getCurrentEquipment('armor')!.name}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {getCurrentEquipment('armor')!.description}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500">装備なし</p>
              )}
            </div>

            {/* ステータス表示 */}
            <div className="mt-6">
              <h3 className="text-lg font-bold text-white mb-3">装備込みステータス</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between bg-gray-800 p-2 rounded">
                  <span className="text-gray-300">HP</span>
                  <span className="text-white">{equippedStats.maxHp}</span>
                </div>
                <div className="flex justify-between bg-gray-800 p-2 rounded">
                  <span className="text-gray-300">MP</span>
                  <span className="text-white">{equippedStats.maxMp}</span>
                </div>
                <div className="flex justify-between bg-gray-800 p-2 rounded">
                  <span className="text-gray-300">攻撃力</span>
                  <span className="text-white">{equippedStats.attack}</span>
                </div>
                <div className="flex justify-between bg-gray-800 p-2 rounded">
                  <span className="text-gray-300">防御力</span>
                  <span className="text-white">{equippedStats.defense}</span>
                </div>
                <div className="flex justify-between bg-gray-800 p-2 rounded">
                  <span className="text-gray-300">素早さ</span>
                  <span className="text-white">{equippedStats.speed}</span>
                </div>
                <div className="flex justify-between bg-gray-800 p-2 rounded">
                  <span className="text-gray-300">運</span>
                  <span className="text-white">{equippedStats.luck}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右側: 装備可能アイテム */}
          {mode === 'item' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">
                {selectedSlot === 'weapon' ? '武器' : '防具'}を選択
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {/* 装備を外すオプション */}
                <div
                  className={`p-3 rounded border-2 ${
                    selectedItemIndex === 0
                      ? 'border-white bg-gray-800'
                      : 'border-gray-700 bg-gray-900'
                  }`}
                >
                  <p className="text-white font-bold">装備を外す</p>
                </div>

                {/* 装備アイテムリスト */}
                {availableItems.map((item, index) => {
                  const isSelected = selectedItemIndex === index + 1
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded border-2 ${
                        isSelected
                          ? 'border-white bg-gray-800'
                          : 'border-gray-700 bg-gray-900'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-white font-bold">{item.name}</p>
                        {item.requiredLevel && (
                          <span className="text-xs text-gray-400">
                            Lv.{item.requiredLevel}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{item.description}</p>

                      {/* ステータス */}
                      {item.equipStats && (
                        <div className="flex gap-2 text-xs">
                          {Object.entries(item.equipStats).map(([key, value]) => {
                            const label = getStatLabel(key)
                            const sign = value > 0 ? '+' : ''
                            return (
                              <span key={key} className="text-green-400">
                                {label}{sign}{value}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* ステータス比較 */}
              {statComparison && (
                <div className="mt-4 p-3 bg-blue-900 rounded">
                  <p className="text-blue-200 font-bold mb-2">ステータス変化</p>
                  <div className="flex gap-3 text-sm">
                    {Object.entries(statComparison).map(([key, value]) => {
                      const label = getStatLabel(key)
                      const sign = value > 0 ? '+' : ''
                      const color = value > 0 ? 'text-green-400' : 'text-red-400'
                      return (
                        <span key={key} className={color}>
                          {label}{sign}{value}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* メッセージ */}
        {message && (
          <div className="mt-4 p-3 bg-yellow-900 border border-yellow-600 rounded text-yellow-200 text-center">
            {message}
          </div>
        )}

        {/* 操作説明 */}
        <div className="mt-6 text-center text-gray-400 text-sm space-y-1">
          {mode === 'slot' ? (
            <p>↑↓: スロット選択 | Enter / Space / Z: アイテム選択へ | Escape / X: 閉じる</p>
          ) : (
            <p>↑↓: アイテム選択 | Enter / Space / Z: 装備 | Escape / X: 戻る</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ステータスラベル取得
function getStatLabel(key: string): string {
  switch (key) {
    case 'maxHp':
    case 'hp':
      return 'HP'
    case 'maxMp':
    case 'mp':
      return 'MP'
    case 'attack':
      return '攻撃'
    case 'defense':
      return '防御'
    case 'speed':
      return '速度'
    case 'luck':
      return '運'
    default:
      return key
  }
}
