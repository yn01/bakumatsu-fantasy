# デプロイガイド

幕末ファンタジーRPG（デモ版）の本番デプロイ手順を説明します。

## 📋 目次

1. [前提条件](#前提条件)
2. [ビルド準備](#ビルド準備)
3. [デプロイ方法](#デプロイ方法)
   - [Vercel（推奨）](#1-vercel推奨)
   - [Netlify](#2-netlify)
   - [Render](#3-render)
   - [GitHub Pages](#4-github-pages)
   - [Cloudflare Pages](#5-cloudflare-pages)
4. [環境変数設定](#環境変数設定)
5. [カスタムドメイン設定](#カスタムドメイン設定)
6. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

- **Node.js**: 20.x LTS以上
- **npm**: 10.x以上
- **Git**: リポジトリ管理用
- **GitHubアカウント**: ほとんどのサービスで必要

---

## ビルド準備

### 1. 依存関係のインストール

```bash
npm install
```

### 2. ローカルビルド確認

```bash
# プロダクションビルド
npm run build

# ビルド結果の確認
ls -lh dist/

# ローカルプレビュー
npm run preview
```

**ビルド成果物**:
- `dist/index.html`: エントリーHTML
- `dist/assets/`: JS/CSSバンドル、画像、音声
- `dist/data/`: ゲームデータ（JSON）

**バンドルサイズ**:
- 合計: 約230 kB
- gzip圧縮後: 約71 kB

### 3. ビルド最適化の確認

```bash
# ビルドサイズの詳細確認
npm run build -- --stats

# バンドルアナライザー（オプション）
npm install -D rollup-plugin-visualizer
```

---

## デプロイ方法

### 1. Vercel（推奨）

**特徴**:
- ✅ Viteに最適化された高速デプロイ
- ✅ 自動HTTPS、グローバルCDN
- ✅ Git連携による自動デプロイ
- ✅ 無料プラン: 100GB帯域幅/月

#### 手順

**A. Vercel CLIを使う方法**

```bash
# Vercel CLIインストール
npm install -g vercel

# ログイン
vercel login

# デプロイ
vercel

# 本番デプロイ
vercel --prod
```

**B. GitHub連携を使う方法**

1. [Vercel](https://vercel.com/)にサインアップ
2. 「New Project」→「Import Git Repository」
3. GitHubリポジトリを選択
4. プロジェクト設定:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. 「Deploy」をクリック

**設定ファイル**: `vercel.json`（オプション）

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**デプロイURL**: `https://your-project.vercel.app`

---

### 2. Netlify

**特徴**:
- ✅ 静的サイトホスティングの老舗
- ✅ フォーム機能、関数機能も利用可能
- ✅ 自動HTTPS、グローバルCDN
- ✅ 無料プラン: 100GB帯域幅/月

#### 手順

**A. Netlify CLIを使う方法**

```bash
# Netlify CLIインストール
npm install -g netlify-cli

# ログイン
netlify login

# デプロイ
netlify deploy

# 本番デプロイ
netlify deploy --prod
```

**B. GitHub連携を使う方法**

1. [Netlify](https://netlify.com/)にサインアップ
2. 「New site from Git」
3. GitHubリポジトリを選択
4. ビルド設定:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. 「Deploy site」をクリック

**設定ファイル**: `netlify.toml`

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**デプロイURL**: `https://your-project.netlify.app`

---

### 3. Render

**特徴**:
- ✅ 静的サイト + バックエンドも対応
- ✅ 自動HTTPS、グローバルCDN
- ✅ GitHub連携による自動デプロイ
- ✅ 無料プラン: 100GB帯域幅/月

#### 手順

1. [Render](https://render.com/)にサインアップ
2. ダッシュボードで「New」→「Static Site」を選択
3. GitHubリポジトリを接続
4. プロジェクト設定:
   - **Name**: `bakumatsu-fantasy`
   - **Branch**: `main`（または`master`）
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
5. 「Create Static Site」をクリック

**環境変数**（必要に応じて）:
- `NODE_VERSION`: `20`

**Rewriteルール**（SPAルーティング対応）:
Renderの設定で以下を追加:
```
/*  /index.html  200
```

**デプロイURL**: `https://your-project.onrender.com`

---

### 4. GitHub Pages

**特徴**:
- ✅ GitHub統合、完全無料
- ✅ 簡単セットアップ
- ❌ カスタムビルドコマンドに制限あり
- ❌ HTTPSはGitHubドメインのみ

#### 手順

**A. GitHub Actionsを使う方法（推奨）**

1. `.github/workflows/deploy.yml` を作成:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

2. GitHubリポジトリ設定:
   - Settings → Pages
   - Source: GitHub Actions

3. `main`ブランチにpushすると自動デプロイ

**B. 手動デプロイ**

```bash
# gh-pagesブランチにデプロイ
npm install -D gh-pages

# package.jsonにスクリプト追加
"scripts": {
  "deploy": "npm run build && gh-pages -d dist"
}

# デプロイ実行
npm run deploy
```

**ベースパス設定**:
`vite.config.ts` で `base` を設定:

```typescript
export default defineConfig({
  base: '/bakumatsu-fantasy/', // リポジトリ名
  // ...
})
```

**デプロイURL**: `https://your-username.github.io/bakumatsu-fantasy/`

---

### 5. Cloudflare Pages

**特徴**:
- ✅ 高速グローバルCDN（Cloudflareネットワーク）
- ✅ 無制限の帯域幅
- ✅ 自動HTTPS
- ✅ GitHub/GitLab連携

#### 手順

1. [Cloudflare Pages](https://pages.cloudflare.com/)にログイン
2. 「Create a project」→「Connect to Git」
3. GitHubリポジトリを選択
4. ビルド設定:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. 「Save and Deploy」をクリック

**設定ファイル**: `wrangler.toml`（オプション）

```toml
name = "bakumatsu-fantasy"
type = "webpack"

[site]
bucket = "./dist"

[build.upload]
format = "service-worker"
```

**デプロイURL**: `https://your-project.pages.dev`

---

## 環境変数設定

現在のデモ版では環境変数は不要ですが、将来的に以下が必要になる可能性があります。

### 必要になる可能性のある環境変数

```bash
# 例: APIエンドポイント（完全版で使用）
VITE_API_ENDPOINT=https://api.example.com

# 例: 分析ツール（Google Analytics等）
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X
```

### 各サービスでの設定方法

**Vercel**:
- ダッシュボード → Project Settings → Environment Variables

**Netlify**:
- Site settings → Build & deploy → Environment

**Render**:
- Dashboard → Environment → Add Environment Variable

**GitHub Actions**:
- Settings → Secrets and variables → Actions

**Cloudflare Pages**:
- Settings → Environment variables

---

## カスタムドメイン設定

### Vercel

1. Project Settings → Domains
2. カスタムドメインを入力（例: `bakumatsu-rpg.com`）
3. DNSレコード設定:
   - **Aレコード**: `76.76.21.21`
   - **CNAMEレコード**: `cname.vercel-dns.com`

### Netlify

1. Site settings → Domain management → Custom domains
2. ドメインを追加
3. DNSレコード設定:
   - **Aレコード**: `75.2.60.5`
   - **CNAMEレコード**: `your-site.netlify.app`

### Render

1. Dashboard → Settings → Custom Domain
2. ドメインを追加
3. DNSレコード設定:
   - **Aレコード**: Renderが提供するIP
   - **CNAMEレコード**: `your-site.onrender.com`

### Cloudflare Pages

1. Pages project → Custom domains
2. ドメインを追加（Cloudflare管理の場合は自動設定）

---

## トラブルシューティング

### ビルドエラー

**症状**: `npm run build` が失敗する

**原因**:
- TypeScriptエラー
- 依存関係の問題

**解決策**:
```bash
# 依存関係の再インストール
rm -rf node_modules package-lock.json
npm install

# TypeScriptエラーの確認
npx tsc --noEmit

# ビルド再実行
npm run build
```

---

### 404エラー（SPAルーティング）

**症状**: リロード時に404エラー

**原因**: サーバー側でSPAのルーティング設定が不足

**解決策**:

**Vercel**: `vercel.json` でrewritesを設定（上記参照）

**Netlify**: `netlify.toml` でredirectsを設定（上記参照）

**Render**: Rewrite Rulesで `/* → /index.html 200` を設定

---

### バンドルサイズが大きすぎる

**症状**: 初期ロードが遅い

**原因**: 不要な依存関係、最適化不足

**解決策**:
```bash
# バンドル分析
npm run build -- --stats

# 不要な依存関係の削除
npm uninstall <package>

# コード分割の確認（vite.config.ts）
```

---

### 音声ファイルが再生されない

**症状**: BGM/SEが鳴らない

**原因**: ブラウザのautoplay制限

**解決策**:
- ユーザー操作後に再生開始（現在の実装で対応済み）
- `AudioManager`のエラーハンドリング確認

---

### localStorage容量不足

**症状**: セーブが失敗する

**原因**: localStorageの5MB制限

**解決策**:
- 古いセーブデータの削除（`SaveManager`で実装済み）
- セーブデータの圧縮（LZ-String等）

---

## デプロイ後の確認項目

- [ ] タイトル画面が表示される
- [ ] New Gameでゲームが開始できる
- [ ] フィールド移動、NPC会話が動作する
- [ ] バトルが正常に動作する
- [ ] セーブ/ロードが動作する
- [ ] 音声が再生される（ファイルがある場合）
- [ ] モバイルブラウザで表示できる
- [ ] HTTPSで配信されている
- [ ] Performance（Lighthouse）が90点以上

---

## 推奨デプロイサービス

| サービス | 推奨度 | 理由 |
|---------|-------|------|
| **Vercel** | ⭐⭐⭐⭐⭐ | Viteに最適化、高速、無料枠が充実 |
| **Netlify** | ⭐⭐⭐⭐ | 信頼性が高い、フォーム機能も利用可能 |
| **Cloudflare Pages** | ⭐⭐⭐⭐ | 高速CDN、無制限帯域幅 |
| **Render** | ⭐⭐⭐ | 静的サイト + バックエンド対応 |
| **GitHub Pages** | ⭐⭐ | 完全無料だが機能制限あり |

**推奨**: **Vercel**（無料、高速、Vite最適化）

---

## 次のステップ

1. デプロイ後、URLを共有してフィードバックを収集
2. Google Analytics等の分析ツール導入（完全版で）
3. カスタムドメインの設定（オプション）
4. PWA対応（Phase 11で実装予定）

---

## 参考リンク

- [Vite デプロイガイド](https://vitejs.dev/guide/static-deploy.html)
- [Vercel ドキュメント](https://vercel.com/docs)
- [Netlify ドキュメント](https://docs.netlify.com/)
- [Render ドキュメント](https://render.com/docs)
- [GitHub Pages ドキュメント](https://docs.github.com/en/pages)
- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
