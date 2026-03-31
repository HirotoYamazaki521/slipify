/**
 * 共通フォームスタイル定数
 * 全コンポーネントで一貫したUIを維持するための Tailwind クラス文字列。
 */

export const INPUT_CLASS =
  'block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50' as const

export const INPUT_COMPACT_CLASS =
  'rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50' as const

export const PRIMARY_BUTTON_CLASS =
  'inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50' as const

export const SECONDARY_BUTTON_CLASS =
  'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50' as const

export const LABEL_CLASS = 'block text-sm font-medium text-gray-700' as const

export const CARD_CLASS =
  'rounded-lg border border-gray-200 bg-white shadow-sm' as const

export const ERROR_BOX_CLASS =
  'rounded-md bg-red-50 p-3 text-sm text-red-700' as const
