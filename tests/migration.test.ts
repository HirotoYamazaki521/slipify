import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const MIGRATION_PATH = join(process.cwd(), 'supabase/migrations/001_initial_schema.sql')
const STORAGE_PATH = join(process.cwd(), 'supabase/migrations/002_storage_setup.sql')
const ENV_EXAMPLE_PATH = join(process.cwd(), '.env.local.example')

describe('Supabase マイグレーション: 001_initial_schema.sql', () => {
  it('マイグレーションファイルが存在する', () => {
    expect(existsSync(MIGRATION_PATH)).toBe(true)
  })

  describe('テーブル定義 (5テーブル)', () => {
    let sql: string

    beforeAll(() => {
      sql = readFileSync(MIGRATION_PATH, 'utf-8')
    })

    it('receipts テーブルが定義されている', () => {
      expect(sql).toMatch(/CREATE TABLE receipts/)
    })

    it('line_items テーブルが定義されている', () => {
      expect(sql).toMatch(/CREATE TABLE line_items/)
    })

    it('export_templates テーブルが定義されている', () => {
      expect(sql).toMatch(/CREATE TABLE export_templates/)
    })

    it('api_usage_logs テーブルが定義されている', () => {
      expect(sql).toMatch(/CREATE TABLE api_usage_logs/)
    })

    it('custom_account_categories テーブルが定義されている', () => {
      expect(sql).toMatch(/CREATE TABLE custom_account_categories/)
    })
  })

  describe('RLS ポリシー', () => {
    let sql: string

    beforeAll(() => {
      sql = readFileSync(MIGRATION_PATH, 'utf-8')
    })

    it('receipts テーブルに RLS が有効化されている', () => {
      expect(sql).toMatch(/ALTER TABLE receipts ENABLE ROW LEVEL SECURITY/)
    })

    it('line_items テーブルに RLS が有効化されている', () => {
      expect(sql).toMatch(/ALTER TABLE line_items ENABLE ROW LEVEL SECURITY/)
    })

    it('export_templates テーブルに RLS が有効化されている', () => {
      expect(sql).toMatch(/ALTER TABLE export_templates ENABLE ROW LEVEL SECURITY/)
    })

    it('api_usage_logs テーブルに RLS が有効化されている', () => {
      expect(sql).toMatch(/ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY/)
    })

    it('custom_account_categories テーブルに RLS が有効化されている', () => {
      expect(sql).toMatch(/ALTER TABLE custom_account_categories ENABLE ROW LEVEL SECURITY/)
    })

    it('auth.uid() によるポリシーが設定されている', () => {
      expect(sql).toMatch(/user_id = auth\.uid\(\)/)
    })
  })

  describe('インデックス', () => {
    let sql: string

    beforeAll(() => {
      sql = readFileSync(MIGRATION_PATH, 'utf-8')
    })

    it('receipts_user_id_created_at インデックスが作成されている', () => {
      expect(sql).toMatch(/CREATE INDEX receipts_user_id_created_at/)
    })

    it('line_items_receipt_id インデックスが作成されている', () => {
      expect(sql).toMatch(/CREATE INDEX line_items_receipt_id/)
    })

    it('api_usage_logs_user_id_created_at インデックスが作成されている', () => {
      expect(sql).toMatch(/CREATE INDEX api_usage_logs_user_id_created_at/)
    })
  })
})

describe('Supabase マイグレーション: 002_storage_setup.sql', () => {
  it('Storageセットアップファイルが存在する', () => {
    expect(existsSync(STORAGE_PATH)).toBe(true)
  })

  it('receipts バケットの設定が含まれている', () => {
    const sql = readFileSync(STORAGE_PATH, 'utf-8')
    expect(sql).toMatch(/receipts/)
  })

  it('プライベートバケット設定（public = false）が含まれている', () => {
    const sql = readFileSync(STORAGE_PATH, 'utf-8')
    expect(sql).toMatch(/public.*false|false.*public/i)
  })
})

describe('.env.local.example', () => {
  it('.env.local.example ファイルが存在する', () => {
    expect(existsSync(ENV_EXAMPLE_PATH)).toBe(true)
  })

  it('NEXT_PUBLIC_SUPABASE_URL が含まれている', () => {
    const content = readFileSync(ENV_EXAMPLE_PATH, 'utf-8')
    expect(content).toMatch(/NEXT_PUBLIC_SUPABASE_URL/)
  })

  it('NEXT_PUBLIC_SUPABASE_ANON_KEY が含まれている', () => {
    const content = readFileSync(ENV_EXAMPLE_PATH, 'utf-8')
    expect(content).toMatch(/NEXT_PUBLIC_SUPABASE_ANON_KEY/)
  })

  it('ANTHROPIC_API_KEY が含まれている', () => {
    const content = readFileSync(ENV_EXAMPLE_PATH, 'utf-8')
    expect(content).toMatch(/ANTHROPIC_API_KEY/)
  })
})
