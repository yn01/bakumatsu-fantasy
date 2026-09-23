/**
 * ピクセルパーフェクト描画パイプラインの共通定義
 *
 * 全ての描画は論理解像度 320x240 のオフスクリーンCanvasに対して行い、
 * 表示用Canvasへ整数倍で転送する。
 */

/** 論理解像度（横） */
export const LOGICAL_WIDTH = 320
/** 論理解像度（縦） */
export const LOGICAL_HEIGHT = 240
/** 論理座標系でのタイルサイズ（px） */
export const TILE_SIZE = 16

/** 論理解像度でのタイル表示数（320/16 = 20, 240/16 = 15） */
export const VIEWPORT_TILES_X = LOGICAL_WIDTH / TILE_SIZE
export const VIEWPORT_TILES_Y = LOGICAL_HEIGHT / TILE_SIZE

/** 表示倍率の上限 */
export const MAX_DISPLAY_SCALE = 6

/**
 * 2Dコンテキストの補間を無効化する（ニアレストネイバー描画）
 */
export const disableSmoothing = (ctx: CanvasRenderingContext2D): void => {
  ctx.imageSmoothingEnabled = false
  // ベンダープレフィックス版（古いブラウザ向け）
  const anyCtx = ctx as unknown as Record<string, unknown>
  anyCtx.mozImageSmoothingEnabled = false
  anyCtx.webkitImageSmoothingEnabled = false
  anyCtx.msImageSmoothingEnabled = false
}

/**
 * 論理解像度のオフスクリーンCanvasを生成する
 */
export const createLogicalCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas')
  canvas.width = LOGICAL_WIDTH
  canvas.height = LOGICAL_HEIGHT
  const ctx = canvas.getContext('2d')
  if (ctx) disableSmoothing(ctx)
  return canvas
}

/**
 * 利用可能な領域に収まる最大の整数倍率を計算する
 */
export const computeIntegerScale = (
  availableWidth: number,
  availableHeight: number,
  maxScale: number = MAX_DISPLAY_SCALE
): number => {
  const scaleX = Math.floor(availableWidth / LOGICAL_WIDTH)
  const scaleY = Math.floor(availableHeight / LOGICAL_HEIGHT)
  const scale = Math.min(scaleX, scaleY)
  return Math.max(1, Math.min(maxScale, Number.isFinite(scale) ? scale : 1))
}

/**
 * devicePixelRatio を考慮したバックバッファ倍率を計算する。
 * ニアレストネイバー転送を保つため、常に整数へ丸める。
 */
export const computeBackingScale = (
  displayScale: number,
  devicePixelRatio: number = 1
): number => {
  return Math.max(1, Math.round(displayScale * (devicePixelRatio || 1)))
}

/**
 * 論理Canvasを表示Canvasへ整数倍で転送する
 */
export const presentLogicalCanvas = (
  source: HTMLCanvasElement,
  displayCtx: CanvasRenderingContext2D
): void => {
  const { width, height } = displayCtx.canvas
  displayCtx.drawImage(source, 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT, 0, 0, width, height)
}

/**
 * 論理ピクセル単位へスナップする（にじみ防止）
 */
export const snap = (value: number): number => Math.round(value)
