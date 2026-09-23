/**
 * 衝突判定システム
 */

import type { Position } from '@/types'
import type { MapRenderer } from './MapRenderer'
import { TILE_SIZE } from '@/systems/graphics/pixelCanvas'

/** 将来の拡張用オプション（現時点では設定項目なし） */
export type CollisionSystemOptions = Record<string, unknown>

export class CollisionSystem {
  private mapRenderer: MapRenderer | null = null

  constructor(_options: CollisionSystemOptions = {}) {
    // タイルサイズはマップデータから動的に取得するため、ここでは保持しない
  }

  /**
   * マップレンダラーを設定
   */
  setMapRenderer(mapRenderer: MapRenderer): void {
    this.mapRenderer = mapRenderer
  }

  /**
   * 現在のタイルサイズを取得
   */
  private getTileSize(): number {
    // マップJSONの tileSize（旧640x480系の32）ではなく論理座標系の値を使う
    return this.mapRenderer?.getTileSize?.() ?? TILE_SIZE
  }

  /**
   * タイル座標での衝突判定
   */
  canMoveTo(position: Position): boolean {
    if (!this.mapRenderer) {
      // マップが読み込まれていない場合は移動不可
      return false
    }

    // マップ境界チェック
    if (!this.isWithinMapBounds(position)) {
      return false
    }

    // タイル衝突判定
    const tileSize = this.getTileSize()
    const pixelX = position.x * tileSize + tileSize / 2
    const pixelY = position.y * tileSize + tileSize / 2
    const hasCollision = this.mapRenderer.getCollisionAt(pixelX, pixelY)

    return !hasCollision
  }

  /**
   * マップ境界内かどうか
   */
  private isWithinMapBounds(position: Position): boolean {
    if (!this.mapRenderer) {
      return false
    }

    const mapSize = this.mapRenderer.getMapSize()
    if (!mapSize) {
      return false
    }

    const tileSize = this.getTileSize()
    const mapWidthInTiles = mapSize.width / tileSize
    const mapHeightInTiles = mapSize.height / tileSize

    return (
      position.x >= 0 &&
      position.y >= 0 &&
      position.x < mapWidthInTiles &&
      position.y < mapHeightInTiles
    )
  }

  /**
   * ピクセル座標での衝突判定
   */
  canMoveToPixel(x: number, y: number): boolean {
    if (!this.mapRenderer) {
      return false
    }

    // ピクセル座標をタイル座標に変換
    const tileSize = this.getTileSize()
    const tileX = Math.floor(x / tileSize)
    const tileY = Math.floor(y / tileSize)

    return this.canMoveTo({ x: tileX, y: tileY })
  }

  /**
   * マップサイズを取得（タイル単位）
   */
  getMapSizeInTiles(): { width: number; height: number } | null {
    if (!this.mapRenderer) {
      return null
    }

    const mapSize = this.mapRenderer.getMapSize()
    if (!mapSize) {
      return null
    }

    const tileSize = this.getTileSize()
    return {
      width: mapSize.width / tileSize,
      height: mapSize.height / tileSize,
    }
  }
}
