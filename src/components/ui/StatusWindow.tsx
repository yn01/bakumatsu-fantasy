/**
 * StatusWindow - キャラクターステータス表示UI
 */

import type { Character } from '@/types/character'
import { equipmentManager } from '@/systems/growth/EquipmentManager'
import { LevelUpManager } from '@/systems/growth/LevelUpManager'

interface StatusWindowProps {
  character: Character
}

export const StatusWindow = ({ character }: StatusWindowProps) => {
  // 装備込みステータスを取得
  const equippedStats = equipmentManager.calculateEquippedStats(character)

  // 次のレベルまでの経験値
  const expForNextLevel = LevelUpManager.getExpForNextLevel(character.level)
  const expToNextLevel = LevelUpManager.getExpToNextLevel(character.level, character.exp)
  const expProgress =
    expForNextLevel > 0 ? ((character.exp / expForNextLevel) * 100).toFixed(1) : '100'

  // 装備アイテム名を取得
  const getEquipmentName = (itemId: string | null): string => {
    if (!itemId) return 'なし'
    const item = equipmentManager.getItem(itemId)
    return item?.name ?? itemId
  }

  return (
    <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-6">
      {/* ヘッダー */}
      <div className="mb-6 pb-4 border-b border-gray-700">
        <h2 className="text-3xl font-bold text-white mb-2">{character.name}</h2>
        <div className="flex gap-4 text-sm">
          <span className="text-gray-400">クラス: <span className="text-blue-300">{character.class}</span></span>
          <span className="text-gray-400">レベル: <span className="text-yellow-300 font-bold">{character.level}</span></span>
        </div>
      </div>

      {/* 経験値 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-bold">経験値</span>
          <span className="text-gray-400 text-sm">
            {character.exp} / {expForNextLevel > 0 ? expForNextLevel : '---'} ({expProgress}%)
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
            style={{ width: `${Math.min(parseFloat(expProgress), 100)}%` }}
          />
        </div>
        {expToNextLevel > 0 && (
          <p className="text-gray-400 text-xs mt-1">次のレベルまで: {expToNextLevel}</p>
        )}
      </div>

      {/* ステータス */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-3 border-b border-gray-700 pb-2">
          ステータス
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* HP */}
          <div className="bg-gray-800 p-3 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-red-400 font-bold">HP</span>
              <span className="text-white">
                {equippedStats.hp} / {equippedStats.maxHp}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full"
                style={{
                  width: `${(equippedStats.hp / equippedStats.maxHp) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* MP */}
          <div className="bg-gray-800 p-3 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-blue-400 font-bold">MP</span>
              <span className="text-white">
                {equippedStats.mp} / {equippedStats.maxMp}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{
                  width: `${(equippedStats.mp / equippedStats.maxMp) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* 攻撃力 */}
          <div className="bg-gray-800 p-3 rounded flex justify-between items-center">
            <span className="text-gray-300">攻撃力</span>
            <span className="text-white font-bold text-xl">{equippedStats.attack}</span>
          </div>

          {/* 防御力 */}
          <div className="bg-gray-800 p-3 rounded flex justify-between items-center">
            <span className="text-gray-300">防御力</span>
            <span className="text-white font-bold text-xl">{equippedStats.defense}</span>
          </div>

          {/* 素早さ */}
          <div className="bg-gray-800 p-3 rounded flex justify-between items-center">
            <span className="text-gray-300">素早さ</span>
            <span className="text-white font-bold text-xl">{equippedStats.speed}</span>
          </div>

          {/* 運 */}
          <div className="bg-gray-800 p-3 rounded flex justify-between items-center">
            <span className="text-gray-300">運</span>
            <span className="text-white font-bold text-xl">{equippedStats.luck}</span>
          </div>
        </div>
      </div>

      {/* 装備 */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-3 border-b border-gray-700 pb-2">
          装備
        </h3>
        <div className="space-y-2">
          <div className="bg-gray-800 p-3 rounded flex justify-between items-center">
            <span className="text-yellow-400 font-bold">武器</span>
            <span className="text-white">{getEquipmentName(character.equipment.weapon)}</span>
          </div>
          <div className="bg-gray-800 p-3 rounded flex justify-between items-center">
            <span className="text-blue-400 font-bold">防具</span>
            <span className="text-white">{getEquipmentName(character.equipment.armor)}</span>
          </div>
        </div>
      </div>

      {/* スキル */}
      <div>
        <h3 className="text-xl font-bold text-white mb-3 border-b border-gray-700 pb-2">
          習得スキル
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">習得数:</span>
          <span className="text-white font-bold">{character.skills.length}</span>
          {character.skillPoints !== undefined && (
            <>
              <span className="text-gray-400 ml-4">スキルポイント:</span>
              <span className="text-yellow-400 font-bold">{character.skillPoints}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
