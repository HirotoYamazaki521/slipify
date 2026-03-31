import { describe, it, expect } from 'vitest'
import {
  INPUT_CLASS,
  INPUT_COMPACT_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
  LABEL_CLASS,
  CARD_CLASS,
  ERROR_BOX_CLASS,
} from '@/lib/styles/form'

/**
 * Task 7.3: デザイントークン・クラス定数の品質確認テスト
 *
 * Requirements: 6.1, 6.3, 7.2
 * - INPUT_CLASS, PRIMARY_BUTTON_CLASS が期待するデザイントークンを含むことを確認
 * - WCAG AA コントラスト基準（gray-900 テキスト）が適用されていることを確認
 * - focus ring が indigo-500 に統一されていることを確認
 */

describe('INPUT_CLASS', () => {
  it('dark text color (text-gray-900) を含む', () => {
    expect(INPUT_CLASS).toContain('text-gray-900')
  })

  it('WCAG AA を満たすプレースホルダー色 (placeholder:text-gray-400) を含む', () => {
    expect(INPUT_CLASS).toContain('placeholder:text-gray-400')
  })

  it('focus ring を indigo-500 に統一している', () => {
    expect(INPUT_CLASS).toContain('focus:ring-indigo-500')
    expect(INPUT_CLASS).toContain('focus:border-indigo-500')
  })

  it('blue-500 / blue-600 を含まない（カラー統一確認）', () => {
    expect(INPUT_CLASS).not.toContain('blue-')
  })

  it('disabled 状態のスタイルを含む', () => {
    expect(INPUT_CLASS).toContain('disabled:opacity-50')
    expect(INPUT_CLASS).toContain('disabled:cursor-not-allowed')
  })

  it('rounded-md border border-gray-300 を含む', () => {
    expect(INPUT_CLASS).toContain('rounded-md')
    expect(INPUT_CLASS).toContain('border-gray-300')
  })
})

describe('INPUT_COMPACT_CLASS', () => {
  it('dark text color (text-gray-900) を含む', () => {
    expect(INPUT_COMPACT_CLASS).toContain('text-gray-900')
  })

  it('focus ring を indigo-500 に統一している', () => {
    expect(INPUT_COMPACT_CLASS).toContain('focus:ring-indigo-500')
  })

  it('blue-500 / blue-600 を含まない', () => {
    expect(INPUT_COMPACT_CLASS).not.toContain('blue-')
  })
})

describe('PRIMARY_BUTTON_CLASS', () => {
  it('プライマリカラーとして indigo-600 を使用する（要件 2.3）', () => {
    expect(PRIMARY_BUTTON_CLASS).toContain('bg-indigo-600')
    expect(PRIMARY_BUTTON_CLASS).toContain('hover:bg-indigo-700')
  })

  it('blue-600 を含まない（旧カラーの残存なし、要件 2.4）', () => {
    expect(PRIMARY_BUTTON_CLASS).not.toContain('blue-')
  })

  it('disabled 状態スタイルを含む（要件 5.3）', () => {
    expect(PRIMARY_BUTTON_CLASS).toContain('disabled:opacity-50')
    expect(PRIMARY_BUTTON_CLASS).toContain('disabled:cursor-not-allowed')
  })

  it('text-white を含む（ボタンテキストの視認性）', () => {
    expect(PRIMARY_BUTTON_CLASS).toContain('text-white')
  })

  it('focus ring を含む（アクセシビリティ）', () => {
    expect(PRIMARY_BUTTON_CLASS).toContain('focus:ring-indigo-500')
  })
})

describe('SECONDARY_BUTTON_CLASS', () => {
  it('アウトラインスタイルを持つ', () => {
    expect(SECONDARY_BUTTON_CLASS).toContain('border')
    expect(SECONDARY_BUTTON_CLASS).toContain('bg-white')
    expect(SECONDARY_BUTTON_CLASS).toContain('text-gray-700')
  })

  it('blue-600 を含まない', () => {
    expect(SECONDARY_BUTTON_CLASS).not.toContain('blue-')
  })
})

describe('LABEL_CLASS', () => {
  it('readable text color を持つ（要件 5.5）', () => {
    expect(LABEL_CLASS).toContain('text-gray-700')
  })

  it('font-medium を含む（視認性）', () => {
    expect(LABEL_CLASS).toContain('font-medium')
  })
})

describe('CARD_CLASS', () => {
  it('white background を持つ（カード浮き上がり、要件 3.4）', () => {
    expect(CARD_CLASS).toContain('bg-white')
  })

  it('rounded corners を持つ', () => {
    expect(CARD_CLASS).toContain('rounded-lg')
  })

  it('shadow を持つ', () => {
    expect(CARD_CLASS).toContain('shadow-sm')
  })
})

describe('ERROR_BOX_CLASS', () => {
  it('red tinted background を持つ（要件 4.4）', () => {
    expect(ERROR_BOX_CLASS).toContain('bg-red-50')
    expect(ERROR_BOX_CLASS).toContain('text-red-700')
  })
})

/**
 * Task 7.3: スタイル文字列スナップショット
 * クラス定数の内容を固定し、意図しない変更を検出する。
 */
describe('Design token snapshots', () => {
  it('INPUT_CLASS スナップショット', () => {
    expect(INPUT_CLASS).toMatchSnapshot()
  })

  it('PRIMARY_BUTTON_CLASS スナップショット', () => {
    expect(PRIMARY_BUTTON_CLASS).toMatchSnapshot()
  })

  it('CARD_CLASS スナップショット', () => {
    expect(CARD_CLASS).toMatchSnapshot()
  })
})
