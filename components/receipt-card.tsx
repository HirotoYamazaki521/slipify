import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { Receipt } from '@/types/domain'

interface ReceiptCardProps {
  receipt: Receipt
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  const displayCategory = receipt.accountCategory ?? receipt.aiAccountCategory

  return (
    <Link
      href={`/receipts/${receipt.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-gray-900">{receipt.storeName}</p>
          <p className="mt-1 text-sm text-gray-500">{formatDate(receipt.receiptDate)}</p>
        </div>
        <div className="ml-4 text-right">
          <p className="font-semibold text-gray-900">{formatCurrency(receipt.totalAmount)}</p>
          <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
            {displayCategory}
          </span>
        </div>
      </div>
    </Link>
  )
}
