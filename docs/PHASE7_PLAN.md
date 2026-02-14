# Phase 7: デモ版マップ＆シナリオ統合

## ドキュメント情報

| 項目 | 値 |
|------|-----|
| 作成日 | 2026-02-10 |
| フェーズ | Phase 7 |
| ステータス | 計画中 |
| 開始予定 | 2026-02-11以降 |

---

## 目的

Phase 1-6で実装した全システムを統合し、デモ版として遊べる完全な「土佐編」を完成させる。

---

## スコープ

### デモ版コンテンツ

- **ストーリー範囲**: 幼少期〜脱藩（序章＋3章＋エピローグ）
- **プレイ時間**: 30分〜1時間
- **マップ数**: 4（才谷屋、高知城下町、道場、浦戸湊）
- **プレイアブルキャラ**: 坂本龍馬、武市半平太
- **敵勢力**: 上士・役人、藩の守旧派、山賊・浪人

---

## 実装タスク

### Task #38: 才谷屋マップ作成

**目的**: プロローグの舞台となる坂本家（才谷屋）のマップを作成

**成果物**:
- `public/data/maps/saigaitaya.json` - 才谷屋マップデータ
- 2階建て構造（1F: 店舗/居間、2F: 私室）
- NPC: 父（八平）、母（幸）、姉（乙女）
- トランジション: 才谷屋 ⇔ 高知城下町

**マップ仕様**:
- サイズ: 30x20タイル（室内＋庭）
- タイルセット: 和風建築（畳、障子、縁側）
- エンカウント: なし（安全地帯）
- BGM: `/assets/bgm/home.mp3`（穏やかな和風BGM）

**データ構造**:
```json
{
  "id": "saigaitaya",
  "name": "才谷屋（坂本家）",
  "width": 30,
  "height": 20,
  "tileSize": 32,
  "layers": { ... },
  "npcs": [
    {
      "id": "npc_hachihei",
      "name": "坂本八平",
      "position": { "x": 15, "y": 10 },
      "dialogue": "龍馬、今日も剣術の稽古か。\n郷士の身分だが、立派な侍になるんだぞ。"
    },
    {
      "id": "npc_sachi",
      "name": "坂本幸",
      "position": { "x": 12, "y": 10 },
      "dialogue": "龍馬、危ないことはしないでね。\n母はいつも心配しているのよ。"
    },
    {
      "id": "npc_otome",
      "name": "坂本乙女",
      "position": { "x": 18, "y": 8 },
      "dialogue": "龍馬！また泣いて帰ってきたの？\n姉さんが剣術を教えてあげるわ！",
      "action": { "type": "save" }
    }
  ],
  "transitions": [
    {
      "fromPosition": { "x": 15, "y": 19 },
      "toMapId": "kochi_town",
      "toPosition": { "x": 10, "y": 5 },
      "transitionType": "walk"
    }
  ],
  "events": []
}
```

**実装ステップ**:
1. マップレイアウト設計（紙/ツール）
2. JSON作成（background/collision/events層）
3. NPC配置（家族3人）
4. トランジション設定
5. 動作確認（移動、会話、セーブ）

---

### Task #39: 高知城下町マップ作成

**目的**: Chapter 1-2の舞台となる城下町を作成

**成果物**:
- `public/data/maps/kochi_town.json` - 高知城下町マップ
- エリア: 町（店舗街、武家屋敷）、城前広場
- NPC: 町人、商人、武士、子供
- トランジション: 才谷屋 ⇔ 城下町 ⇔ 道場 ⇔ 浦戸湊

**マップ仕様**:
- サイズ: 50x40タイル（広域マップ）
- タイルセット: 城下町（石畳、土壁、町家）
- エンカウント: 低確率（rate: 0.02）、敵: 野良犬、ならず者
- BGM: `/assets/bgm/town.mp3`（賑やかな町BGM）

