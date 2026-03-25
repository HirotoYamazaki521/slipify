'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { buildCategoryOptions } from '@/lib/utils/category-options'
import { formatCurrency } from '@/lib/utils/format'
import type { Receipt, LineItem, CustomAccountCategory } from '@/types/domain'

interface ReceiptDetailClientProps {
  receipt: Receipt & { lineItems: LineItem[] }
  customCategories: CustomAccountCategory[]
}

export function ReceiptDetailClient({ receipt, customCategories }: ReceiptDetailClientProps) {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState(
    receipt.accountCategory ?? receipt.aiAccountCategory
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const categoryOptions = buildCategoryOptions(
    customCategories,
    receipt.accountCategory
  )

  async function handleSaveCategory() {
    setIsSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/receipts/${receipt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountCategory: selectedCategory }),
      })
      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } }
        setSaveError(body.error?.message ?? '保存に失敗しました')
        return
      }
      router.refresh()
    } catch {
      setSaveError('ネットワークエラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/receipts/${receipt.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } }
        setDeleteError(body.error?.message ?? '削除に失敗しました')
        setIsDeleting(false)
        return
      }
      router.push('/receipts')
    } catch {
      setDeleteError('ネットワークエラーが発生しました')
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 品目リスト */}
      {receipt.lineItems.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">品目</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-1 font-medium">品目名</th>
                <th className="pb-1 text-right font-medium">単価</th>
                <th className="pb-1 text-right font-medium">数量</th>
                <th className="pb-1 text-right font-medium">小計</th>
              </tr>
            </thead>
            <tbody>
              {receipt.lineItems.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-1.5">{item.name}</td>
                  <td className="py-1.5 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="py-1.5 text-right">{item.quantity}</td>
                  <td className="py-1.5 text-right">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* 勘定科目編集 */}
      <section>
        <label className="mb-1 block text-sm font-semibold text-gray-700" htmlFor="category-select">
          勘定科目
        </label>
        <div className="flex gap-2">
          <select
            id="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={isSaving}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
                {opt.isCustom ? ' (カスタム)' : ''}
              </option>
            ))}
          </select>
          <button
            onClick={handleSaveCategory}
            disabled={isSaving || selectedCategory === (receipt.accountCategory ?? receipt.aiAccountCategory)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
        {saveError && <p className="mt-1 text-sm text-red-600">{saveError}</p>}
        <p className="mt-1 text-xs text-gray-500">
          AI 予測: {receipt.aiAccountCategory}
        </p>
      </section>

      {/* 削除ボタン */}
      <section className="border-t pt-4">
        {deleteError && (
          <p className="mb-2 text-sm text-red-600">{deleteError}</p>
        )}
        <button
          onClick={() => setShowDeleteDialog(true)}
          disabled={isDeleting}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          このレシートを削除
        </button>
      </section>

      {/* 削除確認ダイアログ */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">削除の確認</h3>
            <p className="mt-2 text-sm text-gray-600">
              「{receipt.storeName}」のレシートを削除しますか？この操作は取り消せません。
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
