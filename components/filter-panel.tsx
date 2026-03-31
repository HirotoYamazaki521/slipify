'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { formatCurrency } from '@/lib/utils/format'
import { INPUT_CLASS, INPUT_COMPACT_CLASS } from '@/lib/styles/form'

interface FilterPanelProps {
  availableCategories: string[]
  filteredCount: number
  filteredTotal: number
}

export function FilterPanel({ availableCategories, filteredCount, filteredTotal }: FilterPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const keyword = searchParams.get('keyword') ?? ''
  const startDate = searchParams.get('startDate') ?? ''
  const endDate = searchParams.get('endDate') ?? ''
  const categoriesParam = searchParams.get('categories') ?? ''
  const selectedCategories = categoriesParam ? categoriesParam.split(',').filter(Boolean) : []

  const [keywordInput, setKeywordInput] = useState(keyword)
  const [dateError, setDateError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // URL 変更に keywordInput を同期
  useEffect(() => {
    setKeywordInput(keyword)
  }, [keyword])

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    router.push(`/receipts?${params.toString()}`)
  }

  function handleKeywordChange(value: string) {
    setKeywordInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParams({ keyword: value || null })
    }, 300)
  }

  function handleDateChange(field: 'startDate' | 'endDate', value: string) {
    const newStart = field === 'startDate' ? value : startDate
    const newEnd = field === 'endDate' ? value : endDate

    if (newStart && newEnd && newStart > newEnd) {
      setDateError('開始日は終了日より前に設定してください')
      return
    }
    setDateError(null)
    updateParams({ [field]: value || null })
  }

  function setQuickDate(preset: 'thisMonth' | 'lastMonth' | 'last3Months') {
    const today = new Date()
    let start: string
    let end: string

    if (preset === 'thisMonth') {
      const y = today.getFullYear()
      const m = String(today.getMonth() + 1).padStart(2, '0')
      const lastDay = new Date(y, today.getMonth() + 1, 0).getDate()
      start = `${y}-${m}-01`
      end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`
    } else if (preset === 'lastMonth') {
      const d = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const lastDay = new Date(y, d.getMonth() + 1, 0).getDate()
      start = `${y}-${m}-01`
      end = `${y}-${m}-${String(lastDay).padStart(2, '0')}`
    } else {
      // 直近3ヶ月
      const fromDate = new Date(today.getFullYear(), today.getMonth() - 2, 1)
      const fy = fromDate.getFullYear()
      const fm = String(fromDate.getMonth() + 1).padStart(2, '0')
      const ty = today.getFullYear()
      const tm = String(today.getMonth() + 1).padStart(2, '0')
      const lastDay = new Date(ty, today.getMonth() + 1, 0).getDate()
      start = `${fy}-${fm}-01`
      end = `${ty}-${tm}-${String(lastDay).padStart(2, '0')}`
    }
    setDateError(null)
    updateParams({ startDate: start, endDate: end })
  }

  function toggleCategory(cat: string) {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat]
    updateParams({ categories: next.join(',') || null })
  }

  function clearAll() {
    setKeywordInput('')
    setDateError(null)
    router.push('/receipts')
  }

  const hasFilters =
    keyword.length > 0 || startDate.length > 0 || endDate.length > 0 || selectedCategories.length > 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* 結果サマリ */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {filteredCount} 件 /{' '}
          <span className="font-semibold text-gray-900">{formatCurrency(filteredTotal)}</span>
        </span>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-red-500 hover:underline"
          >
            すべてクリア
          </button>
        )}
      </div>

      {/* 適用中フィルタバッジ */}
      {hasFilters && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {keyword && (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
              &ldquo;{keyword}&rdquo;
              <button
                onClick={() => { setKeywordInput(''); updateParams({ keyword: null }) }}
                className="ml-0.5 hover:text-indigo-900"
              >
                ×
              </button>
            </span>
          )}
          {(startDate || endDate) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
              {startDate || '…'} 〜 {endDate || '…'}
              <button
                onClick={() => updateParams({ startDate: null, endDate: null })}
                className="ml-0.5 hover:text-emerald-900"
              >
                ×
              </button>
            </span>
          )}
          {selectedCategories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700"
            >
              {cat}
              <button onClick={() => toggleCategory(cat)} className="ml-0.5 hover:text-purple-900">
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* テキスト検索 */}
      <div className="mb-3">
        <input
          type="text"
          value={keywordInput}
          onChange={(e) => handleKeywordChange(e.target.value)}
          placeholder="店名・品目名で検索"
          className={INPUT_CLASS}
        />
      </div>

      {/* 日付範囲 — モバイルで縦積み */}
      <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="date"
          value={startDate}
          onChange={(e) => handleDateChange('startDate', e.target.value)}
          className={`flex-1 ${INPUT_COMPACT_CLASS}`}
        />
        <span className="hidden text-gray-400 sm:inline">〜</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => handleDateChange('endDate', e.target.value)}
          className={`flex-1 ${INPUT_COMPACT_CLASS}`}
        />
      </div>
      {dateError && <p className="mb-2 text-xs text-red-500">{dateError}</p>}

      {/* クイック日付選択 */}
      <div className="mb-3 mt-2 flex flex-wrap gap-1.5">
        {(['thisMonth', 'lastMonth', 'last3Months'] as const).map((preset) => (
          <button
            key={preset}
            onClick={() => setQuickDate(preset)}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
          >
            {preset === 'thisMonth' ? '今月' : preset === 'lastMonth' ? '先月' : '直近3ヶ月'}
          </button>
        ))}
      </div>

      {/* 勘定科目フィルタ */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-gray-500">勘定科目</p>
        <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto sm:max-h-none">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`rounded-full px-2 py-0.5 text-xs transition ${
                selectedCategories.includes(cat)
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
