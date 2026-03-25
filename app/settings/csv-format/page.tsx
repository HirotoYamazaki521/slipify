import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createExportTemplateRepository } from '@/lib/repositories/export-template-repository'
import { CsvFormatEditor } from '@/components/csv-format-editor'

export default async function CsvFormatPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const repo = await createExportTemplateRepository()
  const templates = await repo.findMany(user.id)

  // デフォルトテンプレートを優先、なければ先頭、それも無ければ null
  const defaultTemplate =
    templates.find((t) => t.isDefault) ?? templates[0] ?? null

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/receipts" className="text-sm text-blue-600 hover:underline">
          ← レシート一覧
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">CSV フォーマット設定</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <CsvFormatEditor initialTemplate={defaultTemplate} />
      </div>
    </div>
  )
}
