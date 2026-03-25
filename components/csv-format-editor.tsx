'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  addColumn,
  removeColumn,
  moveColumnUp,
  moveColumnDown,
  updateColumnLabel,
  updateColumnSourceField,
  normalizeOrders,
  validateColumns,
} from '@/lib/csv/column-editor-utils'
import { RECEIPT_SOURCE_FIELDS, DELIMITERS } from '@/types/domain'
import type { ExportTemplate, ExportColumn, Delimiter } from '@/types/domain'

const SOURCE_FIELD_LABELS: Record<string, string> = {
  receipt_date: '日付',
  store_name: '店名',
  item_name: '品目名',
  unit_price: '単価',
  quantity: '数量',
  subtotal: '小計',
  total_amount: '合計金額',
  tax_amount: '税額',
  account_category: '勘定科目',
}

const DELIMITER_LABELS: Record<string, string> = {
  ',': 'カンマ (,)',
  '\t': 'タブ (\\t)',
  ';': 'セミコロン (;)',
}

interface CsvFormatEditorProps {
  initialTemplate: ExportTemplate | null
}

export function CsvFormatEditor({ initialTemplate }: CsvFormatEditorProps) {
  const router = useRouter()
  const [templateId] = useState(initialTemplate?.id ?? null)
  const [name, setName] = useState(initialTemplate?.name ?? '新規テンプレート')
  const [columns, setColumns] = useState<ExportColumn[]>(
    initialTemplate?.columns
      ? [...initialTemplate.columns].sort((a, b) => a.order - b.order)
      : []
  )
  const [delimiter, setDelimiter] = useState<Delimiter>(initialTemplate?.delimiter ?? ',')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function handleAddColumn() {
    setColumns((prev) => addColumn(prev))
    setSuccessMessage(null)
  }

  function handleRemoveColumn(index: number) {
    setColumns((prev) => removeColumn(prev, index))
    setSuccessMessage(null)
  }

  function handleMoveUp(index: number) {
    setColumns((prev) => moveColumnUp(prev, index))
    setSuccessMessage(null)
  }

  function handleMoveDown(index: number) {
    setColumns((prev) => moveColumnDown(prev, index))
    setSuccessMessage(null)
  }

  function handleLabelChange(index: number, label: string) {
    setColumns((prev) => updateColumnLabel(prev, index, label))
  }

  function handleSourceFieldChange(index: number, sourceField: string) {
    setColumns((prev) =>
      updateColumnSourceField(prev, index, sourceField as ExportColumn['sourceField'])
    )
  }

  async function handleSave() {
    setSaveError(null)
    setSuccessMessage(null)

    const validationError = validateColumns(columns)
    if (validationError) {
      setSaveError(validationError)
      return
    }

    const normalizedColumns = normalizeOrders(columns)
    setIsSaving(true)

    try {
      const body = { name, columns: normalizedColumns, delimiter }

      let res: Response
      if (templateId) {
        res = await fetch(`/api/export-templates/${templateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/export-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, isDefault: true }),
        })
      }

      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } }
        setSaveError(data.error?.message ?? '保存に失敗しました')
        return
      }

      setSuccessMessage('テンプレートを保存しました')
      router.refresh()
    } catch {
      setSaveError('ネットワークエラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* テンプレート名 */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700" htmlFor="template-name">
          テンプレート名
        </label>
        <input
          id="template-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSaving}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      {/* 区切り文字 */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700" htmlFor="delimiter-select">
          区切り文字
        </label>
        <select
          id="delimiter-select"
          value={delimiter}
          onChange={(e) => setDelimiter(e.target.value as Delimiter)}
          disabled={isSaving}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        >
          {DELIMITERS.map((d) => (
            <option key={d} value={d}>
              {DELIMITER_LABELS[d]}
            </option>
          ))}
        </select>
      </div>

      {/* カラム定義 */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">カラム定義</h2>
          <button
            onClick={handleAddColumn}
            disabled={isSaving}
            className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            + カラムを追加
          </button>
        </div>

        {columns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center">
            <p className="text-sm text-gray-500">カラムが設定されていません</p>
            <button
              onClick={handleAddColumn}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              最初のカラムを追加
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {columns.map((col, index) => (
              <li
                key={index}
                className="flex items-center gap-2 rounded-md border border-gray-200 bg-white p-3"
              >
                {/* 順序番号 */}
                <span className="w-5 text-center text-xs text-gray-400">{index + 1}</span>

                {/* 表示名 */}
                <input
                  type="text"
                  value={col.label}
                  onChange={(e) => handleLabelChange(index, e.target.value)}
                  placeholder="表示名"
                  disabled={isSaving}
                  className="w-32 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none disabled:opacity-50"
                />

                {/* データソース */}
                <select
                  value={col.sourceField}
                  onChange={(e) => handleSourceFieldChange(index, e.target.value)}
                  disabled={isSaving}
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none disabled:opacity-50"
                >
                  {RECEIPT_SOURCE_FIELDS.map((field) => (
                    <option key={field} value={field}>
                      {SOURCE_FIELD_LABELS[field] ?? field}
                    </option>
                  ))}
                </select>

                {/* 移動ボタン */}
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0 || isSaving}
                  title="上に移動"
                  className="rounded px-1 py-0.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === columns.length - 1 || isSaving}
                  title="下に移動"
                  className="rounded px-1 py-0.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                >
                  ▼
                </button>

                {/* 削除ボタン */}
                <button
                  onClick={() => handleRemoveColumn(index)}
                  disabled={isSaving}
                  title="削除"
                  className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 disabled:opacity-50"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* エラー・成功メッセージ */}
      {saveError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{saveError}</p>
      )}
      {successMessage && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-600">{successMessage}</p>
      )}

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  )
}
