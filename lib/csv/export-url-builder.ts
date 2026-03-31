interface ExportUrlOptions {
  templateId?: string | null
  startDate?: string
  endDate?: string
}

/** 選択された receiptIds・templateId・日付範囲から CSV エクスポート URL を生成する */
export function buildExportUrl(
  receiptIds: string[],
  templateId: string | null,
  options?: ExportUrlOptions
): string {
  const params = new URLSearchParams()
  params.set('receiptIds', receiptIds.join(','))
  if (templateId) params.set('templateId', templateId)
  if (options?.startDate) params.set('startDate', options.startDate)
  if (options?.endDate) params.set('endDate', options.endDate)
  return `/api/exports/csv?${params.toString()}`
}

/** エクスポート選択のバリデーション。エラーがあればメッセージを、なければ null を返す */
export function validateExportSelection(selectedIds: string[]): string | null {
  if (selectedIds.length === 0) {
    return 'エクスポート対象がありません'
  }
  return null
}
