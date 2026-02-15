/**
 * QuestListWindow - クエストリストUI
 */

import { useState, useEffect } from 'react'
import { useKeyboard } from '@/hooks/useKeyboard'
import { questManager } from '@/systems/quest/QuestManager'
import type { Quest } from '@/stores/questStore'

interface QuestListWindowProps {
  onClose: () => void
}

type QuestTab = 'active' | 'completed'

export const QuestListWindow = ({ onClose }: QuestListWindowProps) => {
  const [selectedTab, setSelectedTab] = useState<QuestTab>('active')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeQuests, setActiveQuests] = useState<Quest[]>([])
  const [completedQuests, setCompletedQuests] = useState<Quest[]>([])

  // クエストリストを取得
  useEffect(() => {
    setActiveQuests(questManager.getActiveQuests())
    setCompletedQuests(questManager.getCompletedQuests())
  }, [])

  // 現在のタブのクエストリスト
  const currentQuests = selectedTab === 'active' ? activeQuests : completedQuests
  const selectedQuest = currentQuests[selectedIndex]

  // キーボード入力
  useKeyboard({
    enabled: true,
    onKeyDown: (key) => {
      if (key === 'cancel') {
        onClose()
        return
      }

      if (key === 'left' || key === 'right') {
        // タブ切り替え
        setSelectedTab((prev) => (prev === 'active' ? 'completed' : 'active'))
        setSelectedIndex(0)
      } else if (key === 'up') {
        setSelectedIndex((prev) => Math.max(0, prev - 1))
      } else if (key === 'down') {
        setSelectedIndex((prev) => Math.min(currentQuests.length - 1, prev + 1))
      }
    },
  })

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
      <div className="bg-gray-900 border-4 border-green-400 rounded-lg w-11/12 h-5/6 max-w-6xl overflow-hidden flex flex-col">
        {/* ヘッダー: タブ選択 */}
        <div className="bg-gray-800 border-b-2 border-gray-700 p-4">
          <div className="flex gap-4 justify-center">
            <button
              className={`px-6 py-2 rounded transition-all ${
                selectedTab === 'active'
                  ? 'bg-green-500 text-white font-bold scale-105'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              受注中 ({activeQuests.length})
            </button>
            <button
              className={`px-6 py-2 rounded transition-all ${
                selectedTab === 'completed'
                  ? 'bg-green-500 text-white font-bold scale-105'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              完了済み ({completedQuests.length})
            </button>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-hidden flex">
          {/* 左側: クエストリスト */}
          <div className="w-1/3 bg-gray-800 border-r-2 border-gray-700 overflow-y-auto">
            {currentQuests.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {selectedTab === 'active' ? '受注中のクエストはありません' : '完了したクエストはありません'}
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {currentQuests.map((quest, index) => (
                  <div
                    key={quest.id}
                    className={`p-3 rounded border-2 cursor-pointer transition-all ${
                      selectedIndex === index
                        ? 'border-green-400 bg-gray-700 scale-105'
                        : 'border-gray-600 bg-gray-800'
                    }`}
                  >
                    <p className="text-white font-bold">{quest.name}</p>
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{quest.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 右側: クエスト詳細 */}
          <div className="flex-1 bg-gray-900 overflow-y-auto p-6">
            {selectedQuest ? (
              <div className="space-y-6">
                {/* クエスト名 */}
                <div>
                  <h2 className="text-white text-2xl font-bold mb-2">{selectedQuest.name}</h2>
                  <p className="text-gray-400">{selectedQuest.description}</p>
                </div>

                {/* 目標 */}
                <div>
                  <h3 className="text-green-400 text-xl font-bold mb-2">目標</h3>
                  <ul className="space-y-2">
                    {selectedQuest.objectives.map((objective, index) => (
                      <li key={index} className="text-gray-300 flex items-start">
                        <span className="text-green-400 mr-2">•</span>
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 報酬 */}
                <div>
                  <h3 className="text-yellow-400 text-xl font-bold mb-2">報酬</h3>
                  <div className="space-y-1 text-gray-300">
                    {selectedQuest.rewards.exp && (
                      <p>• 経験値: {selectedQuest.rewards.exp}</p>
                    )}
                    {selectedQuest.rewards.gold && (
                      <p>• ゴールド: {selectedQuest.rewards.gold}両</p>
                    )}
                    {selectedQuest.rewards.items && selectedQuest.rewards.items.length > 0 && (
                      <div>
                        <p>• アイテム:</p>
                        <ul className="ml-6 space-y-1">
                          {selectedQuest.rewards.items.map((itemId, index) => (
                            <li key={index} className="text-gray-400">
                              - {itemId}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* ステータス */}
                {selectedTab === 'completed' && (
                  <div className="bg-green-900 bg-opacity-30 border-2 border-green-500 rounded p-4 text-center">
                    <p className="text-green-400 font-bold text-xl">完了済み</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">クエストを選択してください</p>
              </div>
            )}
          </div>
        </div>

        {/* 操作説明 */}
        <div className="bg-gray-800 border-t-2 border-gray-700 p-3 text-center text-gray-400 text-sm">
          <p>←→: タブ切替 | ↑↓: 選択 | Escape: 閉じる</p>
        </div>
      </div>
    </div>
  )
}
