# プロジェクト構造

## 組織方針

**Next.js App Router + 機能ドメイン中心**の構成。
「読み取り → 解析 → 蓄積 → 出力」というデータフローに沿ってモジュールを分割する。

## ディレクトリパターン

### ルーティング（`/app/`）

**場所**: `app/`
**役割**: Next.js App Routerのページ・レイアウト・API Routes
**例**: `app/(auth)/login/page.tsx`, `app/receipts/page.tsx`, `app/api/receipts/route.ts`

### 機能コンポーネント（`/components/`）

**場所**: `components/`
**役割**: UIコンポーネント。ビジネスロジックを含まない純粋なUI
**例**: `components/receipt-card.tsx`, `components/csv-format-editor.tsx`

### ビジネスロジック（`/lib/`）

**場所**: `lib/`
**役割**: AIとのやり取り・CSV生成・データ変換など、フレームワーク非依存のロジック
**例**: `lib/extraction/receipt-parser.ts`, `lib/export/csv-generator.ts`

### DB / 外部サービス（`/lib/`配下）

**場所**: `lib/supabase/`, `lib/anthropic/`
**役割**: Supabase・Claude APIのクライアント初期化とラッパー
**例**: `lib/supabase/server.ts`, `lib/anthropic/client.ts`

### 型定義（`/types/`）

**場所**: `types/`
**役割**: プロジェクト共通の型定義。Supabaseの自動生成型を含む
**例**: `types/database.ts`（supabase gen types出力）, `types/receipt.ts`

## 命名規則

- **ファイル名**: kebab-case（例: `receipt-parser.ts`, `csv-exporter.ts`）
- **コンポーネント名**: PascalCase（例: `ReceiptCard`, `CsvFormatEditor`）
- **関数名**: camelCase・動詞始まり（例: `extractReceiptData`, `generateCsv`）
- **DB テーブル名**: snake_case・複数形（例: `receipts`, `line_items`, `export_templates`）
- **API エンドポイント**: RESTful・リソース中心（例: `/api/receipts`, `/api/exports`）

## インポート規則

```typescript
// 外部ライブラリ
import { createClient } from '@supabase/supabase-js'

// 内部絶対パス（@/ = プロジェクトルート）
import { extractReceiptData } from '@/lib/extraction/receipt-parser'

// 相対パス（同ディレクトリ内のみ許容）
import { ReceiptCard } from './receipt-card'
```

## 重要な設計原則

### APIキーの分離

Claude APIキーはサーバー側環境変数のみ。`app/api/` 配下のRoute Handlerを通じてのみアクセスする。
クライアントコンポーネントからは直接呼ばない。

### 使用量記録の責務

AIを呼び出す関数は必ず使用量トラッキングとセットで実装する。
`lib/anthropic/` 配下にラッパーを設け、呼び出し元が意識しなくて済む設計にする。

### RLSによるデータ分離

Supabaseの全テーブルにRow Level Securityを適用する。
サーバー側では `createServerClient`（service role）を使い、クライアント側はRLSに委ねる。

## 仕様管理

機能Specは `.kiro/specs/{feature}/` に格納。
Spec進捗は `/kiro:spec-status {feature}` で確認。

---

_Document: アーキテクチャパターンと設計原則。ファイルリストではなく新コードが従うべきルールを記述_
