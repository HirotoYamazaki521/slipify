'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils/format'
import type { MonthlySummary } from '@/lib/search/aggregation-service'

interface MonthlySummaryPanelProps {
  summaries: MonthlySummary[]
}

export function MonthlySummaryPanel({ summaries }: MonthlySummaryPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  if (summaries.length === 0) return null

  function applyMonthFilter(month: string) {
    const [year, mon] = month.split('-')
    const lastDay = new Date(Number(year), Number(mon), 0).getDate()
    const start = `${year}-${mon}-01`
    const end = `${year}-${mon}-${String(lastDay).padStart(2, '0')}`
    const params = new URLSearchParams(searchParams.toString())
    params.set('startDate', start)
    params.set('endDate', end)
    router.push(`/receipts?${params.toString()}`)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">月別支出</h3>
      <ul className="space-y-1">
        {summaries.map(({ month, count, totalAmount }) => (
          <li key={month}>
            <button
              onClick={() => applyMonthFilter(month)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-gray-50"
            >
              <span className="text-gray-700">{month}</span>
              <span className="mx-2 text-xs text-gray-400">{count}件</span>
              <span className="font-medium text-gray-900">{formatCurrency(totalAmount)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
