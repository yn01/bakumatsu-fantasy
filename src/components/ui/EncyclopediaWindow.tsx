/**
 * EncyclopediaWindow - 図鑑表示UI
 */

import { useEffect, useState } from 'react'
import { useEncyclopediaStore } from '@/stores/encyclopediaStore'

type TabType = 'enemies' | 'items' | 'skills'

interface EncyclopediaWindowProps {
  onClose: () => void
}

interface Enemy {
  id: string
  name: string
  class: string
  level: number
  stats: {
    maxHp: number
    maxMp: number
    attack: number
    defense: number
    speed: number
  }
  expReward: number
  goldReward: number
}

interface Item {
  id: string
  name: string
  type: string
  description: string
  price?: number
}

interface Skill {
  id: string
  name: string
  description: string
  cost: number
  power?: number
}

export const EncyclopediaWindow = ({ onClose }: EncyclopediaWindowProps) => {
  const { discoveredEnemies, discoveredItems, discoveredSkills } = useEncyclopediaStore()
  const [currentTab, setCurrentTab] = useState<TabType>('enemies')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [skills, setSkills] = useState<Skill[]>([])

  useEffect(() => {
    // データ読み込み
    const loadData = async () => {
      try {
        const basePath = import.meta.env.BASE_URL || '/'

        // 敵データ読み込み
        const enemiesRes = await fetch(`${basePath}data/enemies.json`)
        if (enemiesRes.ok) {
          const enemiesData = await enemiesRes.json()
          setEnemies(enemiesData)
        }

        // アイテムデータ読み込み
        const itemsRes = await fetch(`${basePath}data/items.json`)
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json()
          setItems(itemsData.items || [])
        }

        // スキルデータ読み込み
        const skillsRes = await fetch(`${basePath}data/skills.json`)
        if (skillsRes.ok) {
          const skillsData = await skillsRes.json()
          setSkills(skillsData.skills || [])
        }
      } catch (error) {
        console.error('[EncyclopediaWindow] Failed to load data:', error)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    // タブ切り替え時に選択インデックスをリセット
    setSelectedIndex(0)
  }, [currentTab])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const maxIndex = getCurrentList().length - 1

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          setCurrentTab((prev) => {
            if (prev === 'enemies') return 'skills'
            if (prev === 'items') return 'enemies'
            return 'items'
          })
          break
        case 'ArrowRight':
          e.preventDefault()
          setCurrentTab((prev) => {
            if (prev === 'enemies') return 'items'
            if (prev === 'items') return 'skills'
            return 'enemies'
          })
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(0, prev - 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(maxIndex, prev + 1))
          break
        case 'Escape':
        case 'x':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentTab, enemies.length, items.length, skills.length, onClose])

  const getCurrentList = () => {
    if (currentTab === 'enemies') return enemies
    if (currentTab === 'items') return items
    return skills
  }

  const getCurrentDiscovered = () => {
    if (currentTab === 'enemies') return discoveredEnemies
    if (currentTab === 'items') return discoveredItems
    return discoveredSkills
  }

  const currentList = getCurrentList()
  const currentDiscovered = getCurrentDiscovered()
  const selectedEntry = currentList[selectedIndex]
  const isDiscovered = selectedEntry ? currentDiscovered.includes(selectedEntry.id) : false

  const discoveredCount = currentList.filter((entry) => currentDiscovered.includes(entry.id)).length
  const completionRate =
    currentList.length > 0 ? ((discoveredCount / currentList.length) * 100).toFixed(1) : '0'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 border-4 border-blue-600 rounded-lg w-[90%] h-[90%] max-w-7xl max-h-[800px] flex flex-col">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-4 rounded-t-md">
          <h2 className="text-3xl font-bold text-white text-center">図鑑</h2>
          <p className="text-center text-blue-100 text-sm mt-1">
            発見率: {discoveredCount} / {currentList.length} ({completionRate}%)
          </p>
        </div>

        {/* タブ */}
        <div className="flex border-b border-gray-700">
          <button
            className={`flex-1 py-3 font-bold transition-all ${
              currentTab === 'enemies'
                ? 'bg-blue-600 text-white border-b-4 border-blue-400'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            onClick={() => setCurrentTab('enemies')}
          >
            敵 ({enemies.filter((e) => discoveredEnemies.includes(e.id)).length}/{enemies.length})
          </button>
          <button
            className={`flex-1 py-3 font-bold transition-all ${
              currentTab === 'items'
                ? 'bg-blue-600 text-white border-b-4 border-blue-400'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            onClick={() => setCurrentTab('items')}
          >
            アイテム ({items.filter((i) => discoveredItems.includes(i.id)).length}/{items.length})
          </button>
          <button
            className={`flex-1 py-3 font-bold transition-all ${
              currentTab === 'skills'
                ? 'bg-blue-600 text-white border-b-4 border-blue-400'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            onClick={() => setCurrentTab('skills')}
          >
            スキル ({skills.filter((s) => discoveredSkills.includes(s.id)).length}/{skills.length})
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 左側: エントリーリスト */}
          <div className="w-1/2 border-r border-gray-700 overflow-y-auto">
            <div className="p-4">
              {currentList.map((entry, index) => {
                const discovered = currentDiscovered.includes(entry.id)
                const selected = index === selectedIndex

                return (
                  <div
                    key={entry.id}
                    className={`
                      p-3 mb-2 rounded cursor-pointer transition-all
                      ${selected ? 'bg-blue-600 border-2 border-blue-400' : 'bg-gray-800 border-2 border-gray-700'}
                      ${discovered ? '' : 'opacity-60'}
                    `}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <h3 className={`font-bold ${selected ? 'text-white' : 'text-gray-200'}`}>
                      {discovered ? entry.name : '???'}
                    </h3>
                    <p className={`text-xs ${selected ? 'text-blue-100' : 'text-gray-400'}`}>
                      {discovered
                        ? currentTab === 'enemies'
                          ? `Lv.${(entry as Enemy).level} - ${(entry as Enemy).class}`
                          : currentTab === 'items'
                            ? (entry as Item).type
                            : `消費MP: ${(entry as Skill).cost}`
                        : '未発見'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 右側: エントリー詳細 */}
          <div className="w-1/2 p-6 overflow-y-auto">
            {selectedEntry && isDiscovered ? (
              <div>
                {currentTab === 'enemies' && (
                  <EnemyDetail enemy={selectedEntry as Enemy} />
                )}
                {currentTab === 'items' && <ItemDetail item={selectedEntry as Item} />}
                {currentTab === 'skills' && <SkillDetail skill={selectedEntry as Skill} />}
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-20">
                <div className="text-6xl mb-4">?</div>
                <p>このエントリーはまだ発見されていません</p>
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="bg-gray-800 p-3 rounded-b-md text-center text-sm text-gray-400">
          <p>←→: タブ切替 | ↑↓: 選択 | Escape/X: 閉じる</p>
        </div>
      </div>
    </div>
  )
}

/**
 * 敵詳細表示
 */
function EnemyDetail({ enemy }: { enemy: Enemy }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">{enemy.name}</h2>

      <div className="space-y-4">
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-lg font-bold text-blue-300 mb-2">基本情報</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">クラス:</span>{' '}
              <span className="text-white">{enemy.class}</span>
            </div>
            <div>
              <span className="text-gray-400">レベル:</span>{' '}
              <span className="text-yellow-300">{enemy.level}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-lg font-bold text-blue-300 mb-2">ステータス</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">HP:</span>{' '}
              <span className="text-red-400">{enemy.stats.maxHp}</span>
            </div>
            <div>
              <span className="text-gray-400">MP:</span>{' '}
              <span className="text-blue-400">{enemy.stats.maxMp}</span>
            </div>
            <div>
              <span className="text-gray-400">攻撃:</span>{' '}
              <span className="text-orange-400">{enemy.stats.attack}</span>
            </div>
            <div>
              <span className="text-gray-400">防御:</span>{' '}
              <span className="text-green-400">{enemy.stats.defense}</span>
            </div>
            <div>
              <span className="text-gray-400">素早さ:</span>{' '}
              <span className="text-cyan-400">{enemy.stats.speed}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-lg font-bold text-blue-300 mb-2">報酬</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">経験値:</span>{' '}
              <span className="text-purple-400">{enemy.expReward}</span>
            </div>
            <div>
              <span className="text-gray-400">ゴールド:</span>{' '}
              <span className="text-yellow-400">{enemy.goldReward}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * アイテム詳細表示
 */
function ItemDetail({ item }: { item: Item }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">{item.name}</h2>

      <div className="space-y-4">
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-lg font-bold text-blue-300 mb-2">基本情報</h3>
          <div className="text-sm space-y-2">
            <div>
              <span className="text-gray-400">種類:</span>{' '}
              <span className="text-white">{item.type}</span>
            </div>
            {item.price && (
              <div>
                <span className="text-gray-400">価格:</span>{' '}
                <span className="text-yellow-400">{item.price}両</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-lg font-bold text-blue-300 mb-2">説明</h3>
          <p className="text-gray-300 text-sm">{item.description}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * スキル詳細表示
 */
function SkillDetail({ skill }: { skill: Skill }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">{skill.name}</h2>

      <div className="space-y-4">
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-lg font-bold text-blue-300 mb-2">基本情報</h3>
          <div className="text-sm space-y-2">
            <div>
              <span className="text-gray-400">消費MP:</span>{' '}
              <span className="text-blue-400">{skill.cost}</span>
            </div>
            {skill.power && (
              <div>
                <span className="text-gray-400">威力:</span>{' '}
                <span className="text-orange-400">{skill.power}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h3 className="text-lg font-bold text-blue-300 mb-2">説明</h3>
          <p className="text-gray-300 text-sm">{skill.description}</p>
        </div>
      </div>
    </div>
  )
}
