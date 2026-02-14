/**
 * DebugPanel - 開発用デバッグパネル
 * Ctrl+Shift+D で表示/非表示
 */

import { useState, useEffect } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { usePartyStore } from '@/stores/partyStore'
import { useProgressStore } from '@/stores/progressStore'

export const DebugPanel = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'scene' | 'map' | 'party' | 'flags'>('scene')

  const scene = useGameStore((state) => state.scene)
  const setScene = useGameStore((state) => state.setScene)
  const currentMapId = useProgressStore((state) => state.currentMapId)
  const setCurrentMap = useProgressStore((state) => state.setCurrentMap)
  const members = usePartyStore((state) => state.members)
  const gold = usePartyStore((state) => state.gold)
  const addGold = usePartyStore((state) => state.addGold)
  const flags = useProgressStore((state) => state.flags)
  const setFlag = useProgressStore((state) => state.setFlag)

  // Ctrl+Shift+D でトグル
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        setIsVisible((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 開発モードでない場合は表示しない
  if (!import.meta.env.DEV) {
    return null
  }

  if (!isVisible) {
    return null
  }

  const handleSceneChange = (newScene: 'title' | 'field' | 'battle' | 'menu') => {
    setScene(newScene)
  }

  const handleMapChange = (mapId: string) => {
    setCurrentMap(mapId, { x: 10, y: 10 })
  }

  const handleGoldChange = (amount: number) => {
    addGold(amount)
  }

  const handleLevelUp = () => {
    const leader = members[0]
    if (!leader) return

    const partyStore = usePartyStore.getState()
    partyStore.updateMember(leader.id, {
      level: leader.level + 1,
      stats: {
        ...leader.stats,
        maxHp: leader.stats.maxHp + 10,
        hp: leader.stats.hp + 10,
        attack: leader.stats.attack + 2,
        defense: leader.stats.defense + 1,
      },
    })
  }

  const handleHeal = () => {
    members.forEach((member) => {
      const partyStore = usePartyStore.getState()
      partyStore.updateMember(member.id, {
        stats: {
          ...member.stats,
          hp: member.stats.maxHp,
          mp: member.stats.maxMp,
        },
      })
    })
  }

  const handleToggleFlag = (flagName: string) => {
    const currentValue = flags[flagName]
    setFlag(flagName, !currentValue)
  }

  const commonFlags = [
    'prologue_cleared',
    'chapter1_cleared',
    'chapter2_cleared',
    'chapter3_cleared',
    'chapter1_started',
    'chapter2_started',
    'chapter3_started',
  ]

  return (
    <div className="fixed top-4 right-4 z-50 w-96 rounded-lg bg-gray-900 bg-opacity-95 p-4 text-white shadow-2xl border border-amber-500">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-amber-400">🔧 Debug Panel</h2>
        <button
          onClick={() => setIsVisible(false)}
          className="px-3 py-1 bg-red-600 rounded hover:bg-red-700 text-sm"
        >
          閉じる
        </button>
      </div>

      {/* タブ */}
      <div className="flex gap-2 mb-4">
        {(['scene', 'map', 'party', 'flags'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 rounded text-sm ${
              activeTab === tab
                ? 'bg-amber-500 text-gray-900'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {/* シーン切替 */}
        {activeTab === 'scene' && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-amber-300">シーン切替</h3>
            <p className="text-xs text-gray-400">現在: {scene}</p>
            <div className="grid grid-cols-2 gap-2">
              {(['title', 'field', 'battle', 'menu'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleSceneChange(s)}
                  className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* マップ切替 */}
        {activeTab === 'map' && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-amber-300">マップ切替</h3>
            <p className="text-xs text-gray-400">現在: {currentMapId}</p>
            <div className="space-y-1">
              {['saigaitaya', 'kochi_town', 'yodo_dojo', 'urado_port', 'test_map'].map((mapId) => (
                <button
                  key={mapId}
                  onClick={() => handleMapChange(mapId)}
                  className="w-full px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm text-left"
                >
                  {mapId}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* パーティ編集 */}
        {activeTab === 'party' && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-amber-300">パーティ編集</h3>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-400">メンバー: {members.length}人</p>
                {members.map((member) => (
                  <div key={member.id} className="text-xs text-gray-300 ml-2">
                    {member.name} Lv.{member.level} HP:{member.stats.hp}/{member.stats.maxHp}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-gray-400">ゴールド: {gold}両</p>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  <button
                    onClick={() => handleGoldChange(100)}
                    className="px-2 py-1 bg-green-600 rounded hover:bg-green-700 text-xs"
                  >
                    +100
                  </button>
                  <button
                    onClick={() => handleGoldChange(1000)}
                    className="px-2 py-1 bg-green-600 rounded hover:bg-green-700 text-xs"
                  >
                    +1000
                  </button>
                  <button
                    onClick={() => handleGoldChange(-gold)}
                    className="px-2 py-1 bg-red-600 rounded hover:bg-red-700 text-xs"
                  >
                    0
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleLevelUp}
                  className="px-3 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm"
                >
                  Lv UP
                </button>
                <button
                  onClick={handleHeal}
                  className="px-3 py-2 bg-green-600 rounded hover:bg-green-700 text-sm"
                >
                  全回復
                </button>
              </div>
            </div>
          </div>
        )}

        {/* フラグ管理 */}
        {activeTab === 'flags' && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-amber-300">フラグ管理</h3>
            <div className="space-y-1">
              {commonFlags.map((flagName) => {
                const isActive = !!flags[flagName]
                return (
                  <button
                    key={flagName}
                    onClick={() => handleToggleFlag(flagName)}
                    className={`w-full px-3 py-2 rounded text-sm text-left ${
                      isActive ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {flagName}: {isActive ? 'ON' : 'OFF'}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-400">
        Ctrl+Shift+D でトグル
      </div>
    </div>
  )
}
