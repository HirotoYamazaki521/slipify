import { describe, it, expect } from 'vitest'
import { computeAggregation } from '@/lib/search/aggregation-service'
import type { Receipt } from '@/types/domain'

function makeReceipt(overrides: Partial<Receipt> & Pick<Receipt, 'receiptDate' | 'totalAmount'>): Receipt {
  return {
    id: 'receipt-1',
    userId: 'user-1',
    imagePath: 'path/img.jpg',
    storeName: 'テスト店',
    taxAmount: 0,
    aiAccountCategory: '雑費',
    accountCategory: null,
    status: 'processed',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('computeAggregation', () => {
  describe('空配列', () => {
    it('空の集計を返す', () => {
      const result = computeAggregation([])
      expect(result.monthlySummaries).toEqual([])
      expect(result.categorySummaries).toEqual([])
    })
  })

  describe('月別集計', () => {
    it('複数月にまたがるレシートを月別に降順で集計する', () => {
      const receipts = [
        makeReceipt({ id: 'r1', receiptDate: '2026-01-15', totalAmount: 1000 }),
        makeReceipt({ id: 'r2', receiptDate: '2026-01-20', totalAmount: 2000 }),
        makeReceipt({ id: 'r3', receiptDate: '2026-02-10', totalAmount: 3000 }),
      ]
      const { monthlySummaries } = computeAggregation(receipts)

      expect(monthlySummaries).toHaveLength(2)
      // 新しい月が先（降順）
      expect(monthlySummaries[0].month).toBe('2026-02')
      expect(monthlySummaries[0].totalAmount).toBe(3000)
      expect(monthlySummaries[0].count).toBe(1)
      expect(monthlySummaries[1].month).toBe('2026-01')
      expect(monthlySummaries[1].totalAmount).toBe(3000) // 1000 + 2000
      expect(monthlySummaries[1].count).toBe(2)
    })

    it('同じ月のレシートを正しく合算する', () => {
      const receipts = [
        makeReceipt({ id: 'r1', receiptDate: '2026-03-01', totalAmount: 500 }),
        makeReceipt({ id: 'r2', receiptDate: '2026-03-31', totalAmount: 1500 }),
      ]
      const { monthlySummaries } = computeAggregation(receipts)
      expect(monthlySummaries).toHaveLength(1)
      expect(monthlySummaries[0].month).toBe('2026-03')
      expect(monthlySummaries[0].totalAmount).toBe(2000)
      expect(monthlySummaries[0].count).toBe(2)
    })
  })

  describe('科目別集計', () => {
    it('accountCategory が存在する場合は ai_account_category を使わない', () => {
      const receipts = [
        makeReceipt({
          id: 'r1',
          receiptDate: '2026-01-01',
          totalAmount: 1000,
          aiAccountCategory: '雑費',
          accountCategory: '消耗品費',
        }),
      ]
      const { categorySummaries } = computeAggregation(receipts)
      expect(categorySummaries).toHaveLength(1)
      expect(categorySummaries[0].category).toBe('消耗品費')
    })

    it('accountCategory が null の場合は aiAccountCategory を使用する', () => {
      const receipts = [
        makeReceipt({
          id: 'r1',
          receiptDate: '2026-01-01',
          totalAmount: 1000,
          aiAccountCategory: '交通費',
          accountCategory: null,
        }),
      ]
      const { categorySummaries } = computeAggregation(receipts)
      expect(categorySummaries[0].category).toBe('交通費')
    })

    it('合計金額降順でソートされる', () => {
      const receipts = [
        makeReceipt({ id: 'r1', receiptDate: '2026-01-01', totalAmount: 500, aiAccountCategory: '交際費' }),
        makeReceipt({ id: 'r2', receiptDate: '2026-01-02', totalAmount: 3000, aiAccountCategory: '消耗品費' }),
        makeReceipt({ id: 'r3', receiptDate: '2026-01-03', totalAmount: 1000, aiAccountCategory: '交通費' }),
      ]
      const { categorySummaries } = computeAggregation(receipts)
      expect(categorySummaries[0].category).toBe('消耗品費')
      expect(categorySummaries[1].category).toBe('交通費')
      expect(categorySummaries[2].category).toBe('交際費')
    })

    it('percentage の合計が 100 になる', () => {
      const receipts = [
        makeReceipt({ id: 'r1', receiptDate: '2026-01-01', totalAmount: 1000, aiAccountCategory: '消耗品費' }),
        makeReceipt({ id: 'r2', receiptDate: '2026-01-02', totalAmount: 2000, aiAccountCategory: '交際費' }),
        makeReceipt({ id: 'r3', receiptDate: '2026-01-03', totalAmount: 3000, aiAccountCategory: '交通費' }),
      ]
      const { categorySummaries } = computeAggregation(receipts)
      const total = categorySummaries.reduce((sum, s) => sum + s.percentage, 0)
      expect(total).toBe(100)
    })

    it('複数レシートが同一科目に集計される', () => {
      const receipts = [
        makeReceipt({ id: 'r1', receiptDate: '2026-01-01', totalAmount: 1000, aiAccountCategory: '消耗品費' }),
        makeReceipt({ id: 'r2', receiptDate: '2026-01-02', totalAmount: 2000, aiAccountCategory: '消耗品費' }),
      ]
      const { categorySummaries } = computeAggregation(receipts)
      expect(categorySummaries).toHaveLength(1)
      expect(categorySummaries[0].totalAmount).toBe(3000)
      expect(categorySummaries[0].count).toBe(2)
      expect(categorySummaries[0].percentage).toBe(100)
    })
  })
})
