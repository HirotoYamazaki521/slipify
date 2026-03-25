import { describe, it, expect } from 'vitest'
import { buildExportUrl, validateExportSelection } from '@/lib/csv/export-url-builder'

// ────────────────────────────────────────────
// buildExportUrl
// ────────────────────────────────────────────
describe('buildExportUrl', () => {
  it('receiptIds をカンマ結合したクエリを生成する', () => {
    const url = buildExportUrl(['id1', 'id2', 'id3'], null)
    expect(url).toBe('/api/exports/csv?receiptIds=id1%2Cid2%2Cid3')
  })

  it('templateId が指定されている場合はクエリに含める', () => {
    const url = buildExportUrl(['id1'], 'tmpl-1')
    expect(url).toContain('templateId=tmpl-1')
    expect(url).toContain('receiptIds=id1')
  })

  it('templateId が null の場合はクエリに含めない', () => {
    const url = buildExportUrl(['id1'], null)
    expect(url).not.toContain('templateId')
  })

  it('1件の receiptId でも正しく動作する', () => {
    const url = buildExportUrl(['abc-123'], null)
    expect(url).toBe('/api/exports/csv?receiptIds=abc-123')
  })
})

// ────────────────────────────────────────────
// validateExportSelection
// ────────────────────────────────────────────
describe('validateExportSelection', () => {
  it('空配列の場合エラーメッセージを返す', () => {
    const error = validateExportSelection([])
    expect(error).not.toBeNull()
    expect(error).toContain('エクスポート対象がありません')
  })

  it('1件以上選択されている場合は null を返す', () => {
    expect(validateExportSelection(['id1'])).toBeNull()
    expect(validateExportSelection(['id1', 'id2'])).toBeNull()
  })
})
