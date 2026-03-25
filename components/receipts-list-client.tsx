'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { buildExportUrl, validateExportSelection } from '@/lib/csv/export-url-builder'
import type { Receipt, ExportTemplate } from '@/types/domain'

interface ReceiptsListClientProps {
  receipts: Receipt[]
  templates: ExportTemplate[]
}

export function ReceiptsListClient({ receipts, templates }: ReceiptsListClientProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [exportError, setExportError] = useState<string | null>(null)

  const allSelected = receipts.length > 0 && selectedIds.size === receipts.length
  const someSelected = selectedIds.size > 0 && !allSelected

  function toggleReceipt(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setExportError(null)
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(receipts.map((r) => r.id)))
    }
    setExportError(null)
  }

  function handleExport() {
    const ids = Array.from(selectedIds)
    const error = validateExportSelection(ids)
    if (error) {
      setExportError(error)
      return
    }

    const templateId = selectedTemplateId || null
    const url = buildExportUrl(ids, templateId)
    window.location.href = url
  }

  if (receipts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center">
        <p className="text-gray-500">レシートがまだ登録されていません</p>
        <Link
          href="/receipts/upload"
          className="mt-3 inline-block text-sm text-blue-600 hover:underline"
        >
          最初のレシートをアップロード
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 全選択 */}
      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected
            }}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          すべて選択
        </label>
        <span className="text-sm text-gray-500">{selectedIds.size} 件選択中</span>
      </div>

      {/* レシート一覧 */}
      <ul className="space-y-2">
        {receipts.map((receipt) => {
          const displayCategory = receipt.accountCategory ?? receipt.aiAccountCategory
          return (
            <li
              key={receipt.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(receipt.id)}
                onChange={() => toggleReceipt(receipt.id)}
                className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-blue-600"
              />
              <Link
                href={`/receipts/${receipt.id}`}
                className="min-w-0 flex-1 transition hover:opacity-80"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{receipt.storeName}</p>
                    <p className="mt-0.5 text-sm text-gray-500">{formatDate(receipt.receiptDate)}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(receipt.totalAmount)}
                    </p>
                    <span className="mt-0.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      {displayCategory}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

      {/* CSV エクスポートパネル */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">CSV エクスポート</h2>
        <div className="flex flex-wrap items-center gap-3">
          {/* テンプレート選択 */}
          <div className="flex items-center gap-2">
            <label htmlFor="template-select" className="text-sm text-gray-600">
              フォーマット:
            </label>
            <select
              id="template-select"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">デフォルト</option>
              {templates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name}
                  {tmpl.isDefault ? ' (デフォルト)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* エクスポートボタン */}
          <button
            onClick={handleExport}
            className="rounded-md bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            CSV をダウンロード
          </button>

          {/* フォーマット設定へのリンク */}
          <Link
            href="/settings/csv-format"
            className="text-xs text-gray-500 hover:underline"
          >
            フォーマット設定 →
          </Link>
        </div>

        {/* エラー表示 */}
        {exportError && (
          <p className="mt-2 text-sm text-red-600">{exportError}</p>
        )}
      </div>
    </div>
  )
}
