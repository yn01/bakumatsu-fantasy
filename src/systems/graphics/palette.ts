/**
 * Fixed palette for all procedural pixel art (Phase 13)
 *
 * 16bit 風ピクセルアートの前提として、ゲーム内の全ピクセルはこの単一パレットから
 * 選ばれる。生の 16 進値をスプライト/タイル/背景ジェネレータに直接書かないこと。
 *
 * 構成: 幕末・和の色名をベースにした 47 色。各色群は明度がほぼ等間隔のランプを成し、
 * そのままシェーディング（1 段暗く／明るく）に使える。
 */

export const PALETTE = {
  // --- 無彩色ランプ（墨・鉄紺・鼠・生成り・白） 7色 ---
  SUMI: '#0d0d12', // 墨: 最暗部・アウトライン
  TETSUKON: '#1a1a2e', // 鉄紺: 黒髪・夜の衣
  NEZUMI_DARK: '#33333f', // 濃鼠
  NEZUMI: '#5c5c68', // 鼠
  GINNEZU: '#8f8f9b', // 銀鼠
  KINARI: '#d9d5c8', // 生成り: 生地の白
  SHIRO: '#f2f2ee', // 白

  // --- 銀（刀身・金具） 2色 ---
  GIN: '#b6b6bf', // 銀
  GIN_LIGHT: '#e2e2e8', // 銀（ハイライト）

  // --- 金（装飾・家紋） 2色 ---
  KIN: '#c4a746', // 金
  KIN_LIGHT: '#f0c840', // 金（ハイライト）

  // --- 肌 4色 ---
  HADA_LIGHT: '#fadcbe', // 肌（ハイライト）
  HADA: '#f0cfa4', // 肌（ベース）
  HADA_TAN: '#ddb184', // 肌（日焼け）
  HADA_SHADOW: '#b07f56', // 肌（シャドウ）

  // --- 藍系（着物・夜空） 4色 ---
  AI_DARK: '#101a38', // 褐返（濃藍）
  AI: '#1c3363', // 藍
  AI_MID: '#2f5fa0', // 縹
  ASAGI: '#5e93cf', // 浅葱

  // --- 水系（川・海） 4色 ---
  MIZU_DEEP: '#16466e', // 深海
  MIZU: '#2b7fae', // 水
  MIZU_LIGHT: '#5aa8d2', // 水（明）
  MIZU_FOAM: '#9fd8ee', // 白波

  // --- 朱・緋系（血・鳥居・炎） 6色 ---
  AKA_KURO: '#2a0d12', // 黒赤
  SUOU: '#571421', // 蘇芳
  HI: '#9c2028', // 緋
  SHU: '#c8402f', // 朱
  BENI: '#e8604c', // 紅
  AKANE: '#ff3b52', // 茜（鮮烈アクセント）

  // --- 金茶・土系（畳・木材・土壁） 6色 ---
  TSUCHI_DARK: '#2e1e12', // 焦茶
  KOGE: '#46301f', // 檜皮
  TOBI: '#6b4226', // 鳶
  KUCHIBA: '#8b6b45', // 朽葉
  SUNA: '#b09a6c', // 砂
  TATAMI: '#d4c490', // 畳

  // --- 若草・緑系（草地・森） 4色 ---
  MORI: '#143a18', // 深緑
  MIDORI: '#24602c', // 緑
  WAKAKUSA: '#4a8c3a', // 若草
  MOEGI: '#74ab4d', // 萌黄

  // --- 青緑系（錆浅葱・御納戸） 3色 ---
  ONANDO_DARK: '#16302e', // 御納戸（暗）
  ONANDO: '#2c5852', // 御納戸
  SEIJI: '#4d8a7c', // 青磁

  // --- 紫系（夜・妖） 3色 ---
  MURASAKI_DARK: '#3a2159', // 深紫
  MURASAKI: '#5b3a86', // 紫
  FUJI: '#8e6fb5', // 藤

  // --- 桃系（女性の衣・花） 2色 ---
  MOMO: '#d4708a', // 桃
  SAKURA: '#eda6b8', // 桜
} as const

export type PaletteKey = keyof typeof PALETTE
export type PaletteColor = (typeof PALETTE)[PaletteKey]

