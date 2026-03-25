import type { ExportColumn, ReceiptSourceField } from '@/types/domain'

/** カラムを末尾に1件追加する */
export function addColumn(columns: ExportColumn[]): ExportColumn[] {
  const newColumn: ExportColumn = {
    label: '',
    sourceField: 'receipt_date',
    order: columns.length,
  }
  return [...columns, newColumn]
}

/** 指定インデックスのカラムを削除する */
export function removeColumn(columns: ExportColumn[], index: number): ExportColumn[] {
  return columns.filter((_, i) => i !== index)
}

/** 指定インデックスのカラムを1つ上に移動する */
export function moveColumnUp(columns: ExportColumn[], index: number): ExportColumn[] {
  if (index <= 0) return columns
  const next = [...columns]
  ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
  return normalizeOrders(next)
}

/** 指定インデックスのカラムを1つ下に移動する */
export function moveColumnDown(columns: ExportColumn[], index: number): ExportColumn[] {
  if (index >= columns.length - 1) return columns
  const next = [...columns]
  ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
  return normalizeOrders(next)
}

/** 指定インデックスのカラムラベルを更新する */
export function updateColumnLabel(
  columns: ExportColumn[],
  index: number,
  label: string
): ExportColumn[] {
  return columns.map((col, i) => (i === index ? { ...col, label } : col))
}

/** 指定インデックスのカラムソースフィールドを更新する */
export function updateColumnSourceField(
  columns: ExportColumn[],
  index: number,
  sourceField: ReceiptSourceField
): ExportColumn[] {
  return columns.map((col, i) => (i === index ? { ...col, sourceField } : col))
}

/** order を 0 始まりの連番に揃える */
export function normalizeOrders(columns: ExportColumn[]): ExportColumn[] {
  return columns.map((col, i) => ({ ...col, order: i }))
}

/** カラムリストのバリデーション。エラーがあればメッセージを、なければ null を返す */
export function validateColumns(columns: ExportColumn[]): string | null {
  if (columns.length === 0) {
    return 'カラムが設定されていません。フォーマット設定を確認してください。'
  }
  return null
}
