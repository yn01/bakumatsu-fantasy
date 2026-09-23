# バックログ（未対応項目）

**最終更新**: 2026-09-23（Phase 12.5 完了時点）

Phase 12.5 までの実装で未対応として残っている項目を優先度別に記録する。
着手時は本ファイルの該当項目を更新し、完了したら `CLAUDE.md` の Phase サマリーへ移すこと。

---

## 優先度: High

### B-01. E2Eテスト未着手
- **現状**: `playwright.config.*` もE2Eテストファイルも存在しない。`package.json` の `test:e2e` は実行対象なし。
- **影響**: ユニット/統合テスト（284テスト）はあるが、タイトル→フィールド→バトル→セーブの通しフローが自動検証されていない。
- **対応案**: Playwright 導入、主要フロー（New Game / バトル勝利 / セーブ・ロード / メニュー操作）のシナリオを作成。

### B-02. 宿屋(inn)・セーブ(save) NPCアクション未実装
- **現状**: `src/types/map.ts` に `{ type: 'inn'; cost: number }` と `{ type: 'save' }` の型定義があるが、`src/components/game/Field.tsx` の NPC 話しかけ処理は `type === 'shop'` のみを処理している。
- **影響**: マップ上に宿屋・セーブポイントのNPCを配置しても機能しない。HP/MP回復手段がアイテムのみに限定される。
- **対応案**: Field.tsx にハンドラを追加（inn: ゴールド消費でパーティ全回復、save: SaveLoadWindow を開く）。

### B-03. 道場・闘技場の施設機能未実装
- **現状**: 山内容堂道場などのマップは存在するが、施設としての機能（道場でのスキル習得・強化、闘技場での任意バトル）は未実装。
- **影響**: マップが「通過するだけの場所」になっている。
- **対応案**: NPCアクション種別の拡張（`dojo` / `arena`）と専用UIの実装。

---

## 優先度: Medium

### B-04. 音声キャッシュに上限がない
- **現状**: `audioManager` の `bgmCache` / `seCache` が無制限に増加する。`clearCache()` は実装済みだが自動呼び出しされていない。
- **影響**: 長時間プレイでメモリ使用量が増加する可能性。通常のプレイ時間（2〜4時間）では実害は確認されていない。
- **経緯**: Phase 6 Codexレビューの Medium 指摘。Phase 11 Task D で「影響なし」と判断しスキップ。
- **対応案**: LRU方式で上限（例: BGM 5件 / SE 20件）を設け、超過分を unload。

### B-05. バンドル最適化（目標未達）
- **現状**: 275.92 kB (gzip: 84.32 kB)。目標は gzip 65 kB。`Field.tsx` と Howler.js が静的 import のまま。
- **影響**: 初回ロードが重い。特に Howler.js が約10 kB (gzip) を占める。
- **対応案**: Field.tsx の lazy loading、Howler.js の動的 import（初回の音声再生時にロード）。

---

## 優先度: Low

### B-06. ESLint warning 7件
- **内訳**: `react-hooks/exhaustive-deps` 6件、未使用変数 1件。
- **影響**: error ではないため動作に支障なし。ただし exhaustive-deps は stale closure の温床になりうる。
- **対応案**: 依存配列の見直し、または意図的な除外であれば理由付きの eslint-disable コメントを付与。

### B-07. モバイル対応未着手
- **現状**: レスポンシブ対応、タッチUI（仮想パッド）、PWA化のいずれも未実装。
- **影響**: スマートフォン/タブレットでのプレイ不可（Canvas 640x480 固定、キーボード/ゲームパッド前提）。
- **対応案**: Canvas のレスポンシブスケーリング、タッチ入力を InputManager に統合、manifest.json + Service Worker 追加。

### B-08. ブラウザ互換性テスト / Lighthouse監査 / メモリリークチェック未実施
- **現状**: 開発環境（Chrome系）以外での検証が未実施。パフォーマンス監査・メモリプロファイリングも未実施。
- **対応案**: Chrome / Firefox / Safari / Edge での動作確認、Lighthouse スコア計測、長時間プレイ時の heap snapshot 比較。

---

## 対応不要

### B-09. 造具屋（装備強化）
- `docs/REQUIREMENTS.md` にてデモ版の範囲外と明記されているため、対応不要。
