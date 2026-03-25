import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createExportTemplateRepository } from '@/lib/repositories/export-template-repository'
import { DELIMITERS } from '@/types/domain'
import type { ExportColumn, Delimiter } from '@/types/domain'

async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// ────────────────────────────────────────────
// GET /api/export-templates
// ────────────────────────────────────────────
export async function GET(_request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    )
  }

  const repo = await createExportTemplateRepository()
  const templates = await repo.findMany(user.id)
  return NextResponse.json({ templates })
}

// ────────────────────────────────────────────
// POST /api/export-templates
// ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    )
  }

  let body: { name?: unknown; columns?: unknown; delimiter?: unknown; isDefault?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'リクエストボディが不正です' } },
      { status: 400 }
    )
  }

  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'name は必須です' } },
      { status: 400 }
    )
  }

  if (!Array.isArray(body.columns) || body.columns.length === 0) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'columns は1件以上必要です' } },
      { status: 400 }
    )
  }

  if (!body.delimiter || !(DELIMITERS as unknown[]).includes(body.delimiter)) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'delimiter はカンマ・タブ・セミコロンのいずれかです' } },
      { status: 400 }
    )
  }

  const repo = await createExportTemplateRepository()
  const template = await repo.create({
    userId: user.id,
    name: body.name,
    columns: body.columns as ExportColumn[],
    delimiter: body.delimiter as Delimiter,
    isDefault: typeof body.isDefault === 'boolean' ? body.isDefault : false,
  })

  return NextResponse.json({ template }, { status: 201 })
}
