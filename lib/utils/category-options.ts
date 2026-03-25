import { ACCOUNT_CATEGORY_LIST } from '@/types/domain'
import type { CustomAccountCategory } from '@/types/domain'

export interface CategoryOption {
  value: string
  label: string
  isCustom: boolean
  isUnknown: boolean
}

/**
 * 固定科目リスト・カスタム科目・現在の勘定科目を統合してドロップダウン選択肢を生成する。
 * currentCategory が固定・カスタムいずれにも存在しない場合は先頭に追加する。
 */
export function buildCategoryOptions(
  custom: CustomAccountCategory[],
  currentCategory: string | null
): CategoryOption[] {
  const fixedOptions: CategoryOption[] = ACCOUNT_CATEGORY_LIST.map((cat) => ({
    value: cat,
    label: cat,
    isCustom: false,
    isUnknown: false,
  }))

  const customOptions: CategoryOption[] = custom.map((c) => ({
    value: c.name,
    label: c.name,
    isCustom: true,
    isUnknown: false,
  }))

  const allOptions = [...fixedOptions, ...customOptions]

  if (
    currentCategory &&
    !allOptions.some((o) => o.value === currentCategory)
  ) {
    const unknownOption: CategoryOption = {
      value: currentCategory,
      label: currentCategory,
      isCustom: false,
      isUnknown: true,
    }
    return [unknownOption, ...allOptions]
  }

  return allOptions
}
