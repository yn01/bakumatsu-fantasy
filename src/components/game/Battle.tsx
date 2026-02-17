/**
 * Battle - バトル画面コンポーネント
 */

import { useEffect, useRef, useState } from 'react'
import { useBattleStore } from '@/stores/battleStore'
import { usePartyStore } from '@/stores/partyStore'
import { BattleRenderer } from '@/systems/battle/BattleRenderer'
import { BattleAnimator } from '@/systems/battle/BattleAnimator'
import { BattleEffects } from '@/systems/battle/BattleEffects'
import { BattleManager } from '@/systems/battle/BattleManager'
import { RewardManager } from '@/systems/battle/RewardManager'
import { skillTreeManager } from '@/systems/growth/SkillTreeManager'
import { equipmentManager } from '@/systems/growth/EquipmentManager'
import { CommandWindow } from '@/components/ui/CommandWindow'
import { TargetSelector } from '@/components/ui/TargetSelector'
import { BattleResultWindow } from '@/components/ui/BattleResultWindow'
import { LevelUpWindow } from '@/components/ui/LevelUpWindow'
import { BattlePhase } from '@/types'
import type { BattleCommand, BattleResult } from '@/types/battle'
import type { Character } from '@/types/character'
import type { RewardDistribution } from '@/systems/battle/RewardManager'

interface BattleProps {
  /** 敵ID配列 */
  enemies: string[]
  /** バトル終了コールバック */
  onBattleEnd: (result: BattleResult) => void
}

