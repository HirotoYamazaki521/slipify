import Link from 'next/link'
import { createReceiptRepository } from '@/lib/repositories/receipt-repository'
import { createExportTemplateRepository } from '@/lib/repositories/export-template-repository'
import { ReceiptsListClient } from '@/components/receipts-list-client'
import { formatCurrency } from '@/lib/utils/format'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ReceiptsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [receiptRepo, templateRepo] = await Promise.all([
    createReceiptRepository(),
    createExportTemplateRepository(),
  ])

  const [receipts, templates] = await Promise.all([
    receiptRepo.findMany(user.id),
    templateRepo.findMany(user.id),
  ])

  const total = receipts.length
  const totalAmount = receipts.reduce((sum, r) => sum + r.totalAmount, 0)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">レシート一覧</h1>
        <Link
          href="/receipts/upload"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          アップロード
        </Link>
      </div>

      {/* サマリ */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
          <p className="text-sm text-gray-500">登録件数</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{total} 件</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
          <p className="text-sm text-gray-500">合計金額</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      {/* レシート一覧（チェックボックス選択 + CSV エクスポート） */}
      <ReceiptsListClient receipts={receipts} templates={templates} />
    </div>
  )
}
