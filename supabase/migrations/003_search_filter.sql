-- =====================================================
-- 003: 検索フィルタ機能 — RPC 関数・インデックス
-- =====================================================

-- 店名・品目名の横断検索 RPC 関数
-- SECURITY DEFINER で実行し、必ず user_id フィルタを付与する
CREATE OR REPLACE FUNCTION search_receipts(
  p_user_id    UUID,
  p_keyword    TEXT,
  p_start_date DATE DEFAULT NULL,
  p_end_date   DATE DEFAULT NULL
)
RETURNS SETOF receipts
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT DISTINCT r.*
  FROM receipts r
  LEFT JOIN line_items li ON li.receipt_id = r.id
  WHERE r.user_id = p_user_id
    AND (
      r.store_name ILIKE '%' || p_keyword || '%'
      OR li.name   ILIKE '%' || p_keyword || '%'
    )
    AND (p_start_date IS NULL OR r.receipt_date >= p_start_date)
    AND (p_end_date   IS NULL OR r.receipt_date <= p_end_date)
  ORDER BY r.created_at DESC;
$$;

-- 日付範囲フィルタのパフォーマンス向上インデックス
CREATE INDEX IF NOT EXISTS idx_receipts_user_receipt_date
  ON receipts (user_id, receipt_date DESC);
