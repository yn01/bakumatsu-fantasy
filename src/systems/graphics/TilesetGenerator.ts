/**
 * Procedural tileset generator using Canvas API
 * 16x16 論理px（TILE_SIZE）のタイルをネイティブ生成する（Phase 13 Task B）。
 *
 * 色は全て `palette.ts` の固定パレットから選ぶこと（生の16進値を書かない）。
 * グラデーション（createLinearGradient）や `arc()`/`ellipse()` は16bit固定パレットと
 * 相性が悪いため使用禁止。段差のあるパレットランプ + ディザ（`dither.ts`）で表現する。
 */

import { PALETTE, withAlpha, type PaletteColor } from './palette'
import { fillDitherRect, fillVerticalBandedRamp, ditherEdgeBlend, type EdgeSides } from './dither'
import { TILE_SIZE } from './pixelCanvas'

/** タイルのネイティブ生成サイズ（常にTILE_SIZEと一致） */
const SIZE = TILE_SIZE

function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

/**
 * オートタイル境界処理用の近傍タイルID。
 * 未指定(undefined)は「参照しない／境界処理なし」を意味する。
 */
export interface TileNeighbors {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

/**
 * 境界ディザを適用してよいタイルIDの組み合わせ（順不同）。
 * 「のっぺり感の解消」に限定するため、本当に馴染ませたい組み合わせのみを明示する
 * ホワイトリスト方式にしている（輝度差のしきい値だけでは石畳⇔草のような
 * 目立つ組み合わせを誤って拾ってしまうため）。
 */
const EDGE_BLEND_PAIRS: ReadonlySet<string> = new Set([
  pairKey(5, 14), // 水 ⇔ 砂浜
  pairKey(10, 14), // 海 ⇔ 砂浜
])

function pairKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

/**
 * 円盤状の塗りつぶし（`arc()`の代替）。1pxごとにfillRectするピクセルアート的な円。
 */
function drawPixelDisc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: PaletteColor | string
): void {
  ctx.fillStyle = color
  const r2 = r * r + 0.4
  const cxr = Math.round(cx)
  const cyr = Math.round(cy)
  for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
    for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
      if (dx * dx + dy * dy <= r2) {
        ctx.fillRect(cxr + dx, cyr + dy, 1, 1)
      }
    }
  }
}

class TilesetGeneratorClass {
  private cache = new Map<string, HTMLCanvasElement>()
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    // Pre-generate all static tiles（模様バリエーション分もまとめて）
    for (let id = 1; id <= 14; id++) {
      for (let v = 0; v < 4; v++) {
        this.getTile(id, undefined, undefined, v)
      }
    }
    // Pre-generate water animation frames
    for (let f = 0; f < 4; f++) {
      this.getTile(5, f)
      this.getTile(10, f)
    }

