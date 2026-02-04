/**
 * GameCanvas - メインゲームCanvas
 */

import { useCallback, useState, useEffect } from 'react'
import { useGameLoop } from '@/hooks/useGameLoop'
import { useCanvas } from '@/hooks/useCanvas'

// Canvas仕様（SFC風）
const CANVAS_WIDTH = 640
const CANVAS_HEIGHT = 480
const CANVAS_SCALE = 1.5

interface GameCanvasProps {
  enabled?: boolean
  showFPS?: boolean
}

export const GameCanvas = ({
  enabled = true,
  showFPS = true,
}: GameCanvasProps) => {
  const [fps, setFPS] = useState(0)

  // Canvas設定
  const { canvasRef: canvasRefFromCanvas, containerRef } = useCanvas({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    scale: CANVAS_SCALE,
    pixelPerfect: true,
  })

  // ゲームループコールバック
  const update = useCallback((_deltaTime: number) => {
    // ゲームロジック更新（将来的に実装）
  }, [])

  const render = useCallback((ctx: CanvasRenderingContext2D) => {
    // 背景クリア
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // グリッド描画（デバッグ用）
    ctx.strokeStyle = '#16213e'
    ctx.lineWidth = 1

    for (let x = 0; x < CANVAS_WIDTH; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_HEIGHT)
      ctx.stroke()
    }

    for (let y = 0; y < CANVAS_HEIGHT; y += 32) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_WIDTH, y)
      ctx.stroke()
    }

    // タイトル描画
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 32px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('幕末ファンタジーRPG', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)

    ctx.font = '20px sans-serif'
    ctx.fillText('Phase 1: 基盤構築完了', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)

    ctx.font = '16px sans-serif'
    ctx.fillStyle = '#aaaaaa'
    ctx.fillText(
      'Canvas: 640x480 / FPS: 60',
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 + 40
    )
  }, [])

  // ゲームループ
  const { canvasRef: canvasRefFromLoop, getFPS } = useGameLoop(
    { update, render },
    { enabled, targetFPS: 60 }
  )

  // FPS更新
  useEffect(() => {
    const interval = setInterval(() => {
      setFPS(getFPS())
    }, 500)
    return () => clearInterval(interval)
  }, [getFPS])

  // canvasRefを統合
  const setCanvasRef = useCallback(
    (element: HTMLCanvasElement | null) => {
      if (canvasRefFromCanvas.current !== element) {
        ;(canvasRefFromCanvas as React.MutableRefObject<HTMLCanvasElement | null>).current = element
      }
      if (canvasRefFromLoop.current !== element) {
        ;(canvasRefFromLoop as React.MutableRefObject<HTMLCanvasElement | null>).current = element
      }
    },
    [canvasRefFromCanvas, canvasRefFromLoop]
  )

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center bg-gray-900"
    >
      <canvas
        ref={setCanvasRef}
        className="pixel-perfect border-2 border-primary shadow-2xl"
      />
      {showFPS && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded font-mono text-sm">
          FPS: {fps}
        </div>
      )}
    </div>
  )
}
