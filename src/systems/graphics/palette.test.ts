import { readFileSync } from 'fs'
import path from 'path'
import { describe, expect, it } from 'vitest'

import {
  PALETTE,
  PALETTE_COLORS,
  PALETTE_MAX_COLORS,
  RAMPS,
  darker,
  isPaletteColor,
  lighter,
  outlineFor,
  shade,
  withAlpha,
} from './palette'
import {
  CHARACTER_CONFIGS,
  ENEMY_CONFIGS,
  NPC_CONFIGS,
  type EnemySpriteConfig,
  type SpriteConfig,
} from './spriteConfigs'

const HEX6 = /^#[0-9a-f]{6}$/

describe('PALETTE', () => {
  it('上限色数（48色）以内である', () => {
    expect(PALETTE_COLORS.length).toBeLessThanOrEqual(PALETTE_MAX_COLORS)
    expect(PALETTE_COLORS.length).toBeGreaterThanOrEqual(40)
  })

  it('全ての色が6桁の小文字16進形式である', () => {
    for (const [name, color] of Object.entries(PALETTE)) {
      expect(color, `${name} が不正な形式: ${color}`).toMatch(HEX6)
    }
  })

  it('重複した色値が存在しない', () => {
    const seen = new Map<string, string>()
    for (const [name, color] of Object.entries(PALETTE)) {
      expect(seen.has(color), `${color} が ${seen.get(color)} と ${name} で重複`).toBe(false)
      seen.set(color, name)
    }
    expect(new Set(PALETTE_COLORS).size).toBe(PALETTE_COLORS.length)
  })
})

describe('RAMPS', () => {
  it('全てのランプ要素がパレット内の色である', () => {
    for (const [name, ramp] of Object.entries(RAMPS)) {
      for (const color of ramp) {
        expect(isPaletteColor(color), `ramp ${name} の ${color} がパレット外`).toBe(true)
      }
    }
  })

  it('各ランプは暗い順に並んでいる（明度が単調増加）', () => {
    const luminance = (c: string) =>
      0.299 * parseInt(c.slice(1, 3), 16) +
      0.587 * parseInt(c.slice(3, 5), 16) +
      0.114 * parseInt(c.slice(5, 7), 16)

    for (const [name, ramp] of Object.entries(RAMPS)) {
      const colors = ramp as readonly string[]
      for (let i = 1; i < colors.length; i++) {
        const prev = colors[i - 1] as string
        const curr = colors[i] as string
        expect(luminance(curr), `ramp ${name}: ${prev} → ${curr} で明度が逆転`).toBeGreaterThan(
          luminance(prev)
        )
      }
    }
  })

  it('全てのパレット色がいずれかのランプに属する', () => {
    const inRamps = new Set(Object.values(RAMPS).flatMap((ramp) => [...ramp]))
    for (const color of PALETTE_COLORS) {
      expect(inRamps.has(color), `${color} がどのランプにも属していない`).toBe(true)
    }
  })
})

describe('パレットヘルパー', () => {
  it('shade はランプ内を移動し、端でクランプする', () => {
    expect(shade(PALETTE.HADA, -1)).toBe(PALETTE.HADA_TAN)
    expect(shade(PALETTE.HADA, 1)).toBe(PALETTE.HADA_LIGHT)
    expect(shade(PALETTE.HADA_LIGHT, 5)).toBe(PALETTE.HADA_LIGHT)
    expect(shade(PALETTE.SUMI, -5)).toBe(PALETTE.SUMI)
  })

  it('darker / lighter は1段移動する', () => {
    expect(darker(PALETTE.SHU)).toBe(PALETTE.HI)
    expect(lighter(PALETTE.SHU)).toBe(PALETTE.AKANE)
  })

  it('outlineFor はランプ最暗色を返し、最暗色自身には墨を返す', () => {
    expect(outlineFor(PALETTE.HADA)).toBe(PALETTE.HADA_SHADOW)
    expect(outlineFor(PALETTE.HADA_SHADOW)).toBe(PALETTE.SUMI)
    expect(outlineFor(PALETTE.SUMI)).toBe(PALETTE.SUMI)
  })

  it('withAlpha は rgba 文字列を返す', () => {
    expect(withAlpha(PALETTE.SHIRO, 0.3)).toBe('rgba(242,242,238,0.3)')
  })

  it('isPaletteColor はパレット外の色を弾く', () => {
    expect(isPaletteColor(PALETTE.AI)).toBe(true)
    expect(isPaletteColor('#123456')).toBe(false)
  })
})

describe('spriteConfigs はパレットのみを使う', () => {
  const spriteColorKeys: (keyof SpriteConfig)[] = [
    'hairColor',
    'skinColor',
    'topColor',
    'bottomColor',
    'accessoryColor',
  ]
  const enemyColorKeys: (keyof EnemySpriteConfig)[] = [
    'primaryColor',
    'secondaryColor',
    'accentColor',
    'weaponColor',
  ]

  it.each([
    ['CHARACTER_CONFIGS', CHARACTER_CONFIGS],
    ['NPC_CONFIGS', NPC_CONFIGS],
  ])('%s の全色がパレットに含まれる', (_label, configs) => {
    for (const [id, config] of Object.entries(configs as Record<string, SpriteConfig>)) {
      for (const key of spriteColorKeys) {
        const color = config[key]
        if (color === undefined) continue
        expect(isPaletteColor(color as string), `${id}.${key} = ${color} がパレット外`).toBe(true)
      }
    }
  })

  it('ENEMY_CONFIGS の全色がパレットに含まれる', () => {
    for (const [id, config] of Object.entries(ENEMY_CONFIGS)) {
      for (const key of enemyColorKeys) {
        const color = config[key]
        if (color === undefined) continue
        expect(isPaletteColor(color as string), `${id}.${key} = ${color} がパレット外`).toBe(true)
      }
    }
  })

  it('ソース中に生の16進カラーリテラルが残っていない（回帰テスト）', () => {
    const source = readFileSync(path.resolve(__dirname, 'spriteConfigs.ts'), 'utf-8')
    const literals = source.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []
    expect(literals, `生の16進値: ${literals.join(', ')}`).toHaveLength(0)
  })
})
