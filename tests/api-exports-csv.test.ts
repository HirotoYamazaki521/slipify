import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ExportTemplate } from '@/types/domain'

// ────────────────────────────────────────────
// モック
// ────────────────────────────────────────────

const mockGetUser = vi.fn()
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}))

const mockFindManyWithLineItems = vi.fn()
vi.mock('@/lib/repositories/receipt-repository', () => ({
  createReceiptRepository: vi
    .fn()
    .mockResolvedValue({ findManyWithLineItems: mockFindManyWithLineItems }),
}))

const mockFindById = vi.fn()
const mockFindDefault = vi.fn()
vi.mock('@/lib/repositories/export-template-repository', () => ({
  createExportTemplateRepository: vi
    .fn()
    .mockResolvedValue({ findById: mockFindById, findDefault: mockFindDefault }),
}))

const mockGenerate = vi.fn()
vi.mock('@/lib/csv/csv-generator-service', () => ({
  createCsvGeneratorService: vi.fn().mockReturnValue({ generate: mockGenerate }),
  DEFAULT_EXPORT_TEMPLATE: {
    id: '__default__',
    userId: '',
    name: 'デフォルト',
    delimiter: ',',
    isDefault: true,
    createdAt: '',
    updatedAt: '',
    columns: [],
  } satisfies ExportTemplate,
}))

// ────────────────────────────────────────────
// テストデータ
// ────────────────────────────────────────────

const MOCK_RECEIPT = {
  id: 'r1',
  userId: 'user-1',
  imagePath: 'path/r1.jpg',
  storeName: 'セブンイレブン',
  receiptDate: '2024-01-15',
  totalAmount: 500,
  taxAmount: 50,
  aiAccountCategory: '消耗品費',
  accountCategory: null,
  status: 'processed',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  lineItems: [],
}

const MOCK_TEMPLATE: ExportTemplate = {
  id: 't1',
  userId: 'user-1',
  name: 'カスタム',
  delimiter: '\t',
  isDefault: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  columns: [{ label: '日付', sourceField: 'receipt_date', order: 0 }],
}

function makeRequest(url: string): Request {
  return new Request(url)
}

// ────────────────────────────────────────────
// テスト
// ────────────────────────────────────────────

describe('GET /api/exports/csv', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    mockFindManyWithLineItems.mockResolvedValue([MOCK_RECEIPT])
    mockGenerate.mockReturnValue('\uFEFFtest,csv,content')
    mockFindDefault.mockResolvedValue(null)
    mockFindById.mockResolvedValue(null)
  })

  describe('認証', () => {
    it('未認証の場合 401 を返す', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })
      const { GET } = await import('@/app/api/exports/csv/route')
      const req = makeRequest('http://localhost/api/exports/csv?receiptIds=r1')
      const res = await GET(req as never)
      expect(res.status).toBe(401)
    })
  })

  describe('バリデーション', () => {
    it('receiptIds パラメータなしの場合 400 を返す', async () => {
      const { GET } = await import('@/app/api/exports/csv/route')
      const req = makeRequest('http://localhost/api/exports/csv')
      const res = await GET(req as never)
      expect(res.status).toBe(400)
    })

    it('receiptIds が空文字の場合 400 を返す', async () => {
      const { GET } = await import('@/app/api/exports/csv/route')
      const req = makeRequest('http://localhost/api/exports/csv?receiptIds=')
      const res = await GET(req as never)
      expect(res.status).toBe(400)
    })

    it('対象レシートが 0 件の場合 400 を返す', async () => {
      mockFindManyWithLineItems.mockResolvedValue([])
      const { GET } = await import('@/app/api/exports/csv/route')
      const req = makeRequest('http://localhost/api/exports/csv?receiptIds=r1,r2')
      const res = await GET(req as never)
      expect(res.status).toBe(400)
      const body = (await res.json()) as { error: { code: string } }
      expect(body.error.code).toBe('NO_RECEIPTS')
    })
  })

  describe('正常系', () => {
    it('200 で CSV コンテンツを返す', async () => {
      const { GET } = await import('@/app/api/exports/csv/route')
      const req = makeRequest('http://localhost/api/exports/csv?receiptIds=r1')
      const res = await GET(req as never)
      expect(res.status).toBe(200)
      const text = await res.text()
      // res.text() は UTF-8 BOM を除去するため、コンテンツのみ検証する
      expect(text).toContain('test,csv,content')
    })

    it('Content-Type が text/csv; charset=utf-8', async () => {
      const { GET } = await import('@/app/api/exports/csv/route')
      const req = makeRequest('http://localhost/api/exports/csv?receiptIds=r1')
      const res = await GET(req as never)
      expect(res.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
    })

    it('Content-Disposition に slipify_receipts_YYYYMMDD.csv 形式のファイル名を含む', async () => {
      const { GET } = await import('@/app/api/exports/csv/route')
      const req = makeRequest('http://localhost/api/exports/csv?receiptIds=r1')
      const res = await GET(req as never)
      const disposition = res.headers.get('Content-Disposition') ?? ''
      expect(disposition).toMatch(/attachment; filename="slipify_receipts_\d{8}\.csv"/)
    })

    it('templateId 指定時は findById でテンプレートを取得する', async () => {
      mockFindById.mockResolvedValue(MOCK_TEMPLATE)
      const { GET } = await import('@/app/api/exports/csv/route')
      const req = makeRequest('http://localhost/api/exports/csv?receiptIds=r1&templateId=t1')
      const res = await GET(req as never)
      expect(res.status).toBe(200)
      expect(mockFindById).toHaveBeenCalledWith('t1', 'user-1')
      expect(mockGenerate).toHaveBeenCalledWith([MOCK_RECEIPT], MOCK_TEMPLATE)
    })

    it('templateId 未指定かつ findDefault がテンプレートを返す場合はそれを使用する', async () => {
      mockFindDefault.mockResolvedValue(MOCK_TEMPLATE)
      const { GET } = await import('@/app/api/exports/csv/route')
      const req = makeRequest('http://localhost/api/exports/csv?receiptIds=r1')
      const res = await GET(req as never)
      expect(res.status).toBe(200)
      expect(mockFindDefault).toHaveBeenCalledWith('user-1')
      expect(mockGenerate).toHaveBeenCalledWith(
        [MOCK_RECEIPT],
        expect.objectContaining({ id: 't1' })
      )
    })

    it('templateId 未指定かつ findDefault が null の場合は DEFAULT_EXPORT_TEMPLATE を使用する', async () => {
      mockFindDefault.mockResolvedValue(null)
      const { GET } = await import('@/app/api/exports/csv/route')
      const req = makeRequest('http://localhost/api/exports/csv?receiptIds=r1')
      const res = await GET(req as never)
      expect(res.status).toBe(200)
      expect(mockGenerate).toHaveBeenCalledWith(
        [MOCK_RECEIPT],
        expect.objectContaining({ id: '__default__' })
      )
    })
  })
})
