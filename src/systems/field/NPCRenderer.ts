/**
 * NPC描画システム
 */

import type { NPC } from '@/types'

// NPC色（仮実装：実際のスプライト画像が用意されるまで）
const NPC_COLOR = '#E74C3C' // NPCカラー（赤）
const DIRECTION_INDICATOR_COLOR = '#FFFFFF' // 向き表示（白）

export class NPCRenderer {
  private tileSize: number

  constructor(tileSize: number = 32) {
    this.tileSize = tileSize
  }

  /**
   * NPCを描画（仮実装：色付き四角形）
   */
  render(
    ctx: CanvasRenderingContext2D,
    npc: NPC,
    cameraX: number = 0,
    cameraY: number = 0
  ): void {
    const x = npc.position.x * this.tileSize
    const y = npc.position.y * this.tileSize

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

    // NPC本体（赤い四角形）
    ctx.fillStyle = NPC_COLOR
    ctx.fillRect(screenX + 4, screenY + 4, this.tileSize - 8, this.tileSize - 8)

    // 向き表示
    this.renderDirectionIndicator(ctx, screenX, screenY, npc.direction)

    // 枠線
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.strokeRect(screenX + 4, screenY + 4, this.tileSize - 8, this.tileSize - 8)

    // NPC名表示（デバッグ用）
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '8px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(npc.name, screenX + this.tileSize / 2, screenY + this.tileSize + 10)
  }

  /**
   * 向き表示を描画
   */
  private renderDirectionIndicator(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    direction: string
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
   * 複数のNPCを描画
   */
  renderAll(
    ctx: CanvasRenderingContext2D,
    npcs: NPC[],
    cameraX: number = 0,
    cameraY: number = 0
  ): void {
    for (const npc of npcs) {
      this.render(ctx, npc, cameraX, cameraY)
    }
  }
}
