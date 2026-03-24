-- =====================================================
-- Slipify 初期スキーマ
-- =====================================================

-- レシートテーブル
CREATE TABLE receipts (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_path           TEXT          NOT NULL,
  store_name           TEXT          NOT NULL,
  receipt_date         DATE          NOT NULL,
  total_amount         NUMERIC(10,2) NOT NULL,
  tax_amount           NUMERIC(10,2) NOT NULL DEFAULT 0,
  ai_account_category  TEXT          NOT NULL,
  account_category     TEXT,
  status               TEXT          NOT NULL DEFAULT 'processed'
                       CHECK (status IN ('pending', 'processed', 'failed')),
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 品目テーブル
CREATE TABLE line_items (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id   UUID          NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  name         TEXT          NOT NULL,
  unit_price   NUMERIC(10,2) NOT NULL,
  quantity     NUMERIC(10,3) NOT NULL DEFAULT 1,
  subtotal     NUMERIC(10,2) NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- CSVエクスポートテンプレートテーブル
CREATE TABLE export_templates (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  columns    JSONB       NOT NULL,
  delimiter  TEXT        NOT NULL DEFAULT ','
             CHECK (delimiter IN (',', E'\t', ';')),
  is_default BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API使用量ログテーブル
CREATE TABLE api_usage_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id),
  model         TEXT        NOT NULL,
  input_tokens  INTEGER     NOT NULL DEFAULT 0,
  output_tokens INTEGER     NOT NULL DEFAULT 0,
  entity_type   TEXT        NOT NULL,
  status        TEXT        NOT NULL CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- カスタム勘定科目テーブル
CREATE TABLE custom_account_categories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- =====================================================
-- インデックス
-- =====================================================

CREATE INDEX receipts_user_id_created_at
  ON receipts(user_id, created_at DESC);

CREATE INDEX line_items_receipt_id
  ON line_items(receipt_id);

CREATE INDEX api_usage_logs_user_id_created_at
  ON api_usage_logs(user_id, created_at DESC);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- receipts: ユーザーは自分のレシートのみ操作可能
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY receipts_owner ON receipts
  FOR ALL USING (user_id = auth.uid());

-- line_items: 自分のレシートに紐づく品目のみ操作可能
ALTER TABLE line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY line_items_owner ON line_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM receipts r
      WHERE r.id = line_items.receipt_id AND r.user_id = auth.uid()
    )
  );

-- export_templates: ユーザーは自分のテンプレートのみ操作可能
ALTER TABLE export_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY templates_owner ON export_templates
  FOR ALL USING (user_id = auth.uid());

-- api_usage_logs: ユーザーは自分のログのみ参照可能（書き込みはサービスロールのみ）
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY usage_logs_read ON api_usage_logs
  FOR SELECT USING (user_id = auth.uid());

-- custom_account_categories: ユーザーは自分のカスタム科目のみ操作可能
ALTER TABLE custom_account_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY categories_owner ON custom_account_categories
  FOR ALL USING (user_id = auth.uid());
