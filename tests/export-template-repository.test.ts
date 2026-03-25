import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mapExportTemplateRow } from '@/lib/repositories/export-template-repository'

// --- DB行 → ドメイン変換のテスト ---

describe('mapExportTemplateRow', () => {
  const baseRow = {
    id: 'tpl-1',
    user_id: 'user-1',
    name: 'マイテンプレート',
    columns: [{ label: '日付', sourceField: 'receipt_date', order: 1 }],
    delimiter: ',',
    is_default: false,
    created_at: '2026-03-25T10:00:00Z',
    updated_at: '2026-03-25T10:00:00Z',
  }

  it('snake_case から camelCase に変換される', () => {
    const tpl = mapExportTemplateRow(baseRow)
    expect(tpl.id).toBe('tpl-1')
    expect(tpl.userId).toBe('user-1')
    expect(tpl.name).toBe('マイテンプレート')
    expect(tpl.delimiter).toBe(',')
    expect(tpl.isDefault).toBe(false)
    expect(tpl.createdAt).toBe('2026-03-25T10:00:00Z')
    expect(tpl.updatedAt).toBe('2026-03-25T10:00:00Z')
  })

  it('columns が ExportColumn[] として変換される', () => {
    const tpl = mapExportTemplateRow(baseRow)
    expect(tpl.columns).toHaveLength(1)
    expect(tpl.columns[0].label).toBe('日付')
    expect(tpl.columns[0].sourceField).toBe('receipt_date')
    expect(tpl.columns[0].order).toBe(1)
  })

  it('is_default が true の場合も変換される', () => {
    const tpl = mapExportTemplateRow({ ...baseRow, is_default: true })
    expect(tpl.isDefault).toBe(true)
  })
})

// --- ExportTemplateRepository モックテスト ---

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({ from: mockFrom })
  ),
}))

describe('ExportTemplateRepository', () => {
  const templateRow = {
    id: 'tpl-1',
    user_id: 'user-1',
    name: 'テスト',
    columns: [],
    delimiter: ',',
    is_default: false,
    created_at: '2026-03-25T10:00:00Z',
    updated_at: '2026-03-25T10:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })
    mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder })
    mockEq.mockReturnValue({ order: mockOrder, eq: mockEq, single: mockSingle, limit: mockLimit })
    mockOrder.mockResolvedValue({ data: [templateRow], error: null })
    mockSingle.mockResolvedValue({ data: templateRow, error: null })
    mockLimit.mockResolvedValue({ data: [templateRow], error: null })
    mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: templateRow, error: null }) }) })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockDelete.mockReturnValue({ eq: mockEq })
  })

  it('findMany: user_id でフィルタして一覧取得する', async () => {
    const { createExportTemplateRepository } = await import(
      '@/lib/repositories/export-template-repository'
    )
    const repo = await createExportTemplateRepository()
    const result = await repo.findMany('user-1')

    expect(mockFrom).toHaveBeenCalledWith('export_templates')
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('テスト')
  })

  it('findById: id と user_id でフィルタして単件取得する', async () => {
    const { createExportTemplateRepository } = await import(
      '@/lib/repositories/export-template-repository'
    )
    const repo = await createExportTemplateRepository()
    const result = await repo.findById('tpl-1', 'user-1')

    expect(mockEq).toHaveBeenCalledWith('id', 'tpl-1')
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(result?.id).toBe('tpl-1')
  })

  it('findDefault: is_default = true で取得する', async () => {
    const { createExportTemplateRepository } = await import(
      '@/lib/repositories/export-template-repository'
    )
    const repo = await createExportTemplateRepository()
    await repo.findDefault('user-1')

    expect(mockEq).toHaveBeenCalledWith('is_default', true)
  })
})
