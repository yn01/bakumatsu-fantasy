/**
 * キャラクタースプライト描画システム
 */

import type { Direction } from '@/types'
import { spriteGenerator } from '@/systems/graphics/SpriteGenerator'
import { TILE_SIZE, snap } from '@/systems/graphics/pixelCanvas'

export class CharacterRenderer {
  private tileSize: number

  constructor(tileSize: number = TILE_SIZE) {
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
    const screenX = snap(x - cameraX)
    const screenY = snap(y - cameraY)

    // 画面外は描画しない
    if (
      screenX + this.tileSize < 0 ||
      screenY + this.tileSize < 0 ||
      screenX > ctx.canvas.width ||
      screenY > ctx.canvas.height
    ) {
      return
    }

    const frame = (animationFrame % 4) as 0 | 1 | 2 | 3
    // 16x16ネイティブ生成のスプライトを等倍描画
    const sprite = spriteGenerator.getCharacterSprite(characterId, direction, frame)
    ctx.drawImage(sprite, screenX, screenY, this.tileSize, this.tileSize)
  }
}
