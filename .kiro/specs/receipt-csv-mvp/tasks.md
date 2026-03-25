# 実装計画

- [ ] 1. プロジェクト基盤セットアップ

- [x] 1.1 Next.js + TypeScript + 必要パッケージの初期セットアップ
  - Next.js 15 App Router + TypeScript strict モードでプロジェクトを初期化する
  - @supabase/ssr、@anthropic-ai/sdk、Tailwind CSS をインストールする
  - ESLint + Prettier のコード品質設定を行う
  - Vercel デプロイに必要な設定ファイル（vercel.json 等）を準備する
  - _Requirements: 1.1_

- [x] 1.2 Supabase DB スキーマ・RLS・インデックス・Storage の設定
  - Supabase プロジェクトを作成し、接続情報を環境変数（.env.local）に設定する
  - receipts・line_items・export_templates・api_usage_logs・custom_account_categories の 5 テーブルを作成する
  - 各テーブルに Row Level Security を有効化し、`user_id = auth.uid()` ポリシーを設定する
  - 一覧取得のパフォーマンス向上のためインデックスを作成する
  - Supabase Storage に Private 設定の receipts バケットを作成する
  - _Requirements: 4.3, 7.1_

- [x] 1.3 プロジェクト共通のドメイン型定義
  - AccountCategory の固定リスト（消耗品費・交際費・交通費など 12 科目）を定義する
  - Receipt・LineItem・ExportTemplate・ExportColumn など主要ドメイン型を定義する
  - ReceiptSourceField・Delimiter などの列挙型を定義する
  - supabase gen types でデータベース型を自動生成する
  - _Requirements: 8.1_

- [ ] 2. 認証基盤の構築

- [x] 2.1 Supabase クライアント設定と Auth Middleware の実装
  - @supabase/ssr を用いたサーバー側・クライアント側 Supabase クライアントを設定する
  - Next.js Middleware で全リクエストのセッション検証と cookie のリフレッシュを行う
  - 未認証状態でのページアクセスをログインページへリダイレクトする
  - 未認証状態での API アクセスに 401 を返す
  - _Requirements: 1.5_

- [x] 2.2 サインアップ・ログイン・ログアウト機能とページ
  - メールアドレスとパスワードによるサインアップフォームを実装し、メール確認フローを設定する
  - ログインフォームを実装し、成功時にダッシュボードへリダイレクトする
  - 認証失敗時にエラーメッセージを表示する
  - ログアウト処理でセッションを破棄してログインページへリダイレクトする
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3. データアクセス層の実装（Task 2.1 完了後）

- [x] 3.1 (P) ReceiptRepository の実装
  - receipts テーブルと line_items テーブルへの CRUD 操作をまとめた Repository を実装する
  - ユーザーの全レシートを登録日時の降順で取得する機能を実装する
  - レシートを品目リスト付きで取得する機能（単件・複数件）を実装する
  - レシートと関連品目の一括登録・勘定科目の更新・削除を実装する
  - 全操作で user_id フィルタを明示的に付与し、RLS と多重防御を実現する
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3.2 (P) ExportTemplateRepository の実装
  - export_templates テーブルへの CRUD 操作を実装する
  - テンプレート一覧取得・単件取得・デフォルトテンプレート取得を実装する
  - テンプレートの作成・更新・削除を実装する
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 3.3 (P) UsageLogRepository の実装
  - api_usage_logs テーブルへの INSERT 専用 Repository を実装する
  - 成功・失敗の両方のログエントリを記録できる設計にする
  - ログ書き込みエラーが発生しても例外を呼び出し元へ伝播しない
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 4. AI 解析エンジンの実装（Task 1 完了後、Task 3 と並列実行可能）

- [x] 4.1 (P) AnthropicWrapper の実装
  - @anthropic-ai/sdk を用いた Claude API 通信ラッパーを実装する
  - ANTHROPIC_API_KEY はサーバー側環境変数からのみ取得し、クライアントに露出しない
  - 25 秒タイムアウトを設定し、超過時は TIMEOUT エラーを返す
  - API 呼び出し後に使用量（モデル名・トークン数・成否・エラー内容）を UsageLogRepository で記録する
  - ログ書き込み失敗は解析処理のメインフローを中断しない
  - Task 3.3 のインターフェースを参照して実装する（Task 3.3 と並列実行可能）
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 4.2 ReceiptExtractionService の実装（4.1 完了後）
  - Claude API の tool_use でレシート解析ツールを定義し、JSON スキーマで出力形式を強制する
  - ツール定義に勘定科目の固定リストを enum として含め、予測値を強制する
  - Claude のレスポンスをパースして構造化データに変換する
  - UNREADABLE_IMAGE・API_TIMEOUT・API_ERROR・PARSE_FAILED の各エラーを適切に処理する
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 8.2_

- [ ] 5. レシートアップロード・解析機能（Task 2・3・4 完了後）

- [x] 5.1 POST /api/receipts Route Handler の実装
  - multipart/form-data でアップロードされた画像ファイルを受け取り、MIME type とサイズを検証する
  - バリデーション通過後、画像を Supabase Storage の receipts バケットに保存する
  - 保存したバッファを AI 解析エンジンに渡してレシートデータと勘定科目予測を取得する
  - 解析結果（店名・日付・品目・合計金額・税額・予測勘定科目）を DB に保存する
  - バリデーションエラー (400)・解析失敗 (422)・タイムアウト (504)・内部エラー (500) に対応する
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 3.2, 3.3, 3.4, 3.5_

