import Link from 'next/link'
import { createReceiptRepository } from '@/lib/repositories/receipt-repository'
import { createExportTemplateRepository } from '@/lib/repositories/export-template-repository'
import { ReceiptsListClient } from '@/components/receipts-list-client'
import { FilterPanel } from '@/components/filter-panel'
import { MonthlySummaryPanel } from '@/components/monthly-summary-panel'
import { CategorySummaryPanel } from '@/components/category-summary-panel'
import { computeAggregation } from '@/lib/search/aggregation-service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ACCOUNT_CATEGORY_LIST } from '@/types/domain'
import type { ReceiptFilterParams } from '@/types/domain'
import { redirect } from 'next/navigation'

type PageSearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function ReceiptsPage({ searchParams }: { searchParams: PageSearchParams }) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const params = await searchParams
  const keyword = typeof params.keyword === 'string' ? params.keyword : undefined
  const startDate = typeof params.startDate === 'string' ? params.startDate : undefined
  const endDate = typeof params.endDate === 'string' ? params.endDate : undefined
  const categoriesStr = typeof params.categories === 'string' ? params.categories : undefined
  const categories = categoriesStr ? categoriesStr.split(',').filter(Boolean) : undefined

  const filter: ReceiptFilterParams = {}
  if (keyword) filter.keyword = keyword
  if (startDate) filter.startDate = startDate
  if (endDate) filter.endDate = endDate
  if (categories && categories.length > 0) filter.categories = categories

  const hasFilters = Object.keys(filter).length > 0

  const [receiptRepo, templateRepo, customCatsResult] = await Promise.all([
    createReceiptRepository(),
    createExportTemplateRepository(),
    supabase
      .from('custom_account_categories')
      .select('name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const customCategoryNames = (customCatsResult.data ?? []).map(
    (r: { name: string }) => r.name
  )
  const availableCategories = [...ACCOUNT_CATEGORY_LIST, ...customCategoryNames]

  const [receipts, templates] = await Promise.all([
    hasFilters ? receiptRepo.findManyFiltered(user.id, filter) : receiptRepo.findMany(user.id),
    templateRepo.findMany(user.id),
  ])

  const filteredCount = receipts.length
  const filteredTotal = receipts.reduce((sum, r) => sum + r.totalAmount, 0)
  const aggregation = computeAggregation(receipts)

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

      {/* フィルタパネル */}
      <div className="mb-4">
        <FilterPanel
          availableCategories={availableCategories}
          filteredCount={filteredCount}
          filteredTotal={filteredTotal}
        />
      </div>

      {/* 集計サマリ */}
      {receipts.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-4">
          <MonthlySummaryPanel summaries={aggregation.monthlySummaries} />
          <CategorySummaryPanel summaries={aggregation.categorySummaries} />
        </div>
      )}

      {/* レシートが0件のメッセージ */}
      {hasFilters && receipts.length === 0 && (
        <div className="mb-4 rounded-lg border border-dashed border-gray-300 py-8 text-center">
          <p className="text-gray-500">該当するレシートが見つかりませんでした</p>
        </div>
      )}

      {/* レシート一覧（チェックボックス選択 + CSV エクスポート） */}
      <ReceiptsListClient
        receipts={receipts}
        templates={templates}
        filterParams={filter}
      />
    </div>
  )
}