**NPCリスト**:
1. 武器屋の主人（shopType: weapon）
2. 防具屋の主人（shopType: armor）
3. 道具屋の主人（shopType: item）
4. 宿屋の主人（innType、回復30両）
5. 情報屋（イベントヒント）
6. 町人A-C（雰囲気作り）

**トランジション**:
- 北: 高知城前（将来拡張用、現在は閉鎖）
- 南: 才谷屋
- 東: 山内容堂道場
- 西: 浦戸湊

**イベント**:
- 城下町入口で上士に絡まれる（Chapter 1連動）
- 道場前で武市半平太と出会う（Chapter 2連動）

---

### Task #40: 山内容堂道場マップ作成

**目的**: Chapter 1の剣術修行の舞台

**成果物**:
- `public/data/maps/yodo_dojo.json` - 道場マップ
- エリア: 稽古場、師範室
- NPC: 小栗流師範、門下生
- ボス戦: 師範代との試合

**マップ仕様**:
- サイズ: 25x20タイル（室内）
- タイルセット: 道場（板張り、木刀、的）
- エンカウント: なし
- BGM: `/assets/bgm/dojo.mp3`（緊張感のある和風BGM）

**イベント**:
- 入門試験（バトル: 師範代）
- 修行シーン（message + setFlag）
- スキル習得「一の太刀」

---

### Task #41: 浦戸湊マップ作成

**目的**: Chapter 3の脱藩イベントの舞台

**成果物**:
- `public/data/maps/urado_port.json` - 浦戸湊マップ
- エリア: 港、船着場、倉庫街
- NPC: 船頭、商人、海賊
- ボス戦: 守旧派の追っ手

**マップ仕様**:
- サイズ: 40x30タイル（港町）
- タイルセット: 港（桟橋、船、海）
- エンカウント: 中確率（rate: 0.05）、敵: 浪人、海賊
- BGM: `/assets/bgm/port.mp3`（波音＋冒険BGM）

**イベント**:
- 船頭との交渉（選択肢）
- 守旧派との最終決戦（Battle）
- 脱藩シーン（フェード→エピローグ）

---

### Task #42: シナリオ自動起動システム

**目的**: タイトル→プロローグ→Chapter1→...の自動遷移

**成果物**:
- `src/systems/scenario/ScenarioManager.ts` - シナリオ進行管理
- `src/stores/progressStore.ts` 拡張 - 現在のチャプター管理

**機能**:
1. タイトル「New Game」→ プロローグイベント自動起動
2. プロローグ完了 → 才谷屋マップに移動
3. 各マップのトリガー座標で自動イベント起動
4. フラグ管理（prologue_cleared、chapter1_cleared、etc.）

**実装**:
```typescript
// ScenarioManager.ts
export class ScenarioManager {
  private eventManager: EventManager
  private eventExecutor: EventExecutor

  // 現在のチャプターを取得
  getCurrentChapter(): string {
    const progress = useProgressStore.getState()
    if (!progress.flags['prologue_cleared']) return 'prologue'
    if (!progress.flags['chapter1_cleared']) return 'chapter1'
    if (!progress.flags['chapter2_cleared']) return 'chapter2'
    if (!progress.flags['chapter3_cleared']) return 'chapter3'
    return 'epilogue'
  }

  // チャプター開始
  async startChapter(chapterId: string): Promise<void> {
    const eventId = `${chapterId}_intro`
    await this.eventExecutor.execute(eventId)
  }

  // New Game処理
  async startNewGame(): Promise<void> {
    // プログレスリセット
    useProgressStore.getState().resetProgress()

    // プロローグイベント実行
    await this.startChapter('prologue')

    // 才谷屋マップに移動
    useGameStore.getState().setScene('field')
    // mapId を才谷屋に設定（App.tsx側で対応）
  }
}
```

**progressStore 拡張**:
```typescript
interface ProgressState {
  currentMapId: string // 追加
  currentPosition: Position // 追加
  flags: Record<string, boolean>
  // ...

  setCurrentMap: (mapId: string, position: Position) => void // 追加
}
```

---

### Task #43: マップ間イベント連動

