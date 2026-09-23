/**
 * Procedural tileset generator using Canvas API
 * Generates 32x32 tile images for the map renderer
 *
 * 色は全て `palette.ts` の固定パレットから選ぶこと（生の16進値を書かない）。
 */

import { PALETTE, withAlpha } from './palette'

function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

class TilesetGeneratorClass {
  private cache = new Map<string, HTMLCanvasElement>()
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    // Pre-generate all static tiles
    for (let id = 1; id <= 10; id++) {
      this.getTile(id)
    }
    // Pre-generate water animation frames
    for (let f = 0; f < 4; f++) {
      this.getTile(5, f)
      this.getTile(10, f)
    }

    this.initialized = true
  }

  getTile(tileId: number, frame?: number): HTMLCanvasElement {
    const key = `tile_${tileId}_${frame ?? 0}`
    const cached = this.cache.get(key)
    if (cached) return cached

    const canvas = this.generateTile(tileId, frame ?? 0)
    this.cache.set(key, canvas)
    return canvas
  }

  private generateTile(tileId: number, frame: number): HTMLCanvasElement {
    const size = 32
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')!

    switch (tileId) {
      case 1: this.drawWall(ctx, size); break
      case 2: this.drawGrass(ctx, size); break
      case 3: this.drawStonePath(ctx, size); break
      case 4: this.drawTatami(ctx, size); break
      case 5: this.drawWater(ctx, size, frame); break
      case 6: this.drawShoji(ctx, size); break
      case 7: this.drawCastleWall(ctx, size); break
      case 8: this.drawMountainPath(ctx, size); break
      case 9: this.drawForest(ctx, size); break
      case 10: this.drawSea(ctx, size, frame); break
      default:
        ctx.fillStyle = '#ff00ff'
        ctx.fillRect(0, 0, size, size)
    }

    return canvas
  }

  // Tile 1: Wall - brown stone with mortar lines
  private drawWall(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.fillStyle = PALETTE.KUCHIBA
    ctx.fillRect(0, 0, size, size)

    // Mortar lines
    ctx.strokeStyle = PALETTE.TOBI
    ctx.lineWidth = 1

    // Horizontal mortar
    for (let y = 8; y < size; y += 8) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(size, y)
      ctx.stroke()
    }

    // Vertical mortar (staggered)
    for (let row = 0; row < 4; row++) {
      const offset = row % 2 === 0 ? 0 : 8
      for (let x = offset; x < size; x += 16) {
        ctx.beginPath()
        ctx.moveTo(x, row * 8)
        ctx.lineTo(x, (row + 1) * 8)
        ctx.stroke()
      }
    }

    // Color variations
    const rng = this.seededRandom(1)
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(rng() * size)
      const y = Math.floor(rng() * size)
      ctx.fillStyle = rng() > 0.5 ? PALETTE.SUNA : PALETTE.TOBI
      ctx.fillRect(x, y, 2, 2)
    }
  }

  // Tile 2: Grass
  private drawGrass(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.fillStyle = PALETTE.WAKAKUSA
    ctx.fillRect(0, 0, size, size)

    const rng = this.seededRandom(2)

    // Darker grass patches
    for (let i = 0; i < 12; i++) {
      const x = Math.floor(rng() * size)
      const y = Math.floor(rng() * size)
      ctx.fillStyle = PALETTE.MIDORI
      ctx.fillRect(x, y, 3, 2)
    }

    // Light patches
    for (let i = 0; i < 6; i++) {
      const x = Math.floor(rng() * size)
      const y = Math.floor(rng() * size)
      ctx.fillStyle = PALETTE.MOEGI
      ctx.fillRect(x, y, 2, 2)
    }

    // Small earth spots
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(rng() * (size - 2))
      const y = Math.floor(rng() * (size - 2))
      ctx.fillStyle = PALETTE.KUCHIBA
      ctx.fillRect(x, y, 2, 2)
    }
  }

  // Tile 3: Stone path
  private drawStonePath(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.fillStyle = PALETTE.GINNEZU
    ctx.fillRect(0, 0, size, size)

    const rng = this.seededRandom(3)

    // Rounded stone pattern
    const stones = [
      { x: 2, y: 2, w: 12, h: 10 },
      { x: 16, y: 1, w: 14, h: 11 },
      { x: 1, y: 14, w: 14, h: 10 },
      { x: 17, y: 14, w: 13, h: 11 },
      { x: 6, y: 26, w: 12, h: 5 },
      { x: 20, y: 27, w: 10, h: 4 },
    ]

    const stoneShades = [PALETTE.NEZUMI, PALETTE.GINNEZU, PALETTE.KINARI]

    for (const stone of stones) {
      ctx.fillStyle = stoneShades[Math.floor(rng() * stoneShades.length)] ?? PALETTE.GINNEZU
      ctx.beginPath()
      ctx.roundRect(stone.x, stone.y, stone.w, stone.h, 3)
      ctx.fill()

      // Stone outline
      ctx.strokeStyle = PALETTE.NEZUMI
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(stone.x, stone.y, stone.w, stone.h, 3)
      ctx.stroke()
    }
  }

  // Tile 4: Tatami
  private drawTatami(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.fillStyle = PALETTE.TATAMI
    ctx.fillRect(0, 0, size, size)

    // Weave pattern lines
    ctx.strokeStyle = PALETTE.SUNA
    ctx.lineWidth = 1

    for (let y = 0; y < size; y += 4) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(size, y)
      ctx.stroke()
    }

    // Border
    ctx.strokeStyle = PALETTE.KUCHIBA
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, size - 2, size - 2)
  }

  // Tile 5: Water (animated)
  private drawWater(ctx: CanvasRenderingContext2D, size: number, frame: number): void {
    ctx.fillStyle = PALETTE.MIZU
    ctx.fillRect(0, 0, size, size)

    const offset = frame * 4

    // Wave pattern
    ctx.strokeStyle = PALETTE.MIZU_LIGHT
    ctx.lineWidth = 2

    for (let y = 4; y < size; y += 8) {
      ctx.beginPath()
      for (let x = -8; x <= size + 8; x += 2) {
        const wy = y + Math.sin((x + offset) * 0.4) * 2
        if (x === -8) {
          ctx.moveTo(x, wy)
        } else {
          ctx.lineTo(x, wy)
        }
      }
      ctx.stroke()
    }

    // Lighter highlights
    ctx.strokeStyle = PALETTE.MIZU_FOAM
    ctx.lineWidth = 1
    for (let y = 8; y < size; y += 12) {
      ctx.beginPath()
      for (let x = -4; x <= size + 4; x += 2) {
        const wy = y + Math.sin((x + offset + 10) * 0.5) * 1.5
        if (x === -4) {
          ctx.moveTo(x, wy)
        } else {
          ctx.lineTo(x, wy)
        }
      }
      ctx.stroke()
    }
  }

  // Tile 6: Shoji (paper door)
  private drawShoji(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.fillStyle = PALETTE.SHIRO
    ctx.fillRect(0, 0, size, size)

    // Grid lines (wood frame)
    ctx.strokeStyle = PALETTE.KUCHIBA
    ctx.lineWidth = 2

    // Vertical dividers
    ctx.beginPath()
    ctx.moveTo(0, 0); ctx.lineTo(0, size)
    ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size)
    ctx.moveTo(size, 0); ctx.lineTo(size, size)
    ctx.stroke()

    // Horizontal dividers
    ctx.beginPath()
    ctx.moveTo(0, 0); ctx.lineTo(size, 0)
    ctx.moveTo(0, size / 3); ctx.lineTo(size, size / 3)
    ctx.moveTo(0, (size * 2) / 3); ctx.lineTo(size, (size * 2) / 3)
    ctx.moveTo(0, size); ctx.lineTo(size, size)
    ctx.stroke()
  }

  // Tile 7: Castle wall
  private drawCastleWall(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.fillStyle = PALETTE.GINNEZU
    ctx.fillRect(0, 0, size, size)

    // Large stone blocks
    const blocks = [
      { x: 0, y: 0, w: 16, h: 16 },
      { x: 16, y: 0, w: 16, h: 16 },
      { x: 8, y: 16, w: 16, h: 16 },
      { x: -8, y: 16, w: 16, h: 16 },
      { x: 24, y: 16, w: 8, h: 16 },
    ]

    const rng = this.seededRandom(7)
    const blockShades = [PALETTE.GINNEZU, PALETTE.GIN]
    for (const block of blocks) {
      ctx.fillStyle = blockShades[Math.floor(rng() * blockShades.length)] ?? PALETTE.GINNEZU
      ctx.fillRect(block.x, block.y, block.w, block.h)
      ctx.strokeStyle = PALETTE.NEZUMI
      ctx.lineWidth = 1
      ctx.strokeRect(block.x, block.y, block.w, block.h)
    }
  }

  // Tile 8: Mountain path
  private drawMountainPath(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.fillStyle = PALETTE.KUCHIBA
    ctx.fillRect(0, 0, size, size)

    const rng = this.seededRandom(8)

    // Earth texture
    for (let i = 0; i < 15; i++) {
      const x = Math.floor(rng() * size)
      const y = Math.floor(rng() * size)
      ctx.fillStyle = rng() > 0.5 ? PALETTE.SUNA : PALETTE.TOBI
      ctx.fillRect(x, y, 3, 2)
    }

    // TODO(Phase13-TaskB): グラデーション廃止・パレット化（ellipse を用いた岩の描画）
    // Small rocks
    for (let i = 0; i < 4; i++) {
      const x = Math.floor(rng() * (size - 4))
      const y = Math.floor(rng() * (size - 4))
      ctx.fillStyle = '#a0a090'
      ctx.beginPath()
      ctx.ellipse(x + 2, y + 2, 2, 1.5, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // TODO(Phase13-TaskB): グラデーション廃止・パレット化（arc を用いた樹冠の描画）
  // Tile 9: Forest
  private drawForest(ctx: CanvasRenderingContext2D, size: number): void {
    // Dark ground
    ctx.fillStyle = '#2a5a20'
    ctx.fillRect(0, 0, size, size)

    // Tree canopy blobs
    const trees = [
      { x: 8, y: 8, r: 10 },
      { x: 24, y: 6, r: 9 },
      { x: 4, y: 22, r: 8 },
      { x: 20, y: 24, r: 10 },
      { x: 14, y: 16, r: 7 },
    ]

    for (const tree of trees) {
      // Dark shadow
      ctx.fillStyle = '#1a4a10'
      ctx.beginPath()
      ctx.arc(tree.x + 1, tree.y + 1, tree.r, 0, Math.PI * 2)
      ctx.fill()

      // Canopy
      ctx.fillStyle = '#2a6a1a'
      ctx.beginPath()
      ctx.arc(tree.x, tree.y, tree.r, 0, Math.PI * 2)
      ctx.fill()

      // Highlights
      ctx.fillStyle = '#3a7a2a'
      ctx.beginPath()
      ctx.arc(tree.x - 2, tree.y - 2, tree.r * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Tile 10: Sea (animated)
  private drawSea(ctx: CanvasRenderingContext2D, size: number, frame: number): void {
    ctx.fillStyle = PALETTE.MIZU_DEEP
    ctx.fillRect(0, 0, size, size)

    const offset = frame * 3

    // Deep wave lines
    ctx.strokeStyle = PALETTE.MIZU
    ctx.lineWidth = 2
    for (let y = 6; y < size; y += 10) {
      ctx.beginPath()
      for (let x = -6; x <= size + 6; x += 2) {
        const wy = y + Math.sin((x + offset) * 0.3) * 2
        if (x === -6) ctx.moveTo(x, wy)
        else ctx.lineTo(x, wy)
      }
      ctx.stroke()
    }

    // White foam
    ctx.strokeStyle = withAlpha(PALETTE.SHIRO, 0.3)
    ctx.lineWidth = 1
    for (let y = 3; y < size; y += 14) {
      ctx.beginPath()
      for (let x = -4; x <= size + 4; x += 2) {
        const wy = y + Math.sin((x + offset * 1.5) * 0.5) * 1
        if (x === -4) ctx.moveTo(x, wy)
        else ctx.lineTo(x, wy)
      }
      ctx.stroke()
    }
  }

  // Simple seeded PRNG for deterministic tile patterns
  private seededRandom(seed: number): () => number {
    let s = seed
    return () => {
      s = (s * 16807 + 0) % 2147483647
      return (s - 1) / 2147483646
    }
  }
}

export const tilesetGenerator = new TilesetGeneratorClass()
