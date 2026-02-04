/**
 * BattleResultWindow - バトル勝利結果表示UI
 */

import { useKeyboard } from '@/hooks/useKeyboard'
import type { BattleResult } from '@/types/battle'
import type { RewardDistribution } from '@/systems/battle/RewardManager'

interface BattleResultWindowProps {
  result: BattleResult
  distributions: RewardDistribution[]
  onClose: () => void
}

export const BattleResultWindow = ({
  result,
  distributions,
  onClose,
}: BattleResultWindowProps) => {
  // キーボード入力（Enterで閉じる）
  useKeyboard({
    enabled: true,
    onKeyDown: (key) => {
      if (key === 'confirm') {
        onClose()
      }
    },
  })

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="bg-gray-900 border-4 border-primary rounded-lg p-8 w-3/4 max-w-2xl">
        <h2 className="text-4xl font-bold text-primary mb-6 text-center">勝利！</h2>

        {/* 獲得経験値・ゴールド */}
        <div className="mb-6 text-center">
          <p className="text-2xl text-white mb-2">
            獲得経験値: <span className="text-green-400">{result.exp}</span>
          </p>
          <p className="text-2xl text-white mb-2">
            獲得ゴールド: <span className="text-yellow-400">{result.gold}G</span>
          </p>
          {result.items.length > 0 && (
            <p className="text-xl text-white">
              獲得アイテム: <span className="text-blue-400">{result.items.length}個</span>
            </p>
          )}
        </div>

        {/* 各メンバーの経験値獲得 */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-3 border-b border-gray-700 pb-2">
            メンバー
          </h3>
          <div className="space-y-2">
            {distributions.map((dist) => (
              <div
                key={dist.memberId}
                className="bg-gray-800 p-3 rounded flex justify-between items-center"
              >
                <div>
                  <p className="text-white font-bold">{dist.memberName}</p>
                  {dist.levelUp && dist.newLevel && (
                    <p className="text-green-400 text-sm">
                      レベルアップ！ Lv.{dist.newLevel}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-green-400">+{dist.exp} EXP</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 操作説明 */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">Enter / Space / Z: 閉じる</p>
        </div>
      </div>
    </div>
  )
}
