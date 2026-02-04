/**
 * キャラクタースプライト描画システム
 */

import type { Direction } from '@/types'

// キャラクター色（仮実装：実際のスプライト画像が用意されるまで）
const CHARACTER_COLOR = '#4A90E2' // 主人公カラー（青）
const DIRECTION_INDICATOR_COLOR = '#FFFFFF' // 向き表示（白）

export class CharacterRenderer {
  private tileSize: number

  constructor(tileSize: number = 32) {
    this.tileSize = tileSize
  }

  /**
   * キャラクターを描画（仮実装：色付き四角形）
   */
  render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    direction: Direction,
    animationFrame: number,
    cameraX: number = 0,
    cameraY: number = 0
  ): void {
    const screenX = x - cameraX
    const screenY = y - cameraY

    // 画面外は描画しない
    if (
      screenX + this.tileSize < 0 ||
      screenY + this.tileSize < 0 ||
      screenX > ctx.canvas.width ||
      screenY > ctx.canvas.height
    ) {
      return
    }

    // キャラクター本体（青い四角形）
    ctx.fillStyle = CHARACTER_COLOR
    ctx.fillRect(screenX + 4, screenY + 4, this.tileSize - 8, this.tileSize - 8)

    // 向き表示（方向を示す小さな四角形）
    this.renderDirectionIndicator(ctx, screenX, screenY, direction)

    // アニメーションフレーム表示（デバッグ用）
    this.renderAnimationFrame(ctx, screenX, screenY, animationFrame)

    // 枠線
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.strokeRect(screenX + 4, screenY + 4, this.tileSize - 8, this.tileSize - 8)
  }

  /**
   * 向き表示を描画
   */
  private renderDirectionIndicator(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    direction: Direction
  ): void {
    ctx.fillStyle = DIRECTION_INDICATOR_COLOR

    const centerX = x + this.tileSize / 2
    const centerY = y + this.tileSize / 2
    const indicatorSize = 4

    let indicatorX = centerX
    let indicatorY = centerY

    switch (direction) {
      case 'up':
        indicatorY = y + 8
        break
      case 'down':
        indicatorY = y + this.tileSize - 8
        break
      case 'left':
        indicatorX = x + 8
        break
      case 'right':
        indicatorX = x + this.tileSize - 8
        break
    }

    ctx.fillRect(
      indicatorX - indicatorSize / 2,
      indicatorY - indicatorSize / 2,
      indicatorSize,
      indicatorSize
    )
  }

  /**
   * アニメーションフレーム表示（デバッグ用）
   */
  private renderAnimationFrame(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    frame: number
  ): void {
    ctx.fillStyle = '#FFFF00' // 黄色
    ctx.font = '10px monospace'
    ctx.fillText(`${frame}`, x + 6, y + 14)
  }
}
