import { describe, it, expect } from 'vitest'
import { buildCategoryOptions } from '@/lib/utils/category-options'
import { ACCOUNT_CATEGORY_LIST } from '@/types/domain'
import type { CustomAccountCategory } from '@/types/domain'

const CUSTOM: CustomAccountCategory[] = [
  { id: 'c1', userId: 'u1', name: '研究費', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'c2', userId: 'u1', name: '展示会費', createdAt: '2024-01-02T00:00:00Z' },
]

describe('buildCategoryOptions', () => {
  it('固定科目リストを含む', () => {
    const options = buildCategoryOptions([], null)
    ACCOUNT_CATEGORY_LIST.forEach((cat) => {
      expect(options.map((o) => o.value)).toContain(cat)
    })
  })

  it('カスタム科目を末尾に追加する', () => {
    const options = buildCategoryOptions(CUSTOM, null)
    const customNames = options.filter((o) => o.isCustom).map((o) => o.value)
    expect(customNames).toEqual(['研究費', '展示会費'])
  })

  it('固定科目が先でカスタム科目が後になる', () => {
    const options = buildCategoryOptions(CUSTOM, null)
    const fixedEndIndex = options.findLastIndex((o) => !o.isCustom)
    const customStartIndex = options.findIndex((o) => o.isCustom)
    expect(fixedEndIndex).toBeLessThan(customStartIndex)
  })

  it('currentCategory が固定にもカスタムにもない場合は先頭に追加する', () => {
    const options = buildCategoryOptions([], '未登録科目')
    expect(options[0].value).toBe('未登録科目')
    expect(options[0].isUnknown).toBe(true)
  })

  it('currentCategory が固定科目にある場合は追加しない', () => {
    const options = buildCategoryOptions([], '消耗品費')
    const unknown = options.filter((o) => o.isUnknown)
    expect(unknown).toHaveLength(0)
  })

  it('currentCategory が null の場合は追加しない', () => {
    const options = buildCategoryOptions([], null)
    const unknown = options.filter((o) => o.isUnknown)
    expect(unknown).toHaveLength(0)
  })

  it('currentCategory がカスタム科目にある場合は追加しない', () => {
    const options = buildCategoryOptions(CUSTOM, '研究費')
    const unknown = options.filter((o) => o.isUnknown)
    expect(unknown).toHaveLength(0)
  })
})
