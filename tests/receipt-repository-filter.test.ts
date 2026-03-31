import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockGte = vi.fn()
const mockLte = vi.fn()
const mockOr = vi.fn()
const mockOrder = vi.fn()
const mockRpc = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({
      from: mockFrom,
      rpc: mockRpc,
    })
  ),
}))

const baseReceiptRow = {
  id: 'receipt-1',
  user_id: 'user-1',
  image_path: 'path/img.jpg',
  store_name: 'セブンイレブン',
  receipt_date: '2026-01-15',
  total_amount: 1000,
  tax_amount: 100,
  ai_account_category: '消耗品費',
  account_category: null,
  status: 'processed',
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
}

describe('ReceiptRepository.findManyFiltered', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    // デフォルトチェーン: select → eq → order
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ order: mockOrder, gte: mockGte, lte: mockLte, or: mockOr, eq: mockEq })
    mockGte.mockReturnValue({ lte: mockLte, or: mockOr, order: mockOrder, gte: mockGte })
    mockLte.mockReturnValue({ or: mockOr, order: mockOrder, lte: mockLte })
    mockOr.mockReturnValue({ order: mockOrder })
    mockOrder.mockResolvedValue({ data: [], error: null })

    mockRpc.mockResolvedValue({ data: [], error: null })
  })

  describe('keyword なし', () => {
    it('フィルタなしで findMany と同等の動作をする', async () => {
      vi.mock('@/lib/supabase/server', () => ({
        createServerSupabaseClient: vi.fn(() =>
          Promise.resolve({ from: mockFrom, rpc: mockRpc })
        ),
      }))

      mockOrder.mockResolvedValueOnce({ data: [baseReceiptRow], error: null })

      const { createReceiptRepository } = await import('@/lib/repositories/receipt-repository')
      const repo = await createReceiptRepository()
      const result = await repo.findManyFiltered('user-1', {})

      expect(result).toHaveLength(1)
      expect(result[0].storeName).toBe('セブンイレブン')
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('日付範囲フィルタが適用される', async () => {
      vi.mock('@/lib/supabase/server', () => ({
        createServerSupabaseClient: vi.fn(() =>
          Promise.resolve({ from: mockFrom, rpc: mockRpc })
        ),
      }))

      mockOrder.mockResolvedValueOnce({ data: [baseReceiptRow], error: null })

      const { createReceiptRepository } = await import('@/lib/repositories/receipt-repository')
      const repo = await createReceiptRepository()
      await repo.findManyFiltered('user-1', { startDate: '2026-01-01', endDate: '2026-01-31' })

      expect(mockGte).toHaveBeenCalledWith('receipt_date', '2026-01-01')
      expect(mockLte).toHaveBeenCalledWith('receipt_date', '2026-01-31')
    })

    it('カテゴリフィルタが account_category と ai_account_category の OR 条件で適用される', async () => {
      vi.mock('@/lib/supabase/server', () => ({
        createServerSupabaseClient: vi.fn(() =>
          Promise.resolve({ from: mockFrom, rpc: mockRpc })
        ),
      }))

      mockOrder.mockResolvedValueOnce({ data: [], error: null })

      const { createReceiptRepository } = await import('@/lib/repositories/receipt-repository')
      const repo = await createReceiptRepository()
      await repo.findManyFiltered('user-1', { categories: ['消耗品費', '交際費'] })

      expect(mockOr).toHaveBeenCalledWith(
        'account_category.in.(消耗品費,交際費),ai_account_category.in.(消耗品費,交際費)'
      )
    })
  })

  describe('keyword あり', () => {
    it('RPC search_receipts を呼び出す', async () => {
      vi.mock('@/lib/supabase/server', () => ({
        createServerSupabaseClient: vi.fn(() =>
          Promise.resolve({ from: mockFrom, rpc: mockRpc })
        ),
      }))

      mockRpc.mockResolvedValueOnce({ data: [baseReceiptRow], error: null })

      const { createReceiptRepository } = await import('@/lib/repositories/receipt-repository')
      const repo = await createReceiptRepository()
      const result = await repo.findManyFiltered('user-1', { keyword: 'コーヒー' })

      expect(mockRpc).toHaveBeenCalledWith('search_receipts', {
        p_user_id: 'user-1',
        p_keyword: 'コーヒー',
        p_start_date: null,
        p_end_date: null,
      })
      expect(result).toHaveLength(1)
      expect(mockFrom).not.toHaveBeenCalledWith('receipts')
    })

    it('keyword + 日付範囲を RPC に渡す', async () => {
      vi.mock('@/lib/supabase/server', () => ({
        createServerSupabaseClient: vi.fn(() =>
          Promise.resolve({ from: mockFrom, rpc: mockRpc })
        ),
      }))

      mockRpc.mockResolvedValueOnce({ data: [], error: null })

      const { createReceiptRepository } = await import('@/lib/repositories/receipt-repository')
      const repo = await createReceiptRepository()
      await repo.findManyFiltered('user-1', {
        keyword: 'ランチ',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      })

      expect(mockRpc).toHaveBeenCalledWith('search_receipts', {
        p_user_id: 'user-1',
        p_keyword: 'ランチ',
        p_start_date: '2026-01-01',
        p_end_date: '2026-01-31',
      })
    })

    it('keyword + カテゴリ: RPC の後でカテゴリポストフィルタを適用する', async () => {
      vi.mock('@/lib/supabase/server', () => ({
        createServerSupabaseClient: vi.fn(() =>
          Promise.resolve({ from: mockFrom, rpc: mockRpc })
        ),
      }))

      const rows = [
        { ...baseReceiptRow, id: 'r1', ai_account_category: '消耗品費', account_category: null },
        { ...baseReceiptRow, id: 'r2', ai_account_category: '交際費', account_category: '交通費' },
      ]
      mockRpc.mockResolvedValueOnce({ data: rows, error: null })

      const { createReceiptRepository } = await import('@/lib/repositories/receipt-repository')
      const repo = await createReceiptRepository()
      const result = await repo.findManyFiltered('user-1', {
        keyword: 'テスト',
        categories: ['消耗品費'],
      })

      // r1: ai_account_category='消耗品費' → 一致
      // r2: account_category='交通費', ai_account_category='交際費' → 不一致
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('r1')
    })
  })
})
