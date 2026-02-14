/**
 * キャラクター移動制御システム
 */

import type { Direction, Position } from '@/types'

export interface CharacterControllerOptions {
  /** グリッド移動速度（マス/秒） */
  moveSpeed?: number
  /** タイルサイズ（px） */
  tileSize?: number
  /** 衝突判定コールバック */
  canMoveTo?: (position: Position) => boolean
}

export interface CharacterSprite {
  /** 現在位置（タイル座標） */
  position: Position
  /** 向いている方向 */
  direction: Direction
  /** 移動中かどうか */
  isMoving: boolean
  /** アニメーションフレーム（0-2） */
  animationFrame: number
}

export class CharacterController {
  private sprite: CharacterSprite
  private moveSpeed: number
  private tileSize: number
  private canMoveTo: (position: Position) => boolean

  // 移動アニメーション用
  private targetPosition: Position | null = null
  private moveProgress: number = 0
  private animationTimer: number = 0
  private readonly ANIMATION_SPEED = 0.15 // フレーム切替速度

  constructor(
    initialPosition: Position,
    options: CharacterControllerOptions = {}
  ) {
    this.moveSpeed = options.moveSpeed ?? 4 // デフォルト: 4マス/秒
    this.tileSize = options.tileSize ?? 32
    this.canMoveTo = options.canMoveTo ?? (() => true) // デフォルト: 常に移動可能

    this.sprite = {
      position: { ...initialPosition },
      direction: 'down',
      isMoving: false,
      animationFrame: 0,
    }
  }

  /**
   * 移動開始
   */
  startMove(direction: Direction): boolean {
    // 既に移動中の場合は無視
    if (this.sprite.isMoving) {
      return false
    }

    // 向きを更新
    this.sprite.direction = direction

    // 目標位置を計算
    const target = this.getNextPosition(this.sprite.position, direction)

    // 衝突判定チェック
    const canMove = this.canMoveTo(target)
    console.log(`[CharacterController] 移動チェック: ${this.sprite.position.x},${this.sprite.position.y} → ${target.x},${target.y} (${direction}) = ${canMove ? '可能' : '不可'}`)
    if (!canMove) {
      return false
    }

    // 移動開始
    this.targetPosition = target
    this.sprite.isMoving = true
    this.moveProgress = 0

    return true
  }

  /**
   * 次の位置を計算
   */
  private getNextPosition(current: Position, direction: Direction): Position {
    const next = { ...current }

    switch (direction) {
      case 'up':
        next.y -= 1
        break
      case 'down':
        next.y += 1
        break
      case 'left':
        next.x -= 1
        break
      case 'right':
        next.x += 1
        break
    }

    return next
  }

  /**
   * 更新処理
   */
  update(deltaTime: number): void {
    if (!this.sprite.isMoving || !this.targetPosition) {
      return
    }

    // 移動進行
    this.moveProgress += this.moveSpeed * deltaTime

    // アニメーション更新
    this.animationTimer += deltaTime
    if (this.animationTimer >= this.ANIMATION_SPEED) {
      this.animationTimer = 0
      this.sprite.animationFrame = (this.sprite.animationFrame + 1) % 3
    }

    // 移動完了判定
    if (this.moveProgress >= 1) {
      this.sprite.position = this.targetPosition
      this.sprite.isMoving = false
      this.targetPosition = null
      this.moveProgress = 0
      this.sprite.animationFrame = 0
    }
  }

  /**
   * 描画位置を取得（ピクセル座標、補間あり）
   */
  getRenderPosition(): { x: number; y: number } {
    if (!this.sprite.isMoving || !this.targetPosition) {
      return {
        x: this.sprite.position.x * this.tileSize,
        y: this.sprite.position.y * this.tileSize,
      }
    }

    // 移動中は補間位置を返す
    const startX = this.sprite.position.x * this.tileSize
    const startY = this.sprite.position.y * this.tileSize
    const targetX = this.targetPosition.x * this.tileSize
    const targetY = this.targetPosition.y * this.tileSize

    return {
      x: startX + (targetX - startX) * this.moveProgress,
      y: startY + (targetY - startY) * this.moveProgress,
    }
  }

  /**
   * 現在のスプライト状態を取得
   */
  getSprite(): Readonly<CharacterSprite> {
    return this.sprite
  }

  /**
   * タイル座標を取得
   */
  getPosition(): Readonly<Position> {
    return this.sprite.position
  }

  /**
   * 移動中かどうか
   */
  isMoving(): boolean {
    return this.sprite.isMoving
  }

  /**
   * 向いている方向を取得
   */
  getDirection(): Direction {
    return this.sprite.direction
  }

  /**
   * 位置を強制設定（マップ切替時など）
   */
  setPosition(position: Position): void {
    this.sprite.position = { ...position }
    this.sprite.isMoving = false
    this.targetPosition = null
    this.moveProgress = 0
    this.sprite.animationFrame = 0
  }
}
