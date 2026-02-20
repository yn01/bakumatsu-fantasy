import type { Character } from '@/types/character'
import type { Item } from '@/types/item'
import type { MapData } from '@/types/map'
import { BattlePhase } from '@/types/battle'
import { usePartyStore } from '@/stores/partyStore'
import { useGameStore } from '@/stores/gameStore'
import { useBattleStore } from '@/stores/battleStore'
import { useProgressStore } from '@/stores/progressStore'

/** Creates a valid mock Character object */
export function createMockCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'ryoma',
    name: '坂本龍馬',
    class: 'swordsman',
    level: 1,
    exp: 0,
    stats: {
      hp: 100,
      maxHp: 100,
      mp: 30,
      maxMp: 30,
      attack: 15,
      defense: 10,
      speed: 12,
      luck: 8,
    },
    equipment: {
      weapon: null,
      armor: null,
    },
    skills: [],
    sprite: 'characters/ryoma.png',
    skillPoints: 0,
    growthRate: {
      hp: 10,
      mp: 3,
      attack: 2,
      defense: 1,
      speed: 2,
      luck: 1,
    },
    ...overrides,
  }
}

/** Creates a valid mock enemy Character object */
export function createMockEnemy(overrides: Partial<Character> = {}): Character {
  return {
    id: 'bandit',
    name: 'ならず者',
    class: 'enemy',
    level: 1,
    exp: 20,
    stats: {
      hp: 50,
      maxHp: 50,
      mp: 0,
      maxMp: 0,
      attack: 10,
      defense: 5,
      speed: 8,
      luck: 3,
    },
    equipment: {
      weapon: null,
      armor: null,
    },
    skills: [],
    sprite: 'enemies/bandit.png',
    ...overrides,
  }
}

/** Creates a valid mock Item object */
export function createMockItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'herb',
    name: '薬',
    type: 'consumable',
    description: 'HPを30回復する。',
    price: 50,
    effect: {
      type: 'heal_hp',
      value: 30,
    },
    usableInBattle: true,
    usableInField: true,
    ...overrides,
  }
}

/** Creates a valid mock MapData object */
export function createMockMapData(overrides: Partial<MapData> = {}): MapData {
  const width = 5
  const height = 5
  const emptyRow = () => Array(width).fill(0)

  return {
    id: 'test_map',
    name: 'テストマップ',
    width,
    height,
    tileSize: 32,
    layers: {
      background: Array(height)
        .fill(null)
        .map(() => emptyRow()),
      collision: Array(height)
        .fill(null)
        .map(() => emptyRow()),
      events: Array(height)
        .fill(null)
        .map(() => emptyRow()),
    },
    tileset: 'tilesets/default.png',
    bgm: 'bgm/field.ogg',
    npcs: [],
    transitions: [],
    events: [],
    ...overrides,
  }
}

/** Resets all Zustand stores to their initial state between tests */
export function resetAllStores(): void {
  usePartyStore.setState({
    members: [],
    formation: [],
    gold: 0,
    items: [],
  })

  useGameStore.setState({
    scene: 'title',
    paused: false,
    shopOpen: false,
    shopType: null,
    shopId: null,
    settings: {
      bgmVolume: 0.5,
      seVolume: 0.7,
      messageSpeed: 2,
    },
    difficulty: 'normal',
  })

  useBattleStore.setState({
    phase: BattlePhase.INIT,
    party: [],
    enemies: [],
    turn: 0,
    actionQueue: [],
    currentActorId: null,
    result: null,
  })

  useProgressStore.setState({
    chapter: 'prologue',
    flags: {},
    currentMapId: 'saigaitaya',
    currentPosition: { x: 15, y: 5 },
    visitedMaps: [],
    playTime: 0,
  })
}
