import { describe, it, expect } from 'vitest'
import { createCsvGeneratorService, DEFAULT_EXPORT_TEMPLATE } from '@/lib/csv/csv-generator-service'
import type { Receipt, LineItem, ExportTemplate } from '@/types/domain'

// ────────────────────────────────────────────
// テストデータ
// ────────────────────────────────────────────

const RECEIPT_1: Receipt = {
  id: 'r1',
  userId: 'u1',
  imagePath: 'path/r1.jpg',
  storeName: 'セブンイレブン',
  receiptDate: '2024-01-15',
  totalAmount: 500,
  taxAmount: 50,
  aiAccountCategory: '消耗品費',
  accountCategory: null,
  status: 'processed',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
}

const LINE_ITEM_1: LineItem = {
  id: 'li1',
  receiptId: 'r1',
  name: 'コーヒー',
  unitPrice: 150,
  quantity: 1,
  subtotal: 150,
}

const LINE_ITEM_2: LineItem = {
  id: 'li2',
  receiptId: 'r1',
  name: 'サンドイッチ',
  unitPrice: 350,
  quantity: 1,
  subtotal: 350,
}

const RECEIPT_WITH_2_ITEMS = { ...RECEIPT_1, lineItems: [LINE_ITEM_1, LINE_ITEM_2] }
const RECEIPT_WITH_1_ITEM = { ...RECEIPT_1, lineItems: [LINE_ITEM_1] }
const RECEIPT_NO_ITEMS = { ...RECEIPT_1, lineItems: [] }

const RECEIPT_2: Receipt = {
  ...RECEIPT_1,
  id: 'r2',
  storeName: 'ローソン',
  receiptDate: '2024-01-16',
  totalAmount: 300,
  taxAmount: 30,
  aiAccountCategory: '交際費',
  accountCategory: '交通費',
}

// ────────────────────────────────────────────
// テスト
// ────────────────────────────────────────────

