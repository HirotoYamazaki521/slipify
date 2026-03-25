import { ReceiptUploadForm } from '@/components/receipt-upload-form'

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">レシートをアップロード</h1>
      <ReceiptUploadForm />
    </div>
  )
}
