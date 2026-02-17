/**
 * マップレンダリングシステム
 */

import type { MapData } from '@/types'
import { tilesetGenerator } from '@/systems/graphics/TilesetGenerator'

export class MapRenderer {
  private mapData: MapData | null = null
  private tileSize: number = 32
  private animationFrame: number = 0
  private animationTimer: number = 0
  private static readonly ANIMATION_INTERVAL = 0.5 // seconds per frame

  /**
   * マップデータを読み込む
   */
  async loadMap(mapId: string, signal?: AbortSignal): Promise<void> {
    try {
      const basePath = import.meta.env.BASE_URL || '/'
      const response = await fetch(`${basePath}data/maps/${mapId}.json`, { signal })
      if (!response.ok) {
        throw new Error(`Failed to load map: ${mapId}`)
      }
      this.mapData = await response.json()
      this.tileSize = this.mapData?.tileSize || 32
    } catch (error) {
      // AbortErrorは正常なケース（アンマウント時）なのでログに出さない
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Map load error:', error)
      }
      throw error
    }
  }

  /**
   * アニメーションタイマーを更新
   */
  updateAnimation(deltaTime: number): void {
    this.animationTimer += deltaTime
    if (this.animationTimer >= MapRenderer.ANIMATION_INTERVAL) {
      this.animationTimer -= MapRenderer.ANIMATION_INTERVAL
      this.animationFrame = (this.animationFrame + 1) % 4
    }
  }

  /**
   * マップを描画する
   */
  render(ctx: CanvasRenderingContext2D, cameraX: number = 0, cameraY: number = 0): void {
    if (!this.mapData) return

    const { width, height, layers } = this.mapData

    // 背景レイヤー描画
    this.renderLayer(ctx, layers.background, width, height, cameraX, cameraY)
  }

  /**
   * レイヤーを描画する
   */
  private renderLayer(
    ctx: CanvasRenderingContext2D,
    layer: number[][],
    width: number,
    height: number,
    cameraX: number,
    cameraY: number
  ): void {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tileId = layer[y]?.[x]
        if (tileId === undefined || tileId === 0) continue

        const screenX = x * this.tileSize - cameraX
        const screenY = y * this.tileSize - cameraY

        // 画面外は描画しない（最適化）
        if (
          screenX + this.tileSize < 0 ||
          screenY + this.tileSize < 0 ||
          screenX > ctx.canvas.width ||
          screenY > ctx.canvas.height
        ) {
          continue
        }

        this.renderTile(ctx, tileId, screenX, screenY)
      }
    }
  }

  /**
   * タイルを描画する（TilesetGenerator使用）
   */
  private renderTile(ctx: CanvasRenderingContext2D, tileId: number, x: number, y: number): void {
    // Animated tiles (water=5, sea=10) use animation frame
    const isAnimated = tileId === 5 || tileId === 10
    const tileCanvas = tilesetGenerator.getTile(tileId, isAnimated ? this.animationFrame : undefined)

    ctx.drawImage(tileCanvas, x, y, this.tileSize, this.tileSize)
  }

  /**
   * 衝突判定用データを取得
   */
  getCollisionAt(x: number, y: number): boolean {
    if (!this.mapData) return true

    const tileX = Math.floor(x / this.tileSize)
    const tileY = Math.floor(y / this.tileSize)

    const collisionValue = this.mapData.layers.collision[tileY]?.[tileX]
    return collisionValue === 1
  }

  /**
   * マップサイズを取得
   */
  getMapSize(): { width: number; height: number } | null {
    if (!this.mapData) return null

    return {
      width: this.mapData.width * this.tileSize,
      height: this.mapData.height * this.tileSize,
    }
  }

  /**
   * 現在のマップデータを取得
   */
  getMapData(): MapData | null {
    return this.mapData
  }
}
