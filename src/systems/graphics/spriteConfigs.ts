/**
 * Character/NPC/Enemy sprite color and feature configurations
 *
 * 色は全て `palette.ts` の固定パレットから選ぶこと（生の16進値を書かない）。
 */

import { PALETTE, type PaletteColor } from './palette'

export interface SpriteConfig {
  hairColor: PaletteColor
  skinColor: PaletteColor
  topColor: PaletteColor
  bottomColor: PaletteColor
  accessoryColor?: PaletteColor
  isLarge?: boolean
  hasLongHair?: boolean
  /**
   * バトル用（32x32）の目・眉の個性づけ。未指定は 'normal'。
   * - 'bold': 太い眉（例: 西郷）
   * - 'thin': 細い目・眉なし（例: 勝海舟）
   */
  eyeStyle?: 'normal' | 'bold' | 'thin'
}

export interface EnemySpriteConfig {
  primaryColor: PaletteColor
  secondaryColor: PaletteColor
  accentColor: PaletteColor
  shape: 'humanoid' | 'beast' | 'large_humanoid'
  weaponColor?: PaletteColor
}

// Playable character configs
export const CHARACTER_CONFIGS: Record<string, SpriteConfig> = {
  ryoma: {
    hairColor: PALETTE.TETSUKON,
    skinColor: PALETTE.HADA,
    topColor: PALETTE.SHIRO,
    bottomColor: PALETTE.AI_MID,
  },
  takechi: {
    hairColor: PALETTE.TETSUKON,
    skinColor: PALETTE.HADA,
    topColor: PALETTE.MURASAKI,
    bottomColor: PALETTE.MURASAKI_DARK,
  },
  katsu: {
    hairColor: PALETTE.GINNEZU,
    skinColor: PALETTE.HADA,
    topColor: PALETTE.AI_DARK,
    bottomColor: PALETTE.AI_DARK,
    accessoryColor: PALETTE.KIN,
    eyeStyle: 'thin',
  },
  saigo: {
    hairColor: PALETTE.TETSUKON,
    skinColor: PALETTE.HADA_TAN,
    topColor: PALETTE.SHIRO,
    bottomColor: PALETTE.NEZUMI_DARK,
    isLarge: true,
    eyeStyle: 'bold',
  },
  kido: {
    hairColor: PALETTE.TETSUKON,
    skinColor: PALETTE.HADA,
    topColor: PALETTE.ONANDO,
    bottomColor: PALETTE.ONANDO_DARK,
  },
  nakaoka: {
    hairColor: PALETTE.TSUCHI_DARK,
    skinColor: PALETTE.HADA,
    topColor: PALETTE.TOBI,
    bottomColor: PALETTE.KOGE,
  },
  oryo: {
    hairColor: PALETTE.TETSUKON,
    skinColor: PALETTE.HADA_LIGHT,
    topColor: PALETTE.SHU,
    bottomColor: PALETTE.SHU,
    hasLongHair: true,
  },
}

// NPC type configs
export const NPC_CONFIGS: Record<string, SpriteConfig> = {
  villager: {
    hairColor: PALETTE.TSUCHI_DARK,
    skinColor: PALETTE.HADA,
    topColor: PALETTE.KUCHIBA,
    bottomColor: PALETTE.KOGE,
  },
  merchant: {
    hairColor: PALETTE.TSUCHI_DARK,
    skinColor: PALETTE.HADA,
    topColor: PALETTE.KIN,
    bottomColor: PALETTE.KOGE,
    accessoryColor: PALETTE.KIN_LIGHT,
  },
  samurai: {
    hairColor: PALETTE.TETSUKON,
    skinColor: PALETTE.HADA,
    topColor: PALETTE.ONANDO,
    bottomColor: PALETTE.ONANDO_DARK,
  },
  woman: {
    hairColor: PALETTE.TETSUKON,
    skinColor: PALETTE.HADA_LIGHT,
    topColor: PALETTE.SAKURA,
    bottomColor: PALETTE.MOMO,
    hasLongHair: true,
  },
  guard: {
    hairColor: PALETTE.TETSUKON,
    skinColor: PALETTE.HADA,
    topColor: PALETTE.AI_DARK,
    bottomColor: PALETTE.SUMI,
    accessoryColor: PALETTE.GINNEZU,
  },
  elder: {
    hairColor: PALETTE.GIN,
    skinColor: PALETTE.HADA_TAN,
    topColor: PALETTE.MIDORI,
    bottomColor: PALETTE.MORI,
  },
}

