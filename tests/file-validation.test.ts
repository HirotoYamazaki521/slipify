import { describe, it, expect } from 'vitest'
import { validateUploadFile } from '@/lib/upload/file-validation'

describe('validateUploadFile', () => {
  describe('有効なファイル', () => {
    it('JPEG ファイルは null を返す', () => {
      const file = new File([new Uint8Array(1024)], 'test.jpg', { type: 'image/jpeg' })
      expect(validateUploadFile(file)).toBeNull()
    })

    it('PNG ファイルは null を返す', () => {
      const file = new File([new Uint8Array(1024)], 'test.png', { type: 'image/png' })
      expect(validateUploadFile(file)).toBeNull()
    })

    it('WebP ファイルは null を返す', () => {
      const file = new File([new Uint8Array(1024)], 'test.webp', { type: 'image/webp' })
      expect(validateUploadFile(file)).toBeNull()
    })

    it('ちょうど 10MB の JPEG は null を返す', () => {
      const file = new File([new Uint8Array(10 * 1024 * 1024)], 'exact.jpg', {
        type: 'image/jpeg',
      })
      expect(validateUploadFile(file)).toBeNull()
    })
  })

  describe('INVALID_FILE_TYPE エラー', () => {
    it('PDF は INVALID_FILE_TYPE を返す', () => {
      const file = new File([new Uint8Array(1024)], 'test.pdf', { type: 'application/pdf' })
      const error = validateUploadFile(file)
      expect(error?.code).toBe('INVALID_FILE_TYPE')
      expect(error?.message).toContain('JPEG・PNG・WebP')
    })

    it('GIF は INVALID_FILE_TYPE を返す', () => {
      const file = new File([new Uint8Array(1024)], 'test.gif', { type: 'image/gif' })
      const error = validateUploadFile(file)
      expect(error?.code).toBe('INVALID_FILE_TYPE')
    })

    it('空の MIME タイプは INVALID_FILE_TYPE を返す', () => {
      const file = new File([new Uint8Array(1024)], 'test', { type: '' })
      const error = validateUploadFile(file)
      expect(error?.code).toBe('INVALID_FILE_TYPE')
    })
  })

  describe('FILE_TOO_LARGE エラー', () => {
    it('10MB 超の JPEG は FILE_TOO_LARGE を返す', () => {
      const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.jpg', {
        type: 'image/jpeg',
      })
      const error = validateUploadFile(file)
      expect(error?.code).toBe('FILE_TOO_LARGE')
      expect(error?.message).toContain('10MB')
    })

    it('11MB のファイルは FILE_TOO_LARGE を返す', () => {
      const file = new File([new Uint8Array(11 * 1024 * 1024)], 'large.png', {
        type: 'image/png',
      })
      const error = validateUploadFile(file)
      expect(error?.code).toBe('FILE_TOO_LARGE')
    })
  })
})
