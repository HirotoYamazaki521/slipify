import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createExportTemplateRepository } from '@/lib/repositories/export-template-repository'
import { DELIMITERS } from '@/types/domain'
import type { ExportColumn, Delimiter } from '@/types/domain'

type RouteContext = { params: Promise<{ id: string }> }

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
// PUT /api/export-templates/[id]
// ────────────────────────────────────────────
export async function PUT(request: NextRequest, { params }: RouteContext) {
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

  // columns が指定されている場合は空配列を拒否
  if (body.columns !== undefined && (!Array.isArray(body.columns) || body.columns.length === 0)) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'columns は1件以上必要です' } },
      { status: 400 }
    )
  }

  // delimiter が指定されている場合は値を検証
  if (body.delimiter !== undefined && !(DELIMITERS as unknown[]).includes(body.delimiter)) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'delimiter はカンマ・タブ・セミコロンのいずれかです' } },
      { status: 400 }
    )
  }

  const { id } = await params
  const repo = await createExportTemplateRepository()

  const existing = await repo.findById(id, user.id)
  if (!existing) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'データが見つかりません' } },
      { status: 404 }
    )
  }

  const updateData: {
    name?: string
    columns?: ExportColumn[]
    delimiter?: Delimiter
    isDefault?: boolean
  } = {}
  if (typeof body.name === 'string') updateData.name = body.name
  if (Array.isArray(body.columns)) updateData.columns = body.columns as ExportColumn[]
  if (body.delimiter !== undefined) updateData.delimiter = body.delimiter as Delimiter
  if (typeof body.isDefault === 'boolean') updateData.isDefault = body.isDefault

  const template = await repo.update(id, user.id, updateData)
  return NextResponse.json({ template })
}

// ────────────────────────────────────────────
// DELETE /api/export-templates/[id]
// ────────────────────────────────────────────
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    )
  }

  const { id } = await params
  const repo = await createExportTemplateRepository()

  const existing = await repo.findById(id, user.id)
  if (!existing) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'データが見つかりません' } },
      { status: 404 }
    )
  }

  await repo.delete(id, user.id)
  return new Response(null, { status: 204 })
}
