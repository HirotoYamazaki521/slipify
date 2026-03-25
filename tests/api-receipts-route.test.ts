import { describe, it, expect, vi, beforeEach } from 'vitest'

// Supabase サーバークライアントのモック
const mockGetUser = vi.fn()
const mockStorageUpload = vi.fn()
const mockStorageFrom = vi.fn().mockReturnValue({ upload: mockStorageUpload })

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    storage: { from: mockStorageFrom },
  }),
}))

// ReceiptExtractionService のモック
const mockExtractFromImage = vi.fn()
vi.mock('@/lib/anthropic/receipt-extraction-service', () => ({
  createReceiptExtractionService: vi.fn().mockReturnValue({
    extractFromImage: mockExtractFromImage,
  }),
}))

// ReceiptRepository のモック
const mockRepoCreate = vi.fn()
vi.mock('@/lib/repositories/receipt-repository', () => ({
  createReceiptRepository: vi.fn().mockResolvedValue({
    create: mockRepoCreate,
  }),
}))

// テスト用定数
const MOCK_USER = { id: 'user-1' }
const MOCK_RECEIPT = {
  id: 'receipt-1',
  userId: 'user-1',
  imagePath: 'receipts/user-1/uuid.jpg',
  storeName: 'セブンイレブン',
  receiptDate: '2024-01-15',
  totalAmount: 1000,
  taxAmount: 100,
  aiAccountCategory: '消耗品費',
  accountCategory: null,
  status: 'processed',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  lineItems: [],
}
const SUCCESS_EXTRACTION = {
  ok: true as const,
  data: {
    storeName: 'セブンイレブン',
    receiptDate: '2024-01-15',
    totalAmount: 1000,
    taxAmount: 100,
    predictedAccountCategory: '消耗品費' as const,
    lineItems: [],
  },
}

function makeRequest(file?: File): Request {
  const formData = new FormData()
  if (file) formData.append('file', file)
  return new Request('http://localhost/api/receipts', { method: 'POST', body: formData })
}

