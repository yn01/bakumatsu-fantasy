/**
 * Character/NPC/Enemy sprite color and feature configurations
 */

export interface SpriteConfig {
  hairColor: string
  skinColor: string
  topColor: string
  bottomColor: string
  accessoryColor?: string
  isLarge?: boolean
  hasLongHair?: boolean
}

export interface EnemySpriteConfig {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  shape: 'humanoid' | 'beast' | 'large_humanoid'
  weaponColor?: string
}

// Playable character configs
export const CHARACTER_CONFIGS: Record<string, SpriteConfig> = {
  ryoma: {
    hairColor: '#1a1a2e',
    skinColor: '#f5d0a9',
    topColor: '#f0f0f0',
    bottomColor: '#2a4494',
  },
  takechi: {
    hairColor: '#1a1a2e',
    skinColor: '#f5d0a9',
    topColor: '#6b3fa0',
    bottomColor: '#4a2d7a',
  },
  katsu: {
    hairColor: '#7a7a8a',
    skinColor: '#f5d0a9',
    topColor: '#1a2744',
    bottomColor: '#1a2744',
    accessoryColor: '#c4a746',
  },
  saigo: {
    hairColor: '#1a1a2e',
    skinColor: '#e8c090',
    topColor: '#f0f0f0',
    bottomColor: '#333333',
    isLarge: true,
  },
  kido: {
    hairColor: '#1a1a2e',
    skinColor: '#f5d0a9',
    topColor: '#2d6b4f',
    bottomColor: '#1a4030',
  },
  nakaoka: {
    hairColor: '#2a1a0e',
    skinColor: '#f5d0a9',
    topColor: '#6b4226',
    bottomColor: '#4a2d1a',
  },
  oryo: {
    hairColor: '#1a1a2e',
    skinColor: '#fad8b8',
    topColor: '#c0392b',
    bottomColor: '#c0392b',
    hasLongHair: true,
  },
}

// NPC type configs
export const NPC_CONFIGS: Record<string, SpriteConfig> = {
  villager: {
    hairColor: '#3a2a1a',
    skinColor: '#f5d0a9',
    topColor: '#8b7355',
    bottomColor: '#5c4a32',
  },
  merchant: {
    hairColor: '#3a2a1a',
    skinColor: '#f5d0a9',
    topColor: '#b8860b',
    bottomColor: '#654321',
    accessoryColor: '#daa520',
  },
  samurai: {
    hairColor: '#1a1a2e',
    skinColor: '#f5d0a9',
    topColor: '#2f4f4f',
    bottomColor: '#1a2f2f',
  },
  woman: {
    hairColor: '#1a1a2e',
    skinColor: '#fad8b8',
    topColor: '#e8a0b4',
    bottomColor: '#d4708a',
    hasLongHair: true,
  },
  guard: {
    hairColor: '#1a1a2e',
    skinColor: '#f5d0a9',
    topColor: '#2c3e50',
    bottomColor: '#1a252f',
    accessoryColor: '#7f8c8d',
  },
  elder: {
    hairColor: '#c0c0c0',
    skinColor: '#e8c090',
    topColor: '#556b2f',
    bottomColor: '#3a4a1f',
  },
}

