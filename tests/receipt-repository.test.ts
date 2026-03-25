import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mapReceiptRow, mapLineItemRow } from '@/lib/repositories/receipt-repository'
import type { Database } from '@/types/database'

type ReceiptRow = Database['public']['Tables']['receipts']['Row']
type LineItemRow = Database['public']['Tables']['line_items']['Row']

// --- DB行 → ドメイン変換のテスト ---

describe('mapReceiptRow', () => {
  const baseRow: ReceiptRow = {
    id: 'receipt-1',
    user_id: 'user-1',
    image_path: 'receipts/user-1/abc.jpg',
    store_name: 'セブンイレブン',
    receipt_date: '2026-03-25',
    total_amount: 1100,
    tax_amount: 100,
    ai_account_category: '消耗品費',
    account_category: null,
    status: 'processed',
    created_at: '2026-03-25T10:00:00Z',
    updated_at: '2026-03-25T10:00:00Z',
  }

  it('snake_case から camelCase に変換される', () => {
    const receipt = mapReceiptRow(baseRow)
    expect(receipt.id).toBe('receipt-1')
    expect(receipt.userId).toBe('user-1')
    expect(receipt.imagePath).toBe('receipts/user-1/abc.jpg')
    expect(receipt.storeName).toBe('セブンイレブン')
    expect(receipt.receiptDate).toBe('2026-03-25')
    expect(receipt.totalAmount).toBe(1100)
    expect(receipt.taxAmount).toBe(100)
    expect(receipt.aiAccountCategory).toBe('消耗品費')
    expect(receipt.accountCategory).toBeNull()
    expect(receipt.status).toBe('processed')
    expect(receipt.createdAt).toBe('2026-03-25T10:00:00Z')
    expect(receipt.updatedAt).toBe('2026-03-25T10:00:00Z')
  })

  it('account_category が設定されている場合に変換される', () => {
    const receipt = mapReceiptRow({ ...baseRow, account_category: '交通費' })
    expect(receipt.accountCategory).toBe('交通費')
  })
})

describe('mapLineItemRow', () => {
  const baseRow: LineItemRow = {
    id: 'item-1',
    receipt_id: 'receipt-1',
    name: 'コーヒー',
    unit_price: 150,
    quantity: 2,
    subtotal: 300,
    created_at: '2026-03-25T10:00:00Z',
  }

  it('snake_case から camelCase に変換される', () => {
    const item = mapLineItemRow(baseRow)
    expect(item.id).toBe('item-1')
    expect(item.receiptId).toBe('receipt-1')
    expect(item.name).toBe('コーヒー')
    expect(item.unitPrice).toBe(150)
    expect(item.quantity).toBe(2)
    expect(item.subtotal).toBe(300)
  })
})

// --- ReceiptRepository メソッドのテスト（Supabase モック）---

const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockSingle = vi.fn()
const mockIn = vi.fn()

const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({
      from: mockFrom,
    })
  ),
}))

describe('ReceiptRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // デフォルトのチェーン設定
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })
    mockSelect.mockReturnValue({ eq: mockEq, in: mockIn })
    mockEq.mockReturnValue({ order: mockOrder, eq: mockEq, single: mockSingle })
    mockOrder.mockReturnValue({ data: [], error: null })
    mockSingle.mockReturnValue({ data: null, error: null })
    mockIn.mockReturnValue({ eq: mockEq })
    mockInsert.mockReturnValue({ select: mockSelect })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockDelete.mockReturnValue({ eq: mockEq })
  })

  describe('findMany', () => {
    it('user_id でフィルタし created_at 降順で取得する', async () => {
      const { createReceiptRepository } = await import('@/lib/repositories/receipt-repository')
      const repo = await createReceiptRepository()

      mockOrder.mockResolvedValueOnce({
        data: [
          {
            id: 'receipt-1',
            user_id: 'user-1',
            image_path: 'path/img.jpg',
            store_name: 'A店',
            receipt_date: '2026-03-25',
            total_amount: 500,
            tax_amount: 50,
            ai_account_category: '雑費',
            account_category: null,
            status: 'processed',
            created_at: '2026-03-25T10:00:00Z',
            updated_at: '2026-03-25T10:00:00Z',
          },
        ],
        error: null,
      })

      const result = await repo.findMany('user-1')
      expect(mockFrom).toHaveBeenCalledWith('receipts')
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-1')
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toHaveLength(1)
      expect(result[0].storeName).toBe('A店')
    })
  })

  describe('create', () => {
    it('receipt と line_items を一括登録する', async () => {
      vi.resetModules()
      vi.mock('@/lib/supabase/server', () => ({
        createServerSupabaseClient: vi.fn(() =>
          Promise.resolve({
            from: mockFrom,
          })
        ),
      }))

      const { createReceiptRepository } = await import('@/lib/repositories/receipt-repository')
      const repo = await createReceiptRepository()

      const receiptData = {
        id: 'receipt-1',
        user_id: 'user-1',
        image_path: 'path/img.jpg',
        store_name: 'B店',
        receipt_date: '2026-03-25',
        total_amount: 1000,
        tax_amount: 100,
        ai_account_category: '消耗品費',
        account_category: null,
        status: 'processed',
        created_at: '2026-03-25T10:00:00Z',
        updated_at: '2026-03-25T10:00:00Z',
      }
      const lineItemsData = [
        {
          id: 'item-1',
          receipt_id: 'receipt-1',
          name: 'お茶',
          unit_price: 100,
          quantity: 1,
          subtotal: 100,
          created_at: '2026-03-25T10:00:00Z',
        },
      ]

      // receipts INSERT → single
      mockInsert.mockReturnValueOnce({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: receiptData, error: null }) }) })
      // line_items INSERT → select
      mockInsert.mockReturnValueOnce({ select: vi.fn().mockResolvedValue({ data: lineItemsData, error: null }) })

      const result = await repo.create({
        userId: 'user-1',
        imagePath: 'path/img.jpg',
        storeName: 'B店',
        receiptDate: '2026-03-25',
        totalAmount: 1000,
        taxAmount: 100,
        aiAccountCategory: '消耗品費',
        lineItems: [{ name: 'お茶', unitPrice: 100, quantity: 1, subtotal: 100 }],
      })

      expect(result.storeName).toBe('B店')
      expect(result.lineItems).toHaveLength(1)
      expect(result.lineItems[0].name).toBe('お茶')
    })
  })
})
