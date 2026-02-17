/**
 * バトル画面描画システム
 * サイドビュー形式でバトル参加者を描画
 */

import type { BattleParticipant } from '@/types/battle'
import { spriteGenerator } from '@/systems/graphics/SpriteGenerator'
import { battleBackgroundGenerator } from '@/systems/graphics/BattleBackgroundGenerator'
import { getEnemyConfigKey } from '@/systems/graphics/spriteConfigs'

export class BattleRenderer {
  private readonly canvasWidth: number
  private readonly canvasHeight: number
  private readonly characterSize: number = 64
  private backgroundType: string = 'town'

  constructor(canvasWidth: number = 640, canvasHeight: number = 480) {
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
    enemies: BattleParticipant[]
  ): void {
    // 背景描画
    const bg = battleBackgroundGenerator.getBackground(this.backgroundType)
    ctx.drawImage(bg, 0, 0, this.canvasWidth, this.canvasHeight)

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

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
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

      this.renderPartyMember(ctx, participant, x, y)
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

      this.renderEnemyCharacter(ctx, participant, x, y)
    })
  }

  /**
   * 味方キャラクターを描画（スプライト使用）
   */
  private renderPartyMember(
    ctx: CanvasRenderingContext2D,
    participant: BattleParticipant,
    x: number,
    y: number
  ): void {
    const isDead = participant.state.includes('dead')

    if (isDead) {
      ctx.globalAlpha = 0.3
    }

    // Character sprite (64x64, facing right)
    const charId = participant.character.id
    const sprite = spriteGenerator.getCharacterSprite(charId, 'right', 0, 64)
    ctx.drawImage(sprite, x, y, this.characterSize, this.characterSize)

    // 防御中の表示
    if (participant.isDefending) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.fillRect(x, y, this.characterSize, this.characterSize)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = '24px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('\u{1F6E1}\u{FE0F}', x + this.characterSize / 2, y + this.characterSize / 2)
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
    y: number
  ): void {
    const isDead = participant.state.includes('dead')

    if (isDead) {
      ctx.globalAlpha = 0.3
    }

    // Enemy sprite
    const configKey = getEnemyConfigKey(participant.character.id, participant.character.class)
    const sprite = spriteGenerator.getEnemySprite(configKey, 64)
    ctx.drawImage(sprite, x, y, this.characterSize, this.characterSize)

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
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = side === 'party' ? 'left' : 'right'
    ctx.textBaseline = 'bottom'

    const textX = side === 'party' ? x : x + this.characterSize
    const textY = y - 5

    // Text shadow for readability
    ctx.fillStyle = '#000000'
    ctx.fillText(name, textX + 1, textY + 1)
    ctx.fillStyle = '#FFFFFF'
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
