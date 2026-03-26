# Slipify セットアップメモ

## 必要なもの

- Supabase プロジェクト（[supabase.com](https://supabase.com)）
- Anthropic API キー（[console.anthropic.com](https://console.anthropic.com)）

---

## 1. 環境変数の設定

`.env.local` をプロジェクトルートに作成：

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
ANTHROPIC_API_KEY=<anthropic-api-key>
```

---

## 2. Supabase CLI のインストール

```bash
brew install supabase/tap/supabase
```

※ Xcode Command Line Tools が必要。未インストールの場合：
```bash
sudo xcode-select --install
```

---

## 3. Supabase へログイン・リンク

```bash
supabase login
supabase link --project-ref <project-ref>
```

---

## 4. マイグレーション適用

```bash
supabase db push
```

`supabase/migrations/` 内の以下が適用される：
- `001_initial_schema.sql` — テーブル・RLS・インデックス作成
- `002_storage_setup.sql` — receipts バケット作成

---

## 5. Supabase ダッシュボードでの追加設定

### Storage RLS ポリシー（SQL Editorで実行）

```sql
CREATE POLICY "receipts_insert_owner" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "receipts_select_owner" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

### メール確認をオフにする（開発環境用）

Authentication → Providers → Email → **「Confirm email」を OFF** → Save

---

## 6. 起動

```bash
npm run dev
```

http://localhost:3000 にアクセス。

---

## バグ修正メモ

| 問題 | 原因 | 修正 |
|------|------|------|
| サインアップが504タイムアウト | Supabaseのメール確認送信がタイムアウト | ダッシュボードでメール確認をOFF |
| Storage保存が403エラー | Storage RLSポリシー未設定 | 上記ポリシーをSQL Editorで追加 |
| Storage保存が403エラー（続） | ストレージパスに `receipts/` が重複 | `app/api/receipts/route.ts` のパスを `${user.id}/...` に修正 |
