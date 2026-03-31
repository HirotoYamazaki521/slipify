# 実装計画

- [x] 1. DB マイグレーション

- [x] 1.1 検索用 RPC 関数とインデックスの追加
  - 店名・品目名を横断して ILIKE 検索できる PostgreSQL 関数 `search_receipts` を作成する（DISTINCT + LEFT JOIN + user_id フィルタ必須）
  - 日付範囲フィルタのパフォーマンス向上のために `receipts(user_id, receipt_date DESC)` 複合インデックスを追加する
  - RPC 関数は `SECURITY DEFINER` で作成し、内部で `user_id = p_user_id` の条件を必ず付与してデータ漏洩を防ぐ
  - _Requirements: 1.1, 2.1_

- [x] 2. フィルタ型定義と Repository 拡張

- [x] 2.1 (P) フィルタ条件の型定義
  - `keyword`・`startDate`・`endDate`・`categories` を持つ `ReceiptFilterParams` 型を共通型定義ファイルに追加する
  - `startDate <= endDate` の制約はアプリ層で保証することをコメントで明示する
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 3.1_

- [x] 2.2 ReceiptRepository にフィルタ付き取得メソッドを追加する（Task 1 完了後）
  - `findManyFiltered(userId, filter)` を `ReceiptRepository` インターフェースと実装に追加する
  - keyword が指定された場合は `search_receipts` RPC を呼び出し、ない場合は Supabase JS チェーンでクエリを構築する
  - 日付範囲は `.gte('receipt_date', startDate)` / `.lte('receipt_date', endDate)` で適用する
  - カテゴリフィルタは `account_category` と `ai_account_category` の両方を OR 条件で検索する（`確定済みまたはAI予測` の要件）
  - 複数フィルタが指定された場合は AND 条件として全て適用する
  - 全操作で `user_id` フィルタを明示的に付与する
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1_

- [x] 3. (P) 集計サービスの実装（Task 2.1 完了後）

- [x] 3.1 (P) 月別・科目別集計を計算する純粋関数群の実装
  - フィルタ済みレシート配列を受け取り、月別サマリ（月・件数・合計金額）を降順で返す関数を実装する
  - 同じ配列から科目別サマリ（科目名・件数・合計金額・割合）を合計金額降順で返す関数を実装する
  - 科目の決定は `accountCategory`（確定値）優先、ない場合は `aiAccountCategory`（AI予測）を使用する
  - `percentage` は整数化し、合計が 100 になるよう最大値項目で端数を調整する
  - DB アクセスなし・副作用なしの純粋関数として実装する
  - _Requirements: 5.1, 5.2, 5.4, 6.1, 6.2, 6.3_

- [x] 4. フィルタ UI コンポーネントの実装

- [x] 4.1 FilterPanel コンポーネントの実装（Task 2.1 完了後）
  - URL search params を Single Source of Truth として読み書きするクライアントコンポーネントを実装する
  - テキスト入力欄・開始日/終了日ピッカー・勘定科目複数選択のUIを実装する
  - 「今月」「先月」「直近3ヶ月」のクイック日付選択ボタンを実装する
  - テキスト入力は 300ms デバウンスで URL を更新し、過剰なサーバー再レンダリングを防ぐ
  - 開始日 > 終了日の入力時はフォームレベルでエラーメッセージを表示し、URL は更新しない
  - 適用中のフィルタをバッジ形式で表示し、各バッジに個別クリアボタンを付ける
  - 「すべてクリア」ボタンで全フィルタパラメータを URL から一括除去する
  - フィルタ後件数と合計金額をリアルタイムに表示する（props として受け取る）
  - _Requirements: 1.1, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.4, 4.2, 4.3, 4.4_

- [x] 4.2 (P) サマリ表示コンポーネントの実装（Task 3.1 完了後）
  - 月別サマリを降順リスト形式で表示する `MonthlySummaryPanel` を実装する
  - 科目別サマリを合計金額降順・割合付きで表示する `CategorySummaryPanel` を実装する
  - 各サマリ項目のクリックで対応するフィルタを URL search params に適用する（`useRouter` を使用）
  - 月別クリックは開始日・終了日をその月の初日〜末日に設定する
  - 科目別クリックはカテゴリフィルタにその科目を追加する
  - _Requirements: 5.2, 5.3, 5.4, 6.2, 6.3, 6.4_