    this.initialized = true
  }

  /**
   * タイル画像を取得する。`neighbors`を渡すと、異なるタイルに隣接する辺へ
   * ディザによる境界ブレンド（簡易オートタイル）を適用する。
   * `variant`はマップ座標などから決定的に選ぶ模様バリエーション（0〜3）。
   * 草の房などが同じ絵の反復（壁紙状）に見えないようにするために使う。
   */
  getTile(
    tileId: number,
    frame?: number,
    neighbors?: TileNeighbors,
    variant?: number
  ): HTMLCanvasElement {
    const hasNeighbors =
      !!neighbors &&
      (neighbors.top !== undefined ||
        neighbors.right !== undefined ||
        neighbors.bottom !== undefined ||
        neighbors.left !== undefined)

    const nSuffix = hasNeighbors
      ? `_e${neighbors!.top ?? 'x'}-${neighbors!.right ?? 'x'}-${neighbors!.bottom ?? 'x'}-${neighbors!.left ?? 'x'}`
      : ''
    const v = ((variant ?? 0) % 4 + 4) % 4
    const key = `tile_${tileId}_${frame ?? 0}_v${v}${nSuffix}`
    const cached = this.cache.get(key)
    if (cached) return cached

    const canvas = this.generateTile(tileId, frame ?? 0, v)
    if (hasNeighbors) {
      this.applyAutotileEdges(canvas, tileId, neighbors!)
    }
    this.cache.set(key, canvas)
    return canvas
  }

  private generateTile(tileId: number, frame: number, variant: number): HTMLCanvasElement {
    const canvas = createCanvas(SIZE, SIZE)
    const ctx = canvas.getContext('2d')!

    switch (tileId) {
      case 1: this.drawWall(ctx); break
      case 2: this.drawGrass(ctx, variant); break
      case 3: this.drawStonePath(ctx); break
      case 4: this.drawTatami(ctx); break
      case 5: this.drawWater(ctx, frame); break
      case 6: this.drawShoji(ctx); break
      case 7: this.drawCastleWall(ctx); break
      case 8: this.drawMountainPath(ctx); break
      case 9: this.drawForest(ctx); break
      case 10: this.drawSea(ctx, frame); break
      case 11: this.drawRoof(ctx); break
      case 12: this.drawMudWall(ctx); break
      case 13: this.drawSakura(ctx, variant); break
      case 14: this.drawBeachSand(ctx); break
      default:
        ctx.fillStyle = '#ff00ff' // デバッグマーカー（欠損タイル、パレット外のまま据え置き）
        ctx.fillRect(0, 0, SIZE, SIZE)
    }

    return canvas
  }

  /**
   * オートタイル境界処理: ホワイトリストに載っている組み合わせのみ、
   * 近傍と異なるタイルの辺をディザでブレンドする。
   */
  private applyAutotileEdges(
    canvas: HTMLCanvasElement,
    tileId: number,
    neighbors: TileNeighbors
  ): void {
    const ctx = canvas.getContext('2d')!

    const sides: Array<[keyof EdgeSides, number | undefined]> = [
      ['top', neighbors.top],
      ['right', neighbors.right],
      ['bottom', neighbors.bottom],
      ['left', neighbors.left],
    ]

    for (const [side, neighborId] of sides) {
      if (neighborId === undefined || neighborId === tileId) continue
      if (!EDGE_BLEND_PAIRS.has(pairKey(tileId, neighborId))) continue
      const neighborColor = this.getEdgeColor(neighborId)
      if (!neighborColor) continue
      ditherEdgeBlend(ctx, 0, 0, SIZE, SIZE, neighborColor, { [side]: true }, 2)
    }
  }

  /** 境界ブレンドに使う代表色。ブレンド対象外のタイル（壁・障子など）はnull。 */
  private getEdgeColor(tileId: number): PaletteColor | null {
    switch (tileId) {
      case 2: return PALETTE.WAKAKUSA // 草
      case 3: return PALETTE.GINNEZU // 石畳
      case 5: return PALETTE.MIZU // 水
      case 7: return PALETTE.GINNEZU // 城壁
      case 8: return PALETTE.KUCHIBA // 山道
      case 9: return PALETTE.MORI // 森
      case 10: return PALETTE.MIZU_DEEP // 海
      case 11: return PALETTE.KOGE // 瓦屋根
      case 12: return PALETTE.SUNA // 土壁
      case 13: return PALETTE.WAKAKUSA // 桜（下草込み）
      case 14: return PALETTE.TATAMI // 砂浜
      default: return null // 壁・畳・障子など屋内固定タイルはブレンドしない
    }
  }

  // Tile 1: Wall（屋内壁）- 縦シェーディング + 見切り材で「立っている面」を表現
  private drawWall(ctx: CanvasRenderingContext2D): void {
    // 上が明るく下にいくほど暗くなる縦バンド（面が起き上がって見える）
    fillVerticalBandedRamp(ctx, 0, 0, SIZE, SIZE, [PALETTE.KUCHIBA, PALETTE.TOBI, PALETTE.KOGE])

    // 見切り材（長押）: 上端の明るい水平ライン
    ctx.fillStyle = PALETTE.TSUCHI_DARK
    ctx.fillRect(0, 0, SIZE, 2)
    ctx.fillStyle = PALETTE.SUNA
    ctx.fillRect(0, 2, SIZE, 1)

    // 板目の縦線（互い違い）。石畳/城壁とは異なる「板」の積み方
    ctx.strokeStyle = PALETTE.TSUCHI_DARK
    ctx.lineWidth = 1
    for (const jx of [4, 8, 12]) {
      ctx.beginPath()
      ctx.moveTo(jx + 0.5, 3)
      ctx.lineTo(jx + 0.5, SIZE)
      ctx.stroke()
    }
  }

  // Tile 2: Grass - 落ち着いた2色ディザ + まばらな草束のみ（ノイズ状の散布はやめる）
  private drawGrass(ctx: CanvasRenderingContext2D, variant: number = 0): void {
    // ベースは緑2色のディザに留める
    fillDitherRect(ctx, 0, 0, SIZE, SIZE, PALETTE.MIDORI, PALETTE.WAKAKUSA, 0.35)

    // まばらな草束（数ピクセルの縦線）。マップ座標由来のvariantで配置を変え、
    // タイルが同じ絵の反復（壁紙状）に並んで見えないようにする。
    const tuftSets: Array<Array<{ x: number; y: number }>> = [
      [{ x: 3, y: 10 }, { x: 9, y: 4 }, { x: 12, y: 12 }],
      [{ x: 1, y: 5 }, { x: 7, y: 13 }, { x: 13, y: 3 }],
      [{ x: 5, y: 2 }, { x: 11, y: 8 }, { x: 2, y: 14 }],
      [{ x: 8, y: 6 }, { x: 14, y: 11 }, { x: 4, y: 1 }],
    ]
    const tufts = tuftSets[variant % tuftSets.length] ?? tuftSets[0]!
    ctx.fillStyle = PALETTE.MOEGI
    for (const t of tufts) {
      ctx.fillRect(t.x, t.y, 1, 3)
      ctx.fillRect(t.x + 1, t.y + 1, 1, 2)
    }
  }

  // Tile 3: 石壁（実際のマップデータでは「石畳の床」ではなく、建物を囲む1タイル厚の
  // 石造りの壁として使われている。2x2ブロック+目地の「床」的な模様を1タイル幅の
  // 輪状に連続配置すると規則的な市松模様（公衆トイレの床のような見え方）になって
  // しまうため、床ではなく壁として設計し直す：縦シェーディング+互い違いの
  // レンガ目地で、隣接タイル間で連続する「積まれた壁」に見せる。
  private drawStonePath(ctx: CanvasRenderingContext2D): void {
    // 上がわずかに明るく下が暗い縦シェーディング（漆喰混じりの石壁の質感）
    fillVerticalBandedRamp(ctx, 0, 0, SIZE, SIZE, [PALETTE.GINNEZU, PALETTE.NEZUMI])

    // レンガ状の目地（段ごとに互い違いオフセット）。市松にならないよう、
    // ブロックを塗り分けるのではなく細い目地線だけを引く。
    ctx.strokeStyle = PALETTE.NEZUMI_DARK
    ctx.lineWidth = 1
    const rowHeight = 4
    for (let row = 0; row < SIZE / rowHeight; row++) {
      const y = row * rowHeight
      ctx.beginPath()
      ctx.moveTo(0, y + 0.5)
      ctx.lineTo(SIZE, y + 0.5)
      ctx.stroke()

      const offset = row % 2 === 0 ? 0 : rowHeight
      for (let x = offset; x <= SIZE; x += rowHeight * 2) {
        ctx.beginPath()
        ctx.moveTo(x + 0.5, y)
        ctx.lineTo(x + 0.5, y + rowHeight)
        ctx.stroke()
      }
    }

    // 上端にごく薄い笠石（他の壁と被らない程度に控えめ）
    ctx.fillStyle = PALETTE.KINARI
    ctx.fillRect(0, 0, SIZE, 1)
  }

  // Tile 4: Tatami
  private drawTatami(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = PALETTE.TATAMI
    ctx.fillRect(0, 0, SIZE, SIZE)

    ctx.strokeStyle = PALETTE.SUNA
    ctx.lineWidth = 1
    for (let y = 0; y < SIZE; y += 2) {
      ctx.beginPath()
      ctx.moveTo(0, y + 0.5)
      ctx.lineTo(SIZE, y + 0.5)
      ctx.stroke()
    }

    ctx.strokeStyle = PALETTE.KUCHIBA
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, SIZE - 1, SIZE - 1)
  }

  // Tile 5: Water (animated)
  private drawWater(ctx: CanvasRenderingContext2D, frame: number): void {
    ctx.fillStyle = PALETTE.MIZU
    ctx.fillRect(0, 0, SIZE, SIZE)

    const offset = frame * 2

    ctx.strokeStyle = PALETTE.MIZU_LIGHT
    ctx.lineWidth = 1
    for (let y = 2; y < SIZE; y += 4) {
      ctx.beginPath()
      for (let x = -4; x <= SIZE + 4; x += 1) {
        const wy = y + Math.sin((x + offset) * 0.5) * 1
        if (x === -4) ctx.moveTo(x, wy)
        else ctx.lineTo(x, wy)
      }
      ctx.stroke()
    }

    ctx.strokeStyle = PALETTE.MIZU_FOAM
    for (let y = 4; y < SIZE; y += 6) {
      ctx.beginPath()
      for (let x = -2; x <= SIZE + 2; x += 1) {
        const wy = y + Math.sin((x + offset + 5) * 0.6) * 0.8
        if (x === -2) ctx.moveTo(x, wy)
        else ctx.lineTo(x, wy)
      }
      ctx.stroke()
    }
  }

  // Tile 6: Shoji (paper door)
  private drawShoji(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = PALETTE.SHIRO
    ctx.fillRect(0, 0, SIZE, SIZE)

    ctx.strokeStyle = PALETTE.KUCHIBA
    ctx.lineWidth = 1

    // Vertical dividers
    ctx.beginPath()
    ctx.moveTo(0.5, 0); ctx.lineTo(0.5, SIZE)
    ctx.moveTo(SIZE / 2 + 0.5, 0); ctx.lineTo(SIZE / 2 + 0.5, SIZE)
    ctx.moveTo(SIZE - 0.5, 0); ctx.lineTo(SIZE - 0.5, SIZE)
    ctx.stroke()

    // Horizontal dividers
    ctx.beginPath()
    ctx.moveTo(0, 0.5); ctx.lineTo(SIZE, 0.5)
    ctx.moveTo(0, SIZE / 3); ctx.lineTo(SIZE, SIZE / 3)
    ctx.moveTo(0, (SIZE * 2) / 3); ctx.lineTo(SIZE, (SIZE * 2) / 3)
    ctx.moveTo(0, SIZE - 0.5); ctx.lineTo(SIZE, SIZE - 0.5)
    ctx.stroke()
  }

  // Tile 7: Castle wall（屋外壁）- 石畳(床)とは明確に差をつけ、縦シェーディング+笠木で「垂直面」を表現
  private drawCastleWall(ctx: CanvasRenderingContext2D): void {
    // 上が明るく下にいくほど暗い縦バンド（石畳の水平な明暗とは逆の見え方にする）
    fillVerticalBandedRamp(ctx, 0, 0, SIZE, SIZE, [PALETTE.GINNEZU, PALETTE.NEZUMI, PALETTE.NEZUMI_DARK])

    // 笠木（上端の明るい水平ライン2px）
    ctx.fillStyle = PALETTE.KINARI
    ctx.fillRect(0, 0, SIZE, 1)
    ctx.fillStyle = PALETTE.GIN_LIGHT
    ctx.fillRect(0, 1, SIZE, 1)

    // 石の積み方は床と変える: 横長ブロックを2段、目地は縦線のみ・互い違い
    ctx.strokeStyle = PALETTE.SUMI
    ctx.lineWidth = 1
    const rows: Array<{ y: number; joints: number[] }> = [
      { y: 3, joints: [5, 11] },
      { y: 9, joints: [2, 8, 14] },
    ]
    for (const row of rows) {
      for (const jx of row.joints) {
        ctx.beginPath()
        ctx.moveTo(jx + 0.5, row.y)
        ctx.lineTo(jx + 0.5, row.y + 5)
        ctx.stroke()
      }
    }
  }

  // Tile 8: Mountain path
  private drawMountainPath(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = PALETTE.KUCHIBA
    ctx.fillRect(0, 0, SIZE, SIZE)

    const rng = this.seededRandom(8)

    // Earth texture
    for (let i = 0; i < 8; i++) {
      const x = Math.floor(rng() * SIZE)
      const y = Math.floor(rng() * SIZE)
      ctx.fillStyle = rng() > 0.5 ? PALETTE.SUNA : PALETTE.TOBI
      ctx.fillRect(x, y, 2, 1)
    }

    // Small rocks（ellipse廃止 → ピクセル円盤 + ディザで陰影）
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(rng() * (SIZE - 2)) + 1
      const y = Math.floor(rng() * (SIZE - 2)) + 1
      drawPixelDisc(ctx, x, y, 1, PALETTE.GINNEZU)
      fillDitherRect(ctx, x, y, 1, 1, PALETTE.GINNEZU, PALETTE.NEZUMI, 0.5)
    }
  }

  // Tile 9: Forest
  private drawForest(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = PALETTE.MORI
    ctx.fillRect(0, 0, SIZE, SIZE)

    // Tree canopy（arc廃止 → ピクセル円盤の重ね塗り）
    const trees = [
      { x: 4, y: 4, r: 4 },
      { x: 12, y: 3, r: 4 },
      { x: 2, y: 11, r: 3 },
      { x: 10, y: 12, r: 4 },
      { x: 7, y: 8, r: 3 },
    ]

    for (const tree of trees) {
      drawPixelDisc(ctx, tree.x + 1, tree.y + 1, tree.r, PALETTE.MORI)
      drawPixelDisc(ctx, tree.x, tree.y, tree.r, PALETTE.MIDORI)
      drawPixelDisc(ctx, tree.x - 1, tree.y - 1, Math.max(1, tree.r * 0.4), PALETTE.WAKAKUSA)
    }
  }

  // Tile 10: Sea (animated)
  private drawSea(ctx: CanvasRenderingContext2D, frame: number): void {
    ctx.fillStyle = PALETTE.MIZU_DEEP
    ctx.fillRect(0, 0, SIZE, SIZE)

    const offset = frame * 1.5

    ctx.strokeStyle = PALETTE.MIZU
    ctx.lineWidth = 1
    for (let y = 3; y < SIZE; y += 5) {
      ctx.beginPath()
      for (let x = -3; x <= SIZE + 3; x += 1) {
        const wy = y + Math.sin((x + offset) * 0.4) * 1
        if (x === -3) ctx.moveTo(x, wy)
        else ctx.lineTo(x, wy)
      }
      ctx.stroke()
    }

    ctx.strokeStyle = withAlpha(PALETTE.SHIRO, 0.3)
    for (let y = 1; y < SIZE; y += 7) {
      ctx.beginPath()
      for (let x = -2; x <= SIZE + 2; x += 1) {
        const wy = y + Math.sin((x + offset * 1.5) * 0.6) * 0.6
        if (x === -2) ctx.moveTo(x, wy)
        else ctx.lineTo(x, wy)
      }
      ctx.stroke()
    }
  }

  // Tile 11: 瓦屋根（roof tiles）
  private drawRoof(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = PALETTE.KOGE
    ctx.fillRect(0, 0, SIZE, SIZE)

    // 棟（ridge）: 最上段は濃い墨色の帯
    ctx.fillStyle = PALETTE.TSUCHI_DARK
    ctx.fillRect(0, 0, SIZE, 2)

    // 瓦の並び（半円状の連続パターンをピクセル円盤で表現）
    for (let row = 3; row < SIZE; row += 4) {
      for (let x = 1; x < SIZE; x += 4) {
        const offset = ((row - 3) / 4) % 2 === 0 ? 0 : 2
        drawPixelDisc(ctx, x + offset, row, 1.4, PALETTE.TOBI)
      }
    }

    // ハイライト（瓦の光沢）
    const rng = this.seededRandom(11)
    for (let i = 0; i < 3; i++) {
      const x = Math.floor(rng() * SIZE)
      const y = Math.floor(3 + rng() * (SIZE - 3))
      ctx.fillStyle = PALETTE.SUNA
      ctx.fillRect(x, y, 1, 1)
    }
  }

  // Tile 12: 土壁（mud/plaster wall）
  private drawMudWall(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = PALETTE.SUNA
    ctx.fillRect(0, 0, SIZE, SIZE)

    // 表面のムラを乱数点ではなくブロック単位のディザ混色で表現
    const patches = [
      { x: 0, y: 0, w: 8, h: 8 },
      { x: 8, y: 0, w: 8, h: 8 },
      { x: 0, y: 8, w: 8, h: 8 },
      { x: 8, y: 8, w: 8, h: 8 },
    ]
    patches.forEach((p, i) => {
      const ratio = ((i * 29) % 100) / 100
      fillDitherRect(ctx, p.x, p.y, p.w, p.h, PALETTE.SUNA, PALETTE.KUCHIBA, ratio * 0.5)
    })

    // 貫（柱）の木枠
    ctx.strokeStyle = PALETTE.TOBI
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, SIZE - 1, SIZE - 1)
    ctx.beginPath()
    ctx.moveTo(0, SIZE / 2 + 0.5)
    ctx.lineTo(SIZE, SIZE / 2 + 0.5)
    ctx.stroke()

    // ひび割れ
    ctx.strokeStyle = PALETTE.KOGE
    ctx.beginPath()
    ctx.moveTo(5, 2)
    ctx.lineTo(7, 6)
    ctx.lineTo(6, 10)
    ctx.stroke()
  }

  // Tile 13: 桜（cherry blossom ground）
  private drawSakura(ctx: CanvasRenderingContext2D, variant: number = 0): void {
    // 下草は草タイルと同じベース（緑2色ディザ）にして質感を揃える
    fillDitherRect(ctx, 0, 0, SIZE, SIZE, PALETTE.MIDORI, PALETTE.WAKAKUSA, 0.35)

    // 花びら（桜色のピクセル円盤を散らす）。variantで配置を変え反復を避ける。
    const petalSets: Array<Array<{ x: number; y: number; r: number }>> = [
      [
        { x: 3, y: 3, r: 1.2 }, { x: 9, y: 2, r: 1 }, { x: 13, y: 6, r: 1.2 },
        { x: 5, y: 10, r: 1 }, { x: 11, y: 12, r: 1.4 }, { x: 2, y: 13, r: 1 },
      ],
      [
        { x: 1, y: 6, r: 1 }, { x: 6, y: 1, r: 1.2 }, { x: 12, y: 4, r: 1 },
        { x: 14, y: 10, r: 1.3 }, { x: 8, y: 13, r: 1 }, { x: 4, y: 9, r: 1.1 },
      ],
      [
        { x: 5, y: 4, r: 1.3 }, { x: 10, y: 1, r: 1 }, { x: 2, y: 8, r: 1 },
        { x: 13, y: 8, r: 1.2 }, { x: 7, y: 12, r: 1.4 }, { x: 1, y: 14, r: 1 },
      ],
      [
        { x: 2, y: 2, r: 1 }, { x: 8, y: 5, r: 1.2 }, { x: 14, y: 3, r: 1 },
        { x: 4, y: 11, r: 1.3 }, { x: 10, y: 9, r: 1 }, { x: 12, y: 14, r: 1.1 },
      ],
    ]
    const petals = petalSets[variant % petalSets.length] ?? petalSets[0]!
    for (const petal of petals) {
      drawPixelDisc(ctx, petal.x, petal.y, petal.r, PALETTE.SAKURA)
    }
    // ハイライト（最初の2枚の花びらに乗せる）
    const [p0, p1] = petals
    if (p0) drawPixelDisc(ctx, p0.x, p0.y, Math.max(0.5, p0.r * 0.45), PALETTE.MOMO)
    if (p1) drawPixelDisc(ctx, p1.x, p1.y, Math.max(0.5, p1.r * 0.5), PALETTE.MOMO)
  }

  // Tile 14: 砂浜（beach sand）
  private drawBeachSand(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = PALETTE.TATAMI
    ctx.fillRect(0, 0, SIZE, SIZE)

    // 波打ち際に近い部分（下側）を少し暗いSUNAへバンディング
    fillDitherRect(ctx, 0, SIZE - 5, SIZE, 5, PALETTE.TATAMI, PALETTE.SUNA, 0.4)

    const rng = this.seededRandom(14)
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(rng() * SIZE)
      const y = Math.floor(rng() * SIZE)
      ctx.fillStyle = PALETTE.KUCHIBA
      ctx.fillRect(x, y, 1, 1)
    }
  }

  // Simple seeded PRNG for deterministic tile patterns
  private seededRandom(seed: number): () => number {
    let s = seed
    return () => {
      s = (s * 16807 + 0) % 2147483647
      return (s - 1) / 2147483646
    }
  }
}

export const tilesetGenerator = new TilesetGeneratorClass()
