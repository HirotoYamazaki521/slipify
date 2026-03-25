// =====================================================
// Slipify ドメイン型定義
// =====================================================

// ---------------------------------------------------
// 勘定科目
// ---------------------------------------------------

export type AccountCategory =
  | '消耗品費'
  | '交際費'
  | '交通費'
  | '通信費'
  | '会議費'
  | '福利厚生費'
  | '広告宣伝費'
  | '地代家賃'
  | '水道光熱費'
  | '外注費'
  | '新聞図書費'
  | '雑費'

export const ACCOUNT_CATEGORY_LIST: AccountCategory[] = [
  '消耗品費',
  '交際費',
  '交通費',
  '通信費',
  '会議費',
  '福利厚生費',
  '広告宣伝費',
  '地代家賃',
  '水道光熱費',
  '外注費',
  '新聞図書費',
  '雑費',
]

export function isAccountCategory(value: unknown): value is AccountCategory {
  return typeof value === 'string' && (ACCOUNT_CATEGORY_LIST as string[]).includes(value)
}

// ---------------------------------------------------
// 列挙型
// ---------------------------------------------------

export type ReceiptStatus = 'pending' | 'processed' | 'failed'

export type Delimiter = ',' | '\t' | ';'

export const DELIMITERS: Delimiter[] = [',', '\t', ';']

export type ReceiptSourceField =
  | 'receipt_date'
  | 'store_name'
  | 'item_name'
  | 'unit_price'
  | 'quantity'
  | 'subtotal'
  | 'total_amount'
  | 'tax_amount'
  | 'account_category'

export const RECEIPT_SOURCE_FIELDS: ReceiptSourceField[] = [
  'receipt_date',
  'store_name',
  'item_name',
  'unit_price',
  'quantity',
  'subtotal',
  'total_amount',
  'tax_amount',
  'account_category',
]

// 品目フィールド（CSV生成時に品目ごとに行展開するフィールド）
export const LINE_ITEM_SOURCE_FIELDS: ReceiptSourceField[] = [
  'item_name',
  'unit_price',
  'quantity',
  'subtotal',
]

// ---------------------------------------------------
// ドメインモデル
// ---------------------------------------------------

export interface Receipt {
  id: string
  userId: string
  imagePath: string
  storeName: string
  receiptDate: string
  totalAmount: number
  taxAmount: number
  aiAccountCategory: AccountCategory
  accountCategory: AccountCategory | string | null
  status: ReceiptStatus
  createdAt: string
  updatedAt: string
}

export interface LineItem {
  id: string
  receiptId: string
  name: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface ExportColumn {
  label: string
  sourceField: ReceiptSourceField
  order: number
}

export interface ExportTemplate {
  id: string
  userId: string
  name: string
  columns: ExportColumn[]
  delimiter: Delimiter
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomAccountCategory {
  id: string
  userId: string
  name: string
  createdAt: string
}

// ---------------------------------------------------
// Result 型（エラーハンドリング）
// ---------------------------------------------------

export type Result<T, E> = { ok: true; data: T } | { ok: false; error: E }

export function ok<T>(data: T): Result<T, never> {
  return { ok: true, data }
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}
