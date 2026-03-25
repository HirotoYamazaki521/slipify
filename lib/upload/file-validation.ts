export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export type FileValidationError =
  | { code: 'INVALID_FILE_TYPE'; message: string }
  | { code: 'FILE_TOO_LARGE'; message: string }

export function validateUploadFile(file: File): FileValidationError | null {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return {
      code: 'INVALID_FILE_TYPE',
      message: 'JPEG・PNG・WebP形式のみ対応しています',
    }
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      code: 'FILE_TOO_LARGE',
      message: 'ファイルサイズが上限（10MB）を超えています',
    }
  }
  return null
}
