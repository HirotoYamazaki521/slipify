import type {
  Receipt,
  LineItem,
  ExportTemplate,
  ExportColumn,
  ReceiptSourceField,
  Delimiter,
} from '@/types/domain'

// ────────────────────────────────────────────
// デフォルトテンプレート
// ────────────────────────────────────────────

export const DEFAULT_EXPORT_TEMPLATE: ExportTemplate = {
  id: '__default__',
  userId: '',
  name: 'デフォルト',
  delimiter: ',',
  isDefault: true,
  createdAt: '',
  updatedAt: '',
  columns: [
    { label: '日付', sourceField: 'receipt_date', order: 0 },
    { label: '店名', sourceField: 'store_name', order: 1 },
    { label: '品目名', sourceField: 'item_name', order: 2 },
    { label: '単価', sourceField: 'unit_price', order: 3 },
    { label: '数量', sourceField: 'quantity', order: 4 },
    { label: '小計', sourceField: 'subtotal', order: 5 },
    { label: '合計金額', sourceField: 'total_amount', order: 6 },
    { label: '税額', sourceField: 'tax_amount', order: 7 },
    { label: '勘定科目', sourceField: 'account_category', order: 8 },
  ],
}

// ────────────────────────────────────────────
// CsvGeneratorService インターフェース
// ────────────────────────────────────────────

export interface CsvGeneratorService {
  generate(
    receipts: Array<Receipt & { lineItems: LineItem[] }>,
    template: ExportTemplate
  ): string
}

// ────────────────────────────────────────────
// 内部ヘルパー
// ────────────────────────────────────────────

function escapeCell(value: string, delimiter: Delimiter): string {
  if (
    value.includes(delimiter) ||
    value.includes('\n') ||
    value.includes('\r') ||
    value.includes('"')
  ) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function getCellValue(
  receipt: Receipt,
  lineItem: LineItem | null,
  sourceField: ReceiptSourceField
): string {
  switch (sourceField) {
    case 'receipt_date':
      return receipt.receiptDate
    case 'store_name':
      return receipt.storeName
    case 'total_amount':
      return String(receipt.totalAmount)
    case 'tax_amount':
      return String(receipt.taxAmount)
    case 'account_category':
      return receipt.accountCategory ?? receipt.aiAccountCategory
    case 'item_name':
      return lineItem?.name ?? ''
    case 'unit_price':
      return lineItem !== null ? String(lineItem.unitPrice) : ''
    case 'quantity':
      return lineItem !== null ? String(lineItem.quantity) : ''
    case 'subtotal':
      return lineItem !== null ? String(lineItem.subtotal) : ''
    default:
      return ''
  }
}

function buildRow(
  receipt: Receipt,
  lineItem: LineItem | null,
  columns: ExportColumn[],
  delimiter: Delimiter
): string {
  return columns
    .map((col) => escapeCell(getCellValue(receipt, lineItem, col.sourceField), delimiter))
    .join(delimiter)
}

// ────────────────────────────────────────────
// ファクトリ
// ────────────────────────────────────────────

export function createCsvGeneratorService(): CsvGeneratorService {
  return {
    generate(receipts, template): string {
      const columns = [...template.columns].sort((a, b) => a.order - b.order)
      const { delimiter } = template

      const headerRow = columns.map((col) => escapeCell(col.label, delimiter)).join(delimiter)
      const rows: string[] = [headerRow]

      for (const receipt of receipts) {
        if (receipt.lineItems.length === 0) {
          rows.push(buildRow(receipt, null, columns, delimiter))
        } else {
          for (const lineItem of receipt.lineItems) {
            rows.push(buildRow(receipt, lineItem, columns, delimiter))
          }
        }
      }

      return '\uFEFF' + rows.join('\r\n')
    },
  }
}