- [x] 5.2 レシートアップロード UI ページとフォームコンポーネント
  - 画像ファイル選択でプレビューを表示するアップロードフォームを実装する
  - ファイル形式・サイズのクライアント側バリデーションとエラー表示を実装する
  - 解析中のローディングインジケーターを表示する
  - 解析完了後にレシート詳細ページへ遷移する
  - _Requirements: 2.1, 2.3, 2.4, 3.1_

- [ ] 6. レシートデータ管理（Task 5 完了後）

- [x] 6.1 レシート CRUD API の実装
  - GET /api/receipts でログインユーザーのレシートを登録日時降順で返し、件数と合計金額のサマリを含める
  - GET /api/receipts/[id] でレシートと品目リストを返す
  - DELETE /api/receipts/[id] でレシートと関連品目を削除する
  - PATCH /api/receipts/[id] で確定勘定科目を更新する
  - 全エンドポイントで user_id フィルタを適用し、他ユーザーのデータアクセスを拒否する
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.3, 8.5_

- [x] 6.2 カスタム勘定科目管理 API の実装
  - GET /api/account-categories で固定科目リストとユーザー独自の科目一覧を返す
  - POST /api/account-categories でカスタム科目を追加する（同一ユーザーに重複名不可）
  - _Requirements: 8.1, 8.4_

- [x] 6.3 レシート一覧ページの実装
  - 登録レシートを登録日時降順で一覧表示するページを実装する
  - 登録件数と全レシートの合計金額サマリを表示する
  - 各レシートカードから詳細ページへ遷移できるようにする
  - _Requirements: 4.1, 4.3, 4.5_

- [x] 6.4 レシート詳細・勘定科目編集ページの実装
  - 店名・日付・品目リスト・合計金額・税額・勘定科目の詳細を表示する
  - 固定リストとカスタム科目を含むドロップダウンで勘定科目を確認・変更できるようにする
  - 変更した勘定科目を保存する処理を実装する
  - 削除確認ダイアログからレシートを削除できるようにする
  - _Requirements: 4.2, 4.4, 8.2, 8.3, 8.4_

- [ ] 7. CSV エクスポート（Task 6 完了後）

- [x] 7.1 (P) CsvGeneratorService の実装
  - ExportTemplate の定義（カラム順・表示名・区切り文字）に従って CSV を生成する
  - 品目が複数のレシートは品目ごとに行を展開する（1 レシート = N 行）
  - UTF-8 BOM を先頭に付加し、Excel での文字化けを防ぐ
  - RFC 4180 に従い、区切り文字・改行・ダブルクオートを含むセルをエスケープする
  - テンプレート未指定時は組み込みデフォルト列順（日付・店名・品目名・単価・数量・小計・合計・税額・勘定科目）で生成する
  - _Requirements: 5.2, 5.3, 5.5, 6.3, 6.4_

- [x] 7.2 GET /api/exports/csv Route Handler の実装（7.1・7.3 完了後）
  - クエリパラメータ receiptIds と templateId を受け取り、CSV を生成してファイルとして配信する
  - Content-Disposition ヘッダで slipify_receipts_YYYYMMDD.csv 形式のファイル名を指定する
  - エクスポート対象が 0 件の場合はエラーを返す
  - _Requirements: 5.1, 5.4, 5.5_

- [x] 7.3 (P) テンプレート管理 API の実装
  - GET /api/export-templates でユーザーのテンプレート一覧を返す
  - POST /api/export-templates でテンプレートを新規作成する
  - PUT /api/export-templates/[id] でカラム定義・区切り文字・名称を更新する
  - DELETE /api/export-templates/[id] でテンプレートを削除する
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 7.4 CSV フォーマット設定ページの実装（7.3 完了後）
  - 現在のカラム定義（表示名・データソース・順序）を一覧表示する設定画面を実装する
  - カラムの追加・削除・並び替え・表示名変更の UI を実装する
  - 区切り文字（カンマ・タブ・セミコロン）の選択機能を実装する
  - テンプレートを保存する処理と、カラム未設定時のエラー表示を実装する
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 7.5 レシート一覧からの CSV エクスポート UI（7.2 完了後）
  - レシート一覧からエクスポート対象を選択する UI を実装する
  - テンプレート選択（デフォルト or 保存済みカスタム）のドロップダウンを実装する
  - エクスポートボタンクリックで CSV ダウンロードを起動する
  - 対象 0 件時のエラーメッセージを表示する
  - _Requirements: 5.1, 5.4, 6.4_

- [ ] 8. テスト

- [ ] 8.1 (P) ビジネスロジックのユニットテスト
  - CsvGeneratorService の複数品目展開・デリミタ差異・UTF-8 BOM 付与・特殊文字エスケープをテストする
  - ReceiptExtractionService の各エラーシナリオ（UNREADABLE_IMAGE・TIMEOUT・PARSE_FAILED）をモックでテストする
  - AnthropicWrapper のログ書き込み失敗時に処理が中断しないことをテストする
  - _Requirements: 3.4, 3.5, 5.2, 5.3, 7.3_

- [ ] 8.2 (P) API インテグレーションテスト
  - POST /api/receipts のアップロード → 解析 → DB 保存の一連フローを検証する
  - GET /api/exports/csv のテンプレート適用・Content-Disposition ヘッダを検証する
  - Auth Middleware の未認証アクセスリダイレクトを検証する
  - _Requirements: 2.5, 3.2, 5.1, 5.3_