// Enemy sprite configs
export const ENEMY_CONFIGS: Record<string, EnemySpriteConfig> = {
  // Original enemies
  bandit: { primaryColor: '#6b4226', secondaryColor: '#8b5e3c', accentColor: '#c0392b', shape: 'humanoid' },
  samurai: { primaryColor: '#2f4f4f', secondaryColor: '#3a6060', accentColor: '#a0a0a0', shape: 'humanoid', weaponColor: '#c0c0c0' },
  ronin: { primaryColor: '#4a3728', secondaryColor: '#5c4a38', accentColor: '#8b0000', shape: 'humanoid', weaponColor: '#b0b0b0' },

  // Training / story enemies
  training_partner: { primaryColor: '#f0f0f0', secondaryColor: '#d0d0d0', accentColor: '#4a90e2', shape: 'humanoid' },
  conservative_assassin: { primaryColor: '#1a1a2e', secondaryColor: '#2a2a3e', accentColor: '#c0392b', shape: 'humanoid', weaponColor: '#e0e0e0' },
  conservative_samurai: { primaryColor: '#3a1a1a', secondaryColor: '#5a2a2a', accentColor: '#d4a017', shape: 'humanoid', weaponColor: '#c0c0c0' },

  // Field enemies
  stray_dog: { primaryColor: '#8b6914', secondaryColor: '#a0803a', accentColor: '#5a4010', shape: 'beast' },
  thug: { primaryColor: '#5c4033', secondaryColor: '#7a5a4a', accentColor: '#a04030', shape: 'humanoid' },
  upper_samurai_trainee: { primaryColor: '#2a4a6a', secondaryColor: '#3a5a7a', accentColor: '#c0c0c0', shape: 'humanoid', weaponColor: '#d0d0d0' },
  instructor: { primaryColor: '#3a3a5a', secondaryColor: '#4a4a6a', accentColor: '#d4a017', shape: 'humanoid', weaponColor: '#e0e0e0' },
  clan_official: { primaryColor: '#2a3a2a', secondaryColor: '#3a4a3a', accentColor: '#c4a746', shape: 'humanoid' },
  conservative_swordsman: { primaryColor: '#4a1a1a', secondaryColor: '#6a2a2a', accentColor: '#e0e0e0', shape: 'humanoid', weaponColor: '#c0c0c0' },
  conservative_leader: { primaryColor: '#3a0a0a', secondaryColor: '#5a1a1a', accentColor: '#ffd700', shape: 'large_humanoid', weaponColor: '#e0d0c0' },
  pirate: { primaryColor: '#1a3a5a', secondaryColor: '#2a4a6a', accentColor: '#c0392b', shape: 'humanoid' },

  // Shinsengumi
  shinsengumi_soldier: { primaryColor: '#1a3a7a', secondaryColor: '#2a4a8a', accentColor: '#f0f0f0', shape: 'humanoid', weaponColor: '#c0c0c0' },
  shinsengumi_captain: { primaryColor: '#0a2a6a', secondaryColor: '#1a3a7a', accentColor: '#ffd700', shape: 'humanoid', weaponColor: '#e0e0e0' },
  shinsengumi_vice: { primaryColor: '#0a1a5a', secondaryColor: '#1a2a6a', accentColor: '#ff4444', shape: 'large_humanoid', weaponColor: '#f0f0f0' },
  okita_soji: { primaryColor: '#e8e8f0', secondaryColor: '#d0d0e0', accentColor: '#4a90e2', shape: 'humanoid', weaponColor: '#f0f0f0' },
  saito_hajime: { primaryColor: '#2a2a4a', secondaryColor: '#3a3a5a', accentColor: '#7070a0', shape: 'humanoid', weaponColor: '#e0e0e0' },
  kondo_isami: { primaryColor: '#1a1a3a', secondaryColor: '#2a2a4a', accentColor: '#ffd700', shape: 'large_humanoid', weaponColor: '#f0f0f0' },

  // Bakufu
  bakufu_soldier: { primaryColor: '#3a3a3a', secondaryColor: '#4a4a4a', accentColor: '#8a8a8a', shape: 'humanoid', weaponColor: '#a0a0a0' },
  bakufu_officer: { primaryColor: '#2a2a3a', secondaryColor: '#3a3a4a', accentColor: '#c4a746', shape: 'humanoid', weaponColor: '#c0c0c0' },
  bakufu_elite: { primaryColor: '#1a1a2a', secondaryColor: '#2a2a3a', accentColor: '#ffd700', shape: 'large_humanoid', weaponColor: '#e0e0e0' },
  bakufu_cannon: { primaryColor: '#4a4a4a', secondaryColor: '#5a5a5a', accentColor: '#8b4513', shape: 'large_humanoid' },
  bakufu_ninja: { primaryColor: '#1a1a1a', secondaryColor: '#2a2a2a', accentColor: '#6a0a6a', shape: 'humanoid', weaponColor: '#808080' },

  // Assassins
  assassin_low: { primaryColor: '#2a1a2a', secondaryColor: '#3a2a3a', accentColor: '#a04060', shape: 'humanoid', weaponColor: '#b0b0b0' },
  assassin_mid: { primaryColor: '#1a0a1a', secondaryColor: '#2a1a2a', accentColor: '#c04080', shape: 'humanoid', weaponColor: '#d0d0d0' },
  assassin_leader: { primaryColor: '#0a0a1a', secondaryColor: '#1a0a2a', accentColor: '#ff2060', shape: 'large_humanoid', weaponColor: '#f0f0f0' },
  mimawarigumi: { primaryColor: '#3a0a0a', secondaryColor: '#4a1a1a', accentColor: '#ffd700', shape: 'humanoid', weaponColor: '#e0e0e0' },
  final_assassin: { primaryColor: '#0a0a0a', secondaryColor: '#1a1a1a', accentColor: '#ff0040', shape: 'large_humanoid', weaponColor: '#ffffff' },
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
