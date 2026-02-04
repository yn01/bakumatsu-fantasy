/**
 * マップレンダリングシステム
 */

import type { MapData } from '@/types'

// タイル色マッピング（実際のタイルセット画像が用意されるまでの仮実装）
const TILE_COLORS: { [key: number]: string } = {
  0: '#000000', // 空
  1: '#8B4513', // 壁（茶色）
  2: '#90EE90', // 地面（緑）
  3: '#A9A9A9', // 石（灰色）
  4: '#DEB887', // 床（ベージュ）
}

export class MapRenderer {
  private mapData: MapData | null = null
  private tileSize: number = 32

  /**
   * マップデータを読み込む
   */
  async loadMap(mapId: string, signal?: AbortSignal): Promise<void> {
    try {
      const response = await fetch(`/data/maps/${mapId}.json`, { signal })
      if (!response.ok) {
        throw new Error(`Failed to load map: ${mapId}`)
      }
      this.mapData = await response.json()
      this.tileSize = this.mapData?.tileSize || 32
    } catch (error) {
      console.error('Map load error:', error)
      throw error
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
   * タイルを描画する（仮実装：色のみ）
   */
  private renderTile(ctx: CanvasRenderingContext2D, tileId: number, x: number, y: number): void {
    const color = TILE_COLORS[tileId] || '#FFFFFF'

    ctx.fillStyle = color
    ctx.fillRect(x, y, this.tileSize, this.tileSize)

    // タイル境界線（デバッグ用）
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, this.tileSize, this.tileSize)
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
