/**
 * ShopScreen - ショップ画面
 */

import { useState, useEffect } from 'react'
import { useKeyboard } from '@/hooks/useKeyboard'
import { usePartyStore } from '@/stores/partyStore'
import type { Item } from '@/types/item'
import { shopManager } from '@/systems/growth/ShopManager'
import { equipmentManager } from '@/systems/growth/EquipmentManager'

interface ShopScreenProps {
  shopType: 'weapon' | 'armor' | 'item' | 'all'
  shopId?: string
  onClose: () => void
}

type ShopMode = 'buy' | 'sell'

export const ShopScreen = ({ shopType, shopId, onClose }: ShopScreenProps) => {
  const { gold, items: partyItems } = usePartyStore()
  const [mode, setMode] = useState<ShopMode>('buy')
  const [shopItems, setShopItems] = useState<Item[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [message, setMessage] = useState<string>('')

  // ショップアイテムを読み込み
  useEffect(() => {
    const loadShopItems = async () => {
      try {
        await equipmentManager.loadData()
        await shopManager.loadShopData()

        let items: Item[]
        if (shopId) {
          // shopIdが指定されている場合はそのショップの商品を取得
          items = shopManager.getShopItemsByShopId(shopId)
        } else {
          // shopTypeで取得（従来の方式）
          items = shopManager.getShopItems(shopType)
        }
        setShopItems(items)
      } catch (error) {
        console.error('Failed to load shop items:', error)
        setMessage('商品データの読み込みに失敗しました')
      }
    }
    loadShopItems()
  }, [shopType, shopId])

  // モード切り替え時にリセット
  useEffect(() => {
    setSelectedIndex(0)
    setMessage('')
  }, [mode])

  // 現在のアイテムリスト
  const currentItems =
    mode === 'buy'
      ? shopItems
      : partyItems
          .map((itemId) => equipmentManager.getItem(itemId))
          .filter((item): item is Item => item !== undefined)

  // キーボード入力
  useKeyboard({
    enabled: true,
    onKeyDown: (key) => {
      if (key === 'cancel') {
        onClose()
        return
      }

      if (key === 'up') {
        setSelectedIndex((prev) => Math.max(0, prev - 1))
        setMessage('')
      } else if (key === 'down') {
        setSelectedIndex((prev) => Math.min(currentItems.length - 1, prev + 1))
        setMessage('')
      } else if (key === 'left') {
        setMode('buy')
      } else if (key === 'right') {
        setMode('sell')
      } else if (key === 'confirm') {
        handleTransaction()
      }
    },
  })

  // 取引実行
  const handleTransaction = () => {
    const selectedItem = currentItems[selectedIndex]
    if (!selectedItem) return

    if (mode === 'buy') {
      // 購入
      const result = shopManager.purchaseItem(selectedItem.id)
      if (result.success) {
        setMessage(`「${result.itemName}」を購入しました`)
      } else {
        setMessage(result.error ?? '購入できませんでした')
      }
    } else {
      // 売却
      const result = shopManager.sellItem(selectedItem.id)
      if (result.success) {
        setMessage(`「${result.itemName}」を${result.price}両で売却しました`)
      } else {
        setMessage(result.error ?? '売却できませんでした')
      }
    }
  }

  // ショップタイプ名を取得
  const getShopTypeName = (): string => {
    switch (shopType) {
      case 'weapon':
        return '武器屋'
      case 'armor':
        return '防具屋'
      case 'item':
        return '道具屋'
      case 'all':
        return '雑貨屋'
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
      <div className="bg-gray-900 border-4 border-yellow-400 rounded-lg w-11/12 max-w-4xl h-5/6 overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="bg-gray-800 border-b-2 border-gray-700 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-yellow-400">{getShopTypeName()}</h2>
            <div className="text-right">
              <p className="text-gray-400 text-sm">所持金</p>
              <p className="text-2xl font-bold text-yellow-300">{gold} 両</p>
            </div>
          </div>
        </div>

        {/* モード切り替え */}
        <div className="bg-gray-800 border-b-2 border-gray-700 p-2">
          <div className="flex gap-2 justify-center">
            <button
              className={`px-6 py-2 rounded transition-all ${
                mode === 'buy'
                  ? 'bg-yellow-500 text-white font-bold scale-105'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              買う
            </button>
            <button
              className={`px-6 py-2 rounded transition-all ${
                mode === 'sell'
                  ? 'bg-yellow-500 text-white font-bold scale-105'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              売る
            </button>
          </div>
        </div>

        {/* アイテムリスト */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentItems.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              {mode === 'buy' ? '商品がありません' : '売却できるアイテムがありません'}
            </div>
          ) : (
            <div className="space-y-3">
              {currentItems.map((item, index) => {
                const isSelected = selectedIndex === index
                const price = mode === 'buy' ? item.price : shopManager.getSellPrice(item.id)
                const canAfford = mode === 'buy' ? gold >= item.price : true

                return (
                  <div
                    key={`${item.id}-${index}`}
                    className={`p-4 rounded border-2 transition-all ${
                      isSelected
                        ? 'border-white bg-gray-800 scale-105'
                        : 'border-gray-700 bg-gray-900'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-white">{item.name}</h3>
                          {/* アイテムタイプバッジ */}
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              item.type === 'weapon'
                                ? 'bg-yellow-700 text-yellow-200'
                                : item.type === 'armor'
                                  ? 'bg-blue-700 text-blue-200'
                                  : 'bg-green-700 text-green-200'
                            }`}
                          >
                            {item.type === 'weapon'
                              ? '武器'
                              : item.type === 'armor'
                                ? '防具'
                                : 'アイテム'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p
                          className={`text-2xl font-bold ${
                            canAfford ? 'text-yellow-300' : 'text-red-400'
                          }`}
                        >
                          {price} 両
                        </p>
                        {mode === 'buy' && !canAfford && (
                          <p className="text-xs text-red-400 mt-1">ゴールド不足</p>
                        )}
                        {mode === 'sell' && (
                          <p className="text-xs text-gray-500 mt-1">
                            (購入価格: {item.price}両)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* ステータス効果 */}
                    {item.equipStats && (
                      <div className="flex gap-3 text-sm mt-2">
                        {Object.entries(item.equipStats).map(([key, value]) => {
                          const label = getStatLabel(key)
                          const sign = value > 0 ? '+' : ''
                          return (
                            <span key={key} className="text-green-400">
                              {label}
                              {sign}
                              {value}
                            </span>
                          )
                        })}
                      </div>
                    )}

                    {/* 消費アイテム効果 */}
                    {item.effect && (
                      <div className="text-sm mt-2">
                        <span className="text-blue-400">
                          {getEffectLabel(item.effect.type)}: {item.effect.value}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* メッセージ */}
        {message && (
          <div className="p-3 bg-yellow-900 border-t border-yellow-600 text-yellow-200 text-center">
            {message}
          </div>
        )}

        {/* 操作説明 */}
        <div className="bg-gray-800 border-t-2 border-gray-700 p-3 text-center text-gray-400 text-sm">
          <p>↑↓: 選択 | ←→: モード切替 | Enter / Space / Z: 取引 | Escape / X: 閉じる</p>
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

// 効果ラベル取得
function getEffectLabel(effectType: string): string {
  switch (effectType) {
    case 'heal_hp':
      return 'HP回復'
    case 'heal_mp':
      return 'MP回復'
    case 'cure_poison':
      return '毒治療'
    case 'cure_paralysis':
      return '麻痺治療'
    case 'cure_all':
      return '状態異常治療'
    case 'revive':
      return '蘇生'
    default:
      return effectType
  }
}
