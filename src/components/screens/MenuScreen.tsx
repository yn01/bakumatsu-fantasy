/**
 * MenuScreen - メニュー画面
 */

import { useState, useEffect } from 'react'
import { useKeyboard } from '@/hooks/useKeyboard'
import { usePartyStore } from '@/stores/partyStore'
import { StatusWindow } from '@/components/ui/StatusWindow'
import { SkillTreeWindow } from '@/components/ui/SkillTreeWindow'
import { EquipmentWindow } from '@/components/ui/EquipmentWindow'
import { SaveLoadWindow } from '@/components/ui/SaveLoadWindow'
import { QuestListWindow } from '@/components/ui/QuestListWindow'
import { AchievementWindow } from '@/components/ui/AchievementWindow'
import { EncyclopediaWindow } from '@/components/ui/EncyclopediaWindow'

interface MenuScreenProps {
  onClose: () => void
  currentMap?: string
  playerPosition?: { x: number; y: number }
}

type MenuTab = 'status' | 'skill' | 'equipment' | 'item' | 'quest' | 'save' | 'achievement' | 'encyclopedia'

export const MenuScreen = ({ onClose, currentMap, playerPosition }: MenuScreenProps) => {
  const { members } = usePartyStore()
  const [selectedTab, setSelectedTab] = useState<MenuTab>('status')
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(0)
  const [mode, setMode] = useState<'tab' | 'member' | 'detail'>('tab')

  // メンバー空時のガード処理
  useEffect(() => {
    if (members.length === 0) {
      onClose() // メンバーがいない場合はメニューを閉じる
    } else if (selectedMemberIndex >= members.length) {
      setSelectedMemberIndex(Math.max(0, members.length - 1))
    }
  }, [members, selectedMemberIndex, onClose])

  // 選択中のキャラクター
  const selectedMember = members[selectedMemberIndex]

  // キーボード入力
  useKeyboard({
    enabled: true,
    onKeyDown: (key) => {
      if (key === 'cancel') {
        if (mode === 'detail') {
          setMode('tab')
        } else {
          onClose()
        }
        return
      }

      if (mode === 'tab') {
        handleTabInput(key)
      } else if (mode === 'member') {
        handleMemberInput(key)
      }
      // detail モードは各ウィンドウが処理
    },
  })

  // タブ選択モードの入力処理
  const handleTabInput = (key: string) => {
    if (key === 'left') {
      const tabs: MenuTab[] = ['status', 'skill', 'equipment', 'item', 'quest', 'save']
      const currentIndex = tabs.indexOf(selectedTab)
      const newIndex = (currentIndex - 1 + tabs.length) % tabs.length
      const newTab = tabs[newIndex]
      if (newTab) setSelectedTab(newTab)
    } else if (key === 'right') {
      const tabs: MenuTab[] = ['status', 'skill', 'equipment', 'item', 'quest', 'save', 'achievement', 'encyclopedia']
      const currentIndex = tabs.indexOf(selectedTab)
      const newIndex = (currentIndex + 1) % tabs.length
      const newTab = tabs[newIndex]
      if (newTab) setSelectedTab(newTab)
    } else if (key === 'up') {
      setMode('member')
    } else if (key === 'confirm') {
      // スキル・装備・クエスト・セーブ・実績・図鑑タブは詳細モードへ
      if (selectedTab === 'skill' || selectedTab === 'equipment' || selectedTab === 'quest' || selectedTab === 'save' || selectedTab === 'achievement' || selectedTab === 'encyclopedia') {
        setMode('detail')
      }
    }
  }

  // メンバー選択モードの入力処理
  const handleMemberInput = (key: string) => {
    if (key === 'left') {
      setSelectedMemberIndex((prev) => Math.max(0, prev - 1))
    } else if (key === 'right') {
      setSelectedMemberIndex((prev) => Math.min(members.length - 1, prev + 1))
    } else if (key === 'down') {
      setMode('tab')
    }
  }

  // タブラベル
  const getTabLabel = (tab: MenuTab): string => {
    switch (tab) {
      case 'status':
        return 'ステータス'
      case 'skill':
        return 'スキル'
      case 'equipment':
        return '装備'
      case 'item':
        return 'アイテム'
      case 'quest':
        return 'クエスト'
      case 'save':
        return 'セーブ'
      case 'achievement':
        return '実績'
      case 'encyclopedia':
        return '図鑑'
      default:
        return ''
    }
  }

  // 詳細モードのウィンドウを閉じる
  const handleCloseDetail = () => {
    setMode('tab')
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
      <div className="bg-gray-900 border-4 border-green-400 rounded-lg w-11/12 h-5/6 max-w-6xl overflow-hidden flex flex-col">
        {/* ヘッダー: メンバー選択 */}
        <div className="bg-gray-800 border-b-2 border-gray-700 p-4">
          <div className="flex gap-4 justify-center">
            {members.map((member, index) => (
              <div
                key={member.id}
                className={`p-3 rounded border-2 cursor-pointer transition-all ${
                  mode === 'member' && selectedMemberIndex === index
                    ? 'border-white bg-gray-700 scale-105'
                    : selectedMemberIndex === index
                      ? 'border-green-400 bg-gray-700'
                      : 'border-gray-600 bg-gray-800'
                }`}
              >
                <p className="text-white font-bold text-center">{member.name}</p>
                <p className="text-gray-400 text-sm text-center">Lv.{member.level}</p>
                {/* HPバー */}
                <div className="mt-2 w-24">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>HP</span>
                    <span>
                      {member.stats.hp}/{member.stats.maxHp}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${(member.stats.hp / member.stats.maxHp) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* タブ選択 */}
        <div className="bg-gray-800 border-b-2 border-gray-700 p-2">
          <div className="flex gap-2 justify-center">
            {(['status', 'skill', 'equipment', 'item', 'quest', 'save'] as MenuTab[]).map((tab) => (
              <button
                key={tab}
                className={`px-6 py-2 rounded transition-all ${
                  mode === 'tab' && selectedTab === tab
                    ? 'bg-green-500 text-white font-bold scale-105'
                    : selectedTab === tab
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-400'
                }`}
              >
                {getTabLabel(tab)}
              </button>
            ))}
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedMember && (
            <>
              {selectedTab === 'status' && <StatusWindow character={selectedMember} />}

              {selectedTab === 'skill' && mode !== 'detail' && (
                <div className="bg-gray-800 p-6 rounded text-center">
                  <p className="text-white text-xl mb-4">スキルツリー</p>
                  <p className="text-gray-400 mb-6">
                    Enterキーでスキルツリーを開きます
                  </p>
                  <div className="text-gray-500 text-sm">
                    <p>習得スキル数: {selectedMember.skills.length}</p>
                    <p>スキルポイント: {selectedMember.skillPoints ?? 0}</p>
                  </div>
                </div>
              )}

              {selectedTab === 'equipment' && mode !== 'detail' && (
                <div className="bg-gray-800 p-6 rounded text-center">
                  <p className="text-white text-xl mb-4">装備</p>
                  <p className="text-gray-400 mb-6">
                    Enterキーで装備画面を開きます
                  </p>
                  <div className="text-gray-500 text-sm space-y-2">
                    <p>
                      武器:{' '}
                      {selectedMember.equipment.weapon
                        ? selectedMember.equipment.weapon
                        : 'なし'}
                    </p>
                    <p>
                      防具:{' '}
                      {selectedMember.equipment.armor
                        ? selectedMember.equipment.armor
                        : 'なし'}
                    </p>
                  </div>
                </div>
              )}

              {selectedTab === 'item' && (
                <div className="bg-gray-800 p-6 rounded text-center">
                  <p className="text-white text-xl mb-4">アイテム</p>
                  <p className="text-gray-400">実装予定（Task #22で実装）</p>
                </div>
              )}

              {selectedTab === 'quest' && mode !== 'detail' && (
                <div className="bg-gray-800 p-6 rounded text-center">
                  <p className="text-white text-xl mb-4">クエスト</p>
                  <p className="text-gray-400 mb-6">
                    Enterキーでクエストリストを開きます
                  </p>
                  <div className="text-gray-500 text-sm">
                    <p>受注中/完了済みクエストを確認できます</p>
                  </div>
                </div>
              )}

              {selectedTab === 'save' && mode !== 'detail' && (
                <div className="bg-gray-800 p-6 rounded text-center">
                  <p className="text-white text-xl mb-4">セーブ</p>
                  <p className="text-gray-400 mb-6">
                    Enterキーでセーブ画面を開きます
                  </p>
                  <div className="text-gray-500 text-sm">
                    <p>セーブスロット: 3個</p>
                    <p>オートセーブ: 有効</p>
                  </div>
                </div>
              )}

              {selectedTab === 'achievement' && mode !== 'detail' && (
                <div className="bg-gray-800 p-6 rounded text-center">
                  <p className="text-white text-xl mb-4">実績</p>
                  <p className="text-gray-400 mb-6">
                    Enterキーで実績画面を開きます
                  </p>
                  <div className="text-gray-500 text-sm">
                    <p>解除した実績を確認できます</p>
                    <p>30種類の実績が登録されています</p>
                  </div>
                </div>
              )}

              {selectedTab === 'encyclopedia' && mode !== 'detail' && (
                <div className="bg-gray-800 p-6 rounded text-center">
                  <p className="text-white text-xl mb-4">図鑑</p>
                  <p className="text-gray-400 mb-6">
                    Enterキーで図鑑画面を開きます
                  </p>
                  <div className="text-gray-500 text-sm">
                    <p>敵・アイテム・スキル図鑑を確認できます</p>
                    <p>発見したエントリーが記録されます</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 操作説明 */}
        <div className="bg-gray-800 border-t-2 border-gray-700 p-3 text-center text-gray-400 text-sm">
          {mode === 'tab' && (
            <p>←→: タブ選択 | ↑: メンバー選択 | Enter: 詳細表示 | Escape: 閉じる</p>
          )}
          {mode === 'member' && (
            <p>←→: メンバー選択 | ↓: タブ選択 | Escape: 閉じる</p>
          )}
          {mode === 'detail' && <p>Escape: 戻る</p>}
        </div>
      </div>

      {/* 詳細モード: スキルツリー */}
      {mode === 'detail' && selectedTab === 'skill' && selectedMember && (
        <SkillTreeWindow character={selectedMember} onClose={handleCloseDetail} />
      )}

      {/* 詳細モード: 装備 */}
      {mode === 'detail' && selectedTab === 'equipment' && selectedMember && (
        <EquipmentWindow character={selectedMember} onClose={handleCloseDetail} />
      )}

      {/* 詳細モード: クエスト */}
      {mode === 'detail' && selectedTab === 'quest' && (
        <QuestListWindow onClose={handleCloseDetail} />
      )}

      {/* 詳細モード: セーブ */}
      {mode === 'detail' && selectedTab === 'save' && (
        <SaveLoadWindow
          mode="save"
          isVisible={true}
          onClose={handleCloseDetail}
          currentMap={currentMap}
          playerPosition={playerPosition}
        />
      )}

      {/* 詳細モード: 実績 */}
      {mode === 'detail' && selectedTab === 'achievement' && (
        <AchievementWindow onClose={handleCloseDetail} />
      )}

      {/* 詳細モード: 図鑑 */}
      {mode === 'detail' && selectedTab === 'encyclopedia' && (
        <EncyclopediaWindow onClose={handleCloseDetail} />
      )}
    </div>
  )
}
