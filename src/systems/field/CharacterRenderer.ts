/**
 * キャラクタースプライト描画システム
 */

import type { Direction } from '@/types'
import { spriteGenerator } from '@/systems/graphics/SpriteGenerator'

export class CharacterRenderer {
  private tileSize: number

  constructor(tileSize: number = 32) {
    this.tileSize = tileSize
  }

  /**
   * キャラクターを描画（SpriteGenerator使用）
   */
  render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    direction: Direction,
    animationFrame: number,
    cameraX: number = 0,
    cameraY: number = 0,
    characterId: string = 'ryoma'
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

    const frame = (animationFrame % 3) as 0 | 1 | 2
    const sprite = spriteGenerator.getCharacterSprite(characterId, direction, frame, 32)
    ctx.drawImage(sprite, screenX, screenY, this.tileSize, this.tileSize)
  }
}
