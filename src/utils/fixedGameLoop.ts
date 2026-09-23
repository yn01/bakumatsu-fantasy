/**
 * 固定タイムステップのゲームループ
 *
 * 更新（update）は常に 1/60 秒刻みで実行し、描画（render）は
 * requestAnimationFrame のタイミングで行う（accumulator方式）。
 * これによりリフレッシュレートに依存しない挙動とアニメーションの
 * 量子化を両立する。
 */

import { animationManager } from '@/systems/graphics/AnimationManager'

/** 固定更新間隔（秒） */
export const FIXED_TIMESTEP = 1 / 60

/** 1フレームで処理する最大更新ステップ数（スパイラル防止） */
const MAX_STEPS_PER_FRAME = 5

export interface FixedGameLoopCallbacks {
  /** 固定間隔で呼ばれる更新処理（deltaTimeは常にFIXED_TIMESTEP） */
  update: (deltaTime: number) => void
  /** rAFごとに呼ばれる描画処理 */
  render: () => void
}

/**
 * ループを開始し、停止用の関数を返す
 */
export const startFixedGameLoop = (callbacks: FixedGameLoopCallbacks): (() => void) => {
  let frameId: number | null = null
  let lastTime = 0
  let accumulator = 0
  let running = true

  const frame = (currentTime: number) => {
    if (!running) return

    const frameTime =
      lastTime === 0 ? 0 : Math.min((currentTime - lastTime) / 1000, 0.25)
    lastTime = currentTime
    accumulator += frameTime

    let steps = 0
    while (accumulator >= FIXED_TIMESTEP && steps < MAX_STEPS_PER_FRAME) {
      accumulator -= FIXED_TIMESTEP
      steps++
      // グローバルアニメーションtickを進める（水タイル・歩行アニメ等）
      animationManager.update(FIXED_TIMESTEP)
      callbacks.update(FIXED_TIMESTEP)
    }

    // 処理落ち時は残余を捨てる（無限に溜めない）
    if (accumulator > FIXED_TIMESTEP * MAX_STEPS_PER_FRAME) {
      accumulator = 0
    }

    callbacks.render()

    frameId = requestAnimationFrame(frame)
  }

  frameId = requestAnimationFrame(frame)

  return () => {
    running = false
    if (frameId !== null) {
      cancelAnimationFrame(frameId)
      frameId = null
    }
  }
}
