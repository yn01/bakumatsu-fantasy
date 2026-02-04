/**
 * Canvas管理フック
 */

import { useRef, useEffect } from 'react'

interface UseCanvasOptions {
  width: number
  height: number
  scale?: number
  pixelPerfect?: boolean
}

export const useCanvas = (options: UseCanvasOptions) => {
  const { width, height, scale = 1, pixelPerfect = true } = options

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current

    if (!canvas || !container) return

    // Canvas設定
    canvas.width = width
    canvas.height = height

    // ピクセルパーフェクト設定
    if (pixelPerfect) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.imageSmoothingEnabled = false
      }
    }

    // スケーリング適用
    if (scale !== 1) {
      canvas.style.width = `${width * scale}px`
      canvas.style.height = `${height * scale}px`
    }
  }, [width, height, scale, pixelPerfect])

  return {
    canvasRef,
    containerRef,
  }
}