- [x] 5. ReceiptsPage の統合（Task 2.2・3.1・4.1・4.2 完了後）

- [x] 5.1 ReceiptsPage に searchParams によるフィルタ処理を組み込む
  - `searchParams` から `ReceiptFilterParams` を構築して `findManyFiltered` を呼び出すよう変更する
  - `AggregationService` でフィルタ済みレシートから月別・科目別集計を計算してコンポーネントに渡す
  - `FilterPanel`・`MonthlySummaryPanel`・`CategorySummaryPanel` を一覧ページに配置する
  - フィルタ後件数・合計金額を `FilterPanel` に props として渡す
  - フィルタ後レシートが 0 件の場合は「該当するレシートが見つかりませんでした」を表示する
  - 利用可能な勘定科目一覧（固定リスト＋カスタム科目）を `FilterPanel` に渡す
  - _Requirements: 1.3, 4.1, 4.4, 5.1, 6.1_

- [x] 6. (P) GET /api/receipts にフィルタ対応を追加する（Task 2.2 完了後）

- [x] 6.1 (P) レシート一覧 API にクエリパラメータフィルタを追加する
  - `keyword`・`startDate`・`endDate`・`categories`（カンマ区切り）のクエリパラメータを受け取るよう Route Handler を拡張する
  - パラメータを `ReceiptFilterParams` に変換して `findManyFiltered` を呼び出す
  - レスポンスは既存の `{ receipts, total, totalAmount }` 形式を維持する
  - _Requirements: 7.1_

- [x] 7. CSV エクスポートとフィルタの連携（Task 5.1・6.1 完了後）

- [x] 7.1 フィルタ後レシートの ID を使って CSV エクスポートを行う
  - `ReceiptsListClient` がフィルタ後レシートの ID 一覧を props として受け取るよう変更する
  - エクスポート実行時はフィルタ後の ID のみを `/api/exports/csv` の `receiptIds` パラメータに渡す
  - 日付範囲フィルタが適用されている場合はファイル名に期間情報を含める（例: `slipify_receipts_20260101_20260331.csv`）
  - フィルタ後 0 件の状態でエクスポートしようとした場合は既存の「エクスポート対象がありません」エラーをそのまま表示する
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 8. テスト

- [x] 8.1 (P) AggregationService のユニットテスト
  - 空配列 → 空集計を返すことを確認する
  - 複数月にまたがるレシートが月別降順で正しく集計されることを確認する
  - `accountCategory` がある場合は `aiAccountCategory` を使わないことを確認する
  - `percentage` の合計が 100 になる（端数調整込み）ことを確認する
  - _Requirements: 5.1, 5.2, 5.4, 6.1, 6.2, 6.3_

- [x] 8.2 (P) Repository findManyFiltered のインテグレーションテスト
  - keyword のみ指定で store_name・item name の両方が一致するレシートが返ることを確認する
  - 日付範囲フィルタが境界値を含めて正しく機能することを確認する
  - 複数カテゴリの OR 条件が `account_category` と `ai_account_category` の両方に適用されることを確認する
  - 複合フィルタ（keyword + 日付 + カテゴリ）が AND 条件で機能することを確認する
  - _Requirements: 1.1, 1.2, 2.1, 3.1, 3.3, 4.1_

- [ ]* 8.3 フィルタ〜CSV エクスポートの E2E テスト（Task 7.1 完了後）
  - フィルタ入力 → URL params 更新 → 一覧が絞り込まれる一連のフローを検証する
  - 月別サマリクリック → 日付フィルタが自動適用されることを確認する
  - フィルタ適用中に CSV エクスポート → フィルタ後 ID でファイルがダウンロードされることを確認する
  - _Requirements: 1.1, 5.3, 6.4, 7.1, 7.2_
