import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createReceiptExtractionService } from '@/lib/anthropic/receipt-extraction-service'
import { createReceiptRepository } from '@/lib/repositories/receipt-repository'
import type { Receipt } from '@/types/domain'

// ────────────────────────────────────────────
// GET /api/receipts — レシート一覧取得
// ────────────────────────────────────────────
export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    )
  }

  const repo = await createReceiptRepository()
  const receipts: Receipt[] = await repo.findMany(user.id)
  const total = receipts.length
  const totalAmount = receipts.reduce((sum, r) => sum + r.totalAmount, 0)

  return NextResponse.json({ receipts, total, totalAmount })
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

const MIME_TO_EXT: Record<AllowedMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export async function POST(request: NextRequest) {
  // 1. 認証確認
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    )
  }

  // 2. FormData パース
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'フォームデータの解析に失敗しました' } },
      { status: 500 }
    )
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: { code: 'INVALID_FILE_TYPE', message: 'ファイルが見つかりません' } },
      { status: 400 }
    )
  }

  // 3. MIME タイプ検証
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      {
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'JPEG・PNG・WebP形式のみ対応しています',
        },
      },
      { status: 400 }
    )
  }

  // 4. ファイルサイズ検証
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'ファイルサイズが上限（10MB）を超えています',
        },
      },
      { status: 400 }
    )
  }

  // 5. バッファ取得
  const imageBuffer = await file.arrayBuffer()

  // 6. Supabase Storage へアップロード
  const mimeType = file.type as AllowedMimeType
  const ext = MIME_TO_EXT[mimeType]
  const storagePath = `receipts/${user.id}/${randomUUID()}.${ext}`

  const { error: storageError } = await supabase.storage
    .from('receipts')
    .upload(storagePath, imageBuffer, { contentType: file.type })

  if (storageError) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'ファイルの保存に失敗しました' } },
      { status: 500 }
    )
  }

  // 7. AI 解析
  const extractionService = createReceiptExtractionService()
  const extractionResult = await extractionService.extractFromImage(
    imageBuffer,
    mimeType,
    user.id
  )

  if (!extractionResult.ok) {
    const { error } = extractionResult
    if (error.code === 'UNREADABLE_IMAGE') {
      return NextResponse.json(
        { error: { code: 'UNREADABLE_IMAGE', message: error.message } },
        { status: 422 }
      )
    }
    if (error.code === 'API_TIMEOUT') {
      return NextResponse.json(
        { error: { code: 'API_TIMEOUT', message: error.message } },
        { status: 504 }
      )
    }
    return NextResponse.json(
      { error: { code: 'EXTRACTION_FAILED', message: error.message } },
      { status: 422 }
    )
  }

  // 8. DB 保存
  const repo = await createReceiptRepository()
  let receipt
  try {
    receipt = await repo.create({
      userId: user.id,
      imagePath: storagePath,
      storeName: extractionResult.data.storeName,
      receiptDate: extractionResult.data.receiptDate,
      totalAmount: extractionResult.data.totalAmount,
      taxAmount: extractionResult.data.taxAmount,
      aiAccountCategory: extractionResult.data.predictedAccountCategory,
      lineItems: extractionResult.data.lineItems,
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'データの保存に失敗しました' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ receipt }, { status: 201 })
}
