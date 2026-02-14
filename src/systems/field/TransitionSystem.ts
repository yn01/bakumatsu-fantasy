/**
 * マップ切替トランジションシステム
 */

export type TransitionState = 'idle' | 'fadeOut' | 'fadeIn'

export interface TransitionSystemOptions {
  /** フェード速度（0.0-1.0/秒） */
  fadeSpeed?: number
}

export class TransitionSystem {
  private state: TransitionState = 'idle'
  private alpha: number = 0 // 0.0 (透明) - 1.0 (不透明)
  private fadeSpeed: number
  private onFadeOutComplete?: () => void
  private onFadeInComplete?: () => void

  constructor(options: TransitionSystemOptions = {}) {
    this.fadeSpeed = options.fadeSpeed ?? 2.5 // デフォルト: 2.5/秒 (0.4秒でフェード完了)
  }

  /**
   * フェードアウト開始
   */
  startFadeOut(onComplete?: () => void): void {
    this.state = 'fadeOut'
    this.alpha = 0
    this.onFadeOutComplete = onComplete
  }

  /**
   * フェードイン開始
   */
  startFadeIn(onComplete?: () => void): void {
    this.state = 'fadeIn'
    this.alpha = 1
    this.onFadeInComplete = onComplete
  }

  /**
   * 更新処理
   */
  update(deltaTime: number): void {
    if (this.state === 'idle') {
      return
    }

    if (this.state === 'fadeOut') {
      this.alpha += this.fadeSpeed * deltaTime
      if (this.alpha >= 1) {
        this.alpha = 1
        this.state = 'idle'
        this.onFadeOutComplete?.()
        this.onFadeOutComplete = undefined
      }
    } else if (this.state === 'fadeIn') {
      this.alpha -= this.fadeSpeed * deltaTime
      if (this.alpha <= 0) {
        this.alpha = 0
        this.state = 'idle'
        this.onFadeInComplete?.()
        this.onFadeInComplete = undefined
      }
    }
  }

  /**
   * トランジション描画
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (this.alpha <= 0) {
      return
    }

    ctx.fillStyle = `rgba(0, 0, 0, ${this.alpha})`
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  }

  /**
   * 現在の状態を取得
   */
  getState(): TransitionState {
    return this.state
  }

  /**
   * トランジション中かどうか
   */
  isTransitioning(): boolean {
    return this.state !== 'idle'
  }

  /**
   * アルファ値を取得
   */
  getAlpha(): number {
    return this.alpha
  }
}
