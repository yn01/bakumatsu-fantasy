/**
 * NPC描画システム
 */

import type { NPC } from '@/types'
import { spriteGenerator } from '@/systems/graphics/SpriteGenerator'
import { TILE_SIZE, snap } from '@/systems/graphics/pixelCanvas'

// NPC ID prefix to sprite type mapping
function getNPCType(npc: NPC): string {
  const id = npc.id.toLowerCase()
  if (id.includes('merchant') || id.includes('shop') || id.includes('vendor')) return 'merchant'
  if (id.includes('guard') || id.includes('soldier')) return 'guard'
  if (id.includes('samurai') || id.includes('warrior')) return 'samurai'
  if (id.includes('woman') || id.includes('wife') || id.includes('girl')) return 'woman'
  if (id.includes('elder') || id.includes('old')) return 'elder'
  return 'villager'
}

export class NPCRenderer {
  private tileSize: number

  constructor(tileSize: number = TILE_SIZE) {
    this.tileSize = tileSize
  }

  /**
   * NPCを描画（SpriteGenerator使用）
   */
  render(
    ctx: CanvasRenderingContext2D,
    npc: NPC,
    cameraX: number = 0,
    cameraY: number = 0
  ): void {
    const x = npc.position.x * this.tileSize
    const y = npc.position.y * this.tileSize

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

    const npcType = getNPCType(npc)
    // 16x16ネイティブ生成のスプライトを等倍描画
    const sprite = spriteGenerator.getNPCSprite(npcType, npc.direction, 0)
    ctx.drawImage(sprite, screenX, screenY, this.tileSize, this.tileSize)

    // NPC名表示
    // TODO(Phase13-TaskB): 320x240ではベクターフォントが潰れるためビットマップフォント化する
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '6px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(npc.name, snap(screenX + this.tileSize / 2), snap(screenY + this.tileSize + 6))
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
