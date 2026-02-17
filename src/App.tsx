/**
 * App - ルートコンポーネント
 */

import { useEffect, useState, useRef, useCallback, lazy, Suspense } from 'react'
import { useGameStore } from './stores/gameStore'
import { useProgressStore } from './stores/progressStore'
import type { BattleResult } from './types/battle'
import { useInput } from './hooks/useInput'
import { TitleScreen } from './components/screens/TitleScreen'
import { Field } from './components/game/Field'
import { DebugPanel } from './components/debug/DebugPanel'
import { spriteGenerator } from './systems/graphics/SpriteGenerator'
import { tilesetGenerator } from './systems/graphics/TilesetGenerator'
import { battleBackgroundGenerator } from './systems/graphics/BattleBackgroundGenerator'

// Lazy loading for heavy components
const Battle = lazy(() =>
  import('./components/game/Battle').then((module) => ({
    default: module.Battle,
  }))
)

const MenuScreen = lazy(() =>
  import('./components/screens/MenuScreen').then((module) => ({
    default: module.MenuScreen,
  }))
)

const ShopScreen = lazy(() =>
  import('./components/screens/ShopScreen').then((module) => ({
    default: module.ShopScreen,
  }))
)

function App() {
  const scene = useGameStore((state) => state.scene)
  const paused = useGameStore((state) => state.paused)
  const shopOpen = useGameStore((state) => state.shopOpen)
  const shopType = useGameStore((state) => state.shopType)
  const shopId = useGameStore((state) => state.shopId)
  const setScene = useGameStore((state) => state.setScene)
  const setPaused = useGameStore((state) => state.setPaused)
  const closeShop = useGameStore((state) => state.closeShop)
  const currentMapId = useProgressStore((state) => state.currentMapId)
  const [battleEnemies, setBattleEnemies] = useState<string[]>([])
  const [isEventBattle, setIsEventBattle] = useState(false)
  const [graphicsReady, setGraphicsReady] = useState(false)
  const eventBattleResolveRef = useRef<((result: 'victory' | 'defeat') => void) | null>(null)

  // グラフィックス初期化
  useEffect(() => {
    let cancelled = false
    const initGraphics = async () => {
      await Promise.all([
        spriteGenerator.initialize(),
        tilesetGenerator.initialize(),
        battleBackgroundGenerator.initialize(),
      ])
      if (!cancelled) {
        setGraphicsReady(true)
      }
    }
    initGraphics()
    return () => { cancelled = true }
  }, [])

  // 初期化: タイトル画面から開始
  useEffect(() => {
    // 初回起動時は必ずタイトル画面
    setScene('title')
  }, [setScene])

  // Escapeキーまたはmenuアクションでメニュー表示/非表示
  useInput({
    enabled: scene === 'field' && !paused,
    onKeyDown: (action) => {
      if (action === 'cancel' || action === 'menu') {
        setPaused(true)
      }
    },
  })

  const handleEncounter = (enemies: string[]) => {
    setBattleEnemies(enemies)
    setIsEventBattle(false)
    setScene('battle')
  }

  const handleBattleEnd = useCallback((result: BattleResult) => {
    // イベントバトルの場合、Promiseを解決してフィールドに戻す
    if (isEventBattle && eventBattleResolveRef.current) {
      const resolve = eventBattleResolveRef.current
      eventBattleResolveRef.current = null
      setIsEventBattle(false)
      setScene('field')
      setBattleEnemies([])
      resolve(result.victory ? 'victory' : 'defeat')
    } else {
      setScene('field')
      setBattleEnemies([])
    }
  }, [isEventBattle, setScene])

  const handleEventBattle = useCallback((enemies: string[], _canEscape: boolean): Promise<'victory' | 'defeat'> => {
    return new Promise((resolve) => {
      eventBattleResolveRef.current = resolve
      setBattleEnemies(enemies)
      setIsEventBattle(true)
      setScene('battle')
    })
  }, [setScene])

  const handleCloseMenu = () => {
    setPaused(false)
  }

  if (!graphicsReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-2">幕末ファンタジーRPG</p>
          <p className="text-sm text-gray-400">グラフィック初期化中...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* デバッグパネル */}
      <DebugPanel />

      {/* タイトル画面 */}
      {scene === 'title' && <TitleScreen />}

      {/* フィールド画面 */}
      {scene === 'field' && (
        <Field
          mapId={currentMapId}
          onMapLoad={() => console.log('Map loaded!')}
          onEncounter={handleEncounter}
          onEventBattle={handleEventBattle}
        />
      )}

      {/* バトル画面 */}
      {scene === 'battle' && (
        <Suspense
          fallback={
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
              戦闘準備中...
            </div>
          }
        >
          <Battle enemies={battleEnemies} onBattleEnd={handleBattleEnd} />
        </Suspense>
      )}

      {/* メニュー画面（オーバーレイ） */}
      {paused && scene === 'field' && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center text-white">
              読込中...
            </div>
          }
        >
          <MenuScreen onClose={handleCloseMenu} />
        </Suspense>
      )}

      {/* ショップ画面（オーバーレイ） */}
      {shopOpen && shopType && (
        <Suspense
          fallback={
            <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center text-white">
              読込中...
            </div>
          }
        >
          <ShopScreen shopType={shopType} shopId={shopId || undefined} onClose={closeShop} />
        </Suspense>
      )}
    </>
  )
}

export default App
