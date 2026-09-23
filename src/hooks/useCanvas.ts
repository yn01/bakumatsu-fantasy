/**
 * ピクセルパーフェクトCanvas管理フック
 *
 * - 論理解像度 320x240 のオフスクリーンCanvasを提供
 * - 表示Canvasはウィンドウに収まる最大の整数倍サイズ（中央揃えは親のflexに任せる）
 * - devicePixelRatio を考慮しつつ、バックバッファ倍率は整数に丸める
 */

import { useRef, useState, useEffect, useCallback } from 'react'
import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  computeIntegerScale,
  computeBackingScale,
  createLogicalCanvas,
  disableSmoothing,
  presentLogicalCanvas,
} from '@/systems/graphics/pixelCanvas'

interface UsePixelCanvasOptions {
  /** 表示倍率計算時にウィンドウから差し引く余白（px） */
  margin?: number
  /** 表示倍率の上限 */
  maxScale?: number
}

export interface PixelCanvasHandle {
  /** 表示用Canvasに割り当てるコールバックref */
  displayCanvasRef: (node: HTMLCanvasElement | null) => void
  /** 論理解像度のオフスクリーンコンテキストを取得 */
  getLogicalContext: () => CanvasRenderingContext2D | null
  /** 論理Canvasの内容を表示Canvasへ転送 */
  present: () => void
  /** 現在の表示倍率（整数） */
  scale: number
}

export const usePixelCanvas = (options: UsePixelCanvasOptions = {}): PixelCanvasHandle => {
  const { margin = 24, maxScale } = options

  const displayNodeRef = useRef<HTMLCanvasElement | null>(null)
  const displayCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const logicalCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const logicalCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const [scale, setScale] = useState(1)

  const getLogicalContext = useCallback((): CanvasRenderingContext2D | null => {
    if (!logicalCanvasRef.current) {
      logicalCanvasRef.current = createLogicalCanvas()
      logicalCtxRef.current = logicalCanvasRef.current.getContext('2d')
    }
    if (logicalCtxRef.current) disableSmoothing(logicalCtxRef.current)
    return logicalCtxRef.current
  }, [])

  /** 表示Canvasのバックバッファ・CSSサイズを整数倍に揃える */
  const applyScale = useCallback(() => {
    const nextScale = computeIntegerScale(
      window.innerWidth - margin,
      window.innerHeight - margin,
      maxScale
    )
    setScale(nextScale)

    const display = displayNodeRef.current
    if (!display) return

    const backingScale = computeBackingScale(nextScale, window.devicePixelRatio)
    const backingWidth = LOGICAL_WIDTH * backingScale
    const backingHeight = LOGICAL_HEIGHT * backingScale

    if (display.width !== backingWidth || display.height !== backingHeight) {
      display.width = backingWidth
      display.height = backingHeight
      displayCtxRef.current = display.getContext('2d')
    }
    if (displayCtxRef.current) disableSmoothing(displayCtxRef.current)

    // CSSサイズは論理解像度の整数倍
    display.style.width = `${LOGICAL_WIDTH * nextScale}px`
    display.style.height = `${LOGICAL_HEIGHT * nextScale}px`
  }, [margin, maxScale])

  // コールバックrefでマウント直後にスケールを適用する
  // （ローディング表示のあとにcanvasが現れるケースに対応）
  const displayCanvasRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      displayNodeRef.current = node
      displayCtxRef.current = node ? node.getContext('2d') : null
      if (node) applyScale()
    },
    [applyScale]
  )

  const present = useCallback((): void => {
    const source = logicalCanvasRef.current
    const ctx = displayCtxRef.current
    if (!source || !ctx) return
    presentLogicalCanvas(source, ctx)
  }, [])

  // ウィンドウリサイズ追従
  useEffect(() => {
    applyScale()
    window.addEventListener('resize', applyScale)
    return () => window.removeEventListener('resize', applyScale)
  }, [applyScale])

  return { displayCanvasRef, getLogicalContext, present, scale }
}
