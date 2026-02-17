/**
 * MouseTouchInputProvider - マウス/タッチ入力プロバイダー
 */

export interface TilePosition {
  x: number
  y: number
}

export class MouseTouchInputProvider {
  private canvas: HTMLCanvasElement | null = null
  private tileSize: number = 32
  private moveQueue: TilePosition[] = []
  private handleClickBound: ((event: MouseEvent) => void) | null = null

  setCanvas(canvas: HTMLCanvasElement, tileSize: number): void {
    // Clean up previous listener
    this.removeCanvas()

    this.canvas = canvas
    this.tileSize = tileSize
    this.handleClickBound = this.onClick.bind(this)
    this.canvas.addEventListener('click', this.handleClickBound)
  }

  removeCanvas(): void {
    if (this.canvas && this.handleClickBound) {
      this.canvas.removeEventListener('click', this.handleClickBound)
    }
    this.canvas = null
    this.handleClickBound = null
  }

  private onClick(event: MouseEvent): void {
    if (!this.canvas) return

    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height

    const canvasX = (event.clientX - rect.left) * scaleX
    const canvasY = (event.clientY - rect.top) * scaleY

    const tileX = Math.floor(canvasX / this.tileSize)
    const tileY = Math.floor(canvasY / this.tileSize)

    this.moveQueue.push({ x: tileX, y: tileY })
  }

  getNextMove(): TilePosition | null {
    return this.moveQueue.shift() ?? null
  }

  hasMoves(): boolean {
    return this.moveQueue.length > 0
  }

  clearMoves(): void {
    this.moveQueue = []
  }

  destroy(): void {
    this.removeCanvas()
    this.moveQueue = []
  }
}
