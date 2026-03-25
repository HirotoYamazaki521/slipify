/** 選択された receiptIds と templateId から CSV エクスポート URL を生成する */
export function buildExportUrl(receiptIds: string[], templateId: string | null): string {
  const params = new URLSearchParams()
  params.set('receiptIds', receiptIds.join(','))
  if (templateId) params.set('templateId', templateId)
  return `/api/exports/csv?${params.toString()}`
}

/** エクスポート選択のバリデーション。エラーがあればメッセージを、なければ null を返す */
export function validateExportSelection(selectedIds: string[]): string | null {
  if (selectedIds.length === 0) {
    return 'エクスポート対象がありません'
  }
  return null
}
