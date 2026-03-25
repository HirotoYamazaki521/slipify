import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createReceiptRepository } from '@/lib/repositories/receipt-repository'
import { createExportTemplateRepository } from '@/lib/repositories/export-template-repository'
import {
  createCsvGeneratorService,
  DEFAULT_EXPORT_TEMPLATE,
} from '@/lib/csv/csv-generator-service'

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const receiptIdsParam = searchParams.get('receiptIds')

  if (!receiptIdsParam || receiptIdsParam.trim() === '') {
    return Response.json(
      { error: { code: 'BAD_REQUEST', message: 'receiptIds は必須です' } },
      { status: 400 }
    )
  }

  const receiptIds = receiptIdsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  if (receiptIds.length === 0) {
    return Response.json(
      { error: { code: 'BAD_REQUEST', message: 'receiptIds は必須です' } },
      { status: 400 }
    )
  }

  const receiptRepo = await createReceiptRepository()
  const receipts = await receiptRepo.findManyWithLineItems(receiptIds, user.id)

  if (receipts.length === 0) {
    return Response.json(
      {
        error: {
          code: 'NO_RECEIPTS',
          message: 'エクスポート対象のレシートが見つかりません',
        },
      },
      { status: 400 }
    )
  }

  const templateId = searchParams.get('templateId')
  const templateRepo = await createExportTemplateRepository()

  let template = DEFAULT_EXPORT_TEMPLATE
  if (templateId) {
    const found = await templateRepo.findById(templateId, user.id)
    if (found) template = found
  } else {
    const defaultTemplate = await templateRepo.findDefault(user.id)
    if (defaultTemplate) template = defaultTemplate
  }

  const csvService = createCsvGeneratorService()
  const csv = csvService.generate(receipts, template)

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `slipify_receipts_${dateStr}.csv`

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
