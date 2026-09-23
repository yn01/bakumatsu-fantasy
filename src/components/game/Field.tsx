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
import { ScenarioManager } from '@/systems/scenario/ScenarioManager'
import { AudioManager } from '@/utils/audioManager'
import { SaveManager } from '@/utils/saveManager'
import { useGameStore } from '@/stores/gameStore'
import { useProgressStore } from '@/stores/progressStore'
import { usePartyStore } from '@/stores/partyStore'
import { useInput } from '@/hooks/useInput'
import { usePixelCanvas } from '@/hooks/useCanvas'
import { LOGICAL_WIDTH, LOGICAL_HEIGHT, TILE_SIZE } from '@/systems/graphics/pixelCanvas'
import { startFixedGameLoop } from '@/utils/fixedGameLoop'
import { inputManager } from '@/systems/input/InputManager'
import type { GameAction } from '@/hooks/useInput'
import type { NPC } from '@/types'
import { devLog } from '@/utils/logger'

interface FieldProps {
  mapId: string
  onMapLoad?: () => void
  onEncounter?: (enemies: string[]) => void
  onEventBattle?: (enemies: string[], canEscape: boolean) => Promise<'victory' | 'defeat'>
}

export const Field = ({ mapId, onMapLoad, onEncounter, onEventBattle }: FieldProps) => {
  const openShop = useGameStore((state) => state.openShop)
  const shopOpen = useGameStore((state) => state.shopOpen)
  const { displayCanvasRef, getLogicalContext, present } = usePixelCanvas()
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
  const scenarioManagerRef = useRef<ScenarioManager>(new ScenarioManager())
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
  const messageResolveRef = useRef<(() => void) | null>(null)

  // 選択肢システム
  const [showChoiceWindow, setShowChoiceWindow] = useState(false)
  const [currentChoices, setCurrentChoices] = useState<string[]>([])
  const [choiceCallback, setChoiceCallback] = useState<((index: number) => void) | null>(null)
  const choiceCallbackRef = useRef<((index: number) => void) | null>(null)
  const currentChoicesRef = useRef<string[]>([])

  // イベントシステム
  const [isEventRunning, setIsEventRunning] = useState(false)
  const [prologueTriggered, setPrologueTriggered] = useState(false)

  // キーボード入力
  const isTransitioning = transitionSystemRef.current.isTransitioning()
  const keyboardEnabled = !isLoading && !error && !isTransitioning && !showMessageBox && !showChoiceWindow && !isEventRunning && !shopOpen

  // デバッグ: キーボード入力の状態をログ出力
  useEffect(() => {
    devLog('[Field] Keyboard enabled:', keyboardEnabled, {
      isLoading,
      error: !!error,
      isTransitioning,
      showMessageBox,
      showChoiceWindow,
      isEventRunning,
      shopOpen
    })
  }, [keyboardEnabled, isLoading, error, isTransitioning, showMessageBox, showChoiceWindow, isEventRunning, shopOpen])

  useInput({
    enabled: keyboardEnabled,
    onKeyDown: (key: GameAction) => {
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
            // eventIdが指定されている場合はイベント実行
            if (npc.eventId) {
              const executor = eventExecutorRef.current
              if (executor && !executor.isRunning()) {
                setIsEventRunning(true)
                executor.startEvent(npc.eventId)
              }
            } else {
              // eventIdがない場合は従来の会話方式
              setCurrentNPC(npc)
              setShowMessageBox(true)
            }
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
        devLog('[Field] useEffect: Loading map', mapId)
        setIsLoading(true)
        setError(null)
        await mapRendererRef.current.loadMap(mapId, abortController.signal)

        // アボートされた場合は処理を中断
        if (abortController.signal.aborted) return

        // 論理座標系のタイルサイズ（マップJSONのtileSizeは旧座標系の値なので使わない）
        const mapData = mapRendererRef.current.getMapData()
        const tileSize = TILE_SIZE

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
                devLog('[Field] Transition: set position to', transition.toPosition, 'on map', transition.toMapId)
                devLog('[Field] Transition: current position after set:', controller.getPosition())

                // フェードイン開始（完了後にprogressStoreを更新）
                transitionSystemRef.current.startFadeIn(() => {
                  // フェードイン完了後にprogressStoreを更新
                  // これにより、mapId変更によるuseEffectの再実行がフェード完了後になる
                  useProgressStore.getState().setCurrentMap(transition.toMapId, transition.toPosition)
                  devLog('[Field] Transition: fade-in complete, updated progressStore')

                  // オートセーブ
                  SaveManager.save('auto')
                  devLog('[Field] Auto-save after map transition')
                })
              } catch (err) {
                console.error('Map transition error:', err)
                setError(err instanceof Error ? err.message : 'マップ切替エラー')
                // エラー時はフェードインして復帰
                transitionSystemRef.current.startFadeIn(() => {
                  // エラー時もprogressStoreを更新（元のマップに戻る）
                  useProgressStore.getState().setCurrentMap(mapId, controller.getPosition())
                })
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
              canMoveTo: (pos) => {
                if (!collisionSystemRef.current.canMoveTo(pos)) return false
                const npcs = mapRendererRef.current.getMapData()?.npcs ?? []
                return !npcs.some(npc => npc.position.x === pos.x && npc.position.y === pos.y)
              },
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
                messageResolveRef.current = resolve
              })
            },
            onChoice: (choices, callback) => {
              setCurrentChoices(choices)
              currentChoicesRef.current = choices
              setShowChoiceWindow(true)
              setChoiceCallback(() => callback)
              choiceCallbackRef.current = callback
            },
            onBattle: async (enemyIds, canEscape) => {
              if (onEventBattle) {
                const result = await onEventBattle(enemyIds, canEscape)
                return result
              }
              // フォールバック: コールバック未提供時はvictory
              console.warn('[Field] onEventBattle callback not provided, defaulting to victory')
              return 'victory'
            },
            onChangeMap: async (newMapId, x, y) => {
              try {
                // マップを切り替え
                await mapManagerRef.current?.changeMap(newMapId)
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

                // progressStoreにマップIDと位置を保存
                useProgressStore.getState().setCurrentMap(newMapId, { x, y })

                devLog(`[Field] Changed map to ${newMapId} at (${x}, ${y})`)
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
            onOpenShop: async (shopId, _items) => {
              // ショップを開く
              // shopIdが指定されている場合はそのショップを開く
              if (shopId) {
                devLog(`[Field] Opening shop: ${shopId}`)
                openShop('all', shopId) // shopIdを渡してショップを開く
              } else {
                console.warn('[Field] openShop called without shopId')
              }
            },
            onComplete: () => {
              devLog('[Field] Event completed')
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

  // プロローグ自動開始（New Game直後、才谷屋マップ読み込み完了後）
  useEffect(() => {
    if (isLoading || prologueTriggered) return
    const executor = eventExecutorRef.current
    if (!executor) return

    const progress = useProgressStore.getState()
    // プロローグ未完了 && 才谷屋マップの場合、プロローグイベントを自動開始
    if (mapId === 'saigaitaya' && !progress.getFlag('prologue_completed') && !executor.isRunning()) {
      setPrologueTriggered(true)
      setIsEventRunning(true)
      executor.startEvent('prologue_intro')
    }
  }, [isLoading, mapId, prologueTriggered])

  // イベントコールバッククリーンアップ（メモリリーク防止）
  // マウント時のみ実行（アンマウント時のクリーンアップのため）
  useEffect(() => {
    return () => {
      // アンマウント時のみ未解決のコールバックをクリーンアップ（refsを使用して最新値を取得）
      if (messageResolveRef.current) {
        messageResolveRef.current()
        messageResolveRef.current = null
      }
      if (choiceCallbackRef.current) {
        // 最後の選択肢を選択（通常は「やめる」など）
        const choicesLength = currentChoicesRef.current.length
        choiceCallbackRef.current(choicesLength - 1)
        choiceCallbackRef.current = null
      }
      currentChoicesRef.current = []
    }
  }, [])

  // ゲームループと描画処理
  useEffect(() => {
    if (isLoading || error) return

    const ctx = getLogicalContext()
    if (!ctx) return

    // 固定タイムステップ更新（アニメーションtickはstartFixedGameLoop内で進行）
    const update = (deltaTime: number) => {
      // キャラクター更新
      if (characterControllerRef.current) {
        const wasMoving = characterControllerRef.current.isMoving()
        characterControllerRef.current.update(deltaTime)

        // デバッグ: 現在位置を更新
        const currentPos = characterControllerRef.current.getPosition()
        setDebugPosition(currentPos)

        // キー長押し連続移動: 移動していない時にキーが押されていれば次の移動を開始
        if (!characterControllerRef.current.isMoving() && !wasMoving) {
          if (!transitionSystemRef.current.isTransitioning() && !isEventRunning && !showMessageBox && !showChoiceWindow && !shopOpen) {
            if (inputManager.isPressed('up')) characterControllerRef.current.startMove('up')
            else if (inputManager.isPressed('down')) characterControllerRef.current.startMove('down')
            else if (inputManager.isPressed('left')) characterControllerRef.current.startMove('left')
            else if (inputManager.isPressed('right')) characterControllerRef.current.startMove('right')
          }
        }

        // 移動終了時にトランジションをチェック
        if (wasMoving && !characterControllerRef.current.isMoving()) {
          const currentPos = characterControllerRef.current.getPosition()
          const transition = mapManagerRef.current?.checkTransition(currentPos)
          if (transition) {
            mapManagerRef.current?.triggerTransition(transition)
          } else {
            // トランジションがない場合
            // progressStoreの位置を更新
            useProgressStore.getState().setCurrentPosition(currentPos)

            // シナリオイベントチェック
            const executor = eventExecutorRef.current
            if (executor && !executor.isRunning()) {
              const currentMapId = useProgressStore.getState().currentMapId
              const eventId = scenarioManagerRef.current.checkMapEvent(currentMapId, currentPos)
              if (eventId) {
                setIsEventRunning(true)
                executor.startEvent(eventId)
              }
            }

            // エンカウント判定（イベント実行中でなければ）
            if (!isEventRunning && encounterSystemRef.current.onStep()) {
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
    }

    const render = () => {
      // 背景クリア
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT)

      // カメラ座標（キャラクター追従）
      let cameraX = 0
      let cameraY = 0

      if (characterControllerRef.current && mapRendererRef.current) {
        const playerPos = characterControllerRef.current.getPosition()
        const tileSize = TILE_SIZE

        // キャラクターのピクセル座標
        const playerPixelX = playerPos.x * tileSize
        const playerPixelY = playerPos.y * tileSize

        // カメラをキャラクター中心に配置（画面中央）
        cameraX = playerPixelX - LOGICAL_WIDTH / 2 + tileSize / 2
        cameraY = playerPixelY - LOGICAL_HEIGHT / 2 + tileSize / 2

        // マップ境界内にクランプ
        const mapSize = mapRendererRef.current.getMapSize()
        if (mapSize) {
          cameraX = Math.max(0, Math.min(cameraX, mapSize.width - LOGICAL_WIDTH))
          cameraY = Math.max(0, Math.min(cameraY, mapSize.height - LOGICAL_HEIGHT))
        }

        // 論理ピクセル単位にスナップ（小数カメラによるにじみを防止）
        cameraX = Math.floor(cameraX)
        cameraY = Math.floor(cameraY)
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
        // 先頭メンバー（リーダー）のスプライトで描画
        const partyState = usePartyStore.getState()
        const leaderId = partyState.getLeader()?.id ?? partyState.members[0]?.id ?? 'ryoma'
        characterRendererRef.current.render(
          ctx,
          renderPos.x,
          renderPos.y,
          sprite.direction,
          sprite.animationFrame,
          cameraX,
          cameraY,
          leaderId
        )
      }

      // 前景レイヤー描画（屋根・木の上部など、キャラクターの手前に重ねる装飾）
      mapRendererRef.current.renderForeground(ctx, cameraX, cameraY)

      // トランジション描画（フェード効果）
      transitionSystemRef.current.render(ctx)

      // 論理Canvasを表示Canvasへ整数倍転送
      present()
    }

    // ゲームループ開始（60Hz固定更新 + rAF描画）
    const stopLoop = startFixedGameLoop({ update, render })

    // クリーンアップ
    return stopLoop
  }, [isLoading, error, getLogicalContext, present])

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
          ref={displayCanvasRef}
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
                openShop(currentNPC.action.shopType, currentNPC.action.shopId)
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
              messageResolveRef.current = null
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
            choiceCallbackRef.current = null
          }
        }}
      />
    </>
  )
}
