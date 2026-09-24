/**
 * Procedural sprite generator using Canvas API
 *
 * Phase13-TaskB: 16x16ネイティブ生成に移行。
 * - フィールド用（キャラクター/NPC）は 16x16 の論理グリッドへ 1px=1px で直接描画する
 *   （32px で生成して 16px へ縮小する旧方式は廃止）。
 * - バトル用は 16px の 2 倍拡大ではなく、32x32 専用のディテール（眉・武器・多段シェーディング）で描く。
 * - 全ての座標・オフセットは整数のみ（小数ピクセルオフセットは使用しない）。
 * - 色は必ず `palette.ts` の固定パレットから選ぶ。アウトラインは `withOutline()` により
 *   PALETTE.SUMI で統一する。
 */

import {
  CHARACTER_CONFIGS,
  NPC_CONFIGS,
  ENEMY_CONFIGS,
  type SpriteConfig,
  type EnemySpriteConfig,
} from './spriteConfigs'
import { PALETTE, darker, lighter, type PaletteColor } from './palette'

type DirectionType = 'up' | 'down' | 'left' | 'right'
/** フィールド歩行アニメーションのフレーム（4フレーム: コンタクト→ダウン→パス→アップ） */
export type FieldFrame = 0 | 1 | 2 | 3
/** バトル用モーション */
export type BattleMotion = 'idle' | 'attack' | 'hit' | 'down'

const FIELD_SIZE = 16
const BATTLE_SIZE = 32

/** アウトラインは統一してこの色を使う（palette エージェント申し送り） */
const OUTLINE: PaletteColor = PALETTE.SUMI

/** モーションごとのフレーム数 */
export const BATTLE_FRAME_COUNTS: Record<BattleMotion, number> = {
  idle: 2,
  attack: 3,
  hit: 1,
  down: 1,
}

/**
 * フィールド歩行の4フレームサイクル。
 * legOffset: 左右の脚の水平方向オフセット（整数px）
 * bounce: 体全体の沈み込み量（整数px、0固定を廃止した「コンタクト/ダウン/パス/アップ」表現）
 */
const WALK_FRAMES: ReadonlyArray<{ legOffset: -1 | 0 | 1; bounce: 0 | 1 }> = [
  { legOffset: 0, bounce: 0 }, // コンタクト（中間・直立）
  { legOffset: 1, bounce: 1 }, // ダウン（右脚前・沈み込み）
  { legOffset: 0, bounce: 0 }, // パス（中間）
  { legOffset: -1, bounce: 1 }, // アップ（左脚前・沈み込み）
]

function createCanvas(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  return c
}

/** 1x1px を塗る（ネイティブ解像度なので拡大係数は不要） */
function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color
  ctx.fillRect(x, y, 1, 1)
}

/** w x h の矩形を塗る */
function pxRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
): void {
  if (w <= 0 || h <= 0) return
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
}

/**
 * シルエットの外周に1pxアウトラインを焼き込む。
 * 透明ピクセルの4近傍にある不透明ピクセルの外側へ outlineColor を1px分だけ描き足す。
 */
function withOutline(
  source: HTMLCanvasElement,
  outlineColor: PaletteColor = OUTLINE
): HTMLCanvasElement {
  const w = source.width
  const h = source.height

  const silhouette = createCanvas(w)
  silhouette.width = w
  silhouette.height = h
  const sctx = silhouette.getContext('2d')!
  sctx.drawImage(source, 0, 0)
  sctx.globalCompositeOperation = 'source-in'
  sctx.fillStyle = outlineColor
  sctx.fillRect(0, 0, w, h)

  const out = createCanvas(w)
  out.width = w
  out.height = h
  const octx = out.getContext('2d')!
  const offsets: ReadonlyArray<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
  for (const [dx, dy] of offsets) {
    octx.drawImage(silhouette, dx, dy)
  }
  octx.drawImage(source, 0, 0)
  return out
}

