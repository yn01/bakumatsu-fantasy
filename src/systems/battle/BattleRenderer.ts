/**
 * バトル画面描画システム
 * サイドビュー形式でバトル参加者を描画
 */

import type { BattleParticipant } from '@/types/battle'

// 味方・敵の色（仮実装）
const PARTY_COLOR = '#4A90E2' // 味方（青）
const ENEMY_COLOR = '#E24A4A' // 敵（赤）

export class BattleRenderer {
  private readonly canvasWidth: number
  private readonly canvasHeight: number
  private readonly characterSize: number = 64

  constructor(canvasWidth: number = 640, canvasHeight: number = 480) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
  }

  /**
   * バトル画面全体を描画
   */
  render(
    ctx: CanvasRenderingContext2D,
    party: BattleParticipant[],
    enemies: BattleParticipant[]
  ): void {
    // 背景クリア
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)

    // 地面ライン
    this.renderGround(ctx)

    // 味方描画（左側）
    this.renderParty(ctx, party)

    // 敵描画（右側）
    this.renderEnemies(ctx, enemies)
  }

  /**
   * 地面ラインを描画
   */
  private renderGround(ctx: CanvasRenderingContext2D): void {
    const groundY = this.canvasHeight * 0.7

    ctx.strokeStyle = '#444444'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, groundY)
    ctx.lineTo(this.canvasWidth, groundY)
    ctx.stroke()
  }

  /**
   * 味方パーティを描画
   */
  private renderParty(ctx: CanvasRenderingContext2D, party: BattleParticipant[]): void {
    const baseX = 100
    const baseY = this.canvasHeight * 0.5
    const spacing = 80

    party.forEach((participant, index) => {
      const x = baseX
      const y = baseY + index * spacing

      this.renderCharacter(ctx, participant, x, y, PARTY_COLOR, 'party')
    })
  }

  /**
   * 敵グループを描画
   */
  private renderEnemies(ctx: CanvasRenderingContext2D, enemies: BattleParticipant[]): void {
    const baseX = this.canvasWidth - 150
    const baseY = this.canvasHeight * 0.4
    const spacing = 90

    enemies.forEach((participant, index) => {
      const x = baseX
      const y = baseY + index * spacing

      this.renderCharacter(ctx, participant, x, y, ENEMY_COLOR, 'enemy')
    })
  }

  /**
   * キャラクターを描画
   */
  private renderCharacter(
    ctx: CanvasRenderingContext2D,
    participant: BattleParticipant,
    x: number,
    y: number,
    color: string,
    side: 'party' | 'enemy'
  ): void {
    const isDead = participant.state.includes('dead')

    // 戦闘不能の場合は半透明
    if (isDead) {
      ctx.globalAlpha = 0.3
    }

    // キャラクター本体（四角形）
    ctx.fillStyle = color
    ctx.fillRect(x, y, this.characterSize, this.characterSize)

    // 枠線
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, this.characterSize, this.characterSize)

    // 防御中の表示
    if (participant.isDefending) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.fillRect(x, y, this.characterSize, this.characterSize)

      // 盾アイコン
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '24px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🛡️', x + this.characterSize / 2, y + this.characterSize / 2)
    }

    // アルファ値をリセット
    if (isDead) {
      ctx.globalAlpha = 1.0
    }

    // 名前表示
    this.renderName(ctx, participant.character.name, x, y, side)

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
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = side === 'party' ? 'left' : 'right'
    ctx.textBaseline = 'bottom'

    const textX = side === 'party' ? x : x + this.characterSize
    const textY = y - 5

    ctx.fillText(name, textX, textY)
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
    const barHeight = 8
    const barY = y + this.characterSize + 5

    const hpPercent = participant.currentHp / participant.character.stats.maxHp
    const currentBarWidth = barWidth * hpPercent

    // 背景
    ctx.fillStyle = '#333333'
    ctx.fillRect(x, barY, barWidth, barHeight)

    // HPバー
    if (hpPercent > 0.5) {
      ctx.fillStyle = '#4AE24A' // 緑
    } else if (hpPercent > 0.25) {
      ctx.fillStyle = '#E2E24A' // 黄
    } else {
      ctx.fillStyle = '#E24A4A' // 赤
    }
    ctx.fillRect(x, barY, currentBarWidth, barHeight)

    // 枠線
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1
    ctx.strokeRect(x, barY, barWidth, barHeight)

    // HP数値表示
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '10px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(
      `${participant.currentHp}/${participant.character.stats.maxHp}`,
      x + barWidth / 2,
      barY + barHeight + 2
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
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    statusStates.forEach((state, index) => {
      ctx.fillText(state, x, y + this.characterSize + 30 + index * 12)
    })
  }
}
