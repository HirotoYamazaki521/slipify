# Research & Design Decisions

---
**Feature**: `receipt-search-filter`
**Discovery Scope**: Extension（既存 MVP への機能追加）

**Key Findings**:
- `ReceiptRepository.findMany` は現状フィルタ引数なし。拡張で対応可能。
- 店名＋品目名の横断検索は Supabase JS 単体では記述が複雑なため PostgreSQL RPC 関数を利用する。
- 集計（月別・科目別）は DB クエリ不要でフィルタ済みデータから JavaScript で計算できる。

---

## Research Log

### テキスト検索の実装方式

- **Context**: `store_name`（receipts）と `name`（line_items）の横断検索が要件 1.1 に必要。
- **Sources Consulted**: Supabase Docs — `.or()` filter, PostgreSQL `ILIKE`, Supabase RPC
- **Findings**:
  - Supabase JS の `.or()` はカレントテーブル列のみ対象。JOINを跨ぐ条件は表現困難。
  - PostgreSQL RPC (`supabase.rpc()`) を使えばサーバーサイド JOIN クエリが書ける。
  - `DISTINCT` を使い、line_items が複数行あっても receipt 単位で1件返る設計が必要。
- **Implications**: `search_receipts` Postgres 関数を作成し、`ReceiptRepository` から `supabase.rpc()` で呼び出す。

### 勘定科目フィルタの OR 条件

- **Context**: 要件 3.1 で「確定済みまたは AI 予測」どちらかが一致するレシートを返す必要がある。
- **Findings**:
  - `account_category`（確定）と `ai_account_category`（AI 予測）の両方を対象にする。
  - Supabase `.or(`account_category.in.(x,y),ai_account_category.in.(x,y)`)` で表現可能。
  - ただし keyword 検索と組み合わせる場合は RPC 関数内で条件を統合する方が一貫性が高い。
- **Implications**: フィルタが複合する場合は RPC 関数に全条件を集約し、単純フィルタ（日付・科目のみ）は `findMany` 拡張で対応する2段階設計にする。

### フィルタ状態管理（URL vs React State）

- **Context**: フィルタ条件の保持方法の選択。
- **Findings**:
  - Next.js App Router では `searchParams` を Server Component に渡せるため URL search params が推奨パターン。
  - URL ベースならブラウザ履歴・ブックマーク・共有 URL が自動サポートされる。
  - クライアント側は `useRouter` + `useSearchParams` で URL を更新し Server Component を再レンダリング。
- **Implications**: フィルタ状態は URL search params で管理する。

### インデックス追加の必要性

- **Context**: `receipt_date` と `store_name` の絞り込みのパフォーマンス。
- **Findings**:
  - 現状インデックスは `user_id`（RLS）と `created_at` のみ。
  - `receipt_date` の範囲フィルタは頻出クエリなので `(user_id, receipt_date)` 複合インデックスが効果的。
  - `store_name` の ILIKE 検索は B-Tree インデックスが効かないため、データ量が増えた場合は Full-Text Search への移行を検討。MVP 段階では ILIKE で許容。
- **Implications**: DB マイグレーションで `receipts(user_id, receipt_date)` インデックスを追加する。

---

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations |
|--------|-------------|-----------|---------------------|
| A: クライアント側フィルタ | 全件取得後に JS でフィルタ | 実装簡単 | データ量増加でパフォーマンス劣化 |
| B: サーバー側フィルタ（URL params） | URL searchParams → Server Component → Repository | Next.js 推奨パターン、スケーラブル | 実装量が多い |
| C: 専用 API エンドポイント追加 | GET /api/receipts/search | API 設計が明確 | 既存 page.tsx パターンから外れる |

**選択**: Option B。既存アーキテクチャパターンに合致し、将来のデータ量増加に対しても安全。

---

## Design Decisions

### Decision: フィルタ実装を Repository 層に集約する

- **Context**: フィルタロジックをどの層に置くか。
- **Alternatives Considered**:
  1. API Route Handler でフィルタ処理
  2. Repository 層で Supabase クエリ条件として表現
- **Selected Approach**: `ReceiptRepository.findMany` に `ReceiptFilterParams` を追加し、Supabase クエリに変換する責務を Repository が持つ。
- **Rationale**: 既存パターンに合致。テスト容易性が高い。
- **Trade-offs**: Repository がやや肥大化するが、フィルタ条件が増えても影響範囲が限定される。

### Decision: 集計ロジックを AggregationService として切り出す

- **Context**: 月別・科目別集計のロジックをどこに置くか。
- **Alternatives Considered**:
  1. Page コンポーネント内でインライン計算
  2. 専用サービス関数として `lib/` に切り出す
- **Selected Approach**: `lib/search/aggregation-service.ts` に純粋関数として実装。
- **Rationale**: ユニットテストが容易。Page コンポーネントの責務を軽くできる。

### Decision: テキスト検索に PostgreSQL RPC 関数を使用する

- **Context**: 店名と品目名の横断検索。
- **Alternatives Considered**:
  1. 店名のみ DB 検索（品目名は非対応）
  2. 全件取得後クライアントサイド検索
  3. PostgreSQL RPC 関数
- **Selected Approach**: Option 3。`search_receipts` RPC 関数で JOIN + ILIKE 検索。
- **Trade-offs**: DB マイグレーションが必要。ただし検索精度と性能のバランスが最良。

---

## Risks & Mitigations

- `store_name` ILIKE 検索はデータ量増加時に遅くなる — 将来は PostgreSQL Full-Text Search (tsvector) への移行を検討
- URL search params が長くなった場合のブラウザ互換性 — カテゴリ複数選択はカンマ区切りで単一パラメータに収める
- CSV エクスポートとフィルタの連携 — フィルタ後のレシート ID を ReceiptsListClient に渡すことで既存エクスポート UI を再利用
