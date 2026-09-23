/**
 * バトルアニメーションシステム（仮実装）
 * 攻撃アニメーション、ダメージ数値表示
 * Phase 4以降で拡張予定
 */

import { snap } from '@/systems/graphics/pixelCanvas'
import { animationManager } from '@/systems/graphics/AnimationManager'
import { BATTLE_FRAME_COUNTS, type BattleMotion } from '@/systems/graphics/SpriteGenerator'

interface DamageAnimation {
  targetId: string
  damage: number
  x: number
  y: number
  progress: number // 0.0〜1.0
  isCritical: boolean
}

interface AttackAnimation {
  actorId: string
  targetId: string
  progress: number // 0.0〜1.0（0.5で到達、1.0で戻る）
}

export class BattleAnimator {
  private damageAnimations: DamageAnimation[] = []
  private attackAnimation: AttackAnimation | null = null

  /**
   * ダメージアニメーションを開始
   */
  startDamageAnimation(
    targetId: string,
    damage: number,
    x: number,
    y: number,
    isCritical: boolean = false
  ): void {
    this.damageAnimations.push({
      targetId,
      damage,
      x,
      y,
      progress: 0,
      isCritical,
    })
  }

  /**
   * 攻撃アニメーションを開始
   */
  startAttackAnimation(actorId: string, targetId: string): void {
    this.attackAnimation = {
      actorId,
      targetId,
      progress: 0,
    }
  }

  /**
   * アニメーション更新
   */
  update(deltaTime: number): void {
    // ダメージアニメーション更新
    this.damageAnimations = this.damageAnimations.filter((anim) => {
      anim.progress += deltaTime * 2.0 // 0.5秒で完了
      return anim.progress < 1.0
    })

    // 攻撃アニメーション更新
    if (this.attackAnimation) {
      this.attackAnimation.progress += deltaTime * 4.0 // 0.25秒で完了
      if (this.attackAnimation.progress >= 1.0) {
        this.attackAnimation = null
      }
    }
  }

  /**
   * ダメージ数値を描画
   */
  renderDamageNumbers(ctx: CanvasRenderingContext2D): void {
    this.damageAnimations.forEach((anim) => {
      const alpha = 1.0 - anim.progress
      const offsetY = -anim.progress * 25 // 上に移動（320x240論理座標）

      ctx.save()
      ctx.globalAlpha = alpha

      // ダメージ数値
      ctx.fillStyle = anim.isCritical ? '#FFFF00' : '#FFFFFF'
      // TODO(Phase13-TaskB): ビットマップフォント化予定
      ctx.font = anim.isCritical ? 'bold 14px sans-serif' : 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`-${anim.damage}`, snap(anim.x), snap(anim.y + offsetY))

      // クリティカル表示
      if (anim.isCritical) {
        ctx.fillStyle = '#FF0000'
        ctx.font = 'bold 7px sans-serif'
        ctx.fillText('CRITICAL!', snap(anim.x), snap(anim.y + offsetY - 13))
      }

      ctx.restore()
    })
  }

  /**
   * 攻撃アニメーションのオフセットを取得
   * @param characterId キャラクターID
   * @returns オフセット { x, y }
   */
  getAttackOffset(characterId: string): { x: number; y: number } {
    if (!this.attackAnimation || this.attackAnimation.actorId !== characterId) {
      return { x: 0, y: 0 }
    }

    const progress = this.attackAnimation.progress

    // 前進（0〜0.5）→ 戻る（0.5〜1.0）
    let offsetX = 0
    if (progress < 0.5) {
      offsetX = progress * 2 * 30 // 前進（最大30論理px）
    } else {
      offsetX = (1.0 - progress) * 2 * 30 // 戻る
    }

    return { x: snap(offsetX), y: 0 }
  }

  /**
   * 指定キャラクターの現在のバトルモーション・フレームを取得する。
   * 攻撃アニメーション中の攻撃者は 'attack'、被弾直後の対象は 'hit'、
   * それ以外は 'idle'（呼吸モーション）を返す。'down'（戦闘不能）は
   * 生存状態を持つ呼び出し側（BattleRenderer）で上書きする。
   */
  getCharacterMotion(characterId: string): { motion: BattleMotion; frame: number } {
    if (this.attackAnimation && this.attackAnimation.actorId === characterId) {
      const p = this.attackAnimation.progress
      const frame = p < 0.35 ? 0 : p < 0.7 ? 1 : 2
      return { motion: 'attack', frame }
    }

    const hit = this.damageAnimations.find(
      (anim) => anim.targetId === characterId && anim.progress < 0.4
    )
    if (hit) {
      return { motion: 'hit', frame: 0 }
    }

    return { motion: 'idle', frame: animationManager.getFrame(2, BATTLE_FRAME_COUNTS.idle) }
  }

  /**
   * アニメーション実行中かどうか
   */
  isAnimating(): boolean {
    return this.damageAnimations.length > 0 || this.attackAnimation !== null
  }

  /**
   * すべてのアニメーションをクリア
   */
  clear(): void {
    this.damageAnimations = []
    this.attackAnimation = null
  }
}
