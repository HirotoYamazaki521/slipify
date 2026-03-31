# Research & Design Decisions — ui-redesign

---
**Purpose**: ディスカバリーフェーズの調査結果・設計判断の根拠を記録する。

---

## Summary

- **Feature**: `ui-redesign`
- **Discovery Scope**: Extension（既存UIレイヤーの拡張）
- **Key Findings**:
  - 入力フィールドに `text-gray-900` が未設定。Tailwindユーティリティ優先モデルではボディCSSカスタムプロパティからの継承が不安定であり、明示指定が必要。
  - 認証済みページに共通レイアウト（ナビヘッダー）が存在しない。`app/layout.tsx` はフォントとbodyのみで、各ページが個別にヘッダーを持たない構成。
  - `receipts/page.tsx` のサマリグリッドが `grid-cols-2` のみでレスポンシブ対応なし。`FilterPanel` の日付入力も `flex gap-2` で固定幅レイアウト。

---

## Research Log

### 入力フィールドの文字色が灰色に見える原因

- **Context**: ログイン・フィルターパネルなどの `<input>` で入力テキストが灰色に見えるとの報告。
- **Sources Consulted**: globals.css, login/page.tsx, filter-panel.tsx, signup/page.tsx を直接確認。
- **Findings**:
  - `globals.css` の `body { color: var(--foreground) }` は `#171717`（ほぼ黒）を指定。
  - しかし `<input>` 要素に Tailwind の `text-{color}` クラスが一切付与されていない。
  - Tailwindのプリフライト（CSS Reset）では `input` が `color: inherit` となるが、ブラウザの UA スタイルシートや WebKit の autofill スタイルが上書きする可能性がある。
  - 特に Safari / iOS WebKit では入力フィールドに独自の文字色・背景色スタイルが適用されるケースが多い。
- **Implications**: 全 `<input>`, `<select>`, `<textarea>` に `text-gray-900` を明示付与し、`globals.css` でもベーススタイルを定義することで確実に解決できる。

### 認証済みページの共通レイアウト

- **Context**: ナビゲーションヘッダーがどのページにも存在しない。ページ間の遷移が不明確。
- **Sources Consulted**: `app/layout.tsx`, `app/receipts/page.tsx`, `app/receipts/upload/page.tsx`, `app/settings/csv-format/page.tsx` を確認。
- **Findings**:
  - `app/layout.tsx` は `<body>{children}</body>` のみ。グローバルナビなし。
  - 各ページはそれぞれ独立した `<div className="mx-auto max-w-2xl px-4 py-8">` で囲まれている。
  - `LogoutButton` コンポーネントはあるがどのページからも使われていない。
- **Implications**: Next.js App Router の Route Group (`(app)/layout.tsx`) パターンで共通レイアウトを導入するのが最適。URLに影響なく、`receipts/`, `settings/` を束ねられる。

### Tailwind CSS バージョン・設定

- **Context**: カラーテーマ拡張やカスタムトークン追加のため設定確認が必要。
- **Sources Consulted**: `package.json` は未確認だが `globals.css` の `@tailwind base/components/utilities` から Tailwind CSS 3.x または 4.x を使用していることが判明。
- **Findings**:
  - Next.js 15 + Tailwind CSS の組み合わせ。Tailwind v3系の標準設定が想定される。
  - `tailwind.config.ts` の存在は未確認だが、カスタムカラーは `theme.extend.colors` で追加可能。
  - CSS カスタムプロパティ（`--brand-*`）を `globals.css` で定義し `tailwind.config.ts` で参照するパターンが現代的。
- **Implications**: 大規模なパレット変更は不要。既存の `blue-600` / `green-600` ベースを整理し、全コンポーネントで統一するだけで十分。

### モバイルレイアウトの問題箇所

- **Context**: スマートフォン幅（375px〜）での表示確認。
- **Sources Consulted**: `receipts/page.tsx`, `filter-panel.tsx`, `receipts-list-client.tsx` を確認。
- **Findings**:
  - `receipts/page.tsx` L86: `grid grid-cols-2 gap-4` → `sm:grid-cols-2` が必要
  - `filter-panel.tsx` L182: `flex gap-2` の日付入力 → モバイルで2列が潰れる
  - `filter-panel.tsx` L200: クイック日付ボタンが `flex gap-1.5` → 3ボタンが小画面で折れる
  - `receipts-list-client.tsx` L133: `flex flex-wrap items-center gap-3` のCSVパネル → モバイルで崩れる可能性
  - ナビヘッダーはまだ存在しないため、追加時にモバイル対応を最初から組み込む必要がある
- **Implications**: Tailwind の `sm:` / `flex-col` / `flex-wrap` を活用した変更が最小コストで最大効果。

