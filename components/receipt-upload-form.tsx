'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { validateUploadFile, type FileValidationError } from '@/lib/upload/file-validation'

export function ReceiptUploadForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<FileValidationError | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setValidationError(null)
    setUploadError(null)

    if (!file) {
      setSelectedFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      return
    }

    const error = validateUploadFile(file)
    if (error) {
      setValidationError(error)
      setSelectedFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setSelectedFile(file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await fetch('/api/receipts', { method: 'POST', body: formData })

      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } }
        setUploadError(body.error?.message ?? 'アップロードに失敗しました')
        return
      }

      const { receipt } = (await res.json()) as { receipt: { id: string } }
      router.push(`/receipts/${receipt.id}`)
    } catch {
      setUploadError('ネットワークエラーが発生しました')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          レシート画像（JPEG・PNG・WebP、最大10MB）
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={isUploading}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
        />
        {validationError && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {validationError.message}
          </p>
        )}
      </div>

      {previewUrl && (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="レシートプレビュー"
            className="w-full object-contain"
            style={{ maxHeight: '400px' }}
          />
        </div>
      )}

      {uploadError && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {uploadError}
        </div>
      )}

      <button
        type="submit"
        disabled={!selectedFile || isUploading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isUploading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            解析中...
          </span>
        ) : (
          '解析を開始'
        )}
      </button>
    </form>
  )
}
