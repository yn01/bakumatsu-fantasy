/**
 * Battle visual effects system
 * Provides slash, heal, buff effects, screen shake, and simple particles
 */

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface ActiveEffect {
  type: 'slash' | 'heal' | 'buff' | 'hit'
  x: number
  y: number
  progress: number
  duration: number
}

export class BattleEffects {
  private particles: Particle[] = []
  private effects: ActiveEffect[] = []
  private shakeIntensity = 0
  private shakeDuration = 0
  private shakeTimer = 0
  private static readonly MAX_PARTICLES = 20

  /**
   * Start a slash effect at target position
   */
  startSlashEffect(x: number, y: number): void {
    this.effects.push({
      type: 'slash',
      x, y,
      progress: 0,
      duration: 0.3,
    })
  }

  /**
   * Start a heal effect at target position
   */
  startHealEffect(x: number, y: number): void {
    this.effects.push({
      type: 'heal',
      x, y,
      progress: 0,
      duration: 0.6,
    })

    // Add rising green particles
    for (let i = 0; i < 8; i++) {
      this.addParticle(
        x + (Math.random() - 0.5) * 40,
        y + 20 + Math.random() * 20,
        (Math.random() - 0.5) * 20,
        -40 - Math.random() * 30,
        0.8 + Math.random() * 0.4,
        '#4AE24A',
        3
      )
    }
  }

  /**
   * Start a buff effect at target position
   */
  startBuffEffect(x: number, y: number): void {
    this.effects.push({
      type: 'buff',
      x, y,
      progress: 0,
      duration: 0.5,
    })
  }

  /**
   * Start a hit flash effect
   */
  startHitEffect(x: number, y: number): void {
    this.effects.push({
      type: 'hit',
      x, y,
      progress: 0,
      duration: 0.15,
    })
  }

  /**
   * Start screen shake
   */
  startScreenShake(intensity: number = 5, duration: number = 0.3): void {
    this.shakeIntensity = intensity
    this.shakeDuration = duration
    this.shakeTimer = 0
  }

  /**
   * Update all effects
   */
  update(deltaTime: number): void {
    // Update particles
    this.particles = this.particles.filter((p) => {
      p.x += p.vx * deltaTime
      p.y += p.vy * deltaTime
      p.life -= deltaTime
      return p.life > 0
    })

    // Update effects
    this.effects = this.effects.filter((e) => {
      e.progress += deltaTime / e.duration
      return e.progress < 1.0
    })

    // Update screen shake
    if (this.shakeTimer < this.shakeDuration) {
      this.shakeTimer += deltaTime
    }
  }

  /**
   * Get screen shake offset for ctx.translate
   */
  getShakeOffset(): { x: number; y: number } {
    if (this.shakeTimer >= this.shakeDuration) {
      return { x: 0, y: 0 }
    }

    const decay = 1 - this.shakeTimer / this.shakeDuration
    const intensity = this.shakeIntensity * decay
    return {
      x: (Math.random() - 0.5) * 2 * intensity,
      y: (Math.random() - 0.5) * 2 * intensity,
    }
  }

  /**
   * Render all effects on canvas
   */
  render(ctx: CanvasRenderingContext2D): void {
    // Render effects
    for (const effect of this.effects) {
      switch (effect.type) {
        case 'slash':
          this.renderSlash(ctx, effect)
          break
        case 'heal':
          this.renderHeal(ctx, effect)
          break
        case 'buff':
          this.renderBuff(ctx, effect)
          break
        case 'hit':
          this.renderHit(ctx, effect)
          break
      }
    }

    // Render particles
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
      ctx.restore()
    }
  }

  /**
   * Check if any effects are active
   */
  isActive(): boolean {
    return this.effects.length > 0 || this.particles.length > 0 || this.shakeTimer < this.shakeDuration
  }

  /**
   * Clear all effects
   */
  clear(): void {
    this.particles = []
    this.effects = []
    this.shakeIntensity = 0
    this.shakeDuration = 0
    this.shakeTimer = this.shakeDuration
  }

  private addParticle(
    x: number, y: number,
    vx: number, vy: number,
    life: number, color: string, size: number
  ): void {
    if (this.particles.length >= BattleEffects.MAX_PARTICLES) return
    this.particles.push({ x, y, vx, vy, life, maxLife: life, color, size })
  }

  private renderSlash(ctx: CanvasRenderingContext2D, effect: ActiveEffect): void {
    const { x, y, progress } = effect
    const alpha = 1 - progress

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'

    // Diagonal slash line that grows
    const len = progress * 60
    ctx.beginPath()
    ctx.moveTo(x - len / 2, y + len / 2)
    ctx.lineTo(x + len / 2, y - len / 2)
    ctx.stroke()

    // Second slash (slight delay)
    if (progress > 0.2) {
      const p2 = (progress - 0.2) / 0.8
      const len2 = p2 * 50
      ctx.globalAlpha = alpha * 0.7
      ctx.beginPath()
      ctx.moveTo(x + len2 / 2, y + len2 / 2)
      ctx.lineTo(x - len2 / 2, y - len2 / 2)
      ctx.stroke()
    }

    ctx.restore()
  }

  private renderHeal(ctx: CanvasRenderingContext2D, effect: ActiveEffect): void {
    const { x, y, progress } = effect
    const alpha = 1 - progress * 0.5

    ctx.save()
    ctx.globalAlpha = alpha

    // Glowing green circle
    const radius = 20 + progress * 15
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, 'rgba(74, 226, 74, 0.4)')
    gradient.addColorStop(1, 'rgba(74, 226, 74, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  private renderBuff(ctx: CanvasRenderingContext2D, effect: ActiveEffect): void {
    const { x, y, progress } = effect
    const alpha = 1 - progress

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 2

    // Rising ring
    const radius = 25 + progress * 10
    const ringY = y + 20 - progress * 40
    ctx.beginPath()
    ctx.ellipse(x, ringY, radius, radius * 0.3, 0, 0, Math.PI * 2)
    ctx.stroke()

    // Second ring with delay
    if (progress > 0.15) {
      const p2 = (progress - 0.15) / 0.85
      const r2 = 20 + p2 * 10
      const ry2 = y + 20 - p2 * 40
      ctx.globalAlpha = alpha * 0.6
      ctx.beginPath()
      ctx.ellipse(x, ry2 - 15, r2, r2 * 0.3, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.restore()
  }

  private renderHit(ctx: CanvasRenderingContext2D, effect: ActiveEffect): void {
    const { x, y, progress } = effect

    ctx.save()
    ctx.globalAlpha = 1 - progress

    // White flash
    ctx.fillStyle = '#FFFFFF'
    const size = 30 * (1 - progress)
    ctx.fillRect(x - size / 2, y - size / 2, size, size)

    ctx.restore()
  }
}
