/**
 * Field - フィールド画面コンポーネント
 */

import { useEffect, useRef, useState } from 'react'
import { MapRenderer } from '@/systems/field/MapRenderer'
import { CharacterController } from '@/systems/field/CharacterController'
import { CharacterRenderer } from '@/systems/field/CharacterRenderer'
import { CollisionSystem } from '@/systems/field/CollisionSystem'
import { TransitionSystem } from '@/systems/field/TransitionSystem'
import { MapManager } from '@/systems/field/MapManager'
import { NPCRenderer } from '@/systems/field/NPCRenderer'
import { EncounterSystem } from '@/systems/field/EncounterSystem'
import { EventManager } from '@/systems/event/EventManager'
import { EventExecutor } from '@/systems/event/EventExecutor'
import { MessageBox } from '@/components/ui/MessageBox'
import { ChoiceWindow } from '@/components/ui/ChoiceWindow'
import { AudioManager } from '@/utils/audioManager'
import { useGameStore } from '@/stores/gameStore'
import { useProgressStore } from '@/stores/progressStore'
import { useKeyboard } from '@/hooks/useKeyboard'
import type { GameKey } from '@/hooks/useKeyboard'
import type { NPC } from '@/types'

interface FieldProps {
  mapId: string
  onMapLoad?: () => void
  onEncounter?: (enemies: string[]) => void
}

