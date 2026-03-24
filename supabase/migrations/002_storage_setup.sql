-- =====================================================
-- Supabase Storage セットアップ
-- receipts バケット（プライベート）
-- =====================================================

-- receipts バケットをプライベートで作成
-- public = false により、サーバー側からのみアクセス可能
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- サービスロールのみがオブジェクトを操作できるポリシー
-- （サーバー側の Route Handler が service_role クライアントで操作するため、
--   RLS ポリシーの追加は不要。バケットの public = false で十分）

-- ユーザーが自分のレシート画像を参照できるポリシー（オプション）
-- CREATE POLICY "receipts_select_owner" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'receipts' AND
--     (storage.foldername(name))[1] = auth.uid()::text
--   );
