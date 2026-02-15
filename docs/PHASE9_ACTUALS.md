# Phase 9: 工数予実管理

## ドキュメント情報

| 項目 | 値 |
|------|-----|
| 作成日 | 2026-02-15 |
| フェーズ | Phase 9 |
| 目的 | ゲームシステム拡張（サイドクエスト、隠しダンジョン、やり込み要素、難易度選択、ショップNPC統合） |

---

## 見積もりサマリー

| 項目 | 担当チーム | 実績工数 | 主な成果物 |
|------|------------|----------|------------|
| **サイドクエスト実装** | Team Alpha | 完了 | quests.json（20クエスト）、QuestManager.ts、QuestWindow.tsx |
| **隠しダンジョン実装** | Team Beta | 完了 | hidden_dungeon.json、ボス敵5種、究極装備6種 |
| **やり込み要素実装** | Team Beta | 完了 | 実績30種、図鑑3種、New Game+ |
| **難易度選択実装** | Team Beta | 完了 | DifficultyManager.ts、4難易度対応 |
| **ショップNPC統合** | Team Alpha | 完了 | shop イベントコマンド、10店舗統合 |
| **合計** | **両チーム** | **5タスク完了** | **バンドル +7.47 kB** |

---

## タスク別詳細記録

### Task #48: サイドクエスト実装

**担当チーム**: Team Alpha

**実装内容**:
- サイドクエストシステム設計・実装
- クエストデータ20個作成（quests.json）
- QuestManager.ts 実装（クエスト進捗管理）
- QuestWindow.tsx 実装（クエストUI、進行中/完了済み表示）
- 全マップにクエストNPC配置
- フィールド統合、動作確認

**成果物**:
- `/public/data/quests.json` - 20クエスト定義
- `/src/systems/quest/QuestManager.ts` - クエスト管理システム
- `/src/components/ui/QuestWindow.tsx` - クエストUI
- 各マップデータにクエストNPC追加

**実績**: ✅ 完了
**所感**: サイドクエスト20個を実装し、全マップに配置。クエスト進捗管理とUIが正常動作。

---

### Task #49: 隠しダンジョン実装

**担当チーム**: Team Beta

**実装内容**:
- 隠しダンジョン「幕末の亡霊たち」マップデザイン
- hidden_dungeon.json 作成（50×40タイル、5階層構造）
- ボス敵5体追加（幕末の英雄たち）
- 究極装備6種追加（items.json）
- ダンジョンイベント・ボス戦実装
- マップ遷移・動作確認

**成果物**:
- `/public/data/maps/hidden_dungeon.json` - 隠しダンジョンマップ
- `/public/data/enemies.json` - ボス敵5種追加
- `/public/data/items.json` - 究極装備6種追加
- `/public/data/events/hidden_dungeon_events.json` - ダンジョンイベント

**実績**: ✅ 完了
**所感**: 高難易度ダンジョンとして実装。ボス戦バランス調整も完了。

---

### Task #50: やり込み要素実装

**担当チーム**: Team Beta

**実装内容**:
- 実績システム実装（30種類の実績）
- 図鑑システム実装（敵/アイテム/スキル3種）
- New Game+ 実装（引き継ぎ、2周目敵強化1.3倍）
- AchievementManager.ts 実装
- CompendiumManager.ts 実装
- NewGamePlusManager.ts 実装
- 各種UIコンポーネント実装

**成果物**:
- `/public/data/achievements.json` - 実績30種定義
- `/src/systems/achievement/AchievementManager.ts` - 実績管理
- `/src/systems/compendium/CompendiumManager.ts` - 図鑑管理
- `/src/systems/newgameplus/NewGamePlusManager.ts` - New Game+
- `/src/components/ui/AchievementWindow.tsx` - 実績UI
- `/src/components/ui/CompendiumWindow.tsx` - 図鑑UI

**実績**: ✅ 完了
**所感**: やり込み要素3種を実装。実績達成率、図鑑収集率が正常表示。New Game+で2周目プレイが可能に。

---

### Task #51: 難易度選択実装

**担当チーム**: Team Beta

**実装内容**:
- 難易度システム設計（4段階: Easy/Normal/Hard/Very Hard）
- DifficultyManager.ts 実装（難易度別パラメータ調整）
- TitleScreen難易度選択UI追加
- 敵ステータス倍率調整（Easy 0.7x, Normal 1.0x, Hard 1.3x, Very Hard 1.5x）
- 獲得経験値・ゴールド倍率調整
- 全難易度でのバランステスト