**目的**: 既存シナリオとマップを連動させる

**作業内容**:

1. **プロローグ連動**
   - `prologue.json` の最後に `changeMap` 追加
   - 移動先: `saigaitaya`、座標: 才谷屋2F私室

2. **Chapter 1連動**
   - 城下町の特定座標（x:25, y:20）で `chapter1_intro` 自動起動
   - イベント完了後、道場へのトランジション有効化

3. **Chapter 2連動**
   - 道場入口（x:12, y:3）で `chapter2_intro` 自動起動
   - 武市半平太が仲間に加わる

4. **Chapter 3連動**
   - 城下町で守旧派イベント（x:30, y:25）
   - 浦戸湊への逃亡
   - 最終決戦→エピローグ

**マップイベント追加例**:
```json
// kochi_town.json
{
  "events": [
    {
      "id": "chapter1_trigger",
      "position": { "x": 25, "y": 20 },
      "trigger": "step",
      "eventId": "chapter1_intro",
      "condition": "prologue_cleared"
    }
  ]
}
```

---

### Task #44: タイトル→ゲーム開始フロー実装

**目的**: New Game → プロローグ → フィールドの流れを完成

**修正ファイル**:
- `src/components/screens/TitleScreen.tsx`
- `src/App.tsx`
- `src/stores/gameStore.ts`

**実装**:

1. **TitleScreen.tsx修正**
```typescript
const handleNewGame = async () => {
  // ScenarioManager経由でNew Game処理
  const scenarioManager = new ScenarioManager(...)
  await scenarioManager.startNewGame()
}
```

2. **App.tsx修正**
```typescript
// 動的マップIDに対応
const currentMapId = useProgressStore((state) => state.currentMapId) || 'saigaitaya'

<Field
  mapId={currentMapId}
  onMapLoad={...}
  onEncounter={...}
/>
```

3. **gameStore拡張**
```typescript
// シナリオモード追加
interface GameState {
  scene: GameScene
  scenarioMode: boolean // プロローグ中などはtrue
  // ...
}
```

---

### Task #45: 敵データ追加

**目的**: デモ版の敵を追加

**成果物**:
- `public/data/enemies.json` 更新（9種類追加）

**追加する敵**:
1. **野良犬** (Lv1) - 城下町
2. **ならず者** (Lv2) - 城下町
3. **上士・見習い** (Lv3) - Chapter 1ボス
4. **師範代** (Lv4) - 道場ボス
5. **土佐勤王党・党員** (Lv5) - Chapter 2味方NPC（非戦闘）
6. **藩の役人** (Lv6) - Chapter 3雑魚
7. **守旧派・剣士** (Lv7) - Chapter 3中ボス
8. **守旧派・頭目** (Lv8) - Chapter 3ラスボス
9. **浪人** (Lv5) - 浦戸湊

**データ例**:
```json
{
  "id": "enemy_009_conservative_leader",
  "name": "守旧派・頭目",
  "level": 8,
  "hp": 120,
  "mp": 30,
  "attack": 28,
  "defense": 18,
  "speed": 12,
  "luck": 8,
  "sprite": "/assets/sprites/enemies/conservative_leader.png",
  "skills": ["skill_003_iai", "skill_999_guard"],
  "exp": 150,
  "gold": 100,
  "drops": [
    { "itemId": "item_007_meitoken", "rate": 0.5 }
  ]
}
```

---

### Task #46: デバッグ機能追加

**目的**: 開発効率化とテスト容易化

**成果物**:
- `src/components/debug/DebugPanel.tsx` - デバッグパネル
- `src/utils/devTools.ts` - 開発用ヘルパー

**機能**:
1. シーン切替（Title/Field/Battle/Menu）
2. マップ切替（ドロップダウン）
3. フラグ管理（ON/OFF切替）
4. パーティ編集（レベル、HP、ゴールド）
5. バトル開始（敵選択）
6. イベント実行（イベントID入力）

**表示条件**:
- 開発モード時のみ（`import.meta.env.DEV`）
- Ctrl+Shift+D でトグル

