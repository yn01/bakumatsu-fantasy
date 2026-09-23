/**
 * 固定パレット向けディザリングユーティリティ（Phase 13 Task B）
 *
 * 16bit風の固定パレットでは `createLinearGradient` のような連続階調は使えない。
 * ここでは Bayer 行列を使ったディザで「2色の混色比率」を近似し、
 * 段階的なパレットランプ（`palette.ts` の RAMPS）と組み合わせてバンディング表現を作る。
 *
 * 色は必ず呼び出し側が `palette.ts` の PaletteColor を渡すこと。
 */

import type { PaletteColor } from './palette'

/** 4x4 Bayer行列（0〜15） */
const BAYER_4X4: readonly (readonly number[])[] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]
const BAYER_SIZE = 4

/**
 * 座標(x,y)における混色比率のしきい値（0〜1未満）を返す。
 */
function bayerThreshold(x: number, y: number): number {
  const row = BAYER_4X4[((y % BAYER_SIZE) + BAYER_SIZE) % BAYER_SIZE]
  const v = row?.[((x % BAYER_SIZE) + BAYER_SIZE) % BAYER_SIZE] ?? 0
  return (v + 0.5) / (BAYER_SIZE * BAYER_SIZE)
}

/**
 * 座標(x,y)で、比率ratio（0〜1、1に近いほどcolorB寄り）に応じて
 * colorA/colorBのどちらを塗るべきかをBayerディザで判定する。
 */
export function ditherPick(x: number, y: number, ratio: number): boolean {
  if (ratio <= 0) return false
  if (ratio >= 1) return true
  return ratio > bayerThreshold(x, y)
}

/**
 * 矩形領域をディザパターンで2色塗り分ける。
 * @param ratio colorBの混色比率（0〜1）。0.5なら市松、それ以外は疎密で濃淡を表現する。
 */
export function fillDitherRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  colorA: PaletteColor,
  colorB: PaletteColor,
  ratio: number
): void {
  if (ratio <= 0) {
    ctx.fillStyle = colorA
    ctx.fillRect(x, y, w, h)
    return
  }
  if (ratio >= 1) {
    ctx.fillStyle = colorB
    ctx.fillRect(x, y, w, h)
    return
  }
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      ctx.fillStyle = ditherPick(x + px, y + py, ratio) ? colorB : colorA
      ctx.fillRect(x + px, y + py, 1, 1)
    }
  }
}

/**
 * 縦方向にパレットランプ（暗→明などの配列）を段階的に敷き詰め、
 * バンド境界をディザで滑らかにする。`createLinearGradient` の代替表現。
 */
export function fillVerticalBandedRamp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ramp: readonly PaletteColor[]
): void {
  const bands = ramp.length
  if (bands === 0 || h <= 0) return
  if (bands === 1) {
    ctx.fillStyle = ramp[0] as PaletteColor
    ctx.fillRect(x, y, w, h)
    return
  }

  for (let py = 0; py < h; py++) {
    const pos = (py / Math.max(1, h - 1)) * (bands - 1) // 0..bands-1
    const lowIdx = Math.min(bands - 2, Math.floor(pos))
    const ratio = pos - lowIdx
    const colorA = ramp[lowIdx] as PaletteColor
    const colorB = ramp[lowIdx + 1] as PaletteColor
    if (ratio <= 0) {
      ctx.fillStyle = colorA
      ctx.fillRect(x, y + py, w, 1)
      continue
    }
    if (ratio >= 1) {
      ctx.fillStyle = colorB
      ctx.fillRect(x, y + py, w, 1)
      continue
    }
    for (let px = 0; px < w; px++) {
      ctx.fillStyle = ditherPick(x + px, y + py, ratio) ? colorB : colorA
      ctx.fillRect(x + px, y + py, 1, 1)
    }
  }
}

/** 矩形の各辺に対して境界ブレンドを適用するかどうか */
export interface EdgeSides {
  top?: boolean
  right?: boolean
  bottom?: boolean
  left?: boolean
}

/**
 * 矩形の指定辺から`depth`pxだけ、ディザで`edgeColor`を混ぜ込む（オートタイルの境界表現用）。
 * 辺に近いほど濃く、内側に向かって薄くなる。
 */
export function ditherEdgeBlend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  edgeColor: PaletteColor,
  sides: EdgeSides,
  depth: number = 4
): void {
  const d = Math.max(1, Math.min(depth, Math.floor(Math.min(w, h) / 2)))

  if (sides.top) {
    for (let dy = 0; dy < d; dy++) {
      const ratio = 1 - dy / d
      for (let px = 0; px < w; px++) {
        if (ditherPick(x + px, y + dy, ratio)) {
          ctx.fillStyle = edgeColor
          ctx.fillRect(x + px, y + dy, 1, 1)
        }
      }
    }
  }
  if (sides.bottom) {
    for (let dy = 0; dy < d; dy++) {
      const ratio = 1 - dy / d
      const yy = y + h - 1 - dy
      for (let px = 0; px < w; px++) {
        if (ditherPick(x + px, yy, ratio)) {
          ctx.fillStyle = edgeColor
          ctx.fillRect(x + px, yy, 1, 1)
        }
      }
    }
  }
  if (sides.left) {
    for (let dx = 0; dx < d; dx++) {
      const ratio = 1 - dx / d
      for (let py = 0; py < h; py++) {
        if (ditherPick(x + dx, y + py, ratio)) {
          ctx.fillStyle = edgeColor
          ctx.fillRect(x + dx, y + py, 1, 1)
        }
      }
    }
  }
  if (sides.right) {
    for (let dx = 0; dx < d; dx++) {
      const ratio = 1 - dx / d
      const xx = x + w - 1 - dx
      for (let py = 0; py < h; py++) {
        if (ditherPick(xx, y + py, ratio)) {
          ctx.fillStyle = edgeColor
          ctx.fillRect(xx, y + py, 1, 1)
        }
      }
    }
  }
}
