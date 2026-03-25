import Link from 'next/link'
import { createReceiptRepository } from '@/lib/repositories/receipt-repository'
import { ReceiptCard } from '@/components/receipt-card'
import { formatCurrency } from '@/lib/utils/format'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ReceiptsPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const repo = await createReceiptRepository()
  const receipts = await repo.findMany(user.id)

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

      {/* レシート一覧 */}
      {receipts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center">
          <p className="text-gray-500">レシートがまだ登録されていません</p>
          <Link
            href="/receipts/upload"
            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
          >
            最初のレシートをアップロード
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {receipts.map((receipt) => (
            <li key={receipt.id}>
              <ReceiptCard receipt={receipt} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
