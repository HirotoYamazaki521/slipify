# リサーチ・設計判断ログ

---

## サマリ

- **フィーチャー**: `receipt-csv-mvp`
- **調査スコープ**: 新規機能（グリーンフィールド）
- **主要調査結果**:
  - `@supabase/ssr` が Next.js 15 App Router の正式推奨パッケージ（`@supabase/auth-helpers-nextjs` は廃止済み）
  - Claude API の tool_use によるJSON Schema強制が構造化データ抽出に最適
  - Next.js 15 では GET Route Handler のキャッシュがデフォルト無効に変更（v14 からの破壊的変更）

---

## リサーチログ

### Supabase SSR + Next.js 15 App Router

- **コンテキスト**: Supabase認証とNext.js App RouterのServer Componentsを統合する方法を確認
- **参照ソース**: Supabase公式ドキュメント（supabase.com/docs/guides/auth/server-side/nextjs）
- **調査結果**:
  - `@supabase/ssr` パッケージを使用（旧 `@supabase/auth-helpers-nextjs` は廃止）
  - `createServerClient`: Server Components・Route Handlers・Middleware で使用
  - `createBrowserClient`: Client Components で使用
  - Middleware では `supabase.auth.getUser()` を使用（`getSession()` はサーバー側では信頼できない）
  - Cookie は `getAll()` / `setAll()` インターフェースを使用
  - 2025/2026 時点で破壊的変更なし
- **設計への影響**: `middleware.ts` の実装が必須。Server Componentsからサーバークライアントで直接DBアクセス可能

### Claude API Vision + tool_use

- **コンテキスト**: レシート画像から構造化データを抽出する最適な方法を確認
- **参照ソース**: Anthropic公式ドキュメント（platform.claude.com/docs）
- **調査結果**:
  - tool_use で JSON Schema を定義すると構造化レスポンスを強制できる
  - base64エンコード画像をcontent blockとして渡す形式
  - `claude-sonnet-4-6` は精度とコストのバランスが良い（`claude-opus-4-6` は最高精度だが高コスト）
  - JPEG, PNG, WebP サポート確認
- **設計への影響**: `ReceiptExtractionService` で tool_use 採用。単一 API コールでデータ抽出と勘定科目予測が同時に可能

### Next.js 15 Route Handlers

- **コンテキスト**: CSVファイルダウンロードの Route Handler 実装パターンを確認
- **参照ソース**: Next.js 15 Upgrade Guide、Route Handlers ドキュメント
- **調査結果**:
  - Next.js 15 では GET Route Handler のキャッシュがデフォルト無効（v14 からの破壊的変更）
  - `new Response(csvContent, { headers: {...} })` でファイルダウンロードを返せる
  - UTF-8 BOM: `'\uFEFF'` をコンテンツ先頭に付加
- **設計への影響**: `/api/exports/csv` の GET ハンドラーはキャッシュ設定不要

### Supabase Storage

- **コンテキスト**: 画像アップロードと Claude API への受け渡し方法を確認
- **調査結果**:
  - Route Handler 内で `createServerClient` を使用してサーバーサイドアップロード可能
  - フォームから受け取った画像バッファを直接 Claude API に渡せる（Storage 再ダウンロード不要）
  - Storage バケットはデフォルト Private
- **設計への影響**: 画像はアップロードと同時にメモリ上のバッファを Claude API に渡す（ネットワークラウンドトリップ削減）

---

## アーキテクチャパターン評価

| オプション | 説明 | 強み | リスク・制限 | 備考 |
|-----------|------|------|-------------|------|
| Next.js モノリス | フルスタック Next.js（Route Handler = バックエンド） | シンプル・1リポジトリ・Vercel最適化 | スケール時の分離困難 | MVP の「保守コスト低」方針に合致 |
| Next.js + 別 Express API | Next.js + 別 Node.js サービス | 明確な分離 | 2サービス管理・コスト増 | MVP には過剰 |

**選択**: Next.js モノリス

---

## 設計判断

### Claude API モデル選定

- **コンテキスト**: レシート OCR に使用するモデルの選択
- **検討した代替案**:
  1. `claude-opus-4-6` — 最高精度・最高コスト
  2. `claude-sonnet-4-6` — 高精度・中コスト
- **選択アプローチ**: `claude-sonnet-4-6`
- **根拠**: レシート OCR は文脈理解より画像読み取り精度が重要。Sonnet で十分な精度が期待でき、コストを抑えられる
- **トレードオフ**: 手書きレシートや画像品質が低い場合は Opus に切り替えが必要な可能性
- **フォローアップ**: 実装後に精度を検証し、必要に応じてモデルを再評価

### 画像の Claude API への受け渡し方法

- **コンテキスト**: Storage 保存後の Claude API への画像受け渡し方法
- **検討した代替案**:
  1. Storage に保存 → Storage URL/バイトを取得して Claude API に渡す
  2. フォームデータのバッファをそのまま base64 エンコードして渡す
- **選択アプローチ**: オプション2（メモリ上のバッファを直接使用）
- **根拠**: ネットワークラウンドトリップを削減。Storage への保存は永続化目的で並行実施
- **トレードオフ**: メモリ使用量が若干増加するが、10MB 上限で問題なし

### 解析処理の同期・非同期

- **コンテキスト**: Claude API 呼び出しを Route Handler 内で同期処理するか、非同期ジョブとして行うか
- **検討した代替案**:
  1. 同期処理（Route Handler 内で完結）
  2. 非同期処理（Vercel Queue / バックグラウンドジョブ）
- **選択アプローチ**: 同期処理
- **根拠**: Vercel Hobby プランの 30 秒タイムアウト内に収まる見込み。MVP では複雑なキュー管理は不要
- **トレードオフ**: 解析が遅い場合に UX が劣化する可能性。将来的には非同期化を検討

---

## リスクと対策

- **Vercel Hobby 30秒タイムアウト**: Claude API に 25秒タイムアウトを設定して余裕を持たせる。超過頻発なら Vercel Pro 移行または非同期化
- **Claude API の構造化レスポンス失敗**: tool_use 強制で JSON 保証。ただし `PARSE_FAILED` エラーのフォールバックロジックを実装
- **Supabase Free Tier 制限（DB 500MB, Storage 1GB）**: MVP スケールでは問題なし。超過前に Paid プランへ移行
- **勘定科目予測精度**: 固定リストの enum で強制するため「その他」分類になりやすいケースが出る可能性。ユーザー修正機能で補完

---

## 参照リンク

- [Supabase Auth Server-Side Setup](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Creating a Supabase Client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Claude API Vision Documentation](https://platform.claude.com/docs/en/build-with-claude/vision)
- [Claude Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-15)
- [Next.js Route Handlers](https://nextjs.org/docs/15/app/getting-started/route-handlers-and-middleware)
