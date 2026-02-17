/**
 * Global animation tick manager
 * Provides frame counters for animated tiles and effects
 */

class AnimationManagerClass {
  private tick = 0
  private running = false
  private lastTime = 0
  private frameId: number | null = null

  // Tick rates
  private static readonly TICK_INTERVAL = 1 / 60 // 60 FPS base tick
  private accumulator = 0

  /**
   * Current global tick (increments every frame at 60fps)
   */
  getTick(): number {
    return this.tick
  }

  /**
   * Get water animation frame (2 FPS, 4 frames)
   */
  getWaterFrame(): number {
    return Math.floor(this.tick / 30) % 4
  }

  /**
   * Get fire animation frame (4 FPS, 2 frames)
   */
  getFireFrame(): number {
    return Math.floor(this.tick / 15) % 2
  }

  /**
   * Get generic animation frame at given FPS
   */
  getFrame(fps: number, totalFrames: number): number {
    const ticksPerFrame = Math.max(1, Math.floor(60 / fps))
    return Math.floor(this.tick / ticksPerFrame) % totalFrames
  }

  /**
   * Start the global animation loop
   */
  start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.loop(this.lastTime)
  }

  /**
   * Stop the global animation loop
   */
  stop(): void {
    this.running = false
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
  }

  /**
   * Manual update (for use inside existing game loops instead of standalone loop)
   */
  update(deltaTime: number): void {
    this.accumulator += deltaTime
    while (this.accumulator >= AnimationManagerClass.TICK_INTERVAL) {
      this.accumulator -= AnimationManagerClass.TICK_INTERVAL
      this.tick++
    }
  }

  private loop(currentTime: number): void {
    if (!this.running) return

    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime

    this.update(deltaTime)

    this.frameId = requestAnimationFrame((t) => this.loop(t))
  }
}

export const animationManager = new AnimationManagerClass()
