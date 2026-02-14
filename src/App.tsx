/**
 * App - ルートコンポーネント
 */

import { useEffect, useState, lazy, Suspense } from 'react'
import { useGameStore } from './stores/gameStore'
import { useProgressStore } from './stores/progressStore'
import { useKeyboard } from './hooks/useKeyboard'
import { TitleScreen } from './components/screens/TitleScreen'
import { Field } from './components/game/Field'
import { DebugPanel } from './components/debug/DebugPanel'

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
  const setScene = useGameStore((state) => state.setScene)
  const setPaused = useGameStore((state) => state.setPaused)
  const closeShop = useGameStore((state) => state.closeShop)
  const currentMapId = useProgressStore((state) => state.currentMapId)
  const [battleEnemies, setBattleEnemies] = useState<string[]>([])

  // 初期化: タイトル画面から開始
  useEffect(() => {
    // 初回起動時は必ずタイトル画面
    setScene('title')
  }, [setScene])

  // Escapeキーでメニュー表示/非表示
  useKeyboard({
    enabled: scene === 'field' && !paused,
    onKeyDown: (key) => {
      if (key === 'cancel') {
        setPaused(true)
      }
    },
  })

  const handleEncounter = (enemies: string[]) => {
    setBattleEnemies(enemies)
    setScene('battle')
  }

  const handleBattleEnd = () => {
    setScene('field')
    setBattleEnemies([])
  }

  const handleCloseMenu = () => {
    setPaused(false)
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
          <ShopScreen shopType={shopType} onClose={closeShop} />
        </Suspense>
      )}
    </>
  )
}

export default App
