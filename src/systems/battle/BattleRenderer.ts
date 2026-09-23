/**
 * バトル画面描画システム
 * サイドビュー形式でバトル参加者を描画
 */

import type { BattleParticipant } from '@/types/battle'
import { spriteGenerator, type BattleMotion } from '@/systems/graphics/SpriteGenerator'
import { battleBackgroundGenerator } from '@/systems/graphics/BattleBackgroundGenerator'
import { getEnemyConfigKey } from '@/systems/graphics/spriteConfigs'
import { LOGICAL_WIDTH, LOGICAL_HEIGHT, snap } from '@/systems/graphics/pixelCanvas'
import type { BattleAnimator } from '@/systems/battle/BattleAnimator'
import { animationManager } from '@/systems/graphics/AnimationManager'

/**
 * 320x240 論理解像度を前提としたバトル画面レイアウト定数（すべて整数）
 */
export const BATTLE_LAYOUT = {
  /** キャラクターの描画サイズ（論理px） */
  characterSize: 32,
  /** 地面ラインのY座標（240 * 0.7 = 168） */
  groundY: 168,
  /** 味方の基準X座標 */
  partyBaseX: 50,
  /** 味方の基準Y座標（240 * 0.5 = 120） */
  partyBaseY: 120,
  /** 味方の縦間隔 */
  partySpacing: 40,
  /** 敵の基準X座標（320 - 75） */
  enemyBaseX: LOGICAL_WIDTH - 75,
  /** 敵の基準Y座標（240 * 0.4 = 96） */
  enemyBaseY: 96,
  /** 敵の縦間隔 */
  enemySpacing: 45,
} as const

/** 味方スロットの中心座標を取得（エフェクト位置用） */
export const getPartySlotCenter = (index: number): { x: number; y: number } => ({
  x: BATTLE_LAYOUT.partyBaseX + BATTLE_LAYOUT.characterSize / 2,
  y: BATTLE_LAYOUT.partyBaseY + index * BATTLE_LAYOUT.partySpacing + BATTLE_LAYOUT.characterSize / 2,
})

/** 敵スロットの中心座標を取得（エフェクト位置用） */
export const getEnemySlotCenter = (index: number): { x: number; y: number } => ({
  x: BATTLE_LAYOUT.enemyBaseX + BATTLE_LAYOUT.characterSize / 2,
  y: BATTLE_LAYOUT.enemyBaseY + index * BATTLE_LAYOUT.enemySpacing + BATTLE_LAYOUT.characterSize / 2,
})

export class BattleRenderer {
  private readonly canvasWidth: number
  private readonly canvasHeight: number
  private readonly characterSize: number = BATTLE_LAYOUT.characterSize
  private backgroundType: string = 'town'

