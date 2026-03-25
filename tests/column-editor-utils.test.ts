import { describe, it, expect } from 'vitest'
import {
  addColumn,
  removeColumn,
  moveColumnUp,
  moveColumnDown,
  updateColumnLabel,
  updateColumnSourceField,
  normalizeOrders,
  validateColumns,
} from '@/lib/csv/column-editor-utils'
import type { ExportColumn } from '@/types/domain'

const COL_DATE: ExportColumn = { label: '日付', sourceField: 'receipt_date', order: 0 }
const COL_STORE: ExportColumn = { label: '店名', sourceField: 'store_name', order: 1 }
const COL_TOTAL: ExportColumn = { label: '合計', sourceField: 'total_amount', order: 2 }

// ────────────────────────────────────────────
// addColumn
// ────────────────────────────────────────────
describe('addColumn', () => {
  it('空配列に追加すると 1 件になる', () => {
    const result = addColumn([])
    expect(result).toHaveLength(1)
  })

  it('追加されたカラムの order は末尾 (length)', () => {
    const result = addColumn([COL_DATE, COL_STORE])
    expect(result[2].order).toBe(2)
  })

  it('追加されたカラムのデフォルト sourceField は receipt_date', () => {
    const result = addColumn([])
    expect(result[0].sourceField).toBe('receipt_date')
  })

  it('追加されたカラムのデフォルト label は空文字', () => {
    const result = addColumn([])
    expect(result[0].label).toBe('')
  })

  it('既存カラムは変更されない', () => {
    const result = addColumn([COL_DATE])
    expect(result[0]).toEqual(COL_DATE)
  })
})

// ────────────────────────────────────────────
// removeColumn
// ────────────────────────────────────────────
describe('removeColumn', () => {
  it('指定インデックスのカラムを削除する', () => {
    const result = removeColumn([COL_DATE, COL_STORE, COL_TOTAL], 1)
    expect(result).toHaveLength(2)
    expect(result[0].sourceField).toBe('receipt_date')
    expect(result[1].sourceField).toBe('total_amount')
  })

  it('先頭カラムを削除できる', () => {
    const result = removeColumn([COL_DATE, COL_STORE], 0)
    expect(result).toHaveLength(1)
    expect(result[0].sourceField).toBe('store_name')
  })

  it('最後のカラムを削除すると空になる', () => {
    const result = removeColumn([COL_DATE], 0)
    expect(result).toHaveLength(0)
  })
})

// ────────────────────────────────────────────
// moveColumnUp
// ────────────────────────────────────────────
describe('moveColumnUp', () => {
  it('2番目のカラムを上に移動すると順序が入れ替わる', () => {
    const result = moveColumnUp([COL_DATE, COL_STORE, COL_TOTAL], 1)
    expect(result[0].sourceField).toBe('store_name')
    expect(result[1].sourceField).toBe('receipt_date')
    expect(result[2].sourceField).toBe('total_amount')
  })

  it('先頭のカラムを上に移動しても変わらない', () => {
    const result = moveColumnUp([COL_DATE, COL_STORE], 0)
    expect(result[0].sourceField).toBe('receipt_date')
    expect(result[1].sourceField).toBe('store_name')
  })

  it('移動後に order が再採番される', () => {
    const result = moveColumnUp([COL_DATE, COL_STORE, COL_TOTAL], 2)
    expect(result[0].order).toBe(0)
    expect(result[1].order).toBe(1)
    expect(result[2].order).toBe(2)
  })
})

// ────────────────────────────────────────────
// moveColumnDown
// ────────────────────────────────────────────
describe('moveColumnDown', () => {
  it('1番目のカラムを下に移動すると順序が入れ替わる', () => {
    const result = moveColumnDown([COL_DATE, COL_STORE, COL_TOTAL], 1)
    expect(result[0].sourceField).toBe('receipt_date')
    expect(result[1].sourceField).toBe('total_amount')
    expect(result[2].sourceField).toBe('store_name')
  })

  it('末尾のカラムを下に移動しても変わらない', () => {
    const result = moveColumnDown([COL_DATE, COL_STORE], 1)
    expect(result[0].sourceField).toBe('receipt_date')
    expect(result[1].sourceField).toBe('store_name')
  })

  it('移動後に order が再採番される', () => {
    const result = moveColumnDown([COL_DATE, COL_STORE], 0)
    expect(result[0].order).toBe(0)
    expect(result[1].order).toBe(1)
  })
})

// ────────────────────────────────────────────
// updateColumnLabel
// ────────────────────────────────────────────
describe('updateColumnLabel', () => {
  it('指定インデックスの label を更新する', () => {
    const result = updateColumnLabel([COL_DATE, COL_STORE], 0, '取引日')
    expect(result[0].label).toBe('取引日')
    expect(result[1].label).toBe('店名') // 変化なし
  })
})

// ────────────────────────────────────────────
// updateColumnSourceField
// ────────────────────────────────────────────
describe('updateColumnSourceField', () => {
  it('指定インデックスの sourceField を更新する', () => {
    const result = updateColumnSourceField([COL_DATE, COL_STORE], 0, 'tax_amount')
    expect(result[0].sourceField).toBe('tax_amount')
    expect(result[1].sourceField).toBe('store_name') // 変化なし
  })
})

// ────────────────────────────────────────────
// normalizeOrders
// ────────────────────────────────────────────
describe('normalizeOrders', () => {
  it('order を 0 始まりの連番に揃える', () => {
    const cols: ExportColumn[] = [
      { ...COL_DATE, order: 5 },
      { ...COL_STORE, order: 10 },
      { ...COL_TOTAL, order: 20 },
    ]
    const result = normalizeOrders(cols)
    expect(result[0].order).toBe(0)
    expect(result[1].order).toBe(1)
    expect(result[2].order).toBe(2)
  })
})

// ────────────────────────────────────────────
// validateColumns
// ────────────────────────────────────────────
describe('validateColumns', () => {
  it('カラムが空の場合エラーメッセージを返す', () => {
    const error = validateColumns([])
    expect(error).not.toBeNull()
    expect(error).toContain('カラムが設定されていません')
  })

  it('カラムが1件以上ある場合は null を返す', () => {
    expect(validateColumns([COL_DATE])).toBeNull()
  })
})
