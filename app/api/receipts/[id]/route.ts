import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createReceiptRepository } from '@/lib/repositories/receipt-repository'

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
// GET /api/receipts/[id]
// ────────────────────────────────────────────
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    )
  }

  const { id } = await params
  const repo = await createReceiptRepository()
  const receipt = await repo.findByIdWithLineItems(id, user.id)

  if (!receipt) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'データが見つかりません' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ receipt })
}

// ────────────────────────────────────────────
// DELETE /api/receipts/[id]
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
  const repo = await createReceiptRepository()

  const existing = await repo.findByIdWithLineItems(id, user.id)
  if (!existing) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'データが見つかりません' } },
      { status: 404 }
    )
  }

  await repo.delete(id, user.id)
  return new Response(null, { status: 204 })
}

// ────────────────────────────────────────────
// PATCH /api/receipts/[id]
// ────────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const user = await getAuthenticatedUser()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    )
  }

  let body: { accountCategory?: unknown }
  try {
    body = (await request.json()) as { accountCategory?: unknown }
  } catch {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'リクエストボディが不正です' } },
      { status: 400 }
    )
  }

  if (!body.accountCategory || typeof body.accountCategory !== 'string') {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'accountCategory は必須です' } },
      { status: 400 }
    )
  }

  const { id } = await params
  const repo = await createReceiptRepository()

  const existing = await repo.findByIdWithLineItems(id, user.id)
  if (!existing) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'データが見つかりません' } },
      { status: 404 }
    )
  }

  const receipt = await repo.updateAccountCategory(id, user.id, body.accountCategory)
  return NextResponse.json({ receipt })
}
