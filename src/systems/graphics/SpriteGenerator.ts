/**
 * Procedural sprite generator using Canvas API
 * Generates pixel-art chibi characters for field (32x32) and battle (64x64) views
 */

import {
  CHARACTER_CONFIGS,
  NPC_CONFIGS,
  ENEMY_CONFIGS,
  type SpriteConfig,
  type EnemySpriteConfig,
} from './spriteConfigs'

type DirectionType = 'up' | 'down' | 'left' | 'right'
type FrameType = 0 | 1 | 2

function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  color: string
): void {
  ctx.fillStyle = color
  ctx.fillRect(x * s, y * s, s, s)
}

// Draw a filled rectangle region in pixel units
function pxRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  s: number,
  color: string
): void {
  ctx.fillStyle = color
  ctx.fillRect(x * s, y * s, w * s, h * s)
}

class SpriteGeneratorClass {
  private cache = new Map<string, HTMLCanvasElement>()
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    // Pre-generate all character sprites
    for (const id of Object.keys(CHARACTER_CONFIGS)) {
      for (const dir of ['up', 'down', 'left', 'right'] as DirectionType[]) {
        for (const frame of [0, 1, 2] as FrameType[]) {
          this.getCharacterSprite(id, dir, frame, 32)
          this.getCharacterSprite(id, dir, frame, 64)
        }
      }
    }

    // Pre-generate NPC sprites
    for (const type of Object.keys(NPC_CONFIGS)) {
      for (const dir of ['up', 'down', 'left', 'right'] as DirectionType[]) {
        this.getNPCSprite(type, dir, 0)
      }
    }

    // Pre-generate enemy sprites
    for (const id of Object.keys(ENEMY_CONFIGS)) {
      this.getEnemySprite(id, 64)
    }