**成果物**:
- `/src/systems/difficulty/DifficultyManager.ts` - 難易度管理
- `/src/components/screens/TitleScreen.tsx` - 難易度選択UI追加
- `/src/stores/gameStore.ts` - difficulty フィールド追加

**実績**: ✅ 完了
**所感**: 4難易度を実装。各難易度でのバランス調整も完了し、プレイヤーの好みに応じた難易度選択が可能に。

---

### Task #52: ショップNPC統合

**担当チーム**: Team Alpha

**実装内容**:
- NPC会話→ショップ遷移フロー設計
- shop イベントコマンド追加（EventExecutor.ts）
- 全10店舗のショップNPCをイベント化
- 地域別商品ラインナップ設定
- 条件付きレアアイテム販売実装
- ShopScreen UI改善（商品カテゴリ表示、在庫表示）
- 全ショップの動作確認

**成果物**:
- `/src/systems/event/EventExecutor.ts` - shop コマンド追加
- 各マップの shop_events.json - 10店舗イベント
- `/src/components/screens/ShopScreen.tsx` - UI改善
- `/public/data/shops.json` - ショップマスタデータ

**実績**: ✅ 完了
**所感**: 全10店舗をイベント化し、地域別商品とレアアイテムを実装。ショップUIも改善し、使いやすさが向上。

---

## Codexレビュー＆修正（Phase 9完了後）

**実施日**: 2026-02-15

**検出問題**: 実施予定（リリース前に実施）

**修正完了**: 実施予定

| 優先度 | 問題 | 修正内容 |
|--------|------|----------|
| - | リリース前にCodexレビュー実施予定 | - |

**実績工数**: -

**修正ファイル**:
- リリース前に実施

**ビルド結果**: 241.60 kB (gzip: 74.65 kB)

**未修正（Medium/Low）**: リリース前に確認

---

## 工数分析（Phase 9完了）

### 実装サマリー

| 指標 | 値 |
|------|-----|
| 完了タスク数 | **5タスク** |
| 担当チーム | **Team Alpha（2タスク）、Team Beta（3タスク）** |
| バンドルサイズ増加 | **+7.47 kB (gzip: +1.93 kB)** |
| 新規システム数 | **7システム** |

### タスク別成果

| タスク | 担当チーム | 実績 | 主な成果物 |
|--------|------------|------|------------|
| Task #48 | Team Alpha | ✅ 完了 | サイドクエスト20個、QuestManager |
| Task #49 | Team Beta | ✅ 完了 | 隠しダンジョン、ボス5体、究極装備6種 |
| Task #50 | Team Beta | ✅ 完了 | 実績30種、図鑑3種、New Game+ |
| Task #51 | Team Beta | ✅ 完了 | 難易度選択4段階 |
| Task #52 | Team Alpha | ✅ 完了 | ショップNPC統合10店舗 |
| **合計** | **両チーム** | **5/5完了** | **バンドル 241.60 kB** |

### 学び

**Phase 9 の成功要因**:
- **チーム分割の効果**: Team Alpha（サイドクエスト、ショップ）とTeam Beta（ダンジョン、やり込み、難易度）で並行開発を実現
- **システム設計の再利用**: 既存のイベントシステム、マップシステムを活用し、効率的に新機能を追加
- **データ駆動設計**: quests.json、achievements.json など、データファイルベースで柔軟に拡張

**バンドルサイズ管理**:
- Phase 8: 234.13 kB → Phase 9: 241.60 kB（+3.2%増）
- 新システム7種追加にもかかわらず、適切なサイズ増加に抑制
- Lazy Loading の活用により、初期ロード時のサイズを最適化

**次回への改善点**:
- Codexレビューをリリース前に実施し、品質保証を強化
- パフォーマンステスト（長時間プレイ、メモリリーク検証）の実施
- E2Eテストの追加（自動テストカバレッジ向上）

**Phase 9の成果**:
- **やり込み要素充実**: サイドクエスト20個、隠しダンジョン、実績30種、図鑑3種、New Game+
- **難易度カスタマイズ**: 4段階の難易度選択により、幅広いプレイヤー層に対応
- **ショップ体験向上**: NPC会話→ショップ遷移により、没入感のある買い物体験を実現
- **ゲームの完成度向上**: メインストーリー（Phase 8）に加え、やり込み要素を充実させ、プレイ時間を大幅に拡張

---

**記録者**: Claude Sonnet 4.5 (Documentation Manager)
**最終更新**: 2026-02-15（Phase 9 完了）
