import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createReceiptRepository } from '@/lib/repositories/receipt-repository'
import { ReceiptDetailClient } from '@/components/receipt-detail-client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { CustomAccountCategory } from '@/types/domain'

type PageProps = { params: Promise<{ id: string }> }

interface CustomCategoryRow {
  id: string
  user_id: string
  name: string
  created_at: string
}

export default async function ReceiptDetailPage({ params }: PageProps) {
  const { id } = await params

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const repo = await createReceiptRepository()
  const receipt = await repo.findByIdWithLineItems(id, user.id)
  if (!receipt) notFound()

  // カスタム勘定科目を取得
  const { data: customRows } = await supabase
    .from('custom_account_categories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const customCategories: CustomAccountCategory[] = (
    (customRows as CustomCategoryRow[] | null) ?? []
  ).map((r) => ({ id: r.id, userId: r.user_id, name: r.name, createdAt: r.created_at }))

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/receipts" className="text-sm text-blue-600 hover:underline">
          ← 一覧に戻る
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {/* 基本情報 */}
        <div className="mb-6 space-y-2">
          <h1 className="text-xl font-bold text-gray-900">{receipt.storeName}</h1>
          <p className="text-sm text-gray-500">{formatDate(receipt.receiptDate)}</p>
          <div className="flex gap-6 pt-2">
            <div>
              <span className="text-xs text-gray-500">合計金額</span>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(receipt.totalAmount)}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">税額</span>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(receipt.taxAmount)}
              </p>
            </div>
          </div>
        </div>

        <ReceiptDetailClient receipt={receipt} customCategories={customCategories} />
      </div>
    </div>
  )
}
