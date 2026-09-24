/**
 * マップレンダリングシステム
 */

import type { MapData } from '@/types'
import { tilesetGenerator, type TileNeighbors } from '@/systems/graphics/TilesetGenerator'
import { animationManager } from '@/systems/graphics/AnimationManager'
import { TILE_SIZE, snap } from '@/systems/graphics/pixelCanvas'

export class MapRenderer {
  private mapData: MapData | null = null
  /**
   * 論理座標系のタイルサイズ（常に16）。
   * マップJSONの tileSize は旧640x480系の値（32）だが、表示タイル数は
   * 320x240 / 16px と一致するためデータ側は変更せず解釈のみ切り替える。
   */
  private readonly tileSize: number = TILE_SIZE

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
    } catch (error) {
      // AbortErrorは正常なケース（アンマウント時）なのでログに出さない
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Map load error:', error)
      }
      throw error
    }
  }

  /**
   * 論理座標系のタイルサイズを取得
   */
  getTileSize(): number {
    return this.tileSize
  }

  /**
   * マップを描画する
   */
  render(ctx: CanvasRenderingContext2D, cameraX: number = 0, cameraY: number = 0): void {
    if (!this.mapData) return

    const { width, height, layers } = this.mapData

    // 背景レイヤー描画（オートタイル境界処理あり）
    this.renderLayer(ctx, layers.background, width, height, cameraX, cameraY, true)
  }

  /**
   * 前景レイヤーを描画する（キャラクター・NPCの手前に描画される、屋根や木の上部など）。
   * マップJSONに `layers.foreground` が無い場合は何も描画しない（後方互換）。
   */
  renderForeground(ctx: CanvasRenderingContext2D, cameraX: number = 0, cameraY: number = 0): void {
    if (!this.mapData) return

    const { width, height, layers } = this.mapData
    const foreground = layers.foreground
    if (!foreground) return

    // 前景は独立した装飾レイヤーのため、地面タイルとの境界ブレンドは行わない
    this.renderLayer(ctx, foreground, width, height, cameraX, cameraY, false)
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
    cameraY: number,
    autotile: boolean
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

        const neighbors = autotile
          ? {
              top: layer[y - 1]?.[x],
              right: layer[y]?.[x + 1],
              bottom: layer[y + 1]?.[x],
              left: layer[y]?.[x - 1],
            }
          : undefined

        this.renderTile(ctx, tileId, screenX, screenY, neighbors, x, y)
      }
    }
  }

  /**
   * タイルを描画する（TilesetGenerator使用、16pxネイティブのため等倍描画）
   */
  private renderTile(
    ctx: CanvasRenderingContext2D,
    tileId: number,
    x: number,
    y: number,
    neighbors: TileNeighbors | undefined,
    mapX: number,
    mapY: number
  ): void {
    // Animated tiles (water=5, sea=10) use animation frame
    const isAnimated = tileId === 5 || tileId === 10
    // アニメーションフレームはAnimationManagerのグローバルtickから取得（2fps / 4フレーム）
    // variant: マップ座標から決定的に選ぶ模様バリエーション（草の房などが壁紙状に反復しないようにする）
    const variant = (mapX * 31 + mapY * 17) % 4
    const tileCanvas = tilesetGenerator.getTile(
      tileId,
      isAnimated ? animationManager.getWaterFrame() : undefined,
      neighbors,
      variant
    )

    ctx.drawImage(tileCanvas, snap(x), snap(y))
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
