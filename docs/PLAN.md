# 幕末ファンタジーRPG - 実装計画書

## ドキュメント情報

| 項目 | 値 |
|------|-----|
| 作成日 | 2026-01-29 |
| 最終更新 | 2026-01-31 |
| バージョン | 1.16.0 |
| ステータス | Phase 4 完了（Task #17-#23 完了、最適化完了） |

---

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [技術スタック](#2-技術スタック)
3. [ディレクトリ構造](#3-ディレクトリ構造)
4. [実装フェーズ詳細](#4-実装フェーズ詳細)
5. [データ構造定義](#5-データ構造定義)
6. [進捗管理](#6-進捗管理)

---

## 1. プロジェクト概要

### 1.1 ゲーム概要
- **タイトル**: 幕末ファンタジーRPG（仮）
- **ジャンル**: ターン制RPG
- **プラットフォーム**: Webブラウザ
- **ベースストーリー**: 司馬遼太郎「龍馬がゆく」

### 1.2 デモ版スコープ
- **範囲**: 土佐編（幼少期〜脱藩）
- **プレイ時間**: 30分〜1時間
- **プレイアブルキャラ**: 坂本龍馬、武市半平太
- **マップ数**: 4（才谷屋、高知城下町、山内容堂道場、浦戸湊）

### 1.3 コアシステム
1. フィールド移動（トップダウン2D）
2. ターン制コマンドバトル（FF1-3スタイル）
3. レベルアップ・スキルツリー
4. 装備・アイテム管理
5. イベント・会話システム
6. セーブ/ロード（LocalStorage）

---

## 2. 技術スタック

### 2.1 コア技術
| カテゴリ | 技術 | バージョン | 用途 |
|----------|------|------------|------|
| ランタイム | Node.js | 20.x LTS | 開発環境 |
| フレームワーク | React | 18.x | UIコンポーネント |
| 言語 | TypeScript | 5.x | 型安全性 |
| ビルドツール | Vite | 5.x | 高速ビルド・HMR |

### 2.2 ライブラリ
| ライブラリ | バージョン | 用途 |
|------------|------------|------|
| Zustand | 4.x | 状態管理 |
| React Router | 7.x | ルーティング |
| Tailwind CSS | 3.x | スタイリング |
| Howler.js | 2.x | 音声再生 |

### 2.3 開発ツール
| ツール | 用途 |
|--------|------|
| ESLint | コード品質 |
| Prettier | コードフォーマット |
| Vitest | ユニットテスト |
| Playwright | E2Eテスト |

---

## 3. ディレクトリ構造

```
bakumatsu-fantasy/
├── CLAUDE.md                    # AI開発ガイド
├── README.md                    # プロジェクト説明
├── package.json                 # 依存関係
├── tsconfig.json               # TypeScript設定
├── vite.config.ts              # Vite設定
├── tailwind.config.js          # Tailwind設定
├── postcss.config.js           # PostCSS設定
├── eslint.config.js            # ESLint設定
├── index.html                  # エントリーHTML
│
├── docs/
│   ├── REQUIREMENTS.md         # 要件定義書
│   └── PLAN.md                 # 本実装計画書
│
├── public/
│   ├── assets/
│   │   ├── sprites/            # キャラクタースプライト
│   │   │   ├── characters/     # プレイアブルキャラ
│   │   │   └── enemies/        # 敵キャラ
│   │   ├── tilesets/           # マップチップ
│   │   ├── ui/                 # UI素材
│   │   ├── bgm/                # BGM（.mp3/.ogg）
│   │   └── se/                 # 効果音（.mp3/.ogg）
│   │
│   └── data/
│       ├── characters.json     # キャラクターマスタ
│       ├── enemies.json        # 敵マスタ
│       ├── items.json          # アイテムマスタ
│       ├── skills.json         # スキルマスタ
│       ├── maps/               # マップデータ
│       │   ├── saitaniya.json  # 才谷屋
│       │   ├── castle_town.json # 高知城下町
│       │   ├── dojo.json       # 山内容堂道場
│       │   └── urado.json      # 浦戸湊
│       └── events/             # イベントスクリプト
│           ├── prologue.json   # プロローグ
│           ├── chapter1.json   # 第一章
│           ├── chapter2.json   # 第二章
│           ├── chapter3.json   # 第三章
│           └── epilogue.json   # エピローグ
│
└── src/
    ├── main.tsx                # アプリエントリー
    ├── App.tsx                 # ルートコンポーネント
    ├── index.css               # グローバルCSS
    │
    ├── components/
    │   ├── game/               # ゲームコアコンポーネント
    │   │   ├── GameCanvas.tsx  # メインCanvas
    │   │   ├── Field.tsx       # フィールド描画
    │   │   ├── Battle.tsx      # バトル画面
    │   │   └── Sprite.tsx      # スプライト描画
    │   │
    │   ├── ui/                 # UI部品
    │   │   ├── MessageBox.tsx  # メッセージボックス
    │   │   ├── Menu.tsx        # メインメニュー
    │   │   ├── CommandWindow.tsx # コマンド選択
    │   │   ├── StatusBar.tsx   # ステータス表示
    │   │   ├── Dialog.tsx      # 汎用ダイアログ
    │   │   └── ShopWindow.tsx  # ショップUI
    │   │
    │   └── screens/            # 画面コンポーネント
    │       ├── TitleScreen.tsx # タイトル画面
    │       ├── FieldScreen.tsx # フィールド画面
    │       ├── BattleScreen.tsx # バトル画面
    │       ├── MenuScreen.tsx  # メニュー画面
    │       └── ShopScreen.tsx  # ショップ画面
    │
    ├── systems/                # ゲームシステム
    │   ├── battle/
    │   │   ├── BattleManager.ts    # バトル全体管理
    │   │   ├── TurnManager.ts      # ターン制御
    │   │   ├── DamageCalculator.ts # ダメージ計算
    │   │   ├── BattleAI.ts         # 敵AI
    │   │   └── SkillExecutor.ts    # スキル実行
    │   │
    │   ├── field/
    │   │   ├── MapRenderer.ts      # マップ描画
    │   │   ├── CharacterController.ts # キャラ移動
    │   │   ├── CollisionDetector.ts   # 衝突判定
    │   │   ├── EncounterSystem.ts     # エンカウント
    │   │   └── MapTransition.ts       # マップ切替
    │   │
    │   ├── event/
    │   │   ├── EventManager.ts     # イベント管理
    │   │   ├── DialogueSystem.ts   # 会話システム
    │   │   ├── ScriptParser.ts     # スクリプト解析
    │   │   └── FlagManager.ts      # フラグ管理
    │   │
    │   ├── growth/
    │   │   ├── LevelUpManager.ts   # レベルアップ
    │   │   └── SkillTreeManager.ts # スキルツリー
    │   │
    │   └── save/
    │       └── SaveManager.ts      # セーブ/ロード
    │
    ├── stores/                 # Zustand状態管理
    │   ├── gameStore.ts        # ゲーム全体状態
    │   ├── partyStore.ts       # パーティ状態
    │   ├── inventoryStore.ts   # インベントリ
    │   ├── progressStore.ts    # 進行状況
    │   └── battleStore.ts      # バトル状態
    │
    ├── hooks/                  # カスタムフック
    │   ├── useGameLoop.ts      # ゲームループ
    │   ├── useKeyboard.ts      # キーボード入力
    │   ├── useAudio.ts         # 音声管理
    │   └── useCanvas.ts        # Canvas操作
    │
    ├── types/                  # 型定義
    │   ├── character.ts        # キャラクター型
    │   ├── battle.ts           # バトル型
    │   ├── item.ts             # アイテム型
    │   ├── skill.ts            # スキル型
    │   ├── map.ts              # マップ型
    │   ├── event.ts            # イベント型
    │   └── common.ts           # 共通型
    │
    └── utils/                  # ユーティリティ
        ├── storage.ts          # LocalStorage操作
        ├── random.ts           # 乱数生成
        ├── constants.ts        # 定数定義
        ├── helpers.ts          # ヘルパー関数
        └── assetLoader.ts      # アセット読込
```

---

## 4. 実装フェーズ詳細

### Phase 1: 基盤構築

#### 1.1 プロジェクト初期化
**ステータス**: [ ] 未完了

```bash
# 実行コマンド
npm create vite@latest . -- --template react-ts
npm install
npm install zustand react-router-dom
npm install -D tailwindcss postcss autoprefixer
npm install -D eslint prettier eslint-config-prettier
npx tailwindcss init -p
```

**作成ファイル**:
- [x] package.json
- [ ] tsconfig.json（カスタマイズ）
- [ ] vite.config.ts（カスタマイズ）
- [ ] tailwind.config.js
- [ ] postcss.config.js
- [ ] eslint.config.js
- [ ] .prettierrc

#### 1.2 ディレクトリ構造作成
**ステータス**: [ ] 未完了

```bash
# 作成するディレクトリ
mkdir -p src/{components/{game,ui,screens},systems/{battle,field,event,growth,save},stores,hooks,types,utils}
mkdir -p public/{assets/{sprites/{characters,enemies},tilesets,ui,bgm,se},data/{maps,events}}
mkdir -p docs
```

#### 1.3 型定義作成
**ステータス**: [ ] 未完了

**ファイル**: `src/types/`

| ファイル | 内容 |
|----------|------|
| common.ts | Position, Size, Direction, GameScene など共通型 |
| character.ts | Character, Stats, CharacterState |
| battle.ts | BattleState, Command, BattlePhase, BattleResult |
| item.ts | Item, Equipment, ConsumableItem |
| skill.ts | Skill, SkillEffect, SkillTree |
| map.ts | MapData, Tile, TileType, NPC, MapTransition |
| event.ts | GameEvent, Dialogue, EventFlag, EventCommand |
| save.ts | SaveData, SaveSlot, SaveMetadata |

#### 1.4 状態管理セットアップ
**ステータス**: [ ] 未完了

**ファイル**: `src/stores/`

| ストア | 管理内容 |
|--------|----------|
| gameStore.ts | ゲーム状態（scene, paused, settings） |
| partyStore.ts | パーティ（members, formation） |
| inventoryStore.ts | 所持品（items, equipment, money） |
| progressStore.ts | 進行状況（chapter, flags, visited） |
| battleStore.ts | バトル状態（enemies, turn, phase） |

#### 1.5 キーボード入力システム
**ステータス**: [ ] 未完了

**ファイル**: `src/hooks/useKeyboard.ts`

```typescript
// キーマッピング
const KEY_MAP = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'confirm',
  Space: 'confirm',
  Escape: 'cancel',
  KeyX: 'cancel',
  KeyZ: 'confirm',
} as const;
```

#### 1.6 ゲームループ
**ステータス**: [ ] 未完了

**ファイル**: `src/hooks/useGameLoop.ts`

```typescript
// ゲームループ仕様
- FPS: 60（16.67ms間隔）
- update(deltaTime): ゲームロジック更新
- render(): 描画処理
- requestAnimationFrame使用
```

#### 1.7 GameCanvasコンポーネント
**ステータス**: [ ] 未完了

**ファイル**: `src/components/game/GameCanvas.tsx`

```typescript
// Canvas仕様
- サイズ: 640x480px（4:3、SFC風）
- スケーリング: CSS transform で拡大
- コンテキスト: 2D
```

---

### Phase 2: フィールドシステム

#### 2.1 マップレンダリング
**ステータス**: [ ] 未完了

**ファイル**: `src/systems/field/MapRenderer.ts`

- タイルサイズ: 32x32px
- **データレイヤー**: background（タイル）/ collision（衝突）/ events（イベント）
- **描画順序**: 背景タイル → オブジェクト → キャラクター → オーバーレイ
- ビューポート: 20x15タイル（640x480px）

**注**: データ構造（MapData.layers）は3レイヤーだが、描画時はbackgroundを複数の深度で描画可能。

#### 2.2 キャラクター移動
**ステータス**: [ ] 未完了

**ファイル**: `src/systems/field/CharacterController.ts`

- グリッドベース移動（32px単位）
- 歩行アニメーション（4方向×3フレーム）
- 移動速度: 4px/frame

#### 2.3 衝突判定
**ステータス**: [ ] 未完了

**ファイル**: `src/systems/field/CollisionDetector.ts`

- タイルベース判定
- 通行可能フラグ（passable）
- イベントタイル判定

#### 2.4 マップ切替
**ステータス**: [ ] 未完了

**ファイル**: `src/systems/field/MapTransition.ts`

- トランジション: フェードイン/アウト
- 切替トリガー: 特定タイル踏み
- 初期位置設定

#### 2.5 NPC配置・会話
**ステータス**: [ ] 未完了

- NPCスプライト配置
- 話しかけ判定（Enterキー）
- 会話ウィンドウ表示

---

### Phase 3: バトルシステム

#### 3.1 バトルマネージャー
**ステータス**: [ ] 未完了

**ファイル**: `src/systems/battle/BattleManager.ts`

```typescript
// バトルフェーズ
enum BattlePhase {
  INIT,           // 初期化
  COMMAND_SELECT, // コマンド選択
  ACTION_EXECUTE, // アクション実行
  RESULT,         // 結果表示
  VICTORY,        // 勝利
  DEFEAT,         // 敗北
  ESCAPE,         // 逃走
}
```

#### 3.2 ターン管理
**ステータス**: [ ] 未完了

**ファイル**: `src/systems/battle/TurnManager.ts`

- 素早さ順行動
- コマンド入力待ち
- 行動実行キュー

#### 3.3 ダメージ計算
**ステータス**: [ ] 未完了

**ファイル**: `src/systems/battle/DamageCalculator.ts`

```typescript
// 基本ダメージ計算式
damage = (攻撃力 * スキル倍率) - (防御力 / 2)
damage *= 属性相性倍率
damage *= 乱数(0.9〜1.1)
```

#### 3.4 コマンドUI
**ステータス**: [ ] 未完了

**ファイル**: `src/components/ui/CommandWindow.tsx`

```
┌─────────────┐
│ 攻撃        │
│ 技          │
│ 防御        │
│ アイテム    │
└─────────────┘
```

#### 3.5 バトル画面
**ステータス**: [ ] 未完了

**ファイル**: `src/components/screens/BattleScreen.tsx`

- サイドビュー（味方左、敵右）
- HPバー表示
- ダメージ数値表示
- 勝利/敗北演出

---

### Phase 4: 成長・装備システム

**実装期間**: 2026-01-31 ～ 2026-01-31
**進捗率**: 100% (7/7タスク完了)
**ステータス**: ✅ 完了

#### 完了タスク

##### Task #17: バトル報酬システム ✅
**実装日**: 2026-01-31
**ファイル**:
- `src/systems/battle/RewardManager.ts`
- `src/components/ui/BattleResultWindow.tsx`
- `src/stores/partyStore.ts` (拡張)

**実装内容**:
- partyStore拡張: gold, items フィールド追加、addExp/addGold/addItem/removeItem アクション追加
- RewardManager: 報酬分配ロジック、経験値均等分配、レベルアップチェック
- BattleResultWindow: 勝利画面UI、獲得経験値・ゴールド・アイテム表示
- Battle.tsx統合: 勝利時の報酬分配とBattleResultWindow表示制御

**バンドルサイズ**: 184.61 kB (gzip: 58.37 kB)

##### Task #18: レベルアップシステム ✅
**実装日**: 2026-01-31
**ファイル**:
- `src/systems/growth/LevelUpManager.ts`
- `src/components/ui/LevelUpWindow.tsx`
- `public/data/characters.json`
- `src/types/character.ts` (Character型拡張: growthRate追加)

**実装内容**:
- LevelUpManager: 経験値テーブル(Lv1-50)、ステータス成長計算、複数レベルアップ対応、クラス別成長率
- LevelUpWindow: レベルアップ演出UI、ステータス増加量表示
- characters.json: 坂本龍馬・武市半平太のマスタデータ
- RewardManager統合: checkLevelUp()をLevelUpManagerに委譲
- Battle.tsx統合: レベルアップウィンドウ表示制御、複数メンバー順次表示

**バンドルサイズ**: 189.78 kB (gzip: 59.52 kB)

##### Task #19: スキルツリーシステム ✅
**実装日**: 2026-01-31
**ファイル**:
- `src/systems/growth/SkillTreeManager.ts`
- `src/components/ui/SkillTreeWindow.tsx`
- `public/data/skills.json`
- `public/data/skill_trees.json`
- `src/types/character.ts` (Character型拡張: skillPoints追加)
- `src/systems/growth/LevelUpManager.ts` (スキルポイント付与、自動習得)
- `src/components/ui/LevelUpWindow.tsx` (習得スキル表示改善)
- `src/components/game/Battle.tsx` (SkillTreeManager初期化)

**実装内容**:
- スキルマスタデータ: 12種類のスキル定義（幕末・北辰一刀流テーマ）
- スキルツリーデータ: swordsman、strategistクラスのツリー構造
- SkillTreeManager: 習得可能判定、習得実行、自動習得チェック
- SkillTreeWindow: スキルツリーUI、習得状態表示、キーボード操作
- LevelUpManager統合: スキルポイント付与（1レベル1ポイント）、自動習得スキル
- Character型拡張: skillPoints?: number フィールド追加

**バンドルサイズ**: 192.70 kB (gzip: 60.41 kB)

##### Task #20: 装備システム ✅
**実装日**: 2026-01-31
**ファイル**:
- `src/systems/growth/EquipmentManager.ts`
- `src/components/ui/EquipmentWindow.tsx`
- `public/data/items.json`
- `src/components/game/Battle.tsx` (EquipmentManager初期化)

**実装内容**:
- items.json: 15種類のアイテム定義（武器6種、防具5種、消費アイテム4種）
  - 武器: 木刀、脇差、打刀、名刀・村正、陸奥守吉行、薙刀
  - 防具: 布の着物、袴、羽織、軽鎧、鎧
  - 消費アイテム: 薬、良薬、饅頭、解毒薬
- EquipmentManager: 装備可能判定（レベル、キャラクター制限）、装備変更実行、装備込みステータス計算、装備/外す機能
- EquipmentWindow: 装備UI、現在装備表示、装備可能アイテムリスト、ステータス比較表示、キーボード操作（スロット選択→アイテム選択）
- Battle.tsx統合: EquipmentManager初期化

**バンドルサイズ**: 195.11 kB (gzip: 61.11 kB)

##### Task #21: メニュー画面 ✅
**実装日**: 2026-01-31
**ファイル**:
- `src/components/screens/MenuScreen.tsx`
- `src/components/ui/StatusWindow.tsx`
- `src/App.tsx` (メニュー統合)

**実装内容**:
- MenuScreen: 3モード設計（タブ選択、メンバー選択、詳細表示）、4タブ（ステータス、スキル、装備、アイテム）、キーボード操作
- StatusWindow: キャラクターステータス詳細表示、経験値バー、HPバー、装備表示、習得スキル数表示
- タブ切り替え機能（←→キー）
- キャラクター選択機能（複数メンバー対応）
- 既存UI統合（SkillTreeWindow、EquipmentWindow）
- App.tsx統合: Escapeキーでメニュー表示/非表示、フィールドモード時のみ有効

**バンドルサイズ**: 214.75 kB (gzip: 64.71 kB)
**注**: 目標200 kB超過（+14.75 kB）。Task #23で最適化検討。

#### 未完了タスク

##### Task #22: ショップシステム ⏳
**ステータス**: 未着手
**ファイル**:
- `src/systems/growth/ShopManager.ts`
- `src/components/screens/ShopScreen.tsx`

**実装予定**:
- アイテム購入/売却（売却価格は購入価格の50%）
- ゴールド不足時の購入不可判定
- NPC統合（Field.tsx）

##### Task #23: マスタデータと統合テスト ⏳
**ステータス**: 未着手

**実装予定**:
- 全マスタデータ完成（characters.json、skills.json、skill_trees.json、items.json）
- 統合テスト実施（バトル→報酬→レベルアップフロー、スキルツリー、装備、ショップ、メニュー）
- パフォーマンス検証（バンドルサイズ200kB以下）

---

### Phase 5: イベント・ストーリー

#### 5.1 イベントマネージャー
**ステータス**: [ ] 未完了

**ファイル**: `src/systems/event/EventManager.ts`

- イベントキュー管理
- トリガー条件判定
- イベント実行制御

#### 5.2 スクリプトパーサー
**ステータス**: [ ] 未完了

**ファイル**: `src/systems/event/ScriptParser.ts`

```json
// イベントスクリプト例
{
  "id": "prologue_001",
  "commands": [
    { "type": "message", "text": "ここは土佐、高知城下..." },
    { "type": "wait", "duration": 1000 },
    { "type": "move", "target": "player", "direction": "right", "steps": 3 },
    { "type": "message", "speaker": "龍馬", "text": "わしは坂本龍馬じゃ" },
    { "type": "setFlag", "flag": "prologue_complete", "value": true }
  ]
}
```

#### 5.3 会話システム
**ステータス**: [ ] 未完了

**ファイル**: `src/systems/event/DialogueSystem.ts`

- メッセージ表示（文字送り）
- 話者名表示
- 選択肢対応

#### 5.4 フラグ管理
**ステータス**: [ ] 未完了

**ファイル**: `src/systems/event/FlagManager.ts`

- ストーリーフラグ
- サブイベントフラグ
- 訪問済みマップ記録

#### 5.5 デモ版シナリオ実装
**ステータス**: [ ] 未完了

| 章 | イベント |
|----|----------|
| プロローグ | 才谷屋での幼少期、身分制度の描写 |
| 第一章 | 江戸小栗流入門、剣術修行 |
| 第二章 | 武市半平太との出会い、土佐勤王党 |
| 第三章 | 守旧派との対立、脱藩決意 |
| エピローグ | 土佐を離れる |

---

### Phase 6: サウンド・仕上げ

#### 6.1 BGM/SE実装
**ステータス**: [ ] 未完了

**ファイル**: `src/hooks/useAudio.ts`

- Howler.js使用
- BGMループ再生
- SE同時再生対応
- 音量設定保存

#### 6.2 タイトル画面
**ステータス**: [ ] 未完了

**ファイル**: `src/components/screens/TitleScreen.tsx`

```
┌─────────────────────────────┐
│                             │
│     幕末ファンタジーRPG      │
│                             │
│       ▶ はじめから          │
│         つづきから          │
│         せってい            │
│                             │
└─────────────────────────────┘
```

#### 6.3 セーブ/ロード
**ステータス**: [ ] 未完了

**ファイル**: `src/systems/save/SaveManager.ts`

**基本仕様**:
- LocalStorage使用
- セーブスロット: 3枠
- 自動セーブ（マップ切替時）

**セーブデータ構造**:
```typescript
interface SaveData {
  version: string;              // セーブデータバージョン（例: "1.0.0"）
  timestamp: number;            // 保存日時（Unix timestamp）
  checksum?: string;            // データ整合性チェック（オプション）

  // プレイ状況
  playTime: number;             // プレイ時間（秒）
  chapter: string;              // 現在の章（"prologue", "chapter1", ...）

  // マップ・位置
  currentMap: string;           // 現在のマップID
  playerPosition: {             // プレイヤー座標
    x: number;
    y: number;
  };

  // パーティ
  party: {
    members: string[];          // キャラクターID配列
    formation: number[];        // 編成順
  };

  // キャラクター状態
  characters: {
    [characterId: string]: {
      level: number;
      exp: number;
      hp: number;
      mp: number;
      skills: string[];         // 習得スキルID
      equipment: {
        weapon: string | null;
        armor: string | null;
      };
    };
  };

  // 所持品
  inventory: {
    items: { [itemId: string]: number };  // アイテムID → 所持数
    money: number;                        // 所持金（両）
  };

  // 進行フラグ
  flags: {
    [flagName: string]: boolean | number | string;
  };

  // 訪問済みマップ
  visitedMaps: string[];

  // ゲーム設定
  settings: {
    bgmVolume: number;          // 0.0〜1.0
    seVolume: number;           // 0.0〜1.0
    messageSpeed: number;       // 1〜3
  };
}
```

**バージョニング戦略**:
- セーブデータに `version` フィールドを含める
- ロード時にバージョンチェック
- マイナーアップデート: マイグレーション処理
- メジャーアップデート: 互換性なしの警告

**データ整合性**:
- `checksum` フィールドでデータ破損検知（オプション）
- ロード失敗時は該当スロットを無効化
- バックアップスロット（最後の自動セーブ）を保持

**LocalStorage キー設計**:
```
bakumatsu-fantasy:save:slot1
bakumatsu-fantasy:save:slot2
bakumatsu-fantasy:save:slot3
bakumatsu-fantasy:save:auto
bakumatsu-fantasy:settings
```

**容量制限対策**:
- LocalStorageの容量上限: 通常5MB
- セーブデータ推定サイズ: 10KB程度
- 将来的な圧縮（LZ-string等）は検討項目

#### 6.4 バランス調整
**ステータス**: [ ] 未完了

- 敵ステータス調整
- 経験値・ゴールド調整
- エンカウント率調整
- ボス難易度調整

---

## 5. データ構造定義

### 5.1 キャラクターデータ
```typescript
interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  exp: number;
  stats: {
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    attack: number;
    defense: number;
    speed: number;
    luck: number;
  };
  equipment: {
    weapon: string | null;
    armor: string | null;
  };
  skills: string[];
  sprite: string;
}
```

### 5.2 敵データ
```typescript
interface Enemy {
  id: string;
  name: string;
  stats: Stats;
  skills: string[];
  drops: {
    itemId: string;
    rate: number;
  }[];
  exp: number;
  gold: number;
  sprite: string;
}
```

### 5.3 アイテムデータ
```typescript
interface Item {
  id: string;
  name: string;
  type: 'consumable' | 'weapon' | 'armor' | 'key';
  description: string;
  price: number;
  effect?: {
    type: string;
    value: number;
  };
  equipStats?: Partial<Stats>;
  usableInBattle: boolean;
  usableInField: boolean;
}
```

### 5.4 スキルデータ
```typescript
interface Skill {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  power: number;
  type: 'physical' | 'magical' | 'heal' | 'buff' | 'debuff';
  target: 'single' | 'all' | 'self';
  animation: string;
}
```

### 5.5 マップデータ
```typescript
interface MapData {
  id: string;
  name: string;
  width: number;
  height: number;
  tileSize: number;
  layers: {
    background: number[][];  // タイルID配列
    collision: number[][];   // 0=通行可, 1=通行不可
    events: number[][];      // イベントID（0=なし）
  };
  tileset: string;
  bgm: string;
  encounters?: {
    enemies: string[];
    rate: number;  // エンカウント率（0.0〜1.0）
  };
  npcs: NPC[];
  transitions: MapTransition[];
}

interface NPC {
  id: string;
  name: string;
  sprite: string;
  position: { x: number; y: number };
  direction: 'up' | 'down' | 'left' | 'right';
  dialogue: string | string[];  // 会話ID or 会話内容
  movementPattern?: 'stationary' | 'random' | 'patrol';
  patrolPoints?: { x: number; y: number }[];
}

interface MapTransition {
  id: string;
  fromPosition: { x: number; y: number };  // トリガー座標
  toMapId: string;                          // 遷移先マップID
  toPosition: { x: number; y: number };    // 遷移先座標
  direction?: 'up' | 'down' | 'left' | 'right';  // 必要な向き
  transitionType: 'walk' | 'door' | 'stairs';     // 遷移タイプ
}
```

### 5.6 セーブデータ
```typescript
interface SaveData {
  version: string;              // セーブデータバージョン（例: "1.0.0"）
  timestamp: number;            // 保存日時（Unix timestamp）
  checksum?: string;            // データ整合性チェック（オプション）

  // プレイ状況
  playTime: number;             // プレイ時間（秒）
  chapter: string;              // 現在の章

  // マップ・位置
  currentMap: string;           // 現在のマップID
  playerPosition: {
    x: number;
    y: number;
  };

  // パーティ
  party: {
    members: string[];          // キャラクターID配列
    formation: number[];        // 編成順
  };

  // キャラクター状態
  characters: {
    [characterId: string]: {
      level: number;
      exp: number;
      hp: number;
      mp: number;
      skills: string[];         // 習得スキルID
      equipment: {
        weapon: string | null;
        armor: string | null;
      };
    };
  };

  // 所持品
  inventory: {
    items: { [itemId: string]: number };
    money: number;
  };

  // 進行フラグ
  flags: {
    [flagName: string]: boolean | number | string;
  };

  // 訪問済みマップ
  visitedMaps: string[];

  // ゲーム設定
  settings: {
    bgmVolume: number;
    seVolume: number;
    messageSpeed: number;
  };
}
```

---

## 6. 進捗管理

### 6.1 セッション再開時の手順

**重要**: 新しいセッションを開始する際は、以下の手順で現在の状態を把握してください。

```
1. CLAUDE.md を読む → プロジェクト概要の把握
2. docs/PLAN.md のセクション6 を読む → 現在のフェーズとタスク状態
3. TaskList コマンドを実行 → アクティブなタスクの確認
4. 未完了の最優先タスクから作業を再開
```

### 6.2 フェーズ進捗サマリー

| Phase | 名称 | ステータス | 進捗 | 備考 |
|-------|------|------------|------|------|
| **1** | **基盤構築** | **✅ 完了** | 100% | Codexレビュー実施済み、修正完了 |
| **2** | **フィールドシステム** | **✅ 完了** | 100% | 全タスク完了、Codexレビュー対応済み |
| **3** | **バトルシステム** | **✅ 完了** | 100% | 全6タスク完了、Codexレビュー対応済み |
| **4** | **成長・装備システム** | **✅ 完了** | 100% | Task #17-#23完了（7/7タスク）、最適化完了 |
| 5 | イベント・ストーリー | 未着手 | 0% | - |
| 6 | サウンド・仕上げ | 未着手 | 0% | - |

### 6.3 Phase 1 詳細進捗（✅ 完了）

#### タスク一覧と依存関係

```
Task #1: プロジェクト初期化
    ↓ (完了後に #2 が開始可能)
Task #2: ディレクトリ構造とコア型定義
    ↓ (完了後に #3, #4, #5 が並行開始可能)
    ├── Task #3: 状態管理セットアップ
    ├── Task #4: キーボード入力システム
    └── Task #5: ゲームループとCanvas基盤
```

#### タスク詳細

| Task ID | タスク名 | ステータス | ブロック | 説明 |
|---------|----------|------------|----------|------|
| #1 | プロジェクト初期化 | ✅ 完了 | - | Vite+React+TS初期化、依存関係インストール、ESLint/Prettier設定 |
| #2 | ディレクトリ構造とコア型定義 | ✅ 完了 | #1 | src/types/配下に型定義作成、ディレクトリ構造作成 |
| #3 | 状態管理セットアップ | ✅ 完了 | #2 | Zustandストア作成（game, party, inventory, progress, battle） |
| #4 | キーボード入力システム | ✅ 完了 | #2 | useKeyboardフック作成 |
| #5 | ゲームループとCanvas基盤 | ✅ 完了 | #2 | useGameLoop、useCanvas、GameCanvasコンポーネント作成 |

#### Codexレビュー結果

**実施日**: 2026-01-29
**結果**: High/Medium優先度の問題をすべて修正完了

**修正内容**:
1. ✅ メモリリーク修正（GameCanvas.tsx）
2. ✅ EventCommand型不整合修正（7コマンド追加）
3. ✅ BattleParticipant.state型修正（string[] → CharacterState[]）
4. ✅ キーボード入力堅牢化（blur/visibilitychange対応、フォーム要素除外）

#### 各タスクの成果物

**Task #1: プロジェクト初期化**
```
作成ファイル:
- package.json（依存関係定義）
- tsconfig.json（TypeScript設定）
- vite.config.ts（Vite設定）
- tailwind.config.js（Tailwind設定）
- postcss.config.js（PostCSS設定）
- eslint.config.js（ESLint設定）
- .prettierrc（Prettier設定）
- index.html（エントリーHTML）
- src/main.tsx（エントリーポイント）
- src/App.tsx（ルートコンポーネント）
- src/index.css（グローバルCSS）
```

**Task #2: ディレクトリ構造とコア型定義**
```
作成ディレクトリ:
- src/components/{game,ui,screens}/
- src/systems/{battle,field,event,growth,save}/
- src/stores/
- src/hooks/
- src/types/
- src/utils/
- public/assets/{sprites/{characters,enemies},tilesets,ui,bgm,se}/
- public/data/{maps,events}/

作成ファイル:
- src/types/common.ts
- src/types/character.ts
- src/types/battle.ts
- src/types/item.ts
- src/types/skill.ts
- src/types/map.ts
- src/types/event.ts
```

**Task #3: 状態管理セットアップ**
```
作成ファイル:
- src/stores/gameStore.ts
- src/stores/partyStore.ts
- src/stores/inventoryStore.ts
- src/stores/progressStore.ts
- src/stores/battleStore.ts
```

**Task #4: キーボード入力システム**
```
作成ファイル:
- src/hooks/useKeyboard.ts
```

**Task #5: ゲームループとCanvas基盤**
```
作成ファイル:
- src/hooks/useGameLoop.ts
- src/hooks/useCanvas.ts
- src/components/game/GameCanvas.tsx
```

### 6.4 Phase 2 詳細進捗（🔄 実装中）

#### タスク一覧と依存関係

```
Task #6: マップレンダリング
    ↓ (完了後に #7, #9, #10 が開始可能)
    ├── Task #7: キャラクター移動
    │       ↓ (完了後に #8 が開始可能)
    │       └── Task #8: 衝突判定
    ├── Task #9: マップ切替
    └── Task #10: NPC配置と会話
```

#### タスク詳細

| Task ID | タスク名 | ステータス | 進捗 | 説明 |
|---------|----------|------------|------|------|
| #6 | マップレンダリングシステム | ✅ 完了 | 100% | MapRenderer.ts、Field.tsx作成、App.tsx統合完了 |
| #7 | キャラクター移動システム | ✅ 完了 | 100% | CharacterController.ts、CharacterRenderer.ts作成完了 |
| #8 | 衝突判定システム | ✅ 完了 | 100% | CollisionSystem.ts作成、タイル衝突・境界判定実装 |
| #9 | マップ切替システム | ✅ 完了 | 100% | TransitionSystem.ts、MapManager.ts作成、フェード遷移実装 |
| #10 | NPC配置と会話システム | ✅ 完了 | 100% | NPCRenderer.ts、MessageBox.tsx作成、会話システム実装 |

#### Task #6 進捗詳細（✅ 完了）

**成果物**:
- ✅ テストマップデータ作成（public/data/maps/test_map.json）
  - 20x15タイル、32x32pxタイルサイズ
  - 3レイヤー構成（background, collision, events）
  - 中央の部屋構造（壁、地面、床、石）
- ✅ MapRenderer.ts実装
  - マップデータ非同期読み込み
  - タイル描画（色ベース仮実装）
  - 衝突判定データ取得メソッド
  - カメラ座標対応
  - 画面外カリング最適化
- ✅ Fieldコンポーネント作成（src/components/game/Field.tsx）
  - MapRendererとReactライフサイクルの統合
  - ローディング状態・エラーハンドリング
  - 640x480px Canvas描画
- ✅ App.tsxへの統合
  - モード切替機能（フィールド表示 / Phase 1デモ）
  - キーボード入力テスト表示
- ✅ ビルド検証
  - TypeScriptコンパイル成功
  - 本番ビルド成功（dist/生成確認）
  - 開発サーバー起動確認（http://localhost:3001/）

#### Task #7 進捗詳細（✅ 完了）

**成果物**:
- ✅ CharacterController.ts実装
  - グリッドベース移動システム（4方向）
  - スムーズな補間移動（moveSpeed: 4マス/秒）
  - 移動アニメーション管理（3フレーム、0.15秒間隔）
  - 目標位置計算と移動進捗管理
  - ピクセル座標取得（補間付き）
- ✅ CharacterRenderer.ts実装
  - キャラクタースプライト描画（仮実装：色付き四角形）
  - 向き表示（上下左右インジケーター）
  - アニメーションフレーム表示（デバッグ用）
  - カメラ座標対応
  - 画面外カリング
- ✅ Field.tsx統合
  - ゲームループ実装（requestAnimationFrame）
  - キャラクター更新処理（deltaTime計算）
  - キーボード入力ハンドリング（矢印キー → 移動）
  - キャラクター描画（マップ上にレイヤー表示）
- ✅ ビルド検証
  - TypeScriptコンパイル成功
  - 本番ビルド成功（156.04 kB gzip: 50.43 kB）
  - 開発サーバー起動確認

#### Task #8 進捗詳細（✅ 完了）

**成果物**:
- ✅ CollisionSystem.ts実装
  - タイル座標での衝突判定（canMoveTo）
  - マップ境界チェック（isWithinMapBounds）
  - ピクセル座標での衝突判定（canMoveToPixel）
  - MapRendererとの連携（collision レイヤー参照）
  - マップサイズ取得（タイル単位）
- ✅ CharacterController.ts更新
  - 衝突判定コールバック追加（canMoveTo オプション）
  - 移動開始時に衝突判定チェック
  - 壁・境界に当たると移動キャンセル
- ✅ Field.tsx統合
  - CollisionSystem インスタンス作成
  - マップ読み込み後に MapRenderer を CollisionSystem に設定
  - CharacterController 初期化時に衝突判定コールバックを渡す
  - null チェック追加（ゲームループ、キーボード入力）
- ✅ ビルド検証
  - TypeScriptコンパイル成功
  - 本番ビルド成功（157.15 kB gzip: 50.68 kB）
  - 開発サーバー起動確認

#### Task #9 進捗詳細（✅ 完了）

**成果物**:
- ✅ TransitionSystem.ts実装
  - フェードアウト/フェードイン効果
  - アルファ値管理（0.0-1.0）
  - フェード速度設定（デフォルト: 2.0/秒）
  - 完了コールバック機能
  - トランジション状態管理
- ✅ MapManager.ts実装
  - マップ切り替え機能
  - トランジションチェック（座標ベース）
  - トランジショントリガー
  - 現在マップID管理
- ✅ テストマップ追加
  - test_map_2.json作成（外観エリア）
  - test_map.json にトランジション追加（y=13に配置）
  - test_map_2.json にトランジション追加（y=7に配置）
  - 双方向トランジション実装
- ✅ Field.tsx統合
  - TransitionSystem、MapManager インスタンス作成
  - トランジションコールバック設定
  - 移動終了時のトランジションチェック
  - トランジション中の入力無効化
  - フェード描画追加
- ✅ ビルド検証
  - TypeScriptコンパイル成功
  - 本番ビルド成功（159.33 kB gzip: 51.30 kB）
  - 開発サーバー起動確認

#### Task #10 進捗詳細（✅ 完了）

**成果物**:
- ✅ NPCRenderer.ts実装
  - NPC描画システム（仮実装：色付き四角形、赤色）
  - 向き表示（白いインジケーター）
  - NPC名表示（デバッグ用）
  - 複数NPC一括描画機能
  - カメラ座標対応、画面外カリング
- ✅ MessageBox.tsx実装
  - 会話ウィンドウコンポーネント
  - 話者名表示
  - 複数ページメッセージ対応
  - ページインジケーター表示
  - キーボード操作（Enter/Space/Z: 次へ・閉じる、Escape/X: 閉じる）
  - アニメーション付きインジケーター
- ✅ テストマップにNPC追加
  - test_map.json: 2体のNPC追加（村人、商人）
  - test_map_2.json: 1体のNPC追加（警備兵）
  - 会話データ設定（単一メッセージ・複数ページ両対応）
- ✅ Field.tsx統合
  - NPCRenderer インスタンス作成
  - NPC描画（マップとキャラクターの間のレイヤー）
  - 決定キー（confirm）でNPC会話開始
  - プレイヤーの向いている方向のNPCを検出
  - MessageBox表示制御
  - 会話中の移動入力無効化
- ✅ ビルド検証
  - TypeScriptコンパイル成功
  - 本番ビルド成功（162.42 kB gzip: 52.11 kB）
  - 開発サーバー起動確認

### 6.5 Phase 2 完了サマリー

**実装期間**: 2026-01-29 ～ 2026-01-30

**完了タスク**: 5タスク（#6 ～ #10）

**主な成果物**:
1. マップレンダリング（MapRenderer.ts、test_map.json）
2. キャラクター移動（CharacterController.ts、CharacterRenderer.ts）
3. 衝突判定（CollisionSystem.ts）
4. マップ切替（TransitionSystem.ts、MapManager.ts、test_map_2.json）
5. NPC会話（NPCRenderer.ts、MessageBox.tsx）

**動作確認項目**:
- ✅ マップ表示（20x15タイル、32x32px）
- ✅ キャラクター移動（4方向、スムーズ補間）
- ✅ 壁衝突判定（壁をすり抜けない）
- ✅ マップ遷移（フェード効果付き）
- ✅ NPC会話（決定キーで会話開始）

**次のステップ**: Codexレビュー実施（Phase 2完了時）

### 6.6 Codexレビュー結果と対応

**実施日**: 2026-01-30
**検出問題**: High 3件、Medium 3件、Low 2件

#### High優先度問題の修正

**問題1: タイルサイズの不整合問題**
- ✅ 修正完了
- 対応内容:
  - CollisionSystem: mapDataから動的にtileSizeを取得するように変更
  - Field.tsx: mapData読み込み後にtileSizeを取得し、各レンダラーを初期化
  - CharacterRenderer/NPCRenderer: 初期化をマップロード後に遅延
- 影響: マップデータのtileSizeが32以外でも正しく動作

**問題2: マップ切替時のエラーハンドリング不足**
- ✅ 修正完了
- 対応内容:
  - Field.tsx: startFadeOut内のchangeMapをtry-catchで囲む
  - エラー時はconsole.errorでログ出力、setErrorで状態更新
  - フェードイン実行により復帰可能に
- 影響: マップロード失敗時もアプリケーションがフリーズしない

**問題3: マップロードの競合・メモリリーク**
- ✅ 修正完了
- 対応内容:
  - Field.tsx: AbortControllerを導入、useEffectでクリーンアップ実装
  - MapRenderer.ts: loadMapにAbortSignalパラメータ追加
  - MapManager.ts: changeMapにAbortSignalパラメータ追加（オプショナル）
  - AbortErrorは無視、正常な中断として処理
- 影響: mapId変更やアンマウント時に古いfetchが状態を破壊しない

**ビルド検証**:
- ✅ TypeScriptコンパイル成功
- ✅ 本番ビルド成功（162.90 kB gzip: 52.28 kB）
- ✅ 開発サーバー起動確認

#### 未対応の問題（Medium/Low）

**Medium優先度** (Phase 3以降で対応):
- マップ描画のパフォーマンス問題（視野範囲カリング強化）
- 遷移判定のロジック拡張（direction/transitionType対応）
- test_map_2.jsonのtileset/bgmフィールド追加

**Low優先度** (必要に応じて対応):
- NPCRendererの型安全性向上（Direction型使用）
- MapManagerの内部状態同期

### 6.7 Phase 3 プランニング（2026-01-31）

**実施日**: 2026-01-31

**プランニング成果物**:
- ✅ Phase 3実装計画書作成
  - プランファイル: `/Users/yoheinakanishi/.claude/plans/expressive-twirling-lovelace.md`
  - タスク分解: Task #11-#16（6タスク）
  - 依存関係図作成
  - 実装推奨順序の決定

**タスク一覧**:
1. Task #11: エンカウントシステム（優先度: 最高）
   - EncounterSystem.ts実装
   - App.tsx mode拡張（'field' | 'canvas' | 'battle'）
   - test_map.json encounters追加
2. Task #12: ダメージ計算エンジン（優先度: 高）
   - DamageCalculator.ts実装
   - ダメージ計算式: (攻撃力 × スキル倍率) - (防御力 / 2)
3. Task #13: ターン管理システム（優先度: 高）
   - TurnManager.ts実装
   - BattleManager.ts実装（battleStore統合）
4. Task #14: バトルUI（コマンド選択）（優先度: 中）
   - CommandWindow.tsx実装
   - TargetSelector.tsx実装
5. Task #15: バトル画面とアニメーション（優先度: 中）
   - Battle.tsx実装
   - BattleRenderer.ts実装
   - BattleAnimator.ts実装（仮実装）
6. Task #16: 敵データと統合テスト（優先度: 中）
   - enemies.json作成
   - 統合テスト実施

**システムクラス設計**:
- EncounterSystem: エンカウント判定
- DamageCalculator: ダメージ計算
- TurnManager: ターン順序決定
- BattleManager: バトル統合制御（battleStoreラッパー）
- BattleRenderer: バトル画面描画

**画面遷移フロー**:
- Field → Battle: プレイヤー移動完了 → エンカウント判定 → App.tsx mode切替
- Battle → Field: バトル終了 → 経験値・ゴールド獲得 → App.tsx mode切替

**次のステップ**: Task #11（エンカウントシステム）実装開始

### 6.8 Phase 3 実装完了（2026-01-31）

**実装期間**: 2026-01-31
**完了タスク**: 6タスク（Task #11-#16）
**最終バンドルサイズ**: 179.77 kB (gzip: 57.23 kB)

#### 完了タスク一覧

**Task #11: エンカウントシステム**
- EncounterSystem.ts、Field.tsx統合、App.tsx更新、test_map.json更新

**Task #12: ダメージ計算エンジン**
- DamageCalculator.ts実装（calculateDamage, calculateHeal）

**Task #13: ターン管理システム**
- TurnManager.ts、BattleManager.ts実装

**Task #14: バトルUI**
- CommandWindow.tsx、TargetSelector.tsx実装

**Task #15: バトル画面とアニメーション**
- BattleRenderer.ts、BattleAnimator.ts、Battle.tsx実装、App.tsx統合

**Task #16: 敵データと統合テスト**
- enemies.json作成（3種類の敵）、Battle.tsx敵データロード実装

**統合テスト項目**:
- ✅ フィールド→エンカウント→バトル→勝利→フィールド
- ✅ コマンド選択（攻撃/技/防御/アイテム）
- ✅ ターゲット選択、ダメージ計算、HP減少
- ✅ 経験値・ゴールド獲得表示

**Codexレビュー結果** (2026-01-31):
- 検出問題: High 2件、Medium 4件、Low 4件
- High優先度2件すべて修正完了:
  1. ✅ 防御状態リセット機能（BattleManager.ts: resetDefendingStates()追加）
  2. ✅ ターン進行システム（BattleManager.ts: getCurrentActor(), advanceTurn(), executeEnemyAction()追加、Battle.tsx: 敵のターン自動実行）
- 最終バンドルサイズ: 181.56 kB (gzip: 57.58 kB)

**次のステップ**: Phase 4（成長・装備システム）実装

### 6.9 Phase 4 完了サマリー（✅ 完了、2026-01-31）

**実装期間**: 2026-01-31
**完了タスク**: 7/7タスク（Task #17-#23）
**進捗率**: 100%
**最終バンドルサイズ**: 166.08 kB (gzip: 53.53 kB) ✅ 目標達成

**主な機能**:
1. バトル報酬システム（経験値、ゴールド、アイテム）
2. レベルアップシステム（経験値テーブル、ステータス成長、自動習得スキル）
3. スキルツリーシステム（スキル習得、スキルポイント管理）
4. 装備システム（装備変更、装備込みステータス計算）
5. メニュー画面（ステータス、スキル、装備、アイテムタブ）
6. ショップシステム（購入/売却）
7. 最適化（コード分割、依存関係削減）

**最適化成果**:
- 最適化前: 214.75 kB (gzip: 64.71 kB)
- 最適化後: 166.08 kB (gzip: 53.53 kB)
- 削減量: -48.67 kB (gzip: -11.18 kB)
- 目標達成: 200 kB以内 ✅

#### 完了タスク一覧

**Task #17: バトル報酬システム ✅**
- **実装日**: 2026-01-31
- **成果物**:
  - partyStore拡張: gold, items フィールド追加、addExp/addGold/addItem/removeItem アクション追加
  - RewardManager.ts: 報酬分配ロジック、経験値均等分配、レベルアップチェック
  - BattleResultWindow.tsx: 勝利画面UI、獲得経験値・ゴールド表示、各メンバーの経験値獲得表示
  - Battle.tsx統合: 勝利時の報酬分配、BattleResultWindow表示制御
- **バンドルサイズ**: 184.61 kB (gzip: 58.37 kB)

**Task #18: レベルアップシステム ✅**
- **実装日**: 2026-01-31
- **成果物**:
  - LevelUpManager.ts: 経験値テーブル(Lv1-50、指数関数的増加)、ステータス成長計算、複数レベルアップ対応、クラス別成長率（swordsman, strategist, mage, healer, ronin）
  - LevelUpWindow.tsx: レベルアップ演出UI、ステータス増加量表示（+5 HP、+3 攻撃力など）
  - characters.json: 坂本龍馬・武市半平太のマスタデータ、growthRate定義
  - Character型拡張: growthRate?: GrowthRate フィールド追加
  - RewardManager統合: checkLevelUp()をLevelUpManagerに委譲、RewardDistributionにlevelUpResult追加
  - Battle.tsx統合: レベルアップウィンドウ表示制御、複数メンバー順次表示、レベルアップ演出完了後にバトル終了
- **バンドルサイズ**: 189.78 kB (gzip: 59.52 kB)

**Task #19: スキルツリーシステム ✅**
- **実装日**: 2026-01-31
- **成果物**:
  - skills.json: 12種類のスキル定義（基本攻撃、一の太刀、龍の剣、居合斬り、龍馬奥義など幕末・北辰一刀流テーマ）
  - skill_trees.json: swordsman、strategistクラスのスキルツリー構造（レベル要件、ポイント要件、前提スキル）
  - SkillTreeManager.ts: スキル習得可能判定、習得実行、自動習得チェック、スキル情報取得API
  - SkillTreeWindow.tsx: スキルツリーUI、習得状態表示（習得済み/習得可能/未習得）、スキル詳細表示、キーボード操作
  - LevelUpManager統合: スキルポイント付与（1レベル1ポイント）、自動習得スキル（requiredPoints=0）
  - LevelUpWindow更新: 習得スキルの名前と説明を表示
  - Character型拡張: skillPoints?: number フィールド追加
  - Battle.tsx統合: SkillTreeManager初期化
- **バンドルサイズ**: 192.70 kB (gzip: 60.41 kB)

#### 未完了タスク

**Task #20: 装備システム ✅**
- **実装日**: 2026-01-31
- **成果物**:
  - items.json: 15種類のアイテム定義（武器6種、防具5種、消費アイテム4種、幕末テーマ）
  - EquipmentManager.ts: 装備可能判定（レベル、キャラクター制限）、装備変更実行、装備込みステータス計算、装備/外す機能、アイテム情報取得API
  - EquipmentWindow.tsx: 装備UI、スロット選択モード、アイテム選択モード、現在装備表示、装備可能アイテムリスト、ステータス比較表示、キーボード操作
  - Battle.tsx統合: EquipmentManager初期化
- **バンドルサイズ**: 195.11 kB (gzip: 61.11 kB)

#### 未完了タスク

**Task #21: メニュー画面 ✅**
- **実装日**: 2026-01-31
- **成果物**:
  - MenuScreen.tsx: 3モード設計（タブ選択、メンバー選択、詳細表示）、4タブ（ステータス、スキル、装備、アイテム）、キーボード操作、既存UI統合（SkillTreeWindow、EquipmentWindow）
  - StatusWindow.tsx: キャラクターステータス詳細表示、経験値バー、HPバー、装備表示、習得スキル数表示
  - App.tsx統合: Escapeキーでメニュー表示/非表示、フィールドモード時のみ有効
- **バンドルサイズ**: 214.75 kB (gzip: 64.71 kB) ⚠️ 目標超過

#### 未完了タスク

**Task #22: ショップシステム ✅**
- **実装日**: 2026-01-31
- **成果物**:
  - ShopManager.ts: 購入/売却処理、購入可能判定、売却価格計算（購入価格の50%）、商品リスト取得
  - ShopScreen.tsx: ショップUI、購入/売却モード切り替え、商品リスト表示、所持ゴールド表示、ゴールド不足判定、キーボード操作
- **バンドルサイズ**: 214.75 kB (gzip: 64.71 kB)

#### 未完了タスク

**Task #23: マスタデータと統合テスト ✅**
- **実装日**: 2026-01-31
- **成果物**:
  - マスタデータ完成確認: characters.json、enemies.json、items.json、skills.json、skill_trees.json
  - 依存関係最適化: react-router-dom、howler削除
  - コード分割実装: Battle、MenuScreen、EquipmentManagerをlazy loading
  - バンドルサイズ最適化: 214.75 kB → 166.08 kB (gzip: 64.71 kB → 53.53 kB)
- **最終バンドルサイズ**: 166.08 kB (gzip: 53.53 kB) ✅ 目標達成

**Phase 4 完了サマリー**:
- 実装期間: 2026-01-31
- 完了タスク: 7/7タスク
- 最終バンドルサイズ: 166.08 kB (gzip: 53.53 kB) - 目標200 kB以内達成 ✅
- 主な機能: バトル報酬、レベルアップ、スキルツリー、装備、メニュー、ショップ

**次のステップ**: Phase 5（イベント・ストーリー）実装

### 6.10 変更履歴

| 日付 | バージョン | 変更内容 |
|------|------------|----------|
| 2026-01-29 | 1.0.0 | 初版作成 |
| 2026-01-29 | 1.0.1 | セッション再開手順追加、タスク詳細と依存関係を明記 |
| 2026-01-29 | 1.1.0 | **Codexレビュー対応**: マップレイヤー設計統一、NPC/MapTransition型定義追加、セーブデータ詳細設計追加 |
| 2026-01-29 | 1.2.0 | **Phase 1完了**: 全タスク完了、Codexレビュー実施済み、High/Medium優先度問題修正完了 |
| 2026-01-29 | 1.3.0 | **Phase 2開始**: Task #6（マップレンダリング）実装中、MapRenderer.ts完成、進捗60% |
| 2026-01-30 | 1.4.0 | **Task #6完了**: Field.tsx作成、App.tsx統合、ビルド検証完了、Phase 2進捗20% |
| 2026-01-30 | 1.5.0 | **Task #7完了**: CharacterController.ts、CharacterRenderer.ts作成、移動システム実装完了、Phase 2進捗40% |
| 2026-01-30 | 1.6.0 | **Task #8完了**: CollisionSystem.ts作成、タイル衝突・境界判定実装完了、Phase 2進捗60% |
| 2026-01-30 | 1.7.0 | **Task #9完了**: TransitionSystem.ts、MapManager.ts作成、test_map_2追加、フェード遷移実装完了、Phase 2進捗80% |
| 2026-01-30 | 1.8.0 | **Phase 2完了**: NPCRenderer.ts、MessageBox.tsx作成、NPC会話システム実装完了、Phase 2進捗100%、Codexレビュー待ち |
| 2026-01-30 | 1.8.1 | **Codexレビュー対応**: High優先度3件修正（タイルサイズ単一ソース化、エラーハンドリング追加、AbortController導入） |
| 2026-01-31 | 1.9.0 | **Phase 3プランニング完了**: 実装計画書作成、6タスク分解（Task #11-#16）、システムクラス設計、画面遷移フロー設計 |
| 2026-01-31 | 1.10.0 | **Phase 3完了**: 全6タスク実装完了（エンカウント、ダメージ計算、ターン管理、バトルUI、バトル画面、敵データ）、最終バンドル179.77 kB |
| 2026-01-31 | 1.10.1 | **Codexレビュー対応**: High優先度2件修正（防御状態リセット、ターン進行システム）、最終バンドル181.56 kB |
| 2026-01-31 | 1.11.0 | **Phase 4実装中**: Task #17-#18完了（バトル報酬システム、レベルアップシステム）、進捗率28%、最終バンドル189.78 kB |
| 2026-01-31 | 1.12.0 | **Phase 4実装中**: Task #19完了（スキルツリーシステム）、進捗率42%、最終バンドル192.70 kB |
| 2026-01-31 | 1.13.0 | **Phase 4実装中**: Task #20完了（装備システム）、進捗率57%、最終バンドル195.11 kB |
| 2026-01-31 | 1.14.0 | **Phase 4実装中**: Task #21完了（メニュー画面）、進捗率71%、最終バンドル214.75 kB（目標超過） |
| 2026-01-31 | 1.15.0 | **Phase 4実装中**: Task #22完了（ショップシステム）、進捗率85%、最終バンドル214.75 kB |
| 2026-01-31 | 1.16.0 | **Phase 4完了**: Task #23完了（統合テスト・最適化）、進捗率100%、最終バンドル166.08 kB（目標達成） |

---

## 付録

### A. 参考資料
- [Vite公式ドキュメント](https://vitejs.dev/)
- [React公式ドキュメント](https://react.dev/)
- [Zustand公式ドキュメント](https://zustand-demo.pmnd.rs/)
- [Tailwind CSS公式ドキュメント](https://tailwindcss.com/)

### B. キーマッピング
| キー | 機能 |
|------|------|
| ↑↓←→ | 移動 |
| Enter / Space / Z | 決定 |
| Escape / X | キャンセル / メニュー |

### C. 画面解像度
- 基本解像度: 640x480px
- タイルサイズ: 32x32px
- 表示タイル数: 20x15

---

## 7. Phase 7-12: 完全版開発計画

> **注意**: この章は完全版の開発計画です。デモ版（Phase 1-6）は完了しています。

### 7.1 Phase 7: 完全版基盤強化

**目的**: デモ版で残された課題を解決し、システムを拡張

**期間**: 2週間
**優先度**: High

#### Task #38: マップ/位置データの中央管理
- `progressStore` に `currentMap: string`, `playerPosition: { x: number; y: number }` を追加
- `Field` コンポーネントから状態を`progressStore`に移行
- `SaveManager` のserialize/deserializeでマップ/位置を正確に保存/復元
- App.tsx で `Field` に `progressStore`の位置データを渡す

#### Task #39: オートセーブ実装
- トリガー実装:
  - マップ遷移時（`MapManager.changeMap` 完了後）
  - バトル勝利時（`Battle` コンポーネントの勝利処理後）
  - 章完了時（`EventExecutor` の `setFlag` で `_completed` フラグ設定時）
- QuotaExceededError 対策: 古いオートセーブの自動削除
- UI: オートセーブインジケーター（右上に「Saving...」表示）

#### Task #40: バンドル最適化
- `Field` コンポーネントをlazy loadに変更（`App.tsx`）
- Howler.jsを動的インポート（`AudioManager`内で`import()`使用）
- コード分割の最適化（`vite.config.ts`で`manualChunks`設定）
- **目標**: 初期ロード < 150 kB (gzip < 50 kB)

#### Task #41: 音声アセット追加
- BGM追加:
  - `title.mp3`: タイトル画面（ループ）
  - `field.mp3`: フィールド探索（ループ）
  - `battle.mp3`: バトル中（ループ）
  - `victory.mp3`: 勝利ファンファーレ
  - `defeat.mp3`: 敗北BGM
- SE追加:
  - `decide.mp3`: 決定音
  - `cancel.mp3`: キャンセル音
  - `cursor.mp3`: カーソル移動音
  - `attack.mp3`: 攻撃SE
  - `damage.mp3`: ダメージSE
  - `heal.mp3`: 回復SE
  - `levelup.mp3`: レベルアップSE
- ライセンスフリー素材の選定（魔王魂、効果音ラボなど）

#### Task #42: エラーハンドリング強化
- 音声ロード失敗時のフォールバック（無音でプレイ継続）
- セーブデータ破損時の復旧UI（「データが破損しています。削除しますか？」）
- ネットワークエラー時の再試行ロジック（characters.json、マップデータ読み込み）

---

### 7.2 Phase 8: ストーリー拡張（完全版シナリオ）

**目的**: 龍馬の全生涯を描く完全版ストーリー実装

**期間**: 4週間
**優先度**: Medium

#### 追加章の詳細

**第4章: 神戸海軍操練所**（6-8 KB）
- 江戸脱藩後、勝海舟との出会い
- 海軍操練所での修行
- 黒船ペリー来航の回想
- 新キャラクター: 勝海舟（師匠クラス）

**第5章: 薩長同盟**（7-9 KB）
- 京都での政治工作
- 西郷隆盛との交渉
- 木戸孝允との密談
- 薩長同盟締結イベント
- 新キャラクター: 西郷隆盛（武士クラス）、木戸孝允（政治家クラス）

**第6章: 大政奉還工作**（6-8 KB）
- 土佐藩との連携
- 徳川慶喜への建白
- 幕府側との駆け引き

**第7章: 新政府構想**（7-9 KB）
- 船中八策の起草
- 新時代の設計
- 中岡慎太郎との協力
- 新キャラクター: 中岡慎太郎（志士クラス）

**最終章: 近江屋事件**（8-10 KB）
- 暗殺前夜
- 近江屋での襲撃
- 龍馬の遺志
- エンディング分岐（複数）

#### 追加キャラクタースペック

**勝海舟**:
- クラス: 師匠
- 初期レベル: 20
- スキルツリー: 海軍術（砲撃、航海術、戦略）
- 装備: 洋式剣、洋服

**西郷隆盛**:
- クラス: 武士
- 初期レベル: 18
- スキルツリー: 薩摩示現流（一撃必殺、豪剣）
- 装備: 大太刀、侍装束

**木戸孝允**:
- クラス: 政治家
- 初期レベル: 16
- スキルツリー: 交渉術（説得、バフ、デバフ）
- 装備: 脇差、袴

**中岡慎太郎**:
- クラス: 志士
- 初期レベル: 17
- スキルツリー: 連携攻撃（コンビネーション）
- 装備: 打刀、羽織

**お龍**:
- クラス: サポート
- 初期レベル: 15
- スキルツリー: 回復術（治療、補助、状態異常回復）
- 装備: 短剣、着物

#### 追加敵キャラクター

- **新選組隊士**: 京都編の主要敵（20種類）
- **幕府役人**: 政治編の敵（15種類）
- **暗殺者**: 近江屋編のボス級（5種類）

**イベント総数**: 約150イベント（デモ版31 KB → 完全版150 KB）

---

### 7.3 Phase 9: ゲームシステム拡張

**目的**: やり込み要素とゲーム性の向上

**期間**: 3週間
**優先度**: Medium

#### Task #43: サイドクエスト実装
- 各地の依頼イベント（計20件）
- 報酬: 特殊アイテム、レアスキル、経験値ボーナス
- クエストリスト UI実装
- 進行状況トラッキング

#### Task #44: 隠しダンジョン
- エンドコンテンツ: 「幕末の亡霊たち」
- 歴史上の強敵と戦闘（織田信長、武田信玄、上杉謙信など）
- 難易度: ハードモード以上
- 報酬: 最強装備、幻のスキル

#### Task #45: やり込み要素
- **アチーブメント/実績システム**（30種類）
  - 「初めての戦闘」「レベル50達成」「全スキル習得」など
  - 進捗管理、UI表示
- **図鑑システム**
  - 敵図鑑（全種類の敵の情報）
  - アイテム図鑑（全アイテムの説明）
  - スキル図鑑（全スキルの効果）
  - キャラクター図鑑（全キャラの設定）
- **タイムアタックモード**
  - 最速クリア時間記録
  - ランキング表示
- **ニューゲーム+**
  - クリア後、ステータス引継ぎで最初から
  - 難易度調整

#### Task #46: 難易度選択
- タイトル画面で難易度選択UI追加
- 難易度別パラメータ:
  - **イージー**: 敵HP/攻撃力 0.7倍、経験値 1.5倍
  - **ノーマル**: デフォルト
  - **ハード**: 敵HP/攻撃力 1.5倍、経験値 1.2倍、セーブ回数制限
  - **ベリーハード**: 敵HP/攻撃力 2.0倍、経験値 1.0倍、セーブポイント限定

#### Task #47: ショップNPC統合
- イベントコマンド `openShop` 追加（`EventExecutor`）
- ショップNPCとの会話からショップ画面を開く
- 地域ごとの商品ラインナップ（マップIDで判定）
- レア商品の条件出現（フラグ管理）

---

### 7.4 Phase 10: UI/UX改善

**目的**: プレイヤー体験の向上

**期間**: 3週間
**優先度**: Low-Medium

#### Task #48: ビジュアル強化
- **キャラクタースプライト実装**
  - 龍馬、半平太、勝海舟、西郷隆盛、木戸孝允、中岡慎太郎、お龍
  - 4方向（上下左右）× 3フレームアニメーション
  - サイズ: 32x32px
- **マップタイルセット作成**
  - 和風テーマ（畳、障子、城壁、石畳）
  - 自然（草地、海、山道、森）
  - サイズ: 32x32px
- **バトル背景追加**
  - 城下町、山道、海岸、屋内
  - サイズ: 640x480px
- **UI素材の統一デザイン**
  - 和風フレーム、ボタン、アイコン

#### Task #49: アニメーション追加
- **フィールド**:
  - 水面波紋エフェクト（Canvas描画）
  - 火の揺らぎアニメーション
  - NPCアイドルアニメーション
- **バトル**:
  - スキルエフェクト（攻撃、回復、バフ・デバフ）
  - カットインアニメーション（必殺技時）
- **メニュー**:
  - ページ遷移アニメーション（スライド、フェード）

#### Task #50: 操作性改善
- **ゲームパッド対応**
  - Gamepad API使用
  - ボタンマッピング（A: 決定、B: キャンセル、十字キー: 移動）
- **キーボード設定のカスタマイズ**
  - キーコンフィグUI実装
  - localStorage保存
- **マウス/タッチ操作対応**
  - クリック/タップでキャラクター移動
  - UI要素のマウスホバー対応

#### Task #51: 設定画面実装
- 設定画面UI作成（`SettingsScreen.tsx`）
- 設定項目:
  - **音量調整**: BGM/SE個別スライダー
  - **メッセージ速度**: 1（遅い）〜 3（速い）
  - **ウィンドウスキン変更**: 3種類のデザイン
  - **言語設定**: 日本語/English（多言語対応の基盤）
- `gameStore` 拡張（設定の永続化）

---

### 7.5 Phase 11: モバイル対応

**目的**: スマートフォン・タブレットでのプレイ対応

**期間**: 2週間
**優先度**: Low

#### Task #52: レスポンシブデザイン
- **Canvas自動スケーリング**
  - 画面サイズに応じて640x480pxを拡大/縮小
  - アスペクト比維持（letterbox対応）
- **タッチUI実装**
  - 仮想十字キー（画面左下）
  - 仮想ボタン（画面右下: A, B）
  - 透明度調整可能
- **縦持ち/横持ち対応**
  - 横持ち推奨（640x480pxに最適）
  - 縦持ち時はレターボックス表示

#### Task #53: パフォーマンス最適化
- モバイルブラウザでの60FPS維持
  - requestAnimationFrameの最適化
  - Canvas描画の軽量化（不要な再描画削減）
- バッテリー消費の最適化
  - 非アクティブ時のFPS低減（30FPS）
- メモリ使用量の削減
  - 画像アセットの最適化（WebP使用）
  - 音声ファイルの圧縮

#### Task #54: PWA対応
- **Service Worker実装**
  - オフラインプレイ対応（ゲームファイルのキャッシュ）
  - アセット更新戦略（Cache-First）
- **マニフェストファイル作成**
  - `manifest.json`: アプリ名、アイコン、テーマカラー
  - インストール可能なWebアプリ化
- **アイコン作成**
  - 192x192px, 512x512px（PWA用）

---

### 7.6 Phase 12: テスト・品質保証

**目的**: バグ修正と品質向上

**期間**: 2週間
**優先度**: High

#### Task #55: ユニットテスト実装
- テスト対象:
  - `SaveManager`: save/load/validate
  - `AudioManager`: playBGM/playSE/volume
  - `BattleManager`: ターン管理、ダメージ計算
  - `LevelUpManager`: 経験値計算、成長率
  - `EquipmentManager`: 装備変更、ステータス計算
  - `SkillTreeManager`: スキル習得、前提条件
- フレームワーク: Vitest
- **カバレッジ目標**: 80%以上

#### Task #56: E2Eテスト実装
- テストシナリオ:
  1. タイトル → New Game → フィールド探索 → NPC会話
  2. フィールド → エンカウント → バトル → 勝利 → 報酬
  3. メニュー → ステータス確認 → スキル習得 → 装備変更
  4. ショップ → アイテム購入 → セーブ
  5. タイトル → Load Game → セーブデータ復元
  6. 全章のプレイスルーテスト（自動化）
- フレームワーク: Playwright
- スクリーンショット/ビデオ録画

#### Task #57: ブラウザ互換性テスト
- 対象ブラウザ:
  - **デスクトップ**: Chrome, Firefox, Safari, Edge（最新版）
  - **モバイル**: iOS Safari, Android Chrome
- テスト項目:
  - Canvas描画の正常性
  - 音声再生（autoplay制限対応）
  - localStorage動作
  - キーボード/タッチ入力
  - パフォーマンス（60FPS維持）

#### Task #58: パフォーマンステスト
- **Lighthouse監査**
  - スコア目標: 90点以上（Performance, Accessibility, Best Practices, SEO）
- **メモリリークチェック**
  - Chrome DevTools Performance Profiler
  - 長時間プレイ（1時間）でのメモリ増加確認
- **長時間プレイ安定性テスト**
  - 全章クリア（5-8時間）での動作確認
  - セーブ/ロード繰り返しテスト

---

### 7.7 完全版開発スケジュール

| Phase | タスク | 期間 | 優先度 | 累積期間 | 依存関係 |
|-------|--------|------|--------|----------|----------|
| **Phase 7** | Task #38-#42 | 2週間 | High | 2週間 | - |
| **Phase 8** | 章別実装 | 4週間 | Medium | 6週間 | Phase 7完了 |
| **Phase 9** | Task #43-#47 | 3週間 | Medium | 9週間 | Phase 8完了 |
| **Phase 10** | Task #48-#51 | 3週間 | Low-Medium | 12週間 | Phase 9完了 |
| **Phase 11** | Task #52-#54 | 2週間 | Low | 14週間 | Phase 10完了 |
| **Phase 12** | Task #55-#58 | 2週間 | High | 16週間 | Phase 11完了 |

**完全版リリース予定**: デモ版完了から約4ヶ月後

---

### 7.8 完全版の目標

#### 定量目標
- **プレイ時間**: 5〜8時間（メインストーリー）+ 10時間以上（やり込み）
- **バンドルサイズ**: 初期ロード < 150 kB (gzip < 50 kB)
- **パフォーマンス**: Lighthouse スコア 90点以上
- **品質**: テストカバレッジ 80%以上
- **イベント数**: 約150イベント（デモ版の5倍）
- **キャラクター数**: 7人（デモ版2人 → 完全版7人）
- **敵種類**: 50種類以上（デモ版3種類 → 完全版50種類）

#### 対応環境
- **デスクトップ**: Windows, Mac, Linux
- **ブラウザ**: Chrome, Firefox, Safari, Edge（最新版）
- **モバイル**: iOS Safari, Android Chrome
- **PWA**: インストール可能なWebアプリ

#### 品質基準
- **Lighthouse**: Performance 90+, Accessibility 90+, Best Practices 90+, SEO 90+
- **テストカバレッジ**: ユニットテスト 80%以上、E2Eテスト全シナリオカバー
- **ブラウザ互換性**: Chrome, Firefox, Safari, Edge全対応
- **モバイル対応**: レスポンシブデザイン、タッチUI、60FPS維持

---

### 7.9 変更履歴（完全版）

| 日付 | バージョン | 変更内容 |
|------|------------|----------|
| 2026-02-04 | 2.0.0 | **完全版開発計画追加**: Phase 7-12の詳細計画、スケジュール、目標設定 |

