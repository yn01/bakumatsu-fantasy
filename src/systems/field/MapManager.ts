/**
 * マップ管理システム
 */

import type { Position, MapTransition } from '@/types'
import type { MapRenderer } from './MapRenderer'

export interface MapManagerOptions {
  /** 初期マップID */
  initialMapId: string
  /** マップレンダラー */
  mapRenderer: MapRenderer
}

export class MapManager {
  private currentMapId: string
  private mapRenderer: MapRenderer
  private onTransition?: (transition: MapTransition) => void

  constructor(options: MapManagerOptions) {
    this.currentMapId = options.initialMapId
    this.mapRenderer = options.mapRenderer
  }

  /**
   * トランジションコールバックを設定
   */
  setOnTransition(callback: (transition: MapTransition) => void): void {
    this.onTransition = callback
  }

  /**
   * 現在のマップIDを取得
   */
  getCurrentMapId(): string {
    return this.currentMapId
  }

  /**
   * マップを切り替える
   */
  async changeMap(mapId: string, signal?: AbortSignal): Promise<void> {
    await this.mapRenderer.loadMap(mapId, signal)
    this.currentMapId = mapId
  }

  /**
   * 指定座標にトランジションがあるかチェック
   */
  checkTransition(position: Position): MapTransition | null {
    const mapData = this.mapRenderer.getMapData()
    if (!mapData || !mapData.transitions) {
      return null
    }

    // 該当する座標のトランジションを検索
    const transition = mapData.transitions.find(
      (t) => t.fromPosition.x === position.x && t.fromPosition.y === position.y
    )

    return transition || null
  }

  /**
   * トランジションを実行
   */
  triggerTransition(transition: MapTransition): void {
    this.onTransition?.(transition)
  }
}
