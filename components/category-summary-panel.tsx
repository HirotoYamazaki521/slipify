'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils/format'
import type { CategorySummary } from '@/lib/search/aggregation-service'

interface CategorySummaryPanelProps {
  summaries: CategorySummary[]
}

export function CategorySummaryPanel({ summaries }: CategorySummaryPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  if (summaries.length === 0) return null

  function applyCategoryFilter(category: string) {
    const params = new URLSearchParams(searchParams.toString())
    const existing = params.get('categories') ?? ''
    const cats = existing ? existing.split(',').filter(Boolean) : []
    if (!cats.includes(category)) {
      cats.push(category)
    }
    params.set('categories', cats.join(','))
    router.push(`/receipts?${params.toString()}`)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">科目別支出</h3>
      <ul className="space-y-1">
        {summaries.map(({ category, count, totalAmount, percentage }) => (
          <li key={category}>
            <button
              onClick={() => applyCategoryFilter(category)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-gray-50"
            >
              <span className="flex-1 text-left text-gray-700">{category}</span>
              <span className="mx-1 text-xs text-gray-400">{count}件</span>
              <span className="mx-1 w-8 text-right text-xs text-gray-400">{percentage}%</span>
              <span className="font-medium text-gray-900">{formatCurrency(totalAmount)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