---

## Architecture Pattern Evaluation

| 選択肢 | 説明 | 長所 | 短所・リスク | 備考 |
|--------|------|------|------------|------|
| Route Group Layout `(app)/layout.tsx` | 認証済みページを `(app)/` グループにまとめ、共通レイアウトを適用 | 正規Next.jsパターン、URLに影響なし、レイアウト分離が明確 | 既存ページファイルの移動が必要 | 採用 |
| 各ページに `AppShell` コンポーネントをimport | ページごとにラッパーコンポーネントを使用 | ファイル移動不要 | 追加・変更漏れリスク、冗長 | 不採用 |
| `app/layout.tsx` に全ナビを組み込む | ルートレイアウトにヘッダーを追加し、authページで非表示 | ファイル移動不要 | auth/appの判定ロジックが複雑になる | 不採用 |

---

## Design Decisions

### Decision: 認証済みページに Route Group `(app)` を採用

- **Context**: 全認証済みページに共通ナビゲーションヘッダーが必要（要件 3.2）
- **Alternatives Considered**:
  1. `app/layout.tsx` に全ナビを追加し、auth ページで条件分岐で非表示
  2. `components/app-shell.tsx` ラッパーを各ページで手動 import
- **Selected Approach**: `app/(app)/layout.tsx` に `AppHeader` を組み込む Route Group を新設。既存ページを `app/(app)/` 配下に移動（URLは変化しない）。
- **Rationale**: Next.js 15 の推奨パターンであり、レイアウトとルーティングの責務が明確に分離される。
- **Trade-offs**: 既存ページファイルを `app/(app)/` に移動する作業が発生するが、一度きりの変更でメンテナンス性が大幅に向上する。
- **Follow-up**: `app/page.tsx`（ランディングページ）は `(app)` 外に残し `/receipts` へリダイレクトとするか要確認。

### Decision: 入力フィールドベーススタイルを globals.css に定義

- **Context**: 全入力要素に `text-gray-900` が必要（要件 1.3）。各コンポーネントを個別修正するより一箇所で解決したい。
- **Alternatives Considered**:
  1. 各コンポーネントの `className` に `text-gray-900` を追加（個別修正）
  2. `globals.css` の `@layer base` で `input, select, textarea { color: theme('colors.gray.900') }` を定義
- **Selected Approach**: 両方の組み合わせ。`globals.css` でベーススタイルを定義し、各コンポーネントでも `text-gray-900` を明示して Tailwind Intellisense の補完が効くようにする。
- **Rationale**: ベーススタイルにより Safari/iOS WebKit の autofill 上書き問題を確実に解決。コンポーネント側の明示クラスで可読性を維持。

### Decision: カラーパレットは既存 Tailwind トークンの整理に留める

- **Context**: 「地味」なデザインの改善（要件 2.1, 2.3）
- **Alternatives Considered**:
  1. Tailwind `theme.extend.colors` でブランドカラーを新規定義
  2. 既存の `blue-600` / `green-600` を整理し、indigo など Tailwind 標準の上位カラーに統一
- **Selected Approach**: `indigo-600` をプライマリカラーとして採用（青みが強くブランドイメージに深みが出る）。CSVエクスポートは `emerald-600`。カスタムカラー定義は不要。
- **Rationale**: カスタムトークン定義なしで Tailwind の IDEサポートを最大限に活用できる。
- **Trade-offs**: 将来ブランドカラー変更時に全コンポーネント修正が必要になるリスクあり。その場合は `tailwind.config.ts` でエイリアス定義に切り替える。

---

## Risks & Mitigations

- **ページファイル移動による機能デグレ** — 移動後に全ルートの動作確認テストを実施。`app/(app)/` 配下の全ページで認証チェック（`supabase.auth.getUser`）が引き続き機能することを確認する。
- **グローバル入力スタイルの意図しない上書き** — `globals.css` の `@layer base` スコープで定義することで、コンポーネント側 Tailwind クラスが優先されることを保証する。
- **モバイルでのUXデグレ（フィルターパネル）** — 要件 7.6 のレスポンシブ変更によりPCレイアウトが崩れないよう、`sm:` 以上のブレークポイントで既存スタイルを維持する。

---

## References

- [Next.js App Router Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups) — Route Group パターンの公式ドキュメント
- [Tailwind CSS Preflight](https://tailwindcss.com/docs/preflight) — ベーススタイルのリセット挙動
- [WCAG 2.1 Contrast Requirement AA](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) — コントラスト比 4.5:1 の基準
- [WebKit Autofill Styling](https://developer.mozilla.org/en-US/docs/Web/CSS/:-webkit-autofill) — autofill上書き問題の参考