describe('POST /api/receipts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null })
    mockStorageUpload.mockResolvedValue({ data: { path: 'receipts/user-1/uuid.jpg' }, error: null })
    mockExtractFromImage.mockResolvedValue(SUCCESS_EXTRACTION)
    mockRepoCreate.mockResolvedValue(MOCK_RECEIPT)
  })

  describe('成功ケース', () => {
    it('正常な JPEG ファイルで 201 を返す', async () => {
      const { POST } = await import('@/app/api/receipts/route')
      const file = new File([new Uint8Array(1024)], 'test.jpg', { type: 'image/jpeg' })
      const res = await POST(makeRequest(file) as never)

      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.receipt.storeName).toBe('セブンイレブン')
    })

    it('PNG ファイルも受け付ける', async () => {
      const { POST } = await import('@/app/api/receipts/route')
      const file = new File([new Uint8Array(1024)], 'test.png', { type: 'image/png' })
      const res = await POST(makeRequest(file) as never)
      expect(res.status).toBe(201)
    })

    it('Storage・ExtractionService・Repository が順に呼ばれる', async () => {
      const { POST } = await import('@/app/api/receipts/route')
      const file = new File([new Uint8Array(1024)], 'test.jpg', { type: 'image/jpeg' })
      await POST(makeRequest(file) as never)

      expect(mockStorageFrom).toHaveBeenCalledWith('receipts')
      expect(mockStorageUpload).toHaveBeenCalled()
      expect(mockExtractFromImage).toHaveBeenCalled()
      expect(mockRepoCreate).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', storeName: 'セブンイレブン' })
      )
    })

    it('ストレージパスが receipts/{userId}/ から始まる', async () => {
      const { POST } = await import('@/app/api/receipts/route')
      const file = new File([new Uint8Array(1024)], 'test.jpg', { type: 'image/jpeg' })
      await POST(makeRequest(file) as never)

      const [uploadPath] = mockStorageUpload.mock.calls[0]
      expect(uploadPath).toMatch(/^receipts\/user-1\//)
      expect(uploadPath).toMatch(/\.jpg$/)
    })
  })

  describe('認証エラー（401）', () => {
    it('未認証の場合 401 を返す', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
      const { POST } = await import('@/app/api/receipts/route')
      const file = new File([new Uint8Array(1024)], 'test.jpg', { type: 'image/jpeg' })
      const res = await POST(makeRequest(file) as never)
      expect(res.status).toBe(401)
    })
  })

  describe('バリデーションエラー（400）', () => {
    it('ファイルなしの場合 400 を返す', async () => {
      const { POST } = await import('@/app/api/receipts/route')
      const res = await POST(makeRequest() as never)
      expect(res.status).toBe(400)
    })

    it('サポート外 MIME タイプで INVALID_FILE_TYPE / 400 を返す', async () => {
      const { POST } = await import('@/app/api/receipts/route')
      const file = new File([new Uint8Array(1024)], 'test.pdf', { type: 'application/pdf' })
      const res = await POST(makeRequest(file) as never)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error.code).toBe('INVALID_FILE_TYPE')
    })

    it('10MB 超のファイルで FILE_TOO_LARGE / 400 を返す', async () => {
      const { POST } = await import('@/app/api/receipts/route')
      const file = new File([new Uint8Array(11 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      })
      const res = await POST(makeRequest(file) as never)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error.code).toBe('FILE_TOO_LARGE')
    })
  })

  describe('AI 解析エラー', () => {
    it('UNREADABLE_IMAGE で 422 / UNREADABLE_IMAGE を返す', async () => {
      mockExtractFromImage.mockResolvedValueOnce({
        ok: false,
        error: { code: 'UNREADABLE_IMAGE', message: '読み取り失敗' },
      })
      const { POST } = await import('@/app/api/receipts/route')
      const file = new File([new Uint8Array(1024)], 'test.jpg', { type: 'image/jpeg' })
      const res = await POST(makeRequest(file) as never)
      expect(res.status).toBe(422)
      const body = await res.json()
      expect(body.error.code).toBe('UNREADABLE_IMAGE')
    })

    it('API_TIMEOUT で 504 を返す', async () => {
      mockExtractFromImage.mockResolvedValueOnce({
        ok: false,
        error: { code: 'API_TIMEOUT', message: 'タイムアウト' },
      })
      const { POST } = await import('@/app/api/receipts/route')
      const file = new File([new Uint8Array(1024)], 'test.jpg', { type: 'image/jpeg' })
      const res = await POST(makeRequest(file) as never)
      expect(res.status).toBe(504)
    })

    it('API_ERROR で 422 / EXTRACTION_FAILED を返す', async () => {
      mockExtractFromImage.mockResolvedValueOnce({
        ok: false,
        error: { code: 'API_ERROR', message: 'APIエラー' },
      })
      const { POST } = await import('@/app/api/receipts/route')
      const file = new File([new Uint8Array(1024)], 'test.jpg', { type: 'image/jpeg' })
      const res = await POST(makeRequest(file) as never)
      expect(res.status).toBe(422)
      const body = await res.json()
      expect(body.error.code).toBe('EXTRACTION_FAILED')
    })
  })

  describe('システムエラー（500）', () => {
    it('Storage アップロード失敗で INTERNAL_ERROR / 500 を返す', async () => {
      mockStorageUpload.mockResolvedValueOnce({ data: null, error: new Error('Storage error') })
      const { POST } = await import('@/app/api/receipts/route')
      const file = new File([new Uint8Array(1024)], 'test.jpg', { type: 'image/jpeg' })
      const res = await POST(makeRequest(file) as never)
      expect(res.status).toBe(500)
      const body = await res.json()
      expect(body.error.code).toBe('INTERNAL_ERROR')
    })

    it('DB 保存失敗で 500 を返す', async () => {
      mockRepoCreate.mockRejectedValueOnce(new Error('DB error'))
      const { POST } = await import('@/app/api/receipts/route')
      const file = new File([new Uint8Array(1024)], 'test.jpg', { type: 'image/jpeg' })
      const res = await POST(makeRequest(file) as never)
      expect(res.status).toBe(500)
    })
  })
})
