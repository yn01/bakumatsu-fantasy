/**
 * Battle background generator using Canvas API
 * 320x240 論理解像度をネイティブ生成し、遠景/中景/近景の3層パララックス構成で返す
 * （Phase 13 Task B）。
 *
 * 色は全て `palette.ts` の固定パレットから選ぶこと（生の16進値を書かない）。
 * グラデーション（createLinearGradient）は使用禁止。段差のあるパレットランプ +
 * ディザ（`dither.ts`）でバンディング表現する。
 */

import { PALETTE } from './palette'
import { fillVerticalBandedRamp } from './dither'
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './pixelCanvas'

const W = LOGICAL_WIDTH // 320
const H = LOGICAL_HEIGHT // 240
/** 中景・近景はスクロール表示のため2倍幅で生成し、繰り返し表示できるようにする */
const SCROLL_W = W * 2 // 640

function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/** パララックス3層。far は静止、mid/near は横スクロールしてループする前提の幅を持つ */
export interface BattleBackgroundLayers {
  far: HTMLCanvasElement
  mid: HTMLCanvasElement
  near: HTMLCanvasElement
}

class BattleBackgroundGeneratorClass {
  private cache = new Map<string, BattleBackgroundLayers>()
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return
    for (const type of ['town', 'mountain', 'coast', 'indoor']) {
      this.getBackground(type)
    }
    this.initialized = true
  }

  getBackground(type: string): BattleBackgroundLayers {
    const cached = this.cache.get(type)
    if (cached) return cached

    const layers = this.generateBackground(type)
    this.cache.set(type, layers)
    return layers
  }

  private generateBackground(type: string): BattleBackgroundLayers {
    switch (type) {
      case 'town': return this.buildTown()
      case 'mountain': return this.buildMountain()
      case 'coast': return this.buildCoast()
      case 'indoor': return this.buildIndoor()
      default: return this.buildTown()
    }
  }

  // ------------------------------------------------------------------
  // Town: buildings, stone path, sky banding
  // ------------------------------------------------------------------
  private buildTown(): BattleBackgroundLayers {
    const far = createCanvas(W, H)
    const fctx = far.getContext('2d')!

    // 空（藍ランプのバンディング + ディザ）
    fillVerticalBandedRamp(fctx, 0, 0, W, H * 0.4, [PALETTE.ASAGI, PALETTE.MIZU_FOAM])

    // 遠景の山並み
    fctx.fillStyle = PALETTE.AI_MID
    fctx.beginPath()
    fctx.moveTo(0, H * 0.35)
    fctx.lineTo(50, H * 0.25)
    fctx.lineTo(100, H * 0.3)
    fctx.lineTo(175, H * 0.2)
    fctx.lineTo(250, H * 0.28)
    fctx.lineTo(W, H * 0.32)
    fctx.lineTo(W, H * 0.4)
    fctx.lineTo(0, H * 0.4)
    fctx.fill()

    // 中景: 建物のシルエット（160px周期で4回繰り返し、640幅でシームレスにスクロール）
    const mid = createCanvas(SCROLL_W, H)
    const mctx = mid.getContext('2d')!
    const groundY = H * 0.65
    for (let unit = 0; unit < SCROLL_W; unit += 160) {
      this.drawTownBuildingUnit(mctx, unit, groundY)
    }

    // 近景: 地面・石畳（40px周期、640/40=16回できっちり繰り返し = シームレス）
    const near = createCanvas(SCROLL_W, H)
    const nctx = near.getContext('2d')!
    fillVerticalBandedRamp(nctx, 0, groundY, SCROLL_W, H - groundY, [PALETTE.KUCHIBA, PALETTE.TOBI])
    nctx.fillStyle = PALETTE.SUNA
    for (let x = 0; x < SCROLL_W; x += 40) {
      for (let y = groundY + 6; y < H; y += 14) {
        nctx.beginPath()
        nctx.roundRect(x + (y % 28 === 0 ? 0 : 20), y, 22, 8, 2)
        nctx.fill()
      }
    }

    return { far, mid, near }
  }

  private drawTownBuildingUnit(ctx: CanvasRenderingContext2D, baseX: number, groundY: number): void {
    const buildings = [
      { x: 10, w: 40, h: 60 },
      { x: 60, w: 30, h: 75 },
      { x: 100, w: 45, h: 50 },
    ]
    for (const b of buildings) {
      const x = baseX + b.x
      ctx.fillStyle = PALETTE.TOBI
      ctx.fillRect(x, groundY - b.h, b.w, b.h)

      ctx.fillStyle = PALETTE.TSUCHI_DARK
      ctx.beginPath()
      ctx.moveTo(x - 3, groundY - b.h)
      ctx.lineTo(x + b.w / 2, groundY - b.h - 14)
      ctx.lineTo(x + b.w + 3, groundY - b.h)
      ctx.fill()

      ctx.fillStyle = PALETTE.TATAMI
      for (let wy = groundY - b.h + 10; wy < groundY - 10; wy += 16) {
        for (let wx = x + 5; wx < x + b.w - 5; wx += 10) {
          ctx.fillRect(wx, wy, 4, 6)
        }
      }
    }
  }

  // ------------------------------------------------------------------
  // Mountain: earth, trees, mountain silhouette
  // ------------------------------------------------------------------
  private buildMountain(): BattleBackgroundLayers {
    const far = createCanvas(W, H)
    const fctx = far.getContext('2d')!

    fillVerticalBandedRamp(fctx, 0, 0, W, H * 0.5, [PALETTE.AI, PALETTE.ASAGI])

    fctx.fillStyle = PALETTE.MIZU_DEEP
    fctx.beginPath()
    fctx.moveTo(0, H * 0.4)
    fctx.lineTo(80, H * 0.15)
    fctx.lineTo(160, H * 0.3)
    fctx.lineTo(240, H * 0.1)
    fctx.lineTo(W, H * 0.25)
    fctx.lineTo(W, H * 0.5)
    fctx.lineTo(0, H * 0.5)
    fctx.fill()

    // 中景: 近い山並み + 木立（32px周期、640/32=20回でシームレス）
    const mid = createCanvas(SCROLL_W, H)
    const mctx = mid.getContext('2d')!
    mctx.fillStyle = PALETTE.MIDORI
    mctx.beginPath()
    mctx.moveTo(0, H * 0.45)
    for (let x = 0; x <= SCROLL_W; x += 100) {
      mctx.lineTo(x, H * (x % 200 === 0 ? 0.3 : 0.42))
    }
    mctx.lineTo(SCROLL_W, H * 0.5)
    mctx.lineTo(0, H * 0.5)
    mctx.fill()

    const treeY = H * 0.45
    mctx.fillStyle = PALETTE.MORI
    for (let x = 0; x < SCROLL_W; x += 32) {
      const treeH = 20 + ((x / 32) % 3) * 5
      mctx.beginPath()
      mctx.moveTo(x, treeY)
      mctx.lineTo(x + 6, treeY - treeH)
      mctx.lineTo(x + 12, treeY)
      mctx.fill()
    }

    // 近景: 地面 + 草（20px周期、640/20=32回でシームレス）
    const near = createCanvas(SCROLL_W, H)
    const nctx = near.getContext('2d')!
    const groundY = H * 0.65
    fillVerticalBandedRamp(nctx, 0, groundY - 10, SCROLL_W, H - groundY + 10, [PALETTE.TSUCHI_DARK, PALETTE.KOGE])
    nctx.fillStyle = PALETTE.WAKAKUSA
    for (let x = 0; x < SCROLL_W; x += 20) {
      const gh = 4 + ((x / 20) % 4) * 2
      nctx.fillRect(x, groundY - gh, 2, gh)
    }

    return { far, mid, near }
  }

  // ------------------------------------------------------------------
  // Coast: sand, waves, sky
  // ------------------------------------------------------------------
  private buildCoast(): BattleBackgroundLayers {
    const far = createCanvas(W, H)
    const fctx = far.getContext('2d')!
    fillVerticalBandedRamp(fctx, 0, 0, W, H * 0.45, [PALETTE.MIZU, PALETTE.ASAGI])

    // 中景: 海（640幅・波の1周期=約40pxで16回近似ループ）
    const mid = createCanvas(SCROLL_W, H)
    const mctx = mid.getContext('2d')!
    fillVerticalBandedRamp(mctx, 0, H * 0.35, SCROLL_W, H * 0.3, [PALETTE.MIZU_DEEP, PALETTE.MIZU])
    mctx.strokeStyle = PALETTE.MIZU_LIGHT
    mctx.lineWidth = 1
    for (let y = H * 0.4; y < H * 0.65; y += 8) {
      mctx.beginPath()
      for (let x = 0; x <= SCROLL_W; x += 2) {
        const wy = y + Math.sin((x * 2 * Math.PI) / 40 + y * 0.1) * 2
        if (x === 0) mctx.moveTo(x, wy)
        else mctx.lineTo(x, wy)
      }
      mctx.stroke()
    }

    // 近景: 砂浜（640幅、周期的な貝殻テクスチャ）
    const near = createCanvas(SCROLL_W, H)
    const nctx = near.getContext('2d')!
    fillVerticalBandedRamp(nctx, 0, H * 0.6, SCROLL_W, H * 0.4, [PALETTE.TATAMI, PALETTE.SUNA])
    nctx.fillStyle = PALETTE.SUNA
    nctx.fillRect(0, H * 0.63, SCROLL_W, 8)
    nctx.fillStyle = PALETTE.KUCHIBA
    for (let x = 0; x < SCROLL_W; x += 22) {
      const y = H * 0.66 + ((x / 22) % 5) * 5
      nctx.fillRect(x, y, 2, 1)
    }

    return { far, mid, near }
  }

  // ------------------------------------------------------------------
  // Indoor: tatami floor, shoji walls（スクロールなしの単層構成）
  // ------------------------------------------------------------------
  private buildIndoor(): BattleBackgroundLayers {
    const far = createCanvas(W, H)
    const ctx = far.getContext('2d')!

    // Ceiling / upper wall
    ctx.fillStyle = PALETTE.TOBI
    ctx.fillRect(0, 0, W, H * 0.15)
    ctx.fillStyle = PALETTE.TSUCHI_DARK
    ctx.fillRect(0, H * 0.14, W, 4)

    // Shoji wall panels
    const wallY = H * 0.15
    const wallH = H * 0.35
    ctx.fillStyle = PALETTE.SHIRO
    ctx.fillRect(0, wallY, W, wallH)

    ctx.strokeStyle = PALETTE.KUCHIBA
    ctx.lineWidth = 2
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, wallY)
      ctx.lineTo(x, wallY + wallH)
      ctx.stroke()
    }
    for (let y = wallY; y <= wallY + wallH; y += wallH / 3) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }
    ctx.lineWidth = 1
    for (let x = 20; x < W; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, wallY)
      ctx.lineTo(x, wallY + wallH)
      ctx.stroke()
    }

    // Tatami floor
    const floorY = H * 0.5
    ctx.fillStyle = PALETTE.TATAMI
    ctx.fillRect(0, floorY, W, H - floorY)

    ctx.strokeStyle = PALETTE.SUNA
    ctx.lineWidth = 1
    for (let y = floorY; y < H; y += 3) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }

    ctx.strokeStyle = PALETTE.KUCHIBA
    ctx.lineWidth = 2
    for (let x = 0; x < W; x += 80) {
      ctx.beginPath()
      ctx.moveTo(x, floorY)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
    for (let y = floorY; y < H; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(W, y)
      ctx.stroke()
    }

    ctx.fillStyle = PALETTE.KOGE
    ctx.fillRect(0, floorY - 2, W, 2)

    // 屋内はスクロールしないため、mid/nearは透明な等幅ダミー
    const mid = createCanvas(W, H)
    const near = createCanvas(W, H)

    return { far, mid, near }
  }
}

export const battleBackgroundGenerator = new BattleBackgroundGeneratorClass()