  constructor(canvasWidth: number = LOGICAL_WIDTH, canvasHeight: number = LOGICAL_HEIGHT) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
  }

  /**
   * バトル背景タイプを設定
   */
  setBackgroundType(type: string): void {
    this.backgroundType = type
  }

  /**
   * バトル画面全体を描画
   */
  render(
    ctx: CanvasRenderingContext2D,
    party: BattleParticipant[],
    enemies: BattleParticipant[],
    animator?: BattleAnimator
  ): void {
    // 背景描画（320x240ネイティブ・遠景/中景/近景の3層パララックス）
    const layers = battleBackgroundGenerator.getBackground(this.backgroundType)
    // 遠景は静止。中景・近景はAnimationManagerのグローバルtickに応じてゆっくり横スクロールする
    const tick = animationManager.getTick()
    ctx.drawImage(layers.far, 0, 0, this.canvasWidth, this.canvasHeight)
    this.drawScrollingLayer(ctx, layers.mid, tick * 0.02)
    this.drawScrollingLayer(ctx, layers.near, tick * 0.05)

    // 地面ライン
    this.renderGround(ctx)

    // 味方描画（左側）
    this.renderParty(ctx, party, animator)

    // 敵描画（右側）
    this.renderEnemies(ctx, enemies, animator)
  }

  /**
   * 参加者の現在のバトルモーションを解決する。
   * 戦闘不能は常に 'down'。それ以外は BattleAnimator から攻撃/被弾/待機を取得する
   * （animator 未指定時はアイドル1フレーム固定＝テスト等の簡易呼び出し向け）。
   */
  private resolveMotion(
    participant: BattleParticipant,
    animator: BattleAnimator | undefined
  ): { motion: BattleMotion; frame: number } {
    if (participant.state.includes('dead')) {
      return { motion: 'down', frame: 0 }
    }
    if (animator) {
      return animator.getCharacterMotion(participant.character.id)
    }
    return { motion: 'idle', frame: 0 }
  }

  /**
   * パララックス層をシームレスに横スクロール描画する。
   * レイヤーは幅がキャンバス幅の整数倍で生成されている前提（オフセットをその幅でラップする）。
   */
  private drawScrollingLayer(
    ctx: CanvasRenderingContext2D,
    layer: HTMLCanvasElement,
    offsetX: number
  ): void {
    const layerW = layer.width
    if (layerW <= this.canvasWidth) {
      // スクロール不要（屋内など単層構成）
      ctx.drawImage(layer, 0, 0, this.canvasWidth, this.canvasHeight)
      return
    }

    const ox = snap(((offsetX % layerW) + layerW) % layerW)
    const firstW = layerW - ox
    if (firstW >= this.canvasWidth) {
      ctx.drawImage(layer, ox, 0, this.canvasWidth, layer.height, 0, 0, this.canvasWidth, this.canvasHeight)
      return
    }

    ctx.drawImage(layer, ox, 0, firstW, layer.height, 0, 0, firstW, this.canvasHeight)
    const remaining = this.canvasWidth - firstW
    ctx.drawImage(layer, 0, 0, remaining, layer.height, firstW, 0, remaining, this.canvasHeight)
  }

  /**
   * 地面ラインを描画
   */
  private renderGround(ctx: CanvasRenderingContext2D): void {
    const groundY = BATTLE_LAYOUT.groundY

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, groundY + 0.5)
    ctx.lineTo(this.canvasWidth, groundY + 0.5)
    ctx.stroke()
  }

  /**
   * 味方パーティを描画
   */
  private renderParty(
    ctx: CanvasRenderingContext2D,
    party: BattleParticipant[],
    animator: BattleAnimator | undefined
  ): void {
    const baseX = BATTLE_LAYOUT.partyBaseX
    const baseY = BATTLE_LAYOUT.partyBaseY
    const spacing = BATTLE_LAYOUT.partySpacing

    party.forEach((participant, index) => {
      const x = baseX
      const y = baseY + index * spacing

      this.renderPartyMember(ctx, participant, x, y, animator)
    })
  }

  /**
   * 敵グループを描画
   */
  private renderEnemies(
    ctx: CanvasRenderingContext2D,
    enemies: BattleParticipant[],
    animator: BattleAnimator | undefined
  ): void {
    const baseX = BATTLE_LAYOUT.enemyBaseX
    const baseY = BATTLE_LAYOUT.enemyBaseY
    const spacing = BATTLE_LAYOUT.enemySpacing

    enemies.forEach((participant, index) => {
      const x = baseX
      const y = baseY + index * spacing

      this.renderEnemyCharacter(ctx, participant, x, y, animator)
    })
  }

  /**
   * 味方キャラクターを描画（スプライト使用）
   */
  private renderPartyMember(
    ctx: CanvasRenderingContext2D,
    participant: BattleParticipant,
    x: number,
    y: number,
    animator: BattleAnimator | undefined
  ): void {
    const isDead = participant.state.includes('dead')

    if (isDead) {
      ctx.globalAlpha = 0.3
    }

    const charId = participant.character.id
    const { motion, frame } = this.resolveMotion(participant, animator)
    const sprite = spriteGenerator.getCharacterBattleSprite(charId, motion, frame)
    ctx.drawImage(sprite, snap(x), snap(y), this.characterSize, this.characterSize)

    // 防御中の表示
    if (participant.isDefending) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.fillRect(snap(x), snap(y), this.characterSize, this.characterSize)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('\u{1F6E1}\u{FE0F}', snap(x + this.characterSize / 2), snap(y + this.characterSize / 2))
    }

    if (isDead) {
      ctx.globalAlpha = 1.0
    }

    // 名前表示
    this.renderName(ctx, participant.character.name, x, y, 'party')

    // HPバー表示
    this.renderHPBar(ctx, participant, x, y)

    // 状態異常表示
    this.renderStatus(ctx, participant, x, y)
  }

  /**
   * 敵キャラクターを描画（スプライト使用）
   */
  private renderEnemyCharacter(
    ctx: CanvasRenderingContext2D,
    participant: BattleParticipant,
    x: number,
    y: number,
    animator: BattleAnimator | undefined
  ): void {
    const isDead = participant.state.includes('dead')

    if (isDead) {
      ctx.globalAlpha = 0.3
    }

    // Enemy sprite
    const configKey = getEnemyConfigKey(participant.character.id, participant.character.class)
    const { motion, frame } = this.resolveMotion(participant, animator)
    const sprite = spriteGenerator.getEnemyBattleSprite(configKey, motion, frame)
    ctx.drawImage(sprite, snap(x), snap(y), this.characterSize, this.characterSize)

    if (isDead) {
      ctx.globalAlpha = 1.0
    }

    // 名前表示
    this.renderName(ctx, participant.character.name, x, y, 'enemy')

    // HPバー表示
    this.renderHPBar(ctx, participant, x, y)

    // 状態異常表示
    this.renderStatus(ctx, participant, x, y)
  }

  /**
   * 名前を描画
   */
  private renderName(
    ctx: CanvasRenderingContext2D,
    name: string,
    x: number,
    y: number,
    side: 'party' | 'enemy'
  ): void {
    ctx.fillStyle = '#FFFFFF'
    // TODO(Phase13-TaskB): 320x240ではベクターフォントが潰れるためビットマップフォント化する
    ctx.font = 'bold 7px sans-serif'
    ctx.textAlign = side === 'party' ? 'left' : 'right'
    ctx.textBaseline = 'bottom'

    const textX = side === 'party' ? x : x + this.characterSize
    const textY = y - 3

    // Text shadow for readability
    ctx.fillStyle = '#000000'
    ctx.fillText(name, snap(textX) + 1, snap(textY) + 1)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(name, snap(textX), snap(textY))
  }

  /**
   * HPバーを描画
   */
  private renderHPBar(
    ctx: CanvasRenderingContext2D,
    participant: BattleParticipant,
    x: number,
    y: number
  ): void {
    const barWidth = this.characterSize
    const barHeight = 4
    const barY = y + this.characterSize + 3

    const hpPercent = participant.currentHp / participant.character.stats.maxHp
    const currentBarWidth = barWidth * hpPercent

    // 背景
    ctx.fillStyle = '#333333'
    ctx.fillRect(snap(x), snap(barY), barWidth, barHeight)

    // HPバー
    if (hpPercent > 0.5) {
      ctx.fillStyle = '#4AE24A' // 緑
    } else if (hpPercent > 0.25) {
      ctx.fillStyle = '#E2E24A' // 黄
    } else {
      ctx.fillStyle = '#E24A4A' // 赤
    }
    ctx.fillRect(snap(x), snap(barY), Math.round(currentBarWidth), barHeight)

    // 枠線
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1
    ctx.strokeRect(snap(x) + 0.5, snap(barY) + 0.5, barWidth - 1, barHeight - 1)

    // HP数値表示
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '6px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(
      `${participant.currentHp}/${participant.character.stats.maxHp}`,
      snap(x + barWidth / 2),
      snap(barY + barHeight + 1)
    )
  }

  /**
   * 状態異常を描画
   */
  private renderStatus(
    ctx: CanvasRenderingContext2D,
    participant: BattleParticipant,
    x: number,
    y: number
  ): void {
    const statusStates = participant.state.filter((s) => s !== 'normal')
    if (statusStates.length === 0) return

    ctx.fillStyle = '#AA00FF'
    ctx.font = '6px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    statusStates.forEach((state, index) => {
      ctx.fillText(state, snap(x), snap(y + this.characterSize + 16 + index * 7))
    })
  }
}