describe('CsvGeneratorService.generate', () => {
  const service = createCsvGeneratorService()

  describe('基本構造', () => {
    it('UTF-8 BOM (\\uFEFF) で始まる', () => {
      const csv = service.generate([RECEIPT_WITH_1_ITEM], DEFAULT_EXPORT_TEMPLATE)
      expect(csv.startsWith('\uFEFF')).toBe(true)
    })

    it('1行目はヘッダー行', () => {
      const csv = service.generate([RECEIPT_WITH_1_ITEM], DEFAULT_EXPORT_TEMPLATE)
      const lines = csv.slice(1).split('\r\n')
      expect(lines[0]).toContain('日付')
      expect(lines[0]).toContain('店名')
      expect(lines[0]).toContain('品目名')
    })

    it('デフォルトテンプレートは 9 カラム', () => {
      const csv = service.generate([RECEIPT_WITH_1_ITEM], DEFAULT_EXPORT_TEMPLATE)
      const headerLine = csv.slice(1).split('\r\n')[0]
      expect(headerLine.split(',').length).toBe(9)
    })

    it('行の区切りは CRLF (\\r\\n)', () => {
      const csv = service.generate([RECEIPT_WITH_1_ITEM], DEFAULT_EXPORT_TEMPLATE)
      expect(csv).toContain('\r\n')
    })
  })

  describe('品目展開', () => {
    it('品目が2件のレシートはデータ行が2行になる', () => {
      const csv = service.generate([RECEIPT_WITH_2_ITEMS], DEFAULT_EXPORT_TEMPLATE)
      const dataLines = csv.slice(1).split('\r\n').slice(1) // ヘッダーを除く
      expect(dataLines.length).toBe(2)
    })

    it('品目なしのレシートはデータ行が1行になる', () => {
      const csv = service.generate([RECEIPT_NO_ITEMS], DEFAULT_EXPORT_TEMPLATE)
      const dataLines = csv.slice(1).split('\r\n').slice(1)
      expect(dataLines.length).toBe(1)
    })

    it('複数レシートの場合は品目合計行数になる', () => {
      const receipt2 = { ...RECEIPT_2, lineItems: [LINE_ITEM_1] }
      const csv = service.generate([RECEIPT_WITH_2_ITEMS, receipt2], DEFAULT_EXPORT_TEMPLATE)
      const dataLines = csv.slice(1).split('\r\n').slice(1)
      expect(dataLines.length).toBe(3) // 2 + 1
    })
  })

  describe('フィールド値の出力', () => {
    it('receipt_date フィールドを正しく出力する', () => {
      const csv = service.generate([RECEIPT_WITH_1_ITEM], DEFAULT_EXPORT_TEMPLATE)
      const firstDataLine = csv.slice(1).split('\r\n')[1]
      expect(firstDataLine).toContain('2024-01-15')
    })

    it('store_name フィールドを正しく出力する', () => {
      const csv = service.generate([RECEIPT_WITH_1_ITEM], DEFAULT_EXPORT_TEMPLATE)
      const firstDataLine = csv.slice(1).split('\r\n')[1]
      expect(firstDataLine).toContain('セブンイレブン')
    })

    it('accountCategory が null の場合 aiAccountCategory を使用する', () => {
      const csv = service.generate([RECEIPT_WITH_1_ITEM], DEFAULT_EXPORT_TEMPLATE) // accountCategory: null
      const firstDataLine = csv.slice(1).split('\r\n')[1]
      expect(firstDataLine).toContain('消耗品費')
    })

    it('accountCategory が設定されている場合はその値を使用する', () => {
      const receipt = { ...RECEIPT_2, lineItems: [LINE_ITEM_1] } // accountCategory: '交通費'
      const csv = service.generate([receipt], DEFAULT_EXPORT_TEMPLATE)
      const firstDataLine = csv.slice(1).split('\r\n')[1]
      expect(firstDataLine).toContain('交通費')
      expect(firstDataLine).not.toContain('交際費') // aiAccountCategory は使わない
    })
  })

  describe('RFC 4180 エスケープ', () => {
    it('デリミタ（カンマ）を含むセルをダブルクオートで囲む', () => {
      const receipt = {
        ...RECEIPT_1,
        storeName: '店,名',
        lineItems: [LINE_ITEM_1],
      }
      const csv = service.generate([receipt], DEFAULT_EXPORT_TEMPLATE)
      expect(csv).toContain('"店,名"')
    })

    it('改行を含むセルをダブルクオートで囲む', () => {
      const receipt = {
        ...RECEIPT_1,
        storeName: '店\n名',
        lineItems: [LINE_ITEM_1],
      }
      const csv = service.generate([receipt], DEFAULT_EXPORT_TEMPLATE)
      expect(csv).toContain('"店\n名"')
    })

    it('ダブルクオートを含むセルは "" にエスケープしてダブルクオートで囲む', () => {
      const receipt = {
        ...RECEIPT_1,
        storeName: '店"名',
        lineItems: [LINE_ITEM_1],
      }
      const csv = service.generate([receipt], DEFAULT_EXPORT_TEMPLATE)
      expect(csv).toContain('"店""名"')
    })
  })

  describe('デリミタ変更', () => {
    it('タブ区切りテンプレートでタブ区切りになる', () => {
      const tabTemplate: ExportTemplate = { ...DEFAULT_EXPORT_TEMPLATE, delimiter: '\t' }
      const csv = service.generate([RECEIPT_WITH_1_ITEM], tabTemplate)
      const headerLine = csv.slice(1).split('\r\n')[0]
      expect(headerLine.split('\t').length).toBe(9)
    })

    it('セミコロン区切りテンプレートでセミコロン区切りになる', () => {
      const semiTemplate: ExportTemplate = { ...DEFAULT_EXPORT_TEMPLATE, delimiter: ';' }
      const csv = service.generate([RECEIPT_WITH_1_ITEM], semiTemplate)
      const headerLine = csv.slice(1).split('\r\n')[0]
      expect(headerLine.split(';').length).toBe(9)
    })
  })

  describe('カラム順序', () => {
    it('columns の order プロパティ昇順でカラムが並ぶ', () => {
      const customTemplate: ExportTemplate = {
        ...DEFAULT_EXPORT_TEMPLATE,
        columns: [
          { label: '合計', sourceField: 'total_amount', order: 0 },
          { label: '日付', sourceField: 'receipt_date', order: 1 },
        ],
      }
      const csv = service.generate([RECEIPT_WITH_1_ITEM], customTemplate)
      const headerLine = csv.slice(1).split('\r\n')[0]
      expect(headerLine).toBe('合計,日付')
    })
  })

  describe('空のレシートリスト', () => {
    it('レシートが 0 件の場合はヘッダーのみ', () => {
      const csv = service.generate([], DEFAULT_EXPORT_TEMPLATE)
      const lines = csv.slice(1).split('\r\n')
      expect(lines.length).toBe(1) // ヘッダーのみ
    })
  })
})