export const Battle = ({ enemies, onBattleEnd }: BattleProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const battleRendererRef = useRef<BattleRenderer>(new BattleRenderer(640, 480))
  const battleAnimatorRef = useRef<BattleAnimator>(new BattleAnimator())
  const battleEffectsRef = useRef<BattleEffects>(new BattleEffects())
  const battleManagerRef = useRef<BattleManager>(new BattleManager())
  const rewardManagerRef = useRef<RewardManager>(new RewardManager())

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCommand, setSelectedCommand] = useState<BattleCommand | null>(null)
  const [showBattleResult, setShowBattleResult] = useState(false)
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null)
  const [rewardDistributions, setRewardDistributions] = useState<RewardDistribution[]>([])
  const [levelUpQueue, setLevelUpQueue] = useState<RewardDistribution[]>([])
  const [currentLevelUpIndex, setCurrentLevelUpIndex] = useState(0)

  // battleStoreをサブスクライブ
  const { phase, party, enemies: enemyParticipants } = useBattleStore()

  // ゲームループ用
  const animationFrameRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)

  // バトル初期化
  useEffect(() => {
    const initBattle = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // スキルツリーデータを読み込み
        try {
          await skillTreeManager.loadData()
        } catch (error) {
          console.error('Failed to load skill data:', error)
          // スキルデータの読み込み失敗は致命的ではないため続行
        }

        // 装備データを読み込み
        try {
          await equipmentManager.loadData()
        } catch (error) {
          console.error('Failed to load equipment data:', error)
          // 装備データの読み込み失敗は致命的ではないため続行
        }

        // 敵データをロード
        const basePath = import.meta.env.BASE_URL || '/'
        const response = await fetch(`${basePath}data/enemies.json`)
        if (!response.ok) {
          throw new Error('敵データの読み込みに失敗しました')
        }
        const allEnemies: Character[] = await response.json()

        // 指定された敵IDに基づいて敵キャラクターを取得
        const enemyCharacters: Character[] = enemies
          .map((enemyId) => {
            const enemy = allEnemies.find((e) => e.id === enemyId)
            if (!enemy) {
              console.warn(`Enemy not found: ${enemyId}`)
              return null
            }
            return enemy
          })
          .filter((e): e is Character => e !== null)

        // partyStoreから実際のパーティメンバーを取得
        const partyCharacters: Character[] = usePartyStore.getState().members

        // バトル初期化
        battleManagerRef.current.initBattle(partyCharacters, enemyCharacters)

        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'バトル初期化エラー')
        setIsLoading(false)
      }
    }

    initBattle()
  }, [enemies])

  // ゲームループと描画処理
  useEffect(() => {
    if (isLoading || error) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gameLoop = (currentTime: number) => {
      // Delta time計算（秒単位）
      const deltaTime =
        lastTimeRef.current === 0 ? 0 : Math.min((currentTime - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = currentTime

      // アニメーション更新
      battleAnimatorRef.current.update(deltaTime)
      battleEffectsRef.current.update(deltaTime)

      // 描画
      render(ctx)

      // 次のフレーム
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    const render = (ctx: CanvasRenderingContext2D) => {
      // Screen shake
      const shake = battleEffectsRef.current.getShakeOffset()
      ctx.save()
      ctx.translate(shake.x, shake.y)

      // バトル画面描画
      battleRendererRef.current.render(ctx, party, enemyParticipants)

      // バトルエフェクト描画
      battleEffectsRef.current.render(ctx)

      // ダメージ数値描画
      battleAnimatorRef.current.renderDamageNumbers(ctx)

      ctx.restore()
    }

    // ゲームループ開始
    animationFrameRef.current = requestAnimationFrame(gameLoop)

    // クリーンアップ
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      lastTimeRef.current = 0
    }
  }, [isLoading, error, party, enemyParticipants])

  // バトル終了判定と報酬分配
  useEffect(() => {
    if (phase === BattlePhase.VICTORY) {
      const result = battleManagerRef.current.checkBattleEnd()
      if (result && !showBattleResult) {
        // バトル終了時のHP/MPをpartyStoreに同期（戦闘不能者のHP=0を反映）
        const partyParticipants = useBattleStore.getState().party
        for (const participant of partyParticipants) {
          usePartyStore.getState().updateMember(participant.character.id, {
            stats: {
              ...participant.character.stats,
              hp: participant.currentHp,
              mp: participant.currentMp,
            },
          })
        }

        // 報酬を分配（HP同期後なので、HP=0メンバーにはEXP配布されない）
        const distributions = rewardManagerRef.current.distributeRewards(result)

        setBattleResult(result)
        setRewardDistributions(distributions)

        // 0.8秒後にBattleResultWindow表示
        const timer = setTimeout(() => {
          setShowBattleResult(true)
        }, 800)
        return () => clearTimeout(timer)
      }
    } else if (phase === BattlePhase.DEFEAT) {
      const result = battleManagerRef.current.checkBattleEnd()
      if (result) {
        // 敗北時もHP/MPをpartyStoreに同期
        const partyParticipants = useBattleStore.getState().party
        for (const participant of partyParticipants) {
          usePartyStore.getState().updateMember(participant.character.id, {
            stats: {
              ...participant.character.stats,
              hp: participant.currentHp,
              mp: participant.currentMp,
            },
          })
        }

        // 敗北時はそのまま終了（報酬なし）
        const timer = setTimeout(() => {
          onBattleEnd(result)
        }, 800)
        return () => clearTimeout(timer)
      }
    }
  }, [phase, showBattleResult, onBattleEnd])

  // 敵のターン自動実行
  useEffect(() => {
    if (phase !== BattlePhase.COMMAND_SELECT) return

    const isEnemyTurn = battleManagerRef.current.isCurrentActorEnemy()
    if (!isEnemyTurn) return

    const currentActor = battleManagerRef.current.getCurrentActor()
    if (!currentActor) return

    // 0.7秒待ってから敵が行動
    const timer = setTimeout(() => {
      const result = battleManagerRef.current.executeEnemyAction(currentActor)

      // ダメージアニメーション開始
      if (result.length > 0) {
        result.forEach((dmg) => {
          battleAnimatorRef.current.startDamageAnimation(
            dmg.targetId,
            dmg.damage,
            200,
            300,
            dmg.isCritical
          )
          // Slash effect and screen shake on hit
          battleEffectsRef.current.startSlashEffect(200, 300)
          if (dmg.isCritical) {
            battleEffectsRef.current.startScreenShake(8, 0.4)
          } else {
            battleEffectsRef.current.startScreenShake(3, 0.2)
          }
        })
      }

      // バトル終了判定
      const battleResult = battleManagerRef.current.checkBattleEnd()
      if (battleResult) {
        useBattleStore.getState().endBattle(battleResult)
        return
      }

      // 次の行動者に進む
      setTimeout(() => {
        battleManagerRef.current.advanceTurn()
      }, 700)
    }, 700)

    return () => clearTimeout(timer)
  }, [phase, party, enemyParticipants])

  // コマンド選択処理
  const handleCommandSelect = (command: BattleCommand) => {
    setSelectedCommand(command)

    // 攻撃コマンドの場合、ターゲット選択へ
    if (command === 'attack') {
      // ターゲット選択UIは自動的に表示される（selectedCommandがnullでない場合）
      return
    }

    // TODO: Phase 4で他のコマンド実装
    console.log('Command selected:', command)
    setSelectedCommand(null)
  }

  // ターゲット選択処理
  const handleTargetSelect = (targetId: string) => {
    if (!selectedCommand) return

    const currentActor = battleManagerRef.current.getCurrentActor()
    if (!currentActor) return

    // アクション実行
    const result = battleManagerRef.current.executeAction({
      actorId: currentActor.character.id,
      command: selectedCommand,
      targetIds: [targetId],
    })

    // ダメージアニメーション開始
    if (result.length > 0) {
      result.forEach((dmg) => {
        battleAnimatorRef.current.startDamageAnimation(
          dmg.targetId,
          dmg.damage,
          500,
          200,
          dmg.isCritical
        )
        // Slash effect and screen shake on hit
        battleEffectsRef.current.startSlashEffect(500, 200)
        if (dmg.isCritical) {
          battleEffectsRef.current.startScreenShake(8, 0.4)
        } else {
          battleEffectsRef.current.startScreenShake(3, 0.2)
        }
      })
    }

    setSelectedCommand(null)

    // バトル終了判定
    const battleResult = battleManagerRef.current.checkBattleEnd()
    if (battleResult) {
      useBattleStore.getState().endBattle(battleResult)
      return
    }

    // 次の行動者に進む
    setTimeout(() => {
      battleManagerRef.current.advanceTurn()
    }, 700) // 0.7秒待ってから次のターンへ
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-900">
        <p className="text-white">バトル準備中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-900">
        <div className="text-center">
          <p className="text-red-500 mb-2">エラー</p>
          <p className="text-white text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="relative flex items-center justify-center bg-gray-900">
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="pixel-perfect border-2 border-primary shadow-2xl"
        />
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-sm">
          Turn: {useBattleStore.getState().turn} | Phase: {phase}
        </div>
      </div>

      {/* コマンドウィンドウ */}
      <CommandWindow
        isVisible={
          phase === BattlePhase.COMMAND_SELECT &&
          !selectedCommand &&
          !battleManagerRef.current.isCurrentActorEnemy()
        }
        onSelect={handleCommandSelect}
      />

      {/* ターゲット選択 */}
      {selectedCommand === 'attack' && (
        <TargetSelector
          isVisible={true}
          targets={enemyParticipants}
          targetType="enemy"
          onSelect={handleTargetSelect}
          onCancel={() => setSelectedCommand(null)}
        />
      )}

      {/* 勝利時の報酬表示 */}
      {showBattleResult && battleResult && levelUpQueue.length === 0 && (
        <BattleResultWindow
          result={battleResult}
          distributions={rewardDistributions}
          onClose={() => {
            setShowBattleResult(false)

            // レベルアップしたメンバーがいる場合は、レベルアップウィンドウを表示
            const leveledUpMembers = rewardDistributions.filter((d) => d.levelUp)
            if (leveledUpMembers.length > 0) {
              setLevelUpQueue(leveledUpMembers)
              setCurrentLevelUpIndex(0)
            } else {
              // レベルアップなしの場合はそのまま終了
              onBattleEnd(battleResult)
            }
          }}
        />
      )}

      {/* レベルアップ演出 */}
      {levelUpQueue.length > 0 &&
        currentLevelUpIndex < levelUpQueue.length &&
        levelUpQueue[currentLevelUpIndex] &&
        levelUpQueue[currentLevelUpIndex].levelUpResult && (
          <LevelUpWindow
            characterName={levelUpQueue[currentLevelUpIndex]!.memberName}
            result={levelUpQueue[currentLevelUpIndex]!.levelUpResult!}
            onClose={() => {
              if (currentLevelUpIndex < levelUpQueue.length - 1) {
                // 次のメンバーのレベルアップ表示
                setCurrentLevelUpIndex((prev) => prev + 1)
              } else {
                // 全員のレベルアップ表示完了、バトル終了
                setLevelUpQueue([])
                setCurrentLevelUpIndex(0)
                if (battleResult) {
                  onBattleEnd(battleResult)
                }
              }
            }}
          />
        )}

      {/* 敗北表示 */}
      {phase === BattlePhase.DEFEAT && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-gray-900 border-4 border-red-600 rounded-lg p-8 text-center">
            <h2 className="text-4xl font-bold text-red-600 mb-4">敗北...</h2>
          </div>
        </div>
      )}
    </>
  )
}