    this.initialized = true
  }

  getCharacterSprite(
    id: string,
    direction: DirectionType,
    frame: FrameType,
    size: 32 | 64
  ): HTMLCanvasElement {
    const key = `char_${id}_${direction}_${frame}_${size}`
    const cached = this.cache.get(key)
    if (cached) return cached

    const config = (CHARACTER_CONFIGS[id] ?? CHARACTER_CONFIGS['ryoma'])!
    const canvas = this.generateCharacterSprite(config, direction, frame, size)
    this.cache.set(key, canvas)
    return canvas
  }

  getNPCSprite(
    npcType: string,
    direction: string,
    frame: number
  ): HTMLCanvasElement {
    const key = `npc_${npcType}_${direction}_${frame}`
    const cached = this.cache.get(key)
    if (cached) return cached

    const config = (NPC_CONFIGS[npcType] ?? NPC_CONFIGS['villager'])!
    const canvas = this.generateCharacterSprite(
      config,
      direction as DirectionType,
      (frame % 3) as FrameType,
      32
    )
    this.cache.set(key, canvas)
    return canvas
  }

  getEnemySprite(id: string, size: 64): HTMLCanvasElement {
    const key = `enemy_${id}_${size}`
    const cached = this.cache.get(key)
    if (cached) return cached

    const config = (ENEMY_CONFIGS[id] ?? ENEMY_CONFIGS['bandit'])!
    const canvas = this.generateEnemySprite(config, id, size)
    this.cache.set(key, canvas)
    return canvas
  }

  private generateCharacterSprite(
    config: SpriteConfig,
    direction: DirectionType,
    frame: FrameType,
    size: 32 | 64
  ): HTMLCanvasElement {
    // We draw on a 16x16 grid then scale
    const gridSize = 16
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')!
    const s = size / gridSize // scale factor

    const { hairColor, skinColor, topColor, bottomColor, accessoryColor, isLarge, hasLongHair } = config

    // Walk animation offsets
    const legOffset = frame === 1 ? -1 : frame === 2 ? 1 : 0
    const bodyBounce = frame === 0 ? 0 : -0.5

    // Character width adjustments for large characters
    const bodyW = isLarge ? 10 : 8
    const bodyX = Math.floor((gridSize - bodyW) / 2)

    if (direction === 'down') {
      this.drawCharacterFront(ctx, s, hairColor, skinColor, topColor, bottomColor, accessoryColor, hasLongHair, isLarge, bodyX, bodyW, legOffset, bodyBounce)
    } else if (direction === 'up') {
      this.drawCharacterBack(ctx, s, hairColor, topColor, bottomColor, isLarge, bodyX, bodyW, legOffset, bodyBounce)
    } else if (direction === 'left') {
      this.drawCharacterSide(ctx, s, hairColor, skinColor, topColor, bottomColor, hasLongHair, isLarge, bodyX, bodyW, legOffset, bodyBounce, false)
    } else {
      this.drawCharacterSide(ctx, s, hairColor, skinColor, topColor, bottomColor, hasLongHair, isLarge, bodyX, bodyW, legOffset, bodyBounce, true)
    }

    return canvas
  }

  private drawCharacterFront(
    ctx: CanvasRenderingContext2D,
    s: number,
    hairColor: string,
    skinColor: string,
    topColor: string,
    bottomColor: string,
    accessoryColor: string | undefined,
    hasLongHair: boolean | undefined,
    isLarge: boolean | undefined,
    bodyX: number,
    bodyW: number,
    legOffset: number,
    bodyBounce: number
  ): void {
    const headW = isLarge ? 10 : 8
    const headX = Math.floor((16 - headW) / 2)
    const headY = 1 + bodyBounce

    // Hair (top)
    pxRect(ctx, headX, headY, headW, 3, s, hairColor)

    // Face
    pxRect(ctx, headX, headY + 3, headW, 4, s, skinColor)

    // Eyes
    const eyeY = headY + 4
    px(ctx, headX + 2, eyeY, s, '#1a1a1a')
    px(ctx, headX + headW - 3, eyeY, s, '#1a1a1a')

    // Mouth
    px(ctx, headX + Math.floor(headW / 2), headY + 6, s, '#c08060')

    // Long hair sides
    if (hasLongHair) {
      pxRect(ctx, headX - 1, headY + 2, 1, 6, s, hairColor)
      pxRect(ctx, headX + headW, headY + 2, 1, 6, s, hairColor)
    }

    // Hair sides
    px(ctx, headX, headY + 3, s, hairColor)
    px(ctx, headX + headW - 1, headY + 3, s, hairColor)

    // Body (top/kimono)
    const bodyY = headY + 7
    pxRect(ctx, bodyX, bodyY + bodyBounce, bodyW, 3, s, topColor)

    // Accessory (belt/sash)
    if (accessoryColor) {
      pxRect(ctx, bodyX, bodyY + 3 + bodyBounce, bodyW, 1, s, accessoryColor)
    }

    // Bottom (hakama)
    const bottomY = bodyY + (accessoryColor ? 4 : 3)
    pxRect(ctx, bodyX, bottomY + bodyBounce, bodyW, 3, s, bottomColor)

    // Legs
    const legY = bottomY + 3
    const legW = isLarge ? 4 : 3
    // Left leg
    pxRect(ctx, bodyX + 1 + legOffset, legY + bodyBounce, legW, 2, s, bottomColor)
    // Right leg
    pxRect(ctx, bodyX + bodyW - legW - 1 - legOffset, legY + bodyBounce, legW, 2, s, bottomColor)

    // Feet
    pxRect(ctx, bodyX + 1 + legOffset, legY + 2 + bodyBounce, legW, 1, s, '#3a2a1a')
    pxRect(ctx, bodyX + bodyW - legW - 1 - legOffset, legY + 2 + bodyBounce, legW, 1, s, '#3a2a1a')
  }

  private drawCharacterBack(
    ctx: CanvasRenderingContext2D,
    s: number,
    hairColor: string,
    topColor: string,
    bottomColor: string,
    isLarge: boolean | undefined,
    bodyX: number,
    bodyW: number,
    legOffset: number,
    bodyBounce: number
  ): void {
    const headW = isLarge ? 10 : 8
    const headX = Math.floor((16 - headW) / 2)
    const headY = 1 + bodyBounce

    // Hair (full back of head)
    pxRect(ctx, headX, headY, headW, 7, s, hairColor)

    // Body
    const bodyY = headY + 7
    pxRect(ctx, bodyX, bodyY + bodyBounce, bodyW, 3, s, topColor)

    // Bottom
    pxRect(ctx, bodyX, bodyY + 3 + bodyBounce, bodyW, 4, s, bottomColor)

    // Legs
    const legY = bodyY + 7
    const legW = isLarge ? 4 : 3
    pxRect(ctx, bodyX + 1 + legOffset, legY + bodyBounce, legW, 2, s, bottomColor)
    pxRect(ctx, bodyX + bodyW - legW - 1 - legOffset, legY + bodyBounce, legW, 2, s, bottomColor)
    pxRect(ctx, bodyX + 1 + legOffset, legY + 2 + bodyBounce, legW, 1, s, '#3a2a1a')
    pxRect(ctx, bodyX + bodyW - legW - 1 - legOffset, legY + 2 + bodyBounce, legW, 1, s, '#3a2a1a')
  }

  private drawCharacterSide(
    ctx: CanvasRenderingContext2D,
    s: number,
    hairColor: string,
    skinColor: string,
    topColor: string,
    bottomColor: string,
    hasLongHair: boolean | undefined,
    isLarge: boolean | undefined,
    bodyX: number,
    bodyW: number,
    legOffset: number,
    bodyBounce: number,
    facingRight: boolean
  ): void {
    const headW = isLarge ? 9 : 7
    const headX = facingRight ? Math.floor((16 - headW) / 2) : Math.floor((16 - headW) / 2) + 1
    const headY = 1 + bodyBounce

    // Hair
    pxRect(ctx, headX, headY, headW, 3, s, hairColor)

    // Face side
    if (facingRight) {
      pxRect(ctx, headX, headY + 3, headW - 1, 4, s, hairColor) // back of head
      pxRect(ctx, headX + headW - 3, headY + 3, 3, 4, s, skinColor) // face
      px(ctx, headX + headW - 2, headY + 4, s, '#1a1a1a') // eye
    } else {
      pxRect(ctx, headX + 1, headY + 3, headW - 1, 4, s, hairColor)
      pxRect(ctx, headX, headY + 3, 3, 4, s, skinColor)
      px(ctx, headX + 1, headY + 4, s, '#1a1a1a')
    }

    // Long hair trailing
    if (hasLongHair) {
      const trailX = facingRight ? headX - 1 : headX + headW
      pxRect(ctx, trailX, headY + 2, 1, 7, s, hairColor)
    }

    // Body
    const sideBodyW = bodyW - 1
    const sideBodyX = facingRight ? bodyX : bodyX + 1
    const bodyY = headY + 7
    pxRect(ctx, sideBodyX, bodyY + bodyBounce, sideBodyW, 3, s, topColor)

    // Arm
    const armX = facingRight ? sideBodyX + sideBodyW : sideBodyX - 1
    pxRect(ctx, armX, bodyY + 1 + bodyBounce, 1, 3, s, skinColor)

    // Bottom
    pxRect(ctx, sideBodyX, bodyY + 3 + bodyBounce, sideBodyW, 4, s, bottomColor)

    // Legs (side view - one in front, one behind)
    const legY = bodyY + 7
    const legW = isLarge ? 3 : 2
    // Front leg
    pxRect(ctx, sideBodyX + 1 + legOffset, legY + bodyBounce, legW, 2, s, bottomColor)
    pxRect(ctx, sideBodyX + 1 + legOffset, legY + 2 + bodyBounce, legW, 1, s, '#3a2a1a')
    // Back leg
    pxRect(ctx, sideBodyX + sideBodyW - legW - 1 - legOffset, legY + bodyBounce, legW, 2, s, bottomColor)
    pxRect(ctx, sideBodyX + sideBodyW - legW - 1 - legOffset, legY + 2 + bodyBounce, legW, 1, s, '#3a2a1a')
  }

  private generateEnemySprite(
    config: EnemySpriteConfig,
    _id: string,
    size: number
  ): HTMLCanvasElement {
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')!
    const s = size / 16

    switch (config.shape) {
      case 'beast':
        this.drawBeastEnemy(ctx, s, config)
        break
      case 'large_humanoid':
        this.drawLargeHumanoidEnemy(ctx, s, config)
        break
      default:
        this.drawHumanoidEnemy(ctx, s, config)
        break
    }

    return canvas
  }

  private drawHumanoidEnemy(
    ctx: CanvasRenderingContext2D,
    s: number,
    config: EnemySpriteConfig
  ): void {
    const { primaryColor, secondaryColor, accentColor, weaponColor } = config

    // Head
    pxRect(ctx, 5, 1, 6, 5, s, secondaryColor)
    // Eyes (menacing)
    px(ctx, 6, 3, s, '#ff3030')
    px(ctx, 9, 3, s, '#ff3030')

    // Body
    pxRect(ctx, 4, 6, 8, 4, s, primaryColor)
    // Accent (sash/belt)
    pxRect(ctx, 4, 9, 8, 1, s, accentColor)

    // Arms
    pxRect(ctx, 2, 6, 2, 4, s, secondaryColor)
    pxRect(ctx, 12, 6, 2, 4, s, secondaryColor)

    // Weapon (right hand)
    if (weaponColor) {
      pxRect(ctx, 13, 3, 1, 5, s, weaponColor)
      px(ctx, 13, 2, s, weaponColor)
    }

    // Legs
    pxRect(ctx, 5, 10, 3, 3, s, primaryColor)
    pxRect(ctx, 9, 10, 3, 3, s, primaryColor)
    // Feet
    pxRect(ctx, 5, 13, 3, 1, s, '#2a2a2a')
    pxRect(ctx, 9, 13, 3, 1, s, '#2a2a2a')
  }

  private drawLargeHumanoidEnemy(
    ctx: CanvasRenderingContext2D,
    s: number,
    config: EnemySpriteConfig
  ): void {
    const { primaryColor, secondaryColor, accentColor, weaponColor } = config

    // Head (larger)
    pxRect(ctx, 4, 0, 8, 5, s, secondaryColor)
    // Eyes
    px(ctx, 5, 2, s, '#ff3030')
    px(ctx, 10, 2, s, '#ff3030')

    // Body (wider)
    pxRect(ctx, 2, 5, 12, 5, s, primaryColor)
    // Accent
    pxRect(ctx, 2, 8, 12, 1, s, accentColor)

    // Arms
    pxRect(ctx, 0, 5, 2, 5, s, secondaryColor)
    pxRect(ctx, 14, 5, 2, 5, s, secondaryColor)

    // Weapon
    if (weaponColor) {
      pxRect(ctx, 14, 1, 2, 7, s, weaponColor)
      px(ctx, 14, 0, s, weaponColor)
      px(ctx, 15, 0, s, weaponColor)
    }

    // Legs
    pxRect(ctx, 3, 10, 4, 4, s, primaryColor)
    pxRect(ctx, 9, 10, 4, 4, s, primaryColor)
    pxRect(ctx, 3, 14, 4, 1, s, '#2a2a2a')
    pxRect(ctx, 9, 14, 4, 1, s, '#2a2a2a')
  }

  private drawBeastEnemy(
    ctx: CanvasRenderingContext2D,
    s: number,
    config: EnemySpriteConfig
  ): void {
    const { primaryColor, secondaryColor, accentColor } = config

    // Body (horizontal)
    pxRect(ctx, 3, 6, 10, 5, s, primaryColor)

    // Head
    pxRect(ctx, 1, 5, 4, 5, s, secondaryColor)
    // Eyes
    px(ctx, 2, 6, s, '#ff3030')
    // Snout
    pxRect(ctx, 0, 8, 2, 2, s, accentColor)

    // Ears
    px(ctx, 1, 4, s, secondaryColor)
    px(ctx, 3, 4, s, secondaryColor)

    // Tail
    pxRect(ctx, 13, 5, 2, 2, s, primaryColor)
    px(ctx, 15, 4, s, primaryColor)

    // Legs
    pxRect(ctx, 4, 11, 2, 3, s, primaryColor)
    pxRect(ctx, 7, 11, 2, 3, s, primaryColor)
    pxRect(ctx, 10, 11, 2, 3, s, primaryColor)
    // Paws
    pxRect(ctx, 4, 14, 2, 1, s, accentColor)
    pxRect(ctx, 7, 14, 2, 1, s, accentColor)
    pxRect(ctx, 10, 14, 2, 1, s, accentColor)
  }
}

export const spriteGenerator = new SpriteGeneratorClass()
