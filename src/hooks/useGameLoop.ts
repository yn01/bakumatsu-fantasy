/**
 * ゲームループ管理フック
 */

import { useEffect, useRef, useCallback } from 'react'

interface GameLoopCallbacks {
  update: (deltaTime: number) => void
  render: (ctx: CanvasRenderingContext2D) => void
}

interface UseGameLoopOptions {
  enabled?: boolean
  targetFPS?: number
}

export const useGameLoop = (
  callbacks: GameLoopCallbacks,
  options: UseGameLoopOptions = {}
) => {
  const { enabled = true, targetFPS = 60 } = options

  const animationFrameRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)
  const fpsRef = useRef<number>(0)
  const frameCountRef = useRef<number>(0)
  const fpsUpdateTimeRef = useRef<number>(0)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

  // deltaTimeの上限（フレームスキップ対策）
  const MAX_DELTA_TIME = 1000 / 30 // 30FPS相当

  const gameLoop = useCallback(
    (currentTime: number) => {
      if (!enabled || !ctxRef.current) return

      // deltaTimeの計算（ミリ秒）
      const deltaTime = lastTimeRef.current
        ? Math.min(currentTime - lastTimeRef.current, MAX_DELTA_TIME)
        : 1000 / targetFPS

      lastTimeRef.current = currentTime

      // 更新処理
      callbacks.update(deltaTime)

      // 描画処理
      callbacks.render(ctxRef.current)

      // FPS計測
      frameCountRef.current++
      if (currentTime - fpsUpdateTimeRef.current >= 1000) {
        fpsRef.current = frameCountRef.current
        frameCountRef.current = 0
        fpsUpdateTimeRef.current = currentTime
      }

      // 次のフレーム
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    },
    [enabled, targetFPS, callbacks]
  )

  useEffect(() => {
    if (!enabled || !canvasRef.current) return

    // Canvasコンテキスト取得
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) {
      console.error('Failed to get 2D context')
      return
    }

    ctxRef.current = ctx

    // ゲームループ開始
    lastTimeRef.current = performance.now()
    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [enabled, gameLoop])

  return {
    canvasRef,
    getFPS: () => fpsRef.current,
  }
}