export const Field = ({ mapId, onMapLoad, onEncounter }: FieldProps) => {
  const openShop = useGameStore((state) => state.openShop)
  const shopOpen = useGameStore((state) => state.shopOpen)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mapRendererRef = useRef<MapRenderer>(new MapRenderer())
  const collisionSystemRef = useRef<CollisionSystem>(new CollisionSystem())
  const transitionSystemRef = useRef<TransitionSystem>(new TransitionSystem({ fadeSpeed: 2.0 }))
  const mapManagerRef = useRef<MapManager | null>(null)
  const characterControllerRef = useRef<CharacterController | null>(null)
  const characterRendererRef = useRef<CharacterRenderer | null>(null)
  const npcRendererRef = useRef<NPCRenderer | null>(null)
  const encounterSystemRef = useRef<EncounterSystem>(new EncounterSystem())
  const eventManagerRef = useRef<EventManager>(new EventManager())
  const eventExecutorRef = useRef<EventExecutor | null>(null)
  const audioManagerRef = useRef<AudioManager | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugPosition, setDebugPosition] = useState({ x: 0, y: 0 })

  // 会話システム
  const [showMessageBox, setShowMessageBox] = useState(false)
  const [currentMessageSpeaker, setCurrentMessageSpeaker] = useState<string | undefined>()
  const [currentMessageText, setCurrentMessageText] = useState<string>('')
  const [currentNPC, setCurrentNPC] = useState<NPC | null>(null)
  const [messageResolve, setMessageResolve] = useState<(() => void) | null>(null)

  // 選択肢システム
  const [showChoiceWindow, setShowChoiceWindow] = useState(false)
  const [currentChoices, setCurrentChoices] = useState<string[]>([])
  const [choiceCallback, setChoiceCallback] = useState<((index: number) => void) | null>(null)

  // イベントシステム
  const [isEventRunning, setIsEventRunning] = useState(false)

  // ゲームループ用
  const animationFrameRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)

  // キーボード入力
  useKeyboard({
    enabled: !isLoading && !error && !transitionSystemRef.current.isTransitioning() && !showMessageBox && !showChoiceWindow && !isEventRunning && !shopOpen,
    onKeyDown: (key: GameKey) => {
      const controller = characterControllerRef.current
      if (!controller) return

      // トランジション中は入力を受け付けない
      if (transitionSystemRef.current.isTransitioning()) return

      // 会話中は入力を受け付けない
      if (showMessageBox) return

      // 決定キー処理（NPC会話）
      if (key === 'confirm') {
        const playerPos = controller.getPosition()
        const playerDir = controller.getDirection()

        // プレイヤーの向いている方向の座標を計算
        let checkX = playerPos.x
        let checkY = playerPos.y

        switch (playerDir) {
          case 'up':
            checkY -= 1
            break
          case 'down':
            checkY += 1
            break
          case 'left':
            checkX -= 1
            break
          case 'right':
            checkX += 1
            break
        }

        // その座標にNPCがいるかチェック
        const mapData = mapRendererRef.current.getMapData()
        if (mapData && mapData.npcs) {
          const npc = mapData.npcs.find(
            (n) => n.position.x === checkX && n.position.y === checkY
          )
          if (npc) {
            setCurrentNPC(npc)
            setShowMessageBox(true)
            return
          }
        }
      }

      // 移動キー処理
      switch (key) {
        case 'up':
          controller.startMove('up')
          break
        case 'down':
          controller.startMove('down')
          break
        case 'left':
          controller.startMove('left')
          break
        case 'right':
          controller.startMove('right')
          break
      }
    },
  })

  // マップ読み込み
  useEffect(() => {
    const abortController = new AbortController()

    const loadMap = async () => {
      try {
        setIsLoading(true)
        setError(null)
        await mapRendererRef.current.loadMap(mapId, abortController.signal)

        // アボートされた場合は処理を中断
        if (abortController.signal.aborted) return

        // マップデータからタイルサイズを取得
        const mapData = mapRendererRef.current.getMapData()
        const tileSize = mapData?.tileSize || 32

        // タイルサイズを使ってレンダラーを初期化
        if (!characterRendererRef.current) {
          characterRendererRef.current = new CharacterRenderer(tileSize)
        }
        if (!npcRendererRef.current) {
          npcRendererRef.current = new NPCRenderer(tileSize)
        }

        // エンカウント設定
        if (mapData?.encounters) {
          encounterSystemRef.current.setEncounterRate(mapData.encounters.rate)
        } else {
          encounterSystemRef.current.setEncounterRate(0) // エンカウントなし
        }

        // AudioManager初期化
        if (!audioManagerRef.current) {
          const settings = useGameStore.getState().settings
          audioManagerRef.current = new AudioManager(
            settings.bgmVolume,
            settings.seVolume
          )
        }

        // 衝突判定システムにマップレンダラーを設定
        collisionSystemRef.current.setMapRenderer(mapRendererRef.current)

        // マップマネージャーを初期化
        if (!mapManagerRef.current) {
          mapManagerRef.current = new MapManager({
            initialMapId: mapId,
            mapRenderer: mapRendererRef.current,
          })

          // トランジションコールバックを設定
          mapManagerRef.current.setOnTransition((transition) => {
            const controller = characterControllerRef.current
            if (!controller) return

            // フェードアウト開始
            transitionSystemRef.current.startFadeOut(async () => {
              try {
                // マップ切り替え
                await mapManagerRef.current?.changeMap(transition.toMapId)
                collisionSystemRef.current.setMapRenderer(mapRendererRef.current)

                // エンカウントシステムをリセット
                encounterSystemRef.current.reset()

                // 新しいマップのエンカウント設定を適用
                const newMapData = mapRendererRef.current.getMapData()
                if (newMapData?.encounters) {
                  encounterSystemRef.current.setEncounterRate(newMapData.encounters.rate)
                } else {
                  encounterSystemRef.current.setEncounterRate(0)
                }

                // キャラクター位置を更新
                controller.setPosition(transition.toPosition)

                // progressStoreのマップと位置を更新
                useProgressStore.getState().setCurrentMap(transition.toMapId, transition.toPosition)

                // フェードイン開始
                transitionSystemRef.current.startFadeIn()
              } catch (err) {
                console.error('Map transition error:', err)
                setError(err instanceof Error ? err.message : 'マップ切替エラー')
                // エラー時はフェードインして復帰
                transitionSystemRef.current.startFadeIn()
              }
            })
          })
        }

        // キャラクターコントローラーを初期化（衝突判定付き）
        if (!characterControllerRef.current) {
          // progressStoreから現在位置を取得（存在しない場合はマップ中央）
          const currentPosition = useProgressStore.getState().currentPosition || { x: 10, y: 7 }
          characterControllerRef.current = new CharacterController(
            currentPosition,
            {
              tileSize,
              canMoveTo: (pos) => collisionSystemRef.current.canMoveTo(pos),
            }
          )
        }

        // イベントマネージャーを初期化
        await eventManagerRef.current.loadData()

        // イベント実行エンジンを初期化
        if (!eventExecutorRef.current && characterControllerRef.current) {
          eventExecutorRef.current = new EventExecutor({
            eventManager: eventManagerRef.current,
            playerController: characterControllerRef.current,
            onMessage: (speaker, text) => {
              return new Promise<void>((resolve) => {
                setCurrentMessageSpeaker(speaker)
                setCurrentMessageText(text)
                setShowMessageBox(true)
                setMessageResolve(() => resolve)
              })
            },
            onChoice: (choices, callback) => {
              setCurrentChoices(choices)
              setShowChoiceWindow(true)
              setChoiceCallback(() => callback)
            },
            onBattle: async () => {
              // Task #27で実装
              console.log('[Field] onBattle not implemented yet')
              return 'victory'
            },
            onChangeMap: async (mapId, x, y) => {
              try {
                // マップを切り替え
                await mapManagerRef.current?.changeMap(mapId)
                collisionSystemRef.current.setMapRenderer(mapRendererRef.current)

                // エンカウントシステムをリセット
                encounterSystemRef.current.reset()

                // 新しいマップのエンカウント設定を適用
                const newMapData = mapRendererRef.current.getMapData()
                if (newMapData?.encounters) {
                  encounterSystemRef.current.setEncounterRate(newMapData.encounters.rate)
                } else {
                  encounterSystemRef.current.setEncounterRate(0)
                }

                // キャラクター位置を更新
                characterControllerRef.current?.setPosition({ x, y })

                console.log(`[Field] Changed map to ${mapId} at (${x}, ${y})`)
              } catch (err) {
                console.error('[Field] onChangeMap error:', err)
              }
            },
            onFadeIn: async (_duration) => {
              return new Promise<void>((resolve) => {
                transitionSystemRef.current.startFadeIn(() => resolve())
              })
            },
            onFadeOut: async (_duration) => {
              return new Promise<void>((resolve) => {
                transitionSystemRef.current.startFadeOut(() => resolve())
              })
            },
            onPlayBGM: async (bgmId, volume, loop) => {
              await audioManagerRef.current?.playBGM(bgmId, volume, loop)
            },
            onPlaySE: async (seId, volume) => {
              await audioManagerRef.current?.playSE(seId, volume)
            },
            onComplete: () => {
              console.log('[Field] Event completed')
              setIsEventRunning(false)
            },
          })
        }

        setIsLoading(false)
        onMapLoad?.()
      } catch (err) {
        // アボートによるエラーは無視
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        setError(err instanceof Error ? err.message : 'マップ読み込みエラー')
        setIsLoading(false)
      }
    }

    loadMap()

    // クリーンアップ: アンマウント時または mapId 変更時にリクエストをキャンセル
    return () => {
      abortController.abort()
      // AudioManager クリーンアップ
      audioManagerRef.current?.stopBGM()
      audioManagerRef.current?.clearCache()
    }
  }, [mapId, onMapLoad])

  // イベントコールバッククリーンアップ（メモリリーク防止）
  // マウント時のみ実行（アンマウント時のクリーンアップのため）
  useEffect(() => {
    return () => {
      // アンマウント時のみ未解決のコールバックをクリーンアップ
      const currentMessageResolve = messageResolve
      const currentChoiceCallback = choiceCallback
      const choicesLength = currentChoices.length

      if (currentMessageResolve) {
        currentMessageResolve()
      }
      if (currentChoiceCallback) {
        // 最後の選択肢を選択（通常は「やめる」など）
        currentChoiceCallback(choicesLength - 1)
      }
      // イベント実行中フラグをリセット
      setIsEventRunning(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // マウント時のみ実行、依存配列は空

  // ゲームループと描画処理
  useEffect(() => {
    if (isLoading || error) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gameLoop = (currentTime: number) => {
      // Delta time計算（秒単位）
      const deltaTime = lastTimeRef.current === 0
        ? 0
        : Math.min((currentTime - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = currentTime

      // キャラクター更新
      if (characterControllerRef.current) {
        const wasMoving = characterControllerRef.current.isMoving()
        characterControllerRef.current.update(deltaTime)

        // デバッグ: 現在位置を更新
        const currentPos = characterControllerRef.current.getPosition()
        setDebugPosition(currentPos)

        // 移動終了時にトランジションをチェック
        if (wasMoving && !characterControllerRef.current.isMoving()) {
          const currentPos = characterControllerRef.current.getPosition()
          const transition = mapManagerRef.current?.checkTransition(currentPos)
          if (transition) {
            mapManagerRef.current?.triggerTransition(transition)
          } else {
            // トランジションがない場合
            // progressStoreの位置を更新
            useProgressStore.getState().setCurrentMap(mapId, currentPos)

            // エンカウント判定
            if (encounterSystemRef.current.onStep()) {
              const mapData = mapRendererRef.current.getMapData()
              if (mapData?.encounters && onEncounter) {
                const enemies = encounterSystemRef.current.getEnemyGroup(
                  mapData.encounters.enemies
                )
                onEncounter(enemies)
              }
            }
          }
        }
      }

      // トランジション更新
      transitionSystemRef.current.update(deltaTime)

      // 描画
      render(ctx)

      // 次のフレーム
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    const render = (ctx: CanvasRenderingContext2D) => {
      // 背景クリア
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // カメラ座標（キャラクター追従）
      let cameraX = 0
      let cameraY = 0

      if (characterControllerRef.current && mapRendererRef.current) {
        const playerPos = characterControllerRef.current.getPosition()
        const mapData = mapRendererRef.current.getMapData()
        const tileSize = mapData?.tileSize || 32

        // キャラクターのピクセル座標
        const playerPixelX = playerPos.x * tileSize
        const playerPixelY = playerPos.y * tileSize

        // カメラをキャラクター中心に配置（画面中央）
        cameraX = playerPixelX - canvas.width / 2 + tileSize / 2
        cameraY = playerPixelY - canvas.height / 2 + tileSize / 2

        // マップ境界内にクランプ
        const mapSize = mapRendererRef.current.getMapSize()
        if (mapSize) {
          cameraX = Math.max(0, Math.min(cameraX, mapSize.width - canvas.width))
          cameraY = Math.max(0, Math.min(cameraY, mapSize.height - canvas.height))
        }
      }

      // マップ描画
      mapRendererRef.current.render(ctx, cameraX, cameraY)

      // NPC描画
      const mapData = mapRendererRef.current.getMapData()
      if (mapData && mapData.npcs && npcRendererRef.current) {
        npcRendererRef.current.renderAll(ctx, mapData.npcs, cameraX, cameraY)
      }

      // キャラクター描画
      if (characterControllerRef.current && characterRendererRef.current) {
        const renderPos = characterControllerRef.current.getRenderPosition()
        const sprite = characterControllerRef.current.getSprite()
        characterRendererRef.current.render(
          ctx,
          renderPos.x,
          renderPos.y,
          sprite.direction,
          sprite.animationFrame,
          cameraX,
          cameraY
        )
      }

      // トランジション描画（フェード効果）
      transitionSystemRef.current.render(ctx)
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
  }, [isLoading, error])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-900">
        <p className="text-white">マップ読み込み中...</p>
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
          マップ: {mapId}
          <br />
          位置: x={debugPosition.x}, y={debugPosition.y}
        </div>
      </div>

      {/* 会話ウィンドウ */}
      {currentNPC && (
        <MessageBox
          speaker={currentNPC.name}
          message={currentNPC.dialogue}
          isVisible={showMessageBox}
          onClose={() => {
            setShowMessageBox(false)
            // NPC会話終了時にアクションを実行
            if (currentNPC.action) {
              if (currentNPC.action.type === 'shop') {
                openShop(currentNPC.action.shopType)
              }
              // 他のアクション（inn, saveなど）は将来実装
            }
            setCurrentNPC(null)
          }}
        />
      )}

      {/* イベントメッセージウィンドウ */}
      {!currentNPC && showMessageBox && (
        <MessageBox
          speaker={currentMessageSpeaker}
          message={currentMessageText}
          isVisible={showMessageBox}
          onClose={() => {
            setShowMessageBox(false)
            if (messageResolve) {
              messageResolve()
              setMessageResolve(null)
            }
          }}
        />
      )}

      {/* 選択肢ウィンドウ */}
      <ChoiceWindow
        choices={currentChoices}
        isVisible={showChoiceWindow}
        onSelect={(index) => {
          setShowChoiceWindow(false)
          if (choiceCallback) {
            choiceCallback(index)
            setChoiceCallback(null)
          }
        }}
      />
    </>
  )
}
