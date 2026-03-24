# 技術スタック

## アーキテクチャ

Vercel上で動くNext.js App RouterフルスタックWebアプリ。
SupabaseがDB・認証・ストレージを担い、Claude APIがAI処理を担う。

## コア技術

| 領域 | 技術 |
| --- | --- |
| 言語 | TypeScript（strictモード） |
| フレームワーク | Next.js 15（App Router） |
| ランタイム | Node.js（Vercelサーバーレス） |
| DB / Auth | Supabase（PostgreSQL + Supabase Auth） |
| AI処理 | Claude API（Anthropic） |
| ホスティング | Vercel |

## 主要ライブラリ

- `@supabase/supabase-js` — DBアクセス・認証
- `@anthropic-ai/sdk` — Claude API通信
- Tailwind CSS — スタイリング（想定）

## 開発標準

### 型安全性

TypeScript strictモード。`any` の使用は禁止。
Supabaseのテーブル型は `supabase gen types` で自動生成して使用する。

### コード品質

ESLint + Prettier。Next.jsのlint設定をベースにする。

### テスト

ビジネスロジック層（データ抽出・CSV生成）は最低限テストを書く。
UIテストはVitest / Testing Libraryを想定。

## 開発コマンド

```bash
# Dev
npm run dev

# Build
npm run build

# Type check
npx tsc --noEmit
```

## 重要な技術的決定

### Claude API統合

- APIキーはサーバー側環境変数（`ANTHROPIC_API_KEY`）のみで管理。クライアントに露出しない。
- 画像はbase64エンコードしてAPIへ送信。
- レスポンスは構造化JSON形式で設計し、パース処理を一箇所に集約する。

### 使用量トラッキング

- 将来のサブスク課金モデルに備え、APIコール単位で使用量を `api_usage_logs` テーブルに記録する。
- 記録項目：ユーザーID・タイムスタンプ・モデル名・入力/出力トークン数・処理対象種別。

### 認証（Supabase Auth）

- Row Level Security（RLS）を使い、ユーザーは自分のデータのみアクセスできる。
- セッション管理はSupabaseのサーバー側クライアント（`createServerClient`）を使用。

### CSVエクスポート

- カラム名・順序・区切り文字をユーザーが定義可能。
- フォーマット定義はDBに保存し再利用できる設計。

---

_Document: 決定済みの技術と設計原則。新たな技術選択時はここを先に確認すること_
