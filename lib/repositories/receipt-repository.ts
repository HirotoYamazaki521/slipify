import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Receipt, LineItem, AccountCategory } from '@/types/domain'

// DB行の型（supabase gen types が生成するのと同等の形状）
export interface ReceiptRow {
  id: string
  user_id: string
  image_path: string
  store_name: string
  receipt_date: string
  total_amount: number
  tax_amount: number
  ai_account_category: string
  account_category: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface LineItemRow {
  id: string
  receipt_id: string
  name: string
  unit_price: number
  quantity: number
  subtotal: number
  created_at: string
}

// ---------------------------------------------------
// DB行 → ドメインオブジェクト変換
// ---------------------------------------------------

export function mapReceiptRow(row: ReceiptRow): Receipt {
  return {
    id: row.id,
    userId: row.user_id,
    imagePath: row.image_path,
    storeName: row.store_name,
    receiptDate: row.receipt_date,
    totalAmount: Number(row.total_amount),
    taxAmount: Number(row.tax_amount),
    aiAccountCategory: row.ai_account_category as AccountCategory,
    accountCategory: row.account_category as AccountCategory | null,
    status: row.status as Receipt['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapLineItemRow(row: LineItemRow): LineItem {
  return {
    id: row.id,
    receiptId: row.receipt_id,
    name: row.name,
    unitPrice: Number(row.unit_price),
    quantity: Number(row.quantity),
    subtotal: Number(row.subtotal),
  }
}

// ---------------------------------------------------
// CreateReceiptData 型
// ---------------------------------------------------

export interface CreateReceiptData {
  userId: string
  imagePath: string
  storeName: string
  receiptDate: string
  totalAmount: number
  taxAmount: number
  aiAccountCategory: AccountCategory
  lineItems: Array<{ name: string; unitPrice: number; quantity: number; subtotal: number }>
}

// ---------------------------------------------------
// ReceiptRepository インターフェース
// ---------------------------------------------------

export interface ReceiptRepository {
  findMany(userId: string): Promise<Receipt[]>
  findByIdWithLineItems(
    id: string,
    userId: string
  ): Promise<(Receipt & { lineItems: LineItem[] }) | null>
  findManyWithLineItems(
    ids: string[],
    userId: string
  ): Promise<Array<Receipt & { lineItems: LineItem[] }>>
  create(data: CreateReceiptData): Promise<Receipt & { lineItems: LineItem[] }>
  updateAccountCategory(id: string, userId: string, accountCategory: string): Promise<Receipt>
  delete(id: string, userId: string): Promise<void>
}

// ---------------------------------------------------
// ReceiptRepository 実装
// ---------------------------------------------------

export async function createReceiptRepository(): Promise<ReceiptRepository> {
  const supabase = await createServerSupabaseClient()

  return {
    async findMany(userId: string): Promise<Receipt[]> {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(`findMany failed: ${error.message}`)
      return (data ?? []).map(mapReceiptRow)
    },

    async findByIdWithLineItems(
      id: string,
      userId: string
    ): Promise<(Receipt & { lineItems: LineItem[] }) | null> {
      const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single()

      if (receiptError) {
        if (receiptError.code === 'PGRST116') return null
        throw new Error(`findByIdWithLineItems failed: ${receiptError.message}`)
      }
      if (!receiptData) return null

      const { data: itemsData, error: itemsError } = await supabase
        .from('line_items')
        .select('*')
        .eq('receipt_id', id)

      if (itemsError) throw new Error(`findByIdWithLineItems (line_items) failed: ${itemsError.message}`)

      return {
        ...mapReceiptRow(receiptData),
        lineItems: (itemsData ?? []).map(mapLineItemRow),
      }
    },

    async findManyWithLineItems(
      ids: string[],
      userId: string
    ): Promise<Array<Receipt & { lineItems: LineItem[] }>> {
      if (ids.length === 0) return []

      const { data: receiptsData, error: receiptsError } = await supabase
        .from('receipts')
        .select('*')
        .in('id', ids)
        .eq('user_id', userId)

      if (receiptsError) throw new Error(`findManyWithLineItems failed: ${receiptsError.message}`)
      if (!receiptsData || receiptsData.length === 0) return []

      const receiptIds = receiptsData.map((r) => r.id)
      const { data: itemsData, error: itemsError } = await supabase
        .from('line_items')
        .select('*')
        .in('receipt_id', receiptIds)

      if (itemsError) throw new Error(`findManyWithLineItems (line_items) failed: ${itemsError.message}`)

      const itemsByReceiptId = new Map<string, LineItem[]>()
      for (const item of itemsData ?? []) {
        const mapped = mapLineItemRow(item)
        const list = itemsByReceiptId.get(item.receipt_id) ?? []
        list.push(mapped)
        itemsByReceiptId.set(item.receipt_id, list)
      }

      return receiptsData.map((row) => ({
        ...mapReceiptRow(row),
        lineItems: itemsByReceiptId.get(row.id) ?? [],
      }))
    },

    async create(data: CreateReceiptData): Promise<Receipt & { lineItems: LineItem[] }> {
      const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          user_id: data.userId,
          image_path: data.imagePath,
          store_name: data.storeName,
          receipt_date: data.receiptDate,
          total_amount: data.totalAmount,
          tax_amount: data.taxAmount,
          ai_account_category: data.aiAccountCategory,
          status: 'processed',
        })
        .select()
        .single()

      if (receiptError) throw new Error(`create receipt failed: ${receiptError.message}`)
      if (!receiptData) throw new Error('create receipt returned no data')

      const lineItemsInsert = data.lineItems.map((item) => ({
        receipt_id: receiptData.id,
        name: item.name,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
      }))

      const { data: itemsData, error: itemsError } = await supabase
        .from('line_items')
        .insert(lineItemsInsert)
        .select()

      if (itemsError) throw new Error(`create line_items failed: ${itemsError.message}`)

      return {
        ...mapReceiptRow(receiptData),
        lineItems: (itemsData ?? []).map(mapLineItemRow),
      }
    },

    async updateAccountCategory(
      id: string,
      userId: string,
      accountCategory: string
    ): Promise<Receipt> {
      const { data, error } = await supabase
        .from('receipts')
        .update({ account_category: accountCategory, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw new Error(`updateAccountCategory failed: ${error.message}`)
      if (!data) throw new Error('updateAccountCategory returned no data')
      return mapReceiptRow(data)
    },

    async delete(id: string, userId: string): Promise<void> {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw new Error(`delete failed: ${error.message}`)
    },
  }
}