class SpriteGeneratorClass {
  private cache = new Map<string, HTMLCanvasElement>()
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    // フィールド用キャラクタースプライトを事前生成
    for (const id of Object.keys(CHARACTER_CONFIGS)) {
      for (const dir of ['up', 'down', 'left', 'right'] as DirectionType[]) {
        for (const frame of [0, 1, 2, 3] as FieldFrame[]) {
          this.getCharacterSprite(id, dir, frame)
        }
      }
      // バトル用モーションを事前生成
      for (const motion of Object.keys(BATTLE_FRAME_COUNTS) as BattleMotion[]) {
        const frameCount = BATTLE_FRAME_COUNTS[motion]
        for (let f = 0; f < frameCount; f++) {
          this.getCharacterBattleSprite(id, motion, f)
        }
      }
    }

    // NPCスプライトを事前生成
    for (const type of Object.keys(NPC_CONFIGS)) {
      for (const dir of ['up', 'down', 'left', 'right'] as DirectionType[]) {
        this.getNPCSprite(type, dir, 0)
      }
    }

    // 敵スプライト（バトル用）を事前生成
    for (const id of Object.keys(ENEMY_CONFIGS)) {
      for (const motion of Object.keys(BATTLE_FRAME_COUNTS) as BattleMotion[]) {
        const frameCount = BATTLE_FRAME_COUNTS[motion]
        for (let f = 0; f < frameCount; f++) {
          this.getEnemyBattleSprite(id, motion, f)
        }
      }
    }

