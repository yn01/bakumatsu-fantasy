/**
 * セーブデータ型定義
 */

/** セーブデータ */
export interface SaveData {
  version: string // セーブデータバージョン（例: "1.0.0"）
  timestamp: number // 保存日時（Unix timestamp）
  checksum?: string // データ整合性チェック（オプション）

  // プレイ状況
  playTime: number // プレイ時間（秒）
  chapter: string // 現在の章（"prologue", "chapter1", ...）

  // マップ・位置
  currentMap: string // 現在のマップID
  playerPosition: {
    x: number
    y: number
  }

  // パーティ
  party: {
    members: string[] // キャラクターID配列
    formation: number[] // 編成順
  }

  // キャラクター状態
  characters: {
    [characterId: string]: {
      level: number
      exp: number
      hp: number
      mp: number
      maxHp: number
      maxMp: number
      skills: string[] // 習得スキルID
      equipment: {
        weapon: string | null
        armor: string | null
      }
      skillPoints: number
    }
  }

  // 所持品
  inventory: {
    items: { [itemId: string]: number } // アイテムID → 所持数
    money: number // 所持金（両）
  }

  // 進行フラグ
  flags: {
    [flagName: string]: boolean | number | string
  }

  // 訪問済みマップ
  visitedMaps: string[]

  // ゲーム設定
  settings: {
    bgmVolume: number // 0.0〜1.0
    seVolume: number // 0.0〜1.0
    messageSpeed: number // 1〜3
  }

  // 難易度
  difficulty?: string // 'easy' | 'normal' | 'hard' | 'veryHard'

  // Phase 9: クエスト、実績、図鑑データ
  quests?: {
    activeQuests: string[]
    completedQuests: string[]
  }
  achievements?: {
    unlockedAchievements: string[]
  }
  encyclopedia?: {
    discoveredEnemies: string[]
    discoveredItems: string[]
    discoveredSkills: string[]
  }
}

/** セーブスロット */
export interface SaveSlot {
  id: number // 1, 2, 3, or 0 (auto)
  data: SaveData | null
  isEmpty: boolean
}

/** セーブメタデータ */
export interface SaveMetadata {
  slotId: number
  timestamp: number
  playTime: number
  chapter: string
  level: number
  mapName: string
}
