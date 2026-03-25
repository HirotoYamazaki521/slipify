import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate } from '@/lib/utils/format'

describe('formatCurrency', () => {
  it('整数を ¥X,XXX 形式にフォーマットする', () => {
    expect(formatCurrency(1000)).toBe('¥1,000')
  })

  it('0 を ¥0 にフォーマットする', () => {
    expect(formatCurrency(0)).toBe('¥0')
  })

  it('大きな金額を正しくフォーマットする', () => {
    expect(formatCurrency(1234567)).toBe('¥1,234,567')
  })

  it('小数を整数に丸める', () => {
    expect(formatCurrency(1000.9)).toBe('¥1,001')
  })
})

describe('formatDate', () => {
  it('YYYY-MM-DD を YYYY年M月D日 にフォーマットする', () => {
    expect(formatDate('2024-01-15')).toBe('2024年1月15日')
  })

  it('月・日が 1 桁の場合はゼロパディングしない', () => {
    expect(formatDate('2024-03-05')).toBe('2024年3月5日')
  })

  it('12月31日を正しくフォーマットする', () => {
    expect(formatDate('2024-12-31')).toBe('2024年12月31日')
  })
})
