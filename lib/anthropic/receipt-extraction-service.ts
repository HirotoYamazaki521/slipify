import Anthropic from '@anthropic-ai/sdk'
import { createAnthropicWrapper } from '@/lib/anthropic/anthropic-wrapper'
import { ACCOUNT_CATEGORY_LIST, isAccountCategory } from '@/types/domain'
import type { AccountCategory, Result } from '@/types/domain'

export interface ReceiptExtractionResult {
  storeName: string
  receiptDate: string // YYYY-MM-DD
  totalAmount: number
  taxAmount: number
  predictedAccountCategory: AccountCategory
  lineItems: Array<{
    name: string
    unitPrice: number
    quantity: number
    subtotal: number
  }>
}

export type ExtractionError =
  | { code: 'UNREADABLE_IMAGE'; message: string }
  | { code: 'API_TIMEOUT'; message: string }
  | { code: 'API_ERROR'; message: string }
  | { code: 'PARSE_FAILED'; message: string }

export interface ReceiptExtractionService {
  extractFromImage(
    imageBuffer: ArrayBuffer,
    mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
    userId: string
  ): Promise<Result<ReceiptExtractionResult, ExtractionError>>
}

const RECEIPT_EXTRACTION_TOOL: Anthropic.Messages.Tool = {
  name: 'extract_receipt',
  description:
    'レシート画像から構造化データを抽出する。画像がレシートとして読み取れない場合は readable: false を返す。',
  input_schema: {
    type: 'object',
    properties: {
      readable: {
        type: 'boolean',
        description: 'レシートが読み取り可能かどうか',
      },
      store_name: { type: 'string', description: '店名' },
      receipt_date: { type: 'string', description: 'YYYY-MM-DD形式の日付' },
      total_amount: { type: 'number', description: '合計金額（円）' },
      tax_amount: { type: 'number', description: '税額（円）' },
      predicted_account_category: {
        type: 'string',
        enum: ACCOUNT_CATEGORY_LIST as string[],
        description: '予測勘定科目',
      },
      line_items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            unit_price: { type: 'number' },
            quantity: { type: 'number' },
            subtotal: { type: 'number' },
          },
          required: ['name', 'unit_price', 'quantity', 'subtotal'],
        },
      },
    },
    required: ['readable'],
  },
}

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 1024

export function createReceiptExtractionService(): ReceiptExtractionService {
  const wrapper = createAnthropicWrapper()

  return {
    async extractFromImage(
      imageBuffer: ArrayBuffer,
      mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
      userId: string
    ): Promise<Result<ReceiptExtractionResult, ExtractionError>> {
      const base64 = Buffer.from(imageBuffer).toString('base64')

      const messages: Anthropic.Messages.MessageParam[] = [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: base64 },
            },
            {
              type: 'text',
              text: 'このレシート画像からデータを抽出してください。読み取れない場合は readable: false を返してください。',
            },
          ],
        },
      ]

      const wrapperResult = await wrapper.callWithTracking(
        { model: MODEL, messages, tools: [RECEIPT_EXTRACTION_TOOL], maxTokens: MAX_TOKENS },
        userId
      )

      if (!wrapperResult.ok) {
        const { error } = wrapperResult
        if (error.code === 'TIMEOUT') {
          return { ok: false, error: { code: 'API_TIMEOUT', message: error.message } }
        }
        return { ok: false, error: { code: 'API_ERROR', message: error.message } }
      }

      const input = wrapperResult.data.input as Record<string, unknown>

      if (!input.readable) {
        return {
          ok: false,
          error: {
            code: 'UNREADABLE_IMAGE',
            message:
              'レシートの読み取りに失敗しました。画像を確認して再度お試しください。',
          },
        }
      }

      const storeName = String(input.store_name ?? '')
      const receiptDate = String(input.receipt_date ?? '')
      const totalAmount = Number(input.total_amount)
      const taxAmount = Number(input.tax_amount)
      const rawCategory = input.predicted_account_category

      if (!storeName || !receiptDate || isNaN(totalAmount) || isNaN(taxAmount)) {
        return {
          ok: false,
          error: { code: 'PARSE_FAILED', message: '必須フィールドが不足しています' },
        }
      }

      if (!isAccountCategory(rawCategory)) {
        return {
          ok: false,
          error: {
            code: 'PARSE_FAILED',
            message: `不正な勘定科目: ${String(rawCategory)}`,
          },
        }
      }

      const rawItems = Array.isArray(input.line_items) ? input.line_items : []
      const lineItems = (rawItems as Record<string, unknown>[]).map((item) => ({
        name: String(item.name ?? ''),
        unitPrice: Number(item.unit_price),
        quantity: Number(item.quantity),
        subtotal: Number(item.subtotal),
      }))

      return {
        ok: true,
        data: {
          storeName,
          receiptDate,
          totalAmount,
          taxAmount,
          predictedAccountCategory: rawCategory,
          lineItems,
        },
      }
    },
  }
}