// Enemy sprite configs
export const ENEMY_CONFIGS: Record<string, EnemySpriteConfig> = {
  // Original enemies
  bandit: { primaryColor: PALETTE.TOBI, secondaryColor: PALETTE.KUCHIBA, accentColor: PALETTE.SHU, shape: 'humanoid' },
  samurai: { primaryColor: PALETTE.ONANDO, secondaryColor: PALETTE.SEIJI, accentColor: PALETTE.GINNEZU, shape: 'humanoid', weaponColor: PALETTE.GIN },
  ronin: { primaryColor: PALETTE.KOGE, secondaryColor: PALETTE.TOBI, accentColor: PALETTE.HI, shape: 'humanoid', weaponColor: PALETTE.GIN },

  // Training / story enemies
  training_partner: { primaryColor: PALETTE.SHIRO, secondaryColor: PALETTE.KINARI, accentColor: PALETTE.ASAGI, shape: 'humanoid' },
  conservative_assassin: { primaryColor: PALETTE.TETSUKON, secondaryColor: PALETTE.NEZUMI_DARK, accentColor: PALETTE.SHU, shape: 'humanoid', weaponColor: PALETTE.GIN_LIGHT },
  conservative_samurai: { primaryColor: PALETTE.AKA_KURO, secondaryColor: PALETTE.SUOU, accentColor: PALETTE.KIN, shape: 'humanoid', weaponColor: PALETTE.GIN_LIGHT },

  // Field enemies
  stray_dog: { primaryColor: PALETTE.KUCHIBA, secondaryColor: PALETTE.SUNA, accentColor: PALETTE.KOGE, shape: 'beast' },
  thug: { primaryColor: PALETTE.TOBI, secondaryColor: PALETTE.KUCHIBA, accentColor: PALETTE.SHU, shape: 'humanoid' },
  upper_samurai_trainee: { primaryColor: PALETTE.MIZU_DEEP, secondaryColor: PALETTE.MIZU, accentColor: PALETTE.GIN, shape: 'humanoid', weaponColor: PALETTE.GIN_LIGHT },
  instructor: { primaryColor: PALETTE.NEZUMI_DARK, secondaryColor: PALETTE.NEZUMI, accentColor: PALETTE.KIN, shape: 'humanoid', weaponColor: PALETTE.GIN_LIGHT },
  clan_official: { primaryColor: PALETTE.MORI, secondaryColor: PALETTE.MIDORI, accentColor: PALETTE.KIN, shape: 'humanoid' },
  conservative_swordsman: { primaryColor: PALETTE.SUOU, secondaryColor: PALETTE.HI, accentColor: PALETTE.GIN_LIGHT, shape: 'humanoid', weaponColor: PALETTE.GIN },
  conservative_leader: { primaryColor: PALETTE.AKA_KURO, secondaryColor: PALETTE.SUOU, accentColor: PALETTE.KIN_LIGHT, shape: 'large_humanoid', weaponColor: PALETTE.KINARI },
  pirate: { primaryColor: PALETTE.MIZU_DEEP, secondaryColor: PALETTE.MIZU, accentColor: PALETTE.SHU, shape: 'humanoid' },

  // Shinsengumi
  shinsengumi_soldier: { primaryColor: PALETTE.AI, secondaryColor: PALETTE.AI_MID, accentColor: PALETTE.SHIRO, shape: 'humanoid', weaponColor: PALETTE.GIN },
  shinsengumi_captain: { primaryColor: PALETTE.AI_DARK, secondaryColor: PALETTE.AI, accentColor: PALETTE.KIN_LIGHT, shape: 'humanoid', weaponColor: PALETTE.GIN_LIGHT },
  shinsengumi_vice: { primaryColor: PALETTE.AI_DARK, secondaryColor: PALETTE.AI, accentColor: PALETTE.AKANE, shape: 'large_humanoid', weaponColor: PALETTE.SHIRO },
  okita_soji: { primaryColor: PALETTE.SHIRO, secondaryColor: PALETTE.GIN_LIGHT, accentColor: PALETTE.ASAGI, shape: 'humanoid', weaponColor: PALETTE.GIN_LIGHT },
  saito_hajime: { primaryColor: PALETTE.NEZUMI_DARK, secondaryColor: PALETTE.NEZUMI, accentColor: PALETTE.FUJI, shape: 'humanoid', weaponColor: PALETTE.GIN_LIGHT },
  kondo_isami: { primaryColor: PALETTE.TETSUKON, secondaryColor: PALETTE.NEZUMI_DARK, accentColor: PALETTE.KIN_LIGHT, shape: 'large_humanoid', weaponColor: PALETTE.SHIRO },

  // Bakufu
  bakufu_soldier: { primaryColor: PALETTE.NEZUMI_DARK, secondaryColor: PALETTE.NEZUMI, accentColor: PALETTE.GINNEZU, shape: 'humanoid', weaponColor: PALETTE.GIN },
  bakufu_officer: { primaryColor: PALETTE.TETSUKON, secondaryColor: PALETTE.NEZUMI_DARK, accentColor: PALETTE.KIN, shape: 'humanoid', weaponColor: PALETTE.GIN },
  bakufu_elite: { primaryColor: PALETTE.SUMI, secondaryColor: PALETTE.TETSUKON, accentColor: PALETTE.KIN_LIGHT, shape: 'large_humanoid', weaponColor: PALETTE.GIN_LIGHT },
  bakufu_cannon: { primaryColor: PALETTE.NEZUMI, secondaryColor: PALETTE.GINNEZU, accentColor: PALETTE.TOBI, shape: 'large_humanoid' },
  bakufu_ninja: { primaryColor: PALETTE.SUMI, secondaryColor: PALETTE.TETSUKON, accentColor: PALETTE.MURASAKI_DARK, shape: 'humanoid', weaponColor: PALETTE.GINNEZU },

  // Assassins
  assassin_low: { primaryColor: PALETTE.MURASAKI_DARK, secondaryColor: PALETTE.MURASAKI, accentColor: PALETTE.HI, shape: 'humanoid', weaponColor: PALETTE.GIN },
  assassin_mid: { primaryColor: PALETTE.SUMI, secondaryColor: PALETTE.MURASAKI_DARK, accentColor: PALETTE.MOMO, shape: 'humanoid', weaponColor: PALETTE.GIN_LIGHT },
  assassin_leader: { primaryColor: PALETTE.SUMI, secondaryColor: PALETTE.TETSUKON, accentColor: PALETTE.AKANE, shape: 'large_humanoid', weaponColor: PALETTE.SHIRO },
  mimawarigumi: { primaryColor: PALETTE.AKA_KURO, secondaryColor: PALETTE.SUOU, accentColor: PALETTE.KIN_LIGHT, shape: 'humanoid', weaponColor: PALETTE.GIN_LIGHT },
  final_assassin: { primaryColor: PALETTE.SUMI, secondaryColor: PALETTE.TETSUKON, accentColor: PALETTE.AKANE, shape: 'large_humanoid', weaponColor: PALETTE.SHIRO },
}

// Map from enemy class to config key (for enemies.json class field)
export function getEnemyConfigKey(enemyId: string, enemyClass: string): string {
  // First try exact enemy ID match
  if (ENEMY_CONFIGS[enemyId]) return enemyId
  // Then try class
  if (ENEMY_CONFIGS[enemyClass]) return enemyClass
  // Fallback
  return 'bandit'
}
