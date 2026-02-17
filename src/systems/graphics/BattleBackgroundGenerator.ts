/**
 * Battle background generator using Canvas API
 * Generates 640x480 battle scene backgrounds
 */

function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

class BattleBackgroundGeneratorClass {
  private cache = new Map<string, HTMLCanvasElement>()
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    for (const type of ['town', 'mountain', 'coast', 'indoor']) {
      this.getBackground(type)
    }
    this.initialized = true
  }

  getBackground(type: string): HTMLCanvasElement {
    const cached = this.cache.get(type)
    if (cached) return cached

    const canvas = this.generateBackground(type)
    this.cache.set(type, canvas)
    return canvas
  }

  private generateBackground(type: string): HTMLCanvasElement {
    const w = 640
    const h = 480
    const canvas = createCanvas(w, h)
    const ctx = canvas.getContext('2d')!

    switch (type) {
      case 'town':
        this.drawTownBackground(ctx, w, h)
        break
      case 'mountain':
        this.drawMountainBackground(ctx, w, h)
        break
      case 'coast':
        this.drawCoastBackground(ctx, w, h)
        break
      case 'indoor':
        this.drawIndoorBackground(ctx, w, h)
        break
      default:
        this.drawTownBackground(ctx, w, h)
        break
    }

    return canvas
  }

  // Town: buildings, stone path, sky gradient
  private drawTownBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.4)
    skyGrad.addColorStop(0, '#87CEEB')
    skyGrad.addColorStop(1, '#B0E0E6')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, w, h * 0.4)

    // Distant mountains
    ctx.fillStyle = '#6a8aa0'
    ctx.beginPath()
    ctx.moveTo(0, h * 0.35)
    ctx.lineTo(100, h * 0.25)
    ctx.lineTo(200, h * 0.3)
    ctx.lineTo(350, h * 0.2)
    ctx.lineTo(500, h * 0.28)
    ctx.lineTo(w, h * 0.32)
    ctx.lineTo(w, h * 0.4)
    ctx.lineTo(0, h * 0.4)
    ctx.fill()

    // Buildings silhouette
    const buildings = [
      { x: 20, w: 80, h: 100 },
      { x: 120, w: 60, h: 120 },
      { x: 200, w: 90, h: 80 },
      { x: 350, w: 70, h: 140 },
      { x: 440, w: 80, h: 90 },
      { x: 540, w: 70, h: 110 },
    ]

    const groundY = h * 0.65

    for (const b of buildings) {
      // Building body
      ctx.fillStyle = '#5a4a3a'
      ctx.fillRect(b.x, groundY - b.h, b.w, b.h)

      // Roof (triangular)
      ctx.fillStyle = '#3a2a1a'
      ctx.beginPath()
      ctx.moveTo(b.x - 5, groundY - b.h)
      ctx.lineTo(b.x + b.w / 2, groundY - b.h - 25)
      ctx.lineTo(b.x + b.w + 5, groundY - b.h)
      ctx.fill()

      // Windows
      ctx.fillStyle = '#d4c490'
      for (let wy = groundY - b.h + 20; wy < groundY - 20; wy += 30) {
        for (let wx = b.x + 10; wx < b.x + b.w - 10; wx += 20) {
          ctx.fillRect(wx, wy, 8, 12)
        }
      }
    }

    // Ground/path
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, h)
    groundGrad.addColorStop(0, '#9a8a6a')
    groundGrad.addColorStop(1, '#7a6a4a')
    ctx.fillStyle = groundGrad
    ctx.fillRect(0, groundY, w, h - groundY)

    // Stone path texture
    ctx.fillStyle = '#8a7a5a'
    for (let x = 0; x < w; x += 40) {
      for (let y = groundY + 10; y < h; y += 20) {
        ctx.beginPath()
        ctx.roundRect(x + (y % 40 === 0 ? 0 : 20), y, 30, 12, 3)
        ctx.fill()
      }
    }
  }

  // Mountain: earth, trees, mountain silhouette
  private drawMountainBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5)
    skyGrad.addColorStop(0, '#5a7a9a')
    skyGrad.addColorStop(1, '#8aa0b0')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, w, h * 0.5)

    // Far mountains
    ctx.fillStyle = '#4a6a7a'
    ctx.beginPath()
    ctx.moveTo(0, h * 0.4)
    ctx.lineTo(160, h * 0.15)
    ctx.lineTo(320, h * 0.3)
    ctx.lineTo(480, h * 0.1)
    ctx.lineTo(w, h * 0.25)
    ctx.lineTo(w, h * 0.5)
    ctx.lineTo(0, h * 0.5)
    ctx.fill()

    // Near mountains
    ctx.fillStyle = '#3a5a3a'
    ctx.beginPath()
    ctx.moveTo(0, h * 0.45)
    ctx.lineTo(200, h * 0.3)
    ctx.lineTo(400, h * 0.42)
    ctx.lineTo(550, h * 0.28)
    ctx.lineTo(w, h * 0.4)
    ctx.lineTo(w, h * 0.5)
    ctx.lineTo(0, h * 0.5)
    ctx.fill()

    // Trees along the midground
    const treeY = h * 0.45
    ctx.fillStyle = '#2a4a1a'
    for (let x = 0; x < w; x += 30) {
      const treeH = 40 + Math.sin(x * 0.1) * 15
      ctx.beginPath()
      ctx.moveTo(x, treeY)
      ctx.lineTo(x + 12, treeY - treeH)
      ctx.lineTo(x + 24, treeY)
      ctx.fill()
    }

    // Earth ground
    const groundY = h * 0.65
    const groundGrad = ctx.createLinearGradient(0, groundY - 20, 0, h)
    groundGrad.addColorStop(0, '#5a4a30')
    groundGrad.addColorStop(1, '#4a3a20')
    ctx.fillStyle = groundGrad
    ctx.fillRect(0, groundY - 20, w, h - groundY + 20)

    // Grass at ground line
    ctx.fillStyle = '#3a6a2a'
    for (let x = 0; x < w; x += 6) {
      const gh = 8 + Math.sin(x * 0.3) * 4
      ctx.fillRect(x, groundY - gh, 4, gh)
    }
  }

  // Coast: sand, waves, sky
  private drawCoastBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.4)
    skyGrad.addColorStop(0, '#5a9ac0')
    skyGrad.addColorStop(1, '#8ac0e0')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, w, h * 0.45)

    // Ocean
    const oceanGrad = ctx.createLinearGradient(0, h * 0.35, 0, h * 0.65)
    oceanGrad.addColorStop(0, '#2a6aa0')
    oceanGrad.addColorStop(1, '#3a8ac0')
    ctx.fillStyle = oceanGrad
    ctx.fillRect(0, h * 0.35, w, h * 0.3)

    // Waves
    ctx.strokeStyle = '#5aaae0'
    ctx.lineWidth = 2
    for (let y = h * 0.4; y < h * 0.65; y += 15) {
      ctx.beginPath()
      for (let x = 0; x <= w; x += 3) {
        const wy = y + Math.sin(x * 0.03 + y * 0.1) * 3
        if (x === 0) ctx.moveTo(x, wy)
        else ctx.lineTo(x, wy)
      }
      ctx.stroke()
    }

    // Beach/sand
    const sandGrad = ctx.createLinearGradient(0, h * 0.6, 0, h)
    sandGrad.addColorStop(0, '#e0d0a0')
    sandGrad.addColorStop(1, '#c0b080')
    ctx.fillStyle = sandGrad
    ctx.fillRect(0, h * 0.63, w, h * 0.37)

    // Wet sand at water line
    ctx.fillStyle = '#b0a070'
    ctx.fillRect(0, h * 0.63, w, 15)

    // Sand texture
    ctx.fillStyle = '#d0c090'
    for (let i = 0; i < 30; i++) {
      const x = Math.floor(Math.sin(i * 7.3) * w * 0.5 + w * 0.5)
      const y = Math.floor(h * 0.65 + Math.cos(i * 3.1) * h * 0.15)
      ctx.fillRect(x, y, 3, 2)
    }
  }

  // Indoor: tatami floor, shoji walls
  private drawIndoorBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    // Ceiling / upper wall
    ctx.fillStyle = '#5a4a3a'
    ctx.fillRect(0, 0, w, h * 0.15)

    // Upper beam
    ctx.fillStyle = '#3a2a1a'
    ctx.fillRect(0, h * 0.14, w, 8)

    // Shoji wall panels
    const wallY = h * 0.15
    const wallH = h * 0.35
    ctx.fillStyle = '#f0ead8'
    ctx.fillRect(0, wallY, w, wallH)

    // Shoji grid
    ctx.strokeStyle = '#8a7a5a'
    ctx.lineWidth = 3

    // Vertical frames
    for (let x = 0; x < w; x += 80) {
      ctx.beginPath()
      ctx.moveTo(x, wallY)
      ctx.lineTo(x, wallY + wallH)
      ctx.stroke()
    }
    // Horizontal frames
    for (let y = wallY; y <= wallY + wallH; y += wallH / 3) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Inner grid (thinner)
    ctx.lineWidth = 1
    for (let x = 40; x < w; x += 80) {
      ctx.beginPath()
      ctx.moveTo(x, wallY)
      ctx.lineTo(x, wallY + wallH)
      ctx.stroke()
    }

    // Tatami floor
    const floorY = h * 0.5
    ctx.fillStyle = '#d4c490'
    ctx.fillRect(0, floorY, w, h - floorY)

    // Tatami weave lines
    ctx.strokeStyle = '#c4b480'
    ctx.lineWidth = 1
    for (let y = floorY; y < h; y += 6) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Tatami mat borders
    ctx.strokeStyle = '#a49460'
    ctx.lineWidth = 3
    for (let x = 0; x < w; x += 160) {
      ctx.beginPath()
      ctx.moveTo(x, floorY)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = floorY; y < h; y += 80) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Lower beam / floor edge shadow
    ctx.fillStyle = '#4a3a2a'
    ctx.fillRect(0, floorY - 4, w, 4)
  }
}

export const battleBackgroundGenerator = new BattleBackgroundGeneratorClass()
