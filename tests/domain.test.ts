import { describe, it, expect } from 'vitest'
import {
  ACCOUNT_CATEGORY_LIST,
  isAccountCategory,
} from '@/types/domain'

describe('ACCOUNT_CATEGORY_LIST', () => {
  it('12科目が定義されている', () => {
    expect(ACCOUNT_CATEGORY_LIST).toHaveLength(12)
  })

  it('消耗品費が含まれている', () => {
    expect(ACCOUNT_CATEGORY_LIST).toContain('消耗品費')
  })

  it('交際費が含まれている', () => {
    expect(ACCOUNT_CATEGORY_LIST).toContain('交際費')
  })

  it('交通費が含まれている', () => {
    expect(ACCOUNT_CATEGORY_LIST).toContain('交通費')
  })

  it('通信費が含まれている', () => {
    expect(ACCOUNT_CATEGORY_LIST).toContain('通信費')
  })

  it('会議費が含まれている', () => {
    expect(ACCOUNT_CATEGORY_LIST).toContain('会議費')
  })

  it('福利厚生費が含まれている', () => {
    expect(ACCOUNT_CATEGORY_LIST).toContain('福利厚生費')
  })

  it('広告宣伝費が含まれている', () => {
    expect(ACCOUNT_CATEGORY_LIST).toContain('広告宣伝費')
  })

  it('地代家賃が含まれている', () => {
    expect(ACCOUNT_CATEGORY_LIST).toContain('地代家賃')
  })

  it('水道光熱費が含まれている', () => {
    expect(ACCOUNT_CATEGORY_LIST).toContain('水道光熱費')
  })

  it('外注費が含まれている', () => {
    expect(ACCOUNT_CATEGORY_LIST).toContain('外注費')
  })

  it('新聞図書費が含まれている', () => {
    expect(ACCOUNT_CATEGORY_LIST).toContain('新聞図書費')
  })

  it('雑費が含まれている', () => {
    expect(ACCOUNT_CATEGORY_LIST).toContain('雑費')
  })

  it('重複なし', () => {
    const unique = new Set(ACCOUNT_CATEGORY_LIST)
    expect(unique.size).toBe(ACCOUNT_CATEGORY_LIST.length)
  })
})

describe('isAccountCategory', () => {
  it('有効な勘定科目を true と判定する', () => {
    expect(isAccountCategory('消耗品費')).toBe(true)
    expect(isAccountCategory('雑費')).toBe(true)
    expect(isAccountCategory('交通費')).toBe(true)
  })

  it('無効な値を false と判定する', () => {
    expect(isAccountCategory('無効な科目')).toBe(false)
    expect(isAccountCategory('')).toBe(false)
    expect(isAccountCategory(null)).toBe(false)
    expect(isAccountCategory(undefined)).toBe(false)
    expect(isAccountCategory(123)).toBe(false)
  })
})

describe('RECEIPT_SOURCE_FIELDS', () => {
  it('RECEIPT_SOURCE_FIELDS が定義されている', async () => {
    const { RECEIPT_SOURCE_FIELDS } = await import('@/types/domain')
    expect(RECEIPT_SOURCE_FIELDS).toBeDefined()
    expect(RECEIPT_SOURCE_FIELDS).toContain('receipt_date')
    expect(RECEIPT_SOURCE_FIELDS).toContain('store_name')
    expect(RECEIPT_SOURCE_FIELDS).toContain('item_name')
    expect(RECEIPT_SOURCE_FIELDS).toContain('unit_price')
    expect(RECEIPT_SOURCE_FIELDS).toContain('quantity')
    expect(RECEIPT_SOURCE_FIELDS).toContain('subtotal')
    expect(RECEIPT_SOURCE_FIELDS).toContain('total_amount')
    expect(RECEIPT_SOURCE_FIELDS).toContain('tax_amount')
    expect(RECEIPT_SOURCE_FIELDS).toContain('account_category')
  })
})

describe('DELIMITERS', () => {
  it('DELIMITERS が定義されている', async () => {
    const { DELIMITERS } = await import('@/types/domain')
    expect(DELIMITERS).toBeDefined()
    expect(DELIMITERS).toContain(',')
    expect(DELIMITERS).toContain('\t')
    expect(DELIMITERS).toContain(';')
    expect(DELIMITERS).toHaveLength(3)
  })
})
