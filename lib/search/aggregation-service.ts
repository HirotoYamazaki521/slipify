import type { Receipt } from '@/types/domain'

export interface MonthlySummary {
  month: string       // "YYYY-MM"
  count: number
  totalAmount: number
}

export interface CategorySummary {
  category: string
  count: number
  totalAmount: number
  percentage: number  // 0–100 の整数
}

export interface AggregationResult {
  monthlySummaries: MonthlySummary[]   // 新しい月順（降順）
  categorySummaries: CategorySummary[] // totalAmount 降順
}

/**
 * フィルタ済みレシート配列から月別・科目別集計を計算する純粋関数。
 * DB アクセスなし・副作用なし。
 */
export function computeAggregation(receipts: Receipt[]): AggregationResult {
  return {
    monthlySummaries: computeMonthlySummaries(receipts),
    categorySummaries: computeCategorySummaries(receipts),
  }
}

function computeMonthlySummaries(receipts: Receipt[]): MonthlySummary[] {
  const map = new Map<string, { count: number; totalAmount: number }>()

  for (const receipt of receipts) {
    const month = receipt.receiptDate.substring(0, 7) // "YYYY-MM"
    const existing = map.get(month) ?? { count: 0, totalAmount: 0 }
    map.set(month, {
      count: existing.count + 1,
      totalAmount: existing.totalAmount + receipt.totalAmount,
    })
  }

  return Array.from(map.entries())
    .map(([month, { count, totalAmount }]) => ({ month, count, totalAmount }))
    .sort((a, b) => b.month.localeCompare(a.month)) // 降順
}

function computeCategorySummaries(receipts: Receipt[]): CategorySummary[] {
  const map = new Map<string, { count: number; totalAmount: number }>()
  const grandTotal = receipts.reduce((sum, r) => sum + r.totalAmount, 0)

  for (const receipt of receipts) {
    // 確定済み科目優先、なければ AI 予測を使用
    const category = receipt.accountCategory ?? receipt.aiAccountCategory
    const existing = map.get(category) ?? { count: 0, totalAmount: 0 }
    map.set(category, {
      count: existing.count + 1,
      totalAmount: existing.totalAmount + receipt.totalAmount,
    })
  }

  const summaries = Array.from(map.entries())
    .map(([category, { count, totalAmount }]) => ({
      category,
      count,
      totalAmount,
      percentage: grandTotal > 0 ? Math.round((totalAmount / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount) // 降順

  // percentage の合計を 100 に調整（端数を最大値項目に吸収）
  if (summaries.length > 0 && grandTotal > 0) {
    const currentTotal = summaries.reduce((sum, s) => sum + s.percentage, 0)
    summaries[0].percentage += 100 - currentTotal
  }

  return summaries
}