/** 全パレット色（重複なし） */
export const PALETTE_COLORS: readonly PaletteColor[] = Object.freeze(
  Object.values(PALETTE) as PaletteColor[]
)

/** パレットの上限色数。16bit 風の統一感を保つための制約。 */
export const PALETTE_MAX_COLORS = 48

/**
 * 明度順（暗→明）に並べた色群。シェーディング時に 1 段移動するために使う。
 */
export const RAMPS = {
  neutral: [
    PALETTE.SUMI,
    PALETTE.TETSUKON,
    PALETTE.NEZUMI_DARK,
    PALETTE.NEZUMI,
    PALETTE.GINNEZU,
    PALETTE.KINARI,
    PALETTE.SHIRO,
  ],
  silver: [PALETTE.GIN, PALETTE.GIN_LIGHT],
  gold: [PALETTE.KIN, PALETTE.KIN_LIGHT],
  skin: [PALETTE.HADA_SHADOW, PALETTE.HADA_TAN, PALETTE.HADA, PALETTE.HADA_LIGHT],
  indigo: [PALETTE.AI_DARK, PALETTE.AI, PALETTE.AI_MID, PALETTE.ASAGI],
  water: [PALETTE.MIZU_DEEP, PALETTE.MIZU, PALETTE.MIZU_LIGHT, PALETTE.MIZU_FOAM],
  // 茜は鮮烈なアクセント色だが、明度順では紅の1段下に入る
  red: [PALETTE.AKA_KURO, PALETTE.SUOU, PALETTE.HI, PALETTE.SHU, PALETTE.AKANE, PALETTE.BENI],
  earth: [
    PALETTE.TSUCHI_DARK,
    PALETTE.KOGE,
    PALETTE.TOBI,
    PALETTE.KUCHIBA,
    PALETTE.SUNA,
    PALETTE.TATAMI,
  ],
  green: [PALETTE.MORI, PALETTE.MIDORI, PALETTE.WAKAKUSA, PALETTE.MOEGI],
  teal: [PALETTE.ONANDO_DARK, PALETTE.ONANDO, PALETTE.SEIJI],
  purple: [PALETTE.MURASAKI_DARK, PALETTE.MURASAKI, PALETTE.FUJI],
  pink: [PALETTE.MOMO, PALETTE.SAKURA],
} as const satisfies Record<string, readonly PaletteColor[]>

export type RampName = keyof typeof RAMPS

/**
 * 色が属するランプと、その中での位置を返す。属さない場合は null。
 */
function locate(color: string): { ramp: readonly PaletteColor[]; index: number } | null {
  for (const ramp of Object.values(RAMPS) as readonly (readonly PaletteColor[])[]) {
    const index = ramp.indexOf(color as PaletteColor)
    if (index >= 0) return { ramp, index }
  }
  return null
}

/**
 * 同じランプ内で `steps` 段だけ明るく（正）／暗く（負）した色を返す。
 * ランプ端を超える場合は端の色にクランプする。
 */
export function shade(color: PaletteColor, steps: number): PaletteColor {
  const found = locate(color)
  if (!found) return color
  const next = Math.min(found.ramp.length - 1, Math.max(0, found.index + steps))
  return found.ramp[next] ?? color
}

/** 1 段暗い色（シャドウ用） */
export function darker(color: PaletteColor): PaletteColor {
  return shade(color, -1)
}

/** 1 段明るい色（ハイライト用） */
export function lighter(color: PaletteColor): PaletteColor {
  return shade(color, 1)
}

/**
 * 指定色に対するアウトライン色。
 * ランプの最暗色を使い、それが色自身と同じなら墨に落とす。
 */
export function outlineFor(color: PaletteColor): PaletteColor {
  const found = locate(color)
  if (!found) return PALETTE.SUMI
  const darkest = found.ramp[0] ?? PALETTE.SUMI
  return darkest === color ? PALETTE.SUMI : darkest
}

/** パレット色を rgba 文字列に変換する（半透明の霞・波飛沫など） */
export function withAlpha(color: PaletteColor, alpha: number): string {
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

/** 与えられた文字列がパレット内の色かどうか */
export function isPaletteColor(value: string): value is PaletteColor {
  return (PALETTE_COLORS as readonly string[]).includes(value)
}
