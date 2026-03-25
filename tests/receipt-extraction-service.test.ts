import { describe, it, expect, vi, beforeEach } from 'vitest'

// AnthropicWrapper モック
const mockCallWithTracking = vi.fn()
vi.mock('@/lib/anthropic/anthropic-wrapper', () => ({
  createAnthropicWrapper: vi.fn().mockReturnValue({
    callWithTracking: mockCallWithTracking,
  }),
}))

const IMAGE_BUFFER = new ArrayBuffer(8)
const MIME_TYPE = 'image/jpeg' as const
const USER_ID = 'user-1'

const VALID_TOOL_INPUT = {
  readable: true,
  store_name: 'コンビニA',
  receipt_date: '2024-01-15',
  total_amount: 1000,
  tax_amount: 100,
  predicted_account_category: '消耗品費',
  line_items: [{ name: 'コーヒー', unit_price: 150, quantity: 1, subtotal: 150 }],
}

function makeToolUseBlock(input: Record<string, unknown>) {
  return {
    ok: true as const,
    data: { type: 'tool_use', id: 'tool-1', name: 'extract_receipt', input },
  }
}

describe('ReceiptExtractionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('extractFromImage: 成功ケース', () => {
    it('正常なレシート画像から構造化データを返す', async () => {
      mockCallWithTracking.mockResolvedValueOnce(makeToolUseBlock(VALID_TOOL_INPUT))

      const { createReceiptExtractionService } = await import(
        '@/lib/anthropic/receipt-extraction-service'
      )
      const service = createReceiptExtractionService()
      const result = await service.extractFromImage(IMAGE_BUFFER, MIME_TYPE, USER_ID)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.storeName).toBe('コンビニA')
        expect(result.data.receiptDate).toBe('2024-01-15')
        expect(result.data.totalAmount).toBe(1000)
        expect(result.data.taxAmount).toBe(100)
        expect(result.data.predictedAccountCategory).toBe('消耗品費')
        expect(result.data.lineItems).toHaveLength(1)
        expect(result.data.lineItems[0].name).toBe('コーヒー')
        expect(result.data.lineItems[0].unitPrice).toBe(150)
        expect(result.data.lineItems[0].quantity).toBe(1)
        expect(result.data.lineItems[0].subtotal).toBe(150)
      }
    })

    it('品目なしのレシートも正常に処理する', async () => {
      mockCallWithTracking.mockResolvedValueOnce(
        makeToolUseBlock({ ...VALID_TOOL_INPUT, line_items: [] })
      )

      const { createReceiptExtractionService } = await import(
        '@/lib/anthropic/receipt-extraction-service'
      )
      const service = createReceiptExtractionService()
      const result = await service.extractFromImage(IMAGE_BUFFER, MIME_TYPE, USER_ID)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data.lineItems).toHaveLength(0)
      }
    })

    it('AnthropicWrapper に画像バッファと mimeType を渡す', async () => {
      mockCallWithTracking.mockResolvedValueOnce(makeToolUseBlock(VALID_TOOL_INPUT))

      const { createReceiptExtractionService } = await import(
        '@/lib/anthropic/receipt-extraction-service'
      )
      const service = createReceiptExtractionService()
      await service.extractFromImage(IMAGE_BUFFER, MIME_TYPE, USER_ID)

      expect(mockCallWithTracking).toHaveBeenCalledOnce()
      const [params, userId] = mockCallWithTracking.mock.calls[0]
      expect(userId).toBe(USER_ID)
      expect(params.tools[0].name).toBe('extract_receipt')
      // メッセージに画像コンテンツが含まれること
      const imageContent = params.messages[0].content.find(
        (c: { type: string }) => c.type === 'image'
      )
      expect(imageContent).toBeDefined()
      expect(imageContent.source.media_type).toBe('image/jpeg')
    })
  })

  describe('extractFromImage: UNREADABLE_IMAGE', () => {
    it('readable: false の場合 UNREADABLE_IMAGE エラーを返す', async () => {
      mockCallWithTracking.mockResolvedValueOnce(
        makeToolUseBlock({ readable: false })
      )

      const { createReceiptExtractionService } = await import(
        '@/lib/anthropic/receipt-extraction-service'
      )
      const service = createReceiptExtractionService()
      const result = await service.extractFromImage(IMAGE_BUFFER, MIME_TYPE, USER_ID)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('UNREADABLE_IMAGE')
      }
    })
  })

  describe('extractFromImage: API_TIMEOUT', () => {
    it('AnthropicWrapper が TIMEOUT を返した場合 API_TIMEOUT エラーを返す', async () => {
      mockCallWithTracking.mockResolvedValueOnce({
        ok: false,
        error: { code: 'TIMEOUT', message: 'タイムアウト' },
      })

      const { createReceiptExtractionService } = await import(
        '@/lib/anthropic/receipt-extraction-service'
      )
      const service = createReceiptExtractionService()
      const result = await service.extractFromImage(IMAGE_BUFFER, MIME_TYPE, USER_ID)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('API_TIMEOUT')
      }
    })
  })

  describe('extractFromImage: API_ERROR', () => {
    it('AnthropicWrapper が API_ERROR を返した場合 API_ERROR エラーを返す', async () => {
      mockCallWithTracking.mockResolvedValueOnce({
        ok: false,
        error: { code: 'API_ERROR', message: 'APIエラー', statusCode: 500 },
      })

      const { createReceiptExtractionService } = await import(
        '@/lib/anthropic/receipt-extraction-service'
      )
      const service = createReceiptExtractionService()
      const result = await service.extractFromImage(IMAGE_BUFFER, MIME_TYPE, USER_ID)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('API_ERROR')
      }
    })
  })

  describe('extractFromImage: PARSE_FAILED', () => {
    it('必須フィールドが欠如している場合 PARSE_FAILED エラーを返す', async () => {
      mockCallWithTracking.mockResolvedValueOnce(
        makeToolUseBlock({ readable: true /* 必須フィールドが欠如 */ })
      )

      const { createReceiptExtractionService } = await import(
        '@/lib/anthropic/receipt-extraction-service'
      )
      const service = createReceiptExtractionService()
      const result = await service.extractFromImage(IMAGE_BUFFER, MIME_TYPE, USER_ID)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('PARSE_FAILED')
      }
    })

    it('不正な勘定科目の場合 PARSE_FAILED エラーを返す', async () => {
      mockCallWithTracking.mockResolvedValueOnce(
        makeToolUseBlock({
          ...VALID_TOOL_INPUT,
          predicted_account_category: '不明な科目',
        })
      )

      const { createReceiptExtractionService } = await import(
        '@/lib/anthropic/receipt-extraction-service'
      )
      const service = createReceiptExtractionService()
      const result = await service.extractFromImage(IMAGE_BUFFER, MIME_TYPE, USER_ID)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('PARSE_FAILED')
      }
    })
  })
})