---

### Task #47: 最終調整とテストプレイ

**目的**: デモ版として完成度を高める

**作業内容**:

1. **バランス調整**
   - 敵の強さ調整（Lv1-8）
   - レベルアップ曲線調整
   - ショップ価格調整
   - エンカウント率調整

2. **演出調整**
   - フェード速度
   - メッセージ表示速度
   - BGM音量バランス
   - SE タイミング

3. **通しプレイテスト**
   - Title → Prologue → Chapter 1 → 2 → 3 → Epilogue
   - 所要時間計測（目標30-60分）
   - バグ発見・修正

4. **UI/UX改善**
   - ゲームオーバー画面追加
   - バトル逃走機能追加
   - クイックセーブ（F5）
   - ヘルプ画面（キー操作説明）

---

## 実装順序

### Week 1: マップ作成（Task #38-41）
- Day 1-2: 才谷屋マップ作成
- Day 3-4: 高知城下町マップ作成
- Day 5: 山内容堂道場マップ作成
- Day 6: 浦戸湊マップ作成
- Day 7: 敵データ追加（Task #45）

### Week 2: シナリオ統合（Task #42-44）
- Day 8-9: ScenarioManager実装
- Day 10: マップイベント連動
- Day 11: タイトル→ゲーム開始フロー
- Day 12-13: デバッグ機能追加（Task #46）
- Day 14: バグ修正

### Week 3: 最終調整（Task #47）
- Day 15-16: バランス調整
- Day 17-18: 演出調整
- Day 19-20: 通しプレイテスト
- Day 21: 最終バグ修正

---

## 成果物チェックリスト

### マップファイル
- [ ] `public/data/maps/saigaitaya.json`
- [ ] `public/data/maps/kochi_town.json`
- [ ] `public/data/maps/yodo_dojo.json`
- [ ] `public/data/maps/urado_port.json`

### システムファイル
- [ ] `src/systems/scenario/ScenarioManager.ts`
- [ ] `src/stores/progressStore.ts`（拡張）
- [ ] `src/components/debug/DebugPanel.tsx`
- [ ] `src/utils/devTools.ts`

### データファイル
- [ ] `public/data/enemies.json`（9種類追加）
- [ ] `public/data/events/prologue.json`（更新）
- [ ] `public/data/events/chapter1.json`（更新）
- [ ] `public/data/events/chapter2.json`（更新）
- [ ] `public/data/events/chapter3.json`（更新）
- [ ] `public/data/events/epilogue.json`（更新）

### 動作確認
- [ ] タイトル→New Game→プロローグ自動起動
- [ ] プロローグ→才谷屋マップ移動
- [ ] 才谷屋→城下町移動
- [ ] 城下町→道場移動（Chapter 1完了後）
- [ ] 道場→武市加入（Chapter 2）
- [ ] 城下町→浦戸湊移動（Chapter 3）
- [ ] ラスボス撃破→エピローグ
- [ ] セーブ/ロード動作確認
- [ ] 全NPCとの会話確認
- [ ] 全ショップ動作確認

---

## リスク管理

### リスク1: マップ作成の時間超過
- **対策**: 最小限のマップサイズで実装、装飾は後回し
- **軽減策**: ツール利用（Tiled Map Editorなど）

### リスク2: シナリオ連動の複雑化
- **対策**: フラグベースのシンプルな分岐のみ実装
- **軽減策**: ScenarioManager でロジックを一元管理

### リスク3: バランス調整の長期化
- **対策**: 初期値を保守的に設定（簡単めに）
- **軽減策**: デバッグ機能で素早くテスト

---

## 次回作業開始時の確認事項

1. このドキュメント（PHASE7_PLAN.md）を読む
2. CLAUDE.md の Phase 7 セクションを確認
3. Task #38（才谷屋マップ作成）から開始
4. 不明点があれば REQUIREMENTS.md を参照

---

**作成者**: Claude Sonnet 4.5
**最終更新**: 2026-02-10