    this.initialized = true
  }

  /**
   * フィールド用キャラクタースプライトを取得（16x16 ネイティブ）
   */
  getCharacterSprite(
    id: string,
    direction: DirectionType,
    frame: FieldFrame
  ): HTMLCanvasElement {
    const key = `char_${id}_${direction}_${frame}`
    const cached = this.cache.get(key)
    if (cached) return cached

    const config = (CHARACTER_CONFIGS[id] ?? CHARACTER_CONFIGS['ryoma'])!
    const canvas = withOutline(this.drawFieldCharacter(config, direction, frame))
    this.cache.set(key, canvas)
    return canvas
  }

  /**
   * NPCスプライトを取得（16x16 ネイティブ）
   */
  getNPCSprite(npcType: string, direction: string, frame: number): HTMLCanvasElement {
    const key = `npc_${npcType}_${direction}_${frame}`
    const cached = this.cache.get(key)
    if (cached) return cached

    const config = (NPC_CONFIGS[npcType] ?? NPC_CONFIGS['villager'])!
    const canvas = withOutline(
      this.drawFieldCharacter(config, direction as DirectionType, (frame % 4) as FieldFrame)
    )
    this.cache.set(key, canvas)
    return canvas
  }

  /**
   * バトル用プレイアブルキャラクタースプライトを取得（32x32 専用ディテール）
   */
  getCharacterBattleSprite(
    id: string,
    motion: BattleMotion,
    frame: number
  ): HTMLCanvasElement {
    const clampedFrame = frame % BATTLE_FRAME_COUNTS[motion]
    const key = `charbattle_${id}_${motion}_${clampedFrame}`
    const cached = this.cache.get(key)
    if (cached) return cached

    const config = (CHARACTER_CONFIGS[id] ?? CHARACTER_CONFIGS['ryoma'])!
    const canvas = withOutline(this.drawBattleCharacter(config, motion, clampedFrame))
    this.cache.set(key, canvas)
    return canvas
  }

  /**
   * バトル用敵スプライトを取得（32x32 専用ディテール）
   */
  getEnemyBattleSprite(
    id: string,
    motion: BattleMotion = 'idle',
    frame: number = 0
  ): HTMLCanvasElement {
    const clampedFrame = frame % BATTLE_FRAME_COUNTS[motion]
    const key = `enemy_${id}_${motion}_${clampedFrame}`
    const cached = this.cache.get(key)
    if (cached) return cached

    const config = (ENEMY_CONFIGS[id] ?? ENEMY_CONFIGS['bandit'])!
    const canvas = withOutline(this.drawBattleEnemy(config, motion, clampedFrame))
    this.cache.set(key, canvas)
    return canvas
  }

  // ------------------------------------------------------------------
  // フィールド用描画（16x16 ネイティブ）
  // ------------------------------------------------------------------

  private drawFieldCharacter(
    config: SpriteConfig,
    direction: DirectionType,
    frame: FieldFrame
  ): HTMLCanvasElement {
    const canvas = createCanvas(FIELD_SIZE)
    const ctx = canvas.getContext('2d')!
    const { legOffset, bounce } = WALK_FRAMES[frame]!

    if (direction === 'down') {
      this.drawFieldFront(ctx, config, legOffset, bounce)
    } else if (direction === 'up') {
      this.drawFieldBack(ctx, config, legOffset, bounce)
    } else {
      this.drawFieldSide(ctx, config, legOffset, bounce, direction === 'right')
    }

    return canvas
  }

  private drawFieldFront(
    ctx: CanvasRenderingContext2D,
    config: SpriteConfig,
    legOffset: -1 | 0 | 1,
    bounce: 0 | 1
  ): void {
    const { hairColor, skinColor, topColor, bottomColor, accessoryColor, isLarge, hasLongHair } =
      config
    const headW = isLarge ? 10 : 8
    const bodyW = isLarge ? 10 : 8
    const headX = Math.floor((FIELD_SIZE - headW) / 2)
    const bodyX = Math.floor((FIELD_SIZE - bodyW) / 2)
    const headY = bounce

    // 髪（上段）
    pxRect(ctx, headX, headY, headW, 1, lighter(hairColor))
    pxRect(ctx, headX, headY + 1, headW, 1, hairColor)

    // 顔
    const faceY = headY + 2
    pxRect(ctx, headX, faceY, headW, 3, skinColor)
    px(ctx, headX, faceY, hairColor)
    px(ctx, headX + headW - 1, faceY, hairColor)
    if (hasLongHair) {
      pxRect(ctx, headX - 1, faceY, 1, 3, hairColor)
      pxRect(ctx, headX + headW, faceY, 1, 3, hairColor)
    }
    // 目（2px幅にして視認性を確保。1px点だと実プレイ解像度でほぼ潰れる）
    const eyeW = 2
    const leftEyeX = headX + 1
    const rightEyeX = headX + headW - 1 - eyeW
    pxRect(ctx, leftEyeX, faceY + 1, eyeW, 1, OUTLINE)
    pxRect(ctx, rightEyeX, faceY + 1, eyeW, 1, OUTLINE)
    // 眉影（目の直上を1段暗くして彫りを出す）
    pxRect(ctx, leftEyeX, faceY, eyeW, 1, darker(skinColor))
    pxRect(ctx, rightEyeX, faceY, eyeW, 1, darker(skinColor))

    // 上衣
    const bodyY = faceY + 3
    pxRect(ctx, bodyX, bodyY, bodyW, 1, topColor)
    pxRect(ctx, bodyX, bodyY + 1, bodyW, 1, darker(topColor))

    let nextY = bodyY + 2
    if (accessoryColor) {
      pxRect(ctx, bodyX, nextY, bodyW, 1, accessoryColor)
      nextY += 1
    }

    // 袴（下衣）
    pxRect(ctx, bodyX, nextY, bodyW, 1, bottomColor)
    pxRect(ctx, bodyX, nextY + 1, bodyW, 1, darker(bottomColor))
    nextY += 2

    // 脚と足元
    const legW = isLarge ? 3 : 2
    const legLX = bodyX + 1 + legOffset
    const legRX = bodyX + bodyW - 1 - legW - legOffset
    pxRect(ctx, legLX, nextY, legW, 1, bottomColor)
    pxRect(ctx, legRX, nextY, legW, 1, bottomColor)
    pxRect(ctx, legLX, nextY + 1, legW, 1, OUTLINE)
    pxRect(ctx, legRX, nextY + 1, legW, 1, OUTLINE)
  }

  private drawFieldBack(
    ctx: CanvasRenderingContext2D,
    config: SpriteConfig,
    legOffset: -1 | 0 | 1,
    bounce: 0 | 1
  ): void {
    const { hairColor, topColor, bottomColor, accessoryColor, isLarge } = config
    const headW = isLarge ? 10 : 8
    const bodyW = isLarge ? 10 : 8
    const headX = Math.floor((FIELD_SIZE - headW) / 2)
    const bodyX = Math.floor((FIELD_SIZE - bodyW) / 2)
    const headY = bounce

    // 後頭部（髪で覆われる）
    pxRect(ctx, headX, headY, headW, 1, lighter(hairColor))
    pxRect(ctx, headX, headY + 1, headW, 2, hairColor)

    const bodyY = headY + 5
    pxRect(ctx, bodyX, bodyY, bodyW, 1, topColor)
    pxRect(ctx, bodyX, bodyY + 1, bodyW, 1, darker(topColor))

    let nextY = bodyY + 2
    if (accessoryColor) {
      pxRect(ctx, bodyX, nextY, bodyW, 1, accessoryColor)
      nextY += 1
    }

    pxRect(ctx, bodyX, nextY, bodyW, 1, bottomColor)
    pxRect(ctx, bodyX, nextY + 1, bodyW, 1, darker(bottomColor))
    nextY += 2

    const legW = isLarge ? 3 : 2
    const legLX = bodyX + 1 + legOffset
    const legRX = bodyX + bodyW - 1 - legW - legOffset
    pxRect(ctx, legLX, nextY, legW, 1, bottomColor)
    pxRect(ctx, legRX, nextY, legW, 1, bottomColor)
    pxRect(ctx, legLX, nextY + 1, legW, 1, OUTLINE)
    pxRect(ctx, legRX, nextY + 1, legW, 1, OUTLINE)
  }

  private drawFieldSide(
    ctx: CanvasRenderingContext2D,
    config: SpriteConfig,
    legOffset: -1 | 0 | 1,
    bounce: 0 | 1,
    facingRight: boolean
  ): void {
    const { hairColor, skinColor, topColor, bottomColor, hasLongHair, isLarge } = config
    const headW = isLarge ? 9 : 7
    const bodyW = isLarge ? 9 : 7
    const headX = Math.floor((FIELD_SIZE - headW) / 2)
    const bodyX = Math.floor((FIELD_SIZE - bodyW) / 2)
    const headY = bounce

    // 髪
    pxRect(ctx, headX, headY, headW, 2, hairColor)

    // 顔（進行方向側のみ肌色、反対側は後頭部の髪）
    // 肌面を3px幅確保し、外周1pxを残して目を2px幅で置く（1px点は実解像度で潰れるため）
    const faceY = headY + 2
    const faceSkinW = 3
    if (facingRight) {
      pxRect(ctx, headX, faceY, headW - faceSkinW, 3, hairColor)
      pxRect(ctx, headX + headW - faceSkinW, faceY, faceSkinW, 3, skinColor)
      pxRect(ctx, headX + headW - faceSkinW, faceY + 1, 2, 1, OUTLINE)
    } else {
      pxRect(ctx, headX + faceSkinW, faceY, headW - faceSkinW, 3, hairColor)
      pxRect(ctx, headX, faceY, faceSkinW, 3, skinColor)
      pxRect(ctx, headX + 1, faceY + 1, 2, 1, OUTLINE)
    }

    if (hasLongHair) {
      const trailX = facingRight ? headX - 1 : headX + headW
      pxRect(ctx, trailX, faceY, 1, 3, hairColor)
    }

    // 体
    const bodyY = faceY + 3
    pxRect(ctx, bodyX, bodyY, bodyW, 1, topColor)
    pxRect(ctx, bodyX, bodyY + 1, bodyW, 1, darker(topColor))

    // 腕
    const armX = facingRight ? bodyX + bodyW : bodyX - 1
    px(ctx, armX, bodyY, skinColor)

    // 袴
    pxRect(ctx, bodyX, bodyY + 2, bodyW, 1, bottomColor)
    pxRect(ctx, bodyX, bodyY + 3, bodyW, 1, darker(bottomColor))

    // 脚（前後2本、前脚は進行方向へ）
    const legY = bodyY + 4
    const legW = isLarge ? 3 : 2
    const frontX = facingRight ? bodyX + bodyW - legW + legOffset : bodyX - legOffset
    const backX = facingRight ? bodyX - legOffset : bodyX + bodyW - legW + legOffset
    pxRect(ctx, frontX, legY, legW, 1, bottomColor)
    pxRect(ctx, backX, legY, legW, 1, bottomColor)
    pxRect(ctx, frontX, legY + 1, legW, 1, OUTLINE)
    pxRect(ctx, backX, legY + 1, legW, 1, OUTLINE)
  }

  // ------------------------------------------------------------------
  // バトル用描画（32x32 専用ディテール）
  // ------------------------------------------------------------------

  /**
   * モーション・フレームごとの姿勢オフセット（すべて整数px）
   */
  private battlePose(motion: BattleMotion, frame: number): {
    lunge: number
    lift: number
    lean: number
  } {
    switch (motion) {
      case 'idle':
        // 2フレームの呼吸モーション（体がわずかに上下）
        return { lunge: 0, lift: frame === 1 ? 1 : 0, lean: 0 }
      case 'attack':
        // 3フレーム: 振りかぶり → 踏み込み → 残心
        if (frame === 0) return { lunge: -2, lift: 0, lean: -1 } // 振りかぶり（後傾）
        if (frame === 1) return { lunge: 4, lift: 0, lean: 2 } // 踏み込み（前傾）
        return { lunge: 1, lift: 0, lean: 0 } // 残心
      case 'hit':
        // 被弾: のけぞる
        return { lunge: -3, lift: 0, lean: -2 }
      case 'down':
        // やられ: くずおれる
        return { lunge: 0, lift: 6, lean: 0 }
    }
  }

  private drawBattleCharacter(
    config: SpriteConfig,
    motion: BattleMotion,
    frame: number
  ): HTMLCanvasElement {
    const canvas = createCanvas(BATTLE_SIZE)
    const ctx = canvas.getContext('2d')!
    const {
      hairColor,
      skinColor,
      topColor,
      bottomColor,
      accessoryColor,
      isLarge,
      hasLongHair,
      eyeStyle = 'normal',
    } = config
    const { lunge, lift, lean } = this.battlePose(motion, frame)

    const headW = isLarge ? 16 : 13
    const bodyW = isLarge ? 17 : 14
    const baseX = Math.floor((BATTLE_SIZE - bodyW) / 2) + lunge
    const headX = baseX + Math.floor((bodyW - headW) / 2) + lean
    const headY = 3 + lift

    // 髪（上段2段）
    pxRect(ctx, headX, headY, headW, 2, lighter(hairColor))
    pxRect(ctx, headX, headY + 2, headW, 2, hairColor)

    // 顔
    const faceY = headY + 4
    pxRect(ctx, headX, faceY, headW, 5, skinColor)
    pxRect(ctx, headX, faceY, 1, 5, hairColor)
    pxRect(ctx, headX + headW - 1, faceY, 1, 5, hairColor)
    if (hasLongHair) {
      pxRect(ctx, headX - 1, faceY, 1, 6, hairColor)
      pxRect(ctx, headX + headW, faceY, 1, 6, hairColor)
    }
    // 目・眉（表情の要。2px幅にして視認性を確保し、eyeStyleでキャラの個性を出す）
    const leftEyeX = headX + 2
    const rightEyeX = headX + headW - 4
    const eyeShut = motion === 'hit' || motion === 'down'
    const browColor = darker(hairColor)

    if (eyeStyle === 'bold') {
      // 太い眉（西郷）: 眉を2段厚くし、幅も広めに取る
      pxRect(ctx, leftEyeX - 1, faceY, 4, 2, browColor)
      pxRect(ctx, rightEyeX - 1, faceY, 4, 2, browColor)
    } else if (eyeStyle !== 'thin') {
      // 通常の眉: 1段
      pxRect(ctx, leftEyeX, faceY + 1, 2, 1, browColor)
      pxRect(ctx, rightEyeX, faceY + 1, 2, 1, browColor)
    }
    // 'thin'（勝）は眉を描かず、切れ長の目だけで表情を作る

    if (eyeShut) {
      pxRect(ctx, leftEyeX, faceY + 2, 2, 1, OUTLINE)
      pxRect(ctx, rightEyeX, faceY + 2, 2, 1, OUTLINE)
    } else if (eyeStyle === 'thin') {
      // 細い目: 縦1pxのまま横幅だけ広く取り、鋭い目つきにする
      pxRect(ctx, leftEyeX - 1, faceY + 2, 3, 1, OUTLINE)
      pxRect(ctx, rightEyeX - 1, faceY + 2, 3, 1, OUTLINE)
    } else {
      pxRect(ctx, leftEyeX, faceY + 2, 2, 1, OUTLINE)
      pxRect(ctx, rightEyeX, faceY + 2, 2, 1, OUTLINE)
    }
    // 口
    px(ctx, headX + Math.floor(headW / 2), faceY + 4, darker(skinColor))

    // 上衣（胸元・肩）
    const bodyY = faceY + 5
    pxRect(ctx, baseX, bodyY, bodyW, 1, lighter(topColor))
    pxRect(ctx, baseX, bodyY + 1, bodyW, 3, topColor)
    pxRect(ctx, baseX, bodyY + 3, bodyW, 1, darker(topColor))

    let nextY = bodyY + 4
    if (accessoryColor) {
      pxRect(ctx, baseX, nextY, bodyW, 1, accessoryColor)
      nextY += 1
    }

    // 腕（前腕は攻撃モーションで突き出す）
    const armY = bodyY + 1
    const frontArmX = baseX + bodyW + Math.max(0, lunge > 0 ? 2 : 0)
    pxRect(ctx, frontArmX, armY, 2, 3, skinColor)
    pxRect(ctx, baseX - 2, armY, 2, 3, skinColor)

    // 刀（攻撃時に前腕の先へ伸ばす）
    if (motion === 'attack') {
      const swordLen = frame === 1 ? 10 : 6
      pxRect(ctx, frontArmX + 2, armY - 1, swordLen, 1, PALETTE.GIN_LIGHT)
      pxRect(ctx, frontArmX + 2, armY, swordLen, 1, PALETTE.GIN)
      px(ctx, frontArmX + 1, armY, PALETTE.KOGE)
    }

    // 袴
    pxRect(ctx, baseX, nextY, bodyW, 2, bottomColor)
    pxRect(ctx, baseX, nextY + 2, bodyW, 1, darker(bottomColor))
    nextY += 3

    // 脚・足元
    const legW = isLarge ? 5 : 4
    const legLX = baseX + 1
    const legRX = baseX + bodyW - 1 - legW
    const legH = motion === 'down' ? 2 : 4
    pxRect(ctx, legLX, nextY, legW, legH, bottomColor)
    pxRect(ctx, legRX, nextY, legW, legH, bottomColor)
    pxRect(ctx, legLX, nextY + legH, legW, 1, OUTLINE)
    pxRect(ctx, legRX, nextY + legH, legW, 1, OUTLINE)

    return canvas
  }

  // ------------------------------------------------------------------
  // 敵バトルスプライト（32x32 専用ディテール）
  // ------------------------------------------------------------------

  private drawBattleEnemy(
    config: EnemySpriteConfig,
    motion: BattleMotion,
    frame: number
  ): HTMLCanvasElement {
    const canvas = createCanvas(BATTLE_SIZE)
    const ctx = canvas.getContext('2d')!
    const { lunge, lift, lean } = this.battlePose(motion, frame)

    switch (config.shape) {
      case 'beast':
        this.drawBeastEnemy(ctx, config, lunge, lift)
        break
      case 'large_humanoid':
        this.drawLargeHumanoidEnemy(ctx, config, motion, frame, lunge, lift, lean)
        break
      default:
        this.drawHumanoidEnemy(ctx, config, motion, frame, lunge, lift, lean)
        break
    }

    return canvas
  }

  private drawHumanoidEnemy(
    ctx: CanvasRenderingContext2D,
    config: EnemySpriteConfig,
    motion: BattleMotion,
    frame: number,
    lunge: number,
    lift: number,
    lean: number
  ): void {
    const { primaryColor, secondaryColor, accentColor, weaponColor } = config
    const baseX = 9 - lunge
    const headX = baseX + 2 + lean
    const headY = 2 + lift

    // 頭
    pxRect(ctx, headX, headY, 12, 5, secondaryColor)
    pxRect(ctx, headX, headY + 4, 12, 1, darker(secondaryColor))
    // 眼光（2px幅で視認性を確保、直上に影を落として彫りを出す）
    pxRect(ctx, headX + 1, headY + 1, 2, 1, darker(secondaryColor))
    pxRect(ctx, headX + 7, headY + 1, 2, 1, darker(secondaryColor))
    pxRect(ctx, headX + 1, headY + 2, 2, 1, PALETTE.AKANE)
    pxRect(ctx, headX + 7, headY + 2, 2, 1, PALETTE.AKANE)

    // 体
    const bodyY = headY + 5
    pxRect(ctx, baseX, bodyY, 16, 6, primaryColor)
    pxRect(ctx, baseX, bodyY, 16, 1, lighter(primaryColor))
    pxRect(ctx, baseX, bodyY + 5, 16, 1, accentColor)

    // 腕
    pxRect(ctx, baseX - 4, bodyY, 4, 6, secondaryColor)
    const frontArmX = baseX + 16 + (motion === 'attack' && lunge > 0 ? 2 : 0)
    pxRect(ctx, frontArmX, bodyY, 4, 6, secondaryColor)

    // 武器
    if (weaponColor) {
      const weaponLen = motion === 'attack' && frame === 1 ? 12 : 8
      pxRect(ctx, frontArmX + 4, bodyY - 2, 2, weaponLen, weaponColor)
      px(ctx, frontArmX + 4, bodyY - 3, lighter(weaponColor))
    }

    // 脚
    const legY = bodyY + 6
    const legH = motion === 'down' ? 3 : 6
    pxRect(ctx, baseX + 2, legY, 5, legH, primaryColor)
    pxRect(ctx, baseX + 9, legY, 5, legH, primaryColor)
    pxRect(ctx, baseX + 2, legY + legH, 5, 1, OUTLINE)
    pxRect(ctx, baseX + 9, legY + legH, 5, 1, OUTLINE)
  }

  private drawLargeHumanoidEnemy(
    ctx: CanvasRenderingContext2D,
    config: EnemySpriteConfig,
    motion: BattleMotion,
    frame: number,
    lunge: number,
    lift: number,
    lean: number
  ): void {
    const { primaryColor, secondaryColor, accentColor, weaponColor } = config
    const baseX = 6 - lunge
    const headX = baseX + 3 + lean
    const headY = lift

    // 頭（大きめ）
    pxRect(ctx, headX, headY, 15, 6, secondaryColor)
    pxRect(ctx, headX, headY + 5, 15, 1, darker(secondaryColor))
    // 眼光（2px幅で視認性を確保、直上に影を落として彫りを出す）
    pxRect(ctx, headX + 2, headY + 1, 2, 1, darker(secondaryColor))
    pxRect(ctx, headX + 9, headY + 1, 2, 1, darker(secondaryColor))
    pxRect(ctx, headX + 2, headY + 2, 2, 1, PALETTE.AKANE)
    pxRect(ctx, headX + 9, headY + 2, 2, 1, PALETTE.AKANE)

    // 体（幅広）
    const bodyY = headY + 6
    pxRect(ctx, baseX, bodyY, 22, 7, primaryColor)
    pxRect(ctx, baseX, bodyY, 22, 1, lighter(primaryColor))
    pxRect(ctx, baseX, bodyY + 6, 22, 1, accentColor)

    // 腕
    pxRect(ctx, baseX - 4, bodyY, 4, 7, secondaryColor)
    const frontArmX = baseX + 22 + (motion === 'attack' && lunge > 0 ? 2 : 0)
    pxRect(ctx, frontArmX, bodyY, 4, 7, secondaryColor)

    if (weaponColor) {
      const weaponLen = motion === 'attack' && frame === 1 ? 14 : 10
      pxRect(ctx, frontArmX + 4, bodyY - 3, 3, weaponLen, weaponColor)
      px(ctx, frontArmX + 4, bodyY - 4, lighter(weaponColor))
    }

    // 脚
    const legY = bodyY + 7
    const legH = motion === 'down' ? 3 : 5
    pxRect(ctx, baseX + 3, legY, 6, legH, primaryColor)
    pxRect(ctx, baseX + 13, legY, 6, legH, primaryColor)
    pxRect(ctx, baseX + 3, legY + legH, 6, 1, OUTLINE)
    pxRect(ctx, baseX + 13, legY + legH, 6, 1, OUTLINE)
  }

  private drawBeastEnemy(
    ctx: CanvasRenderingContext2D,
    config: EnemySpriteConfig,
    lunge: number,
    lift: number
  ): void {
    const { primaryColor, secondaryColor, accentColor } = config
    const baseX = 6 - lunge
    const baseY = 10 + lift

    // 胴体
    pxRect(ctx, baseX, baseY, 20, 8, primaryColor)
    pxRect(ctx, baseX, baseY, 20, 1, lighter(primaryColor))

    // 頭
    pxRect(ctx, baseX - 4, baseY - 2, 8, 8, secondaryColor)
    px(ctx, baseX - 2, baseY, PALETTE.AKANE)
    pxRect(ctx, baseX - 6, baseY + 3, 3, 3, accentColor)

    // 耳
    px(ctx, baseX - 3, baseY - 3, secondaryColor)
    px(ctx, baseX + 1, baseY - 3, secondaryColor)

    // 尻尾
    pxRect(ctx, baseX + 20, baseY - 1, 4, 3, primaryColor)
    px(ctx, baseX + 24, baseY - 3, primaryColor)

    // 脚
    pxRect(ctx, baseX + 2, baseY + 8, 3, 5, primaryColor)
    pxRect(ctx, baseX + 8, baseY + 8, 3, 5, primaryColor)
    pxRect(ctx, baseX + 14, baseY + 8, 3, 5, primaryColor)
    pxRect(ctx, baseX + 2, baseY + 13, 3, 1, accentColor)
    pxRect(ctx, baseX + 8, baseY + 13, 3, 1, accentColor)
    pxRect(ctx, baseX + 14, baseY + 13, 3, 1, accentColor)
  }
}

export const spriteGenerator = new SpriteGeneratorClass()
