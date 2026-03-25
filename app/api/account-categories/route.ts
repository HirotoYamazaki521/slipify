import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ACCOUNT_CATEGORY_LIST } from '@/types/domain'
import type { CustomAccountCategory } from '@/types/domain'

interface CustomCategoryRow {
  id: string
  user_id: string
  name: string
  created_at: string
}

function mapRow(row: CustomCategoryRow): CustomAccountCategory {
  return { id: row.id, userId: row.user_id, name: row.name, createdAt: row.created_at }
}

async function authenticate() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { supabase, user: error || !user ? null : user }
}

// ────────────────────────────────────────────
// GET /api/account-categories
// ────────────────────────────────────────────
export async function GET(_request: NextRequest) {
  const { supabase, user } = await authenticate()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    )
  }

  const { data, error } = await supabase
    .from('custom_account_categories')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'データの取得に失敗しました' } },
      { status: 500 }
    )
  }

  const custom = (data as CustomCategoryRow[] ?? []).map(mapRow)
  return NextResponse.json({ fixed: ACCOUNT_CATEGORY_LIST, custom })
}

// ────────────────────────────────────────────
// POST /api/account-categories
// ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const { supabase, user } = await authenticate()
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    )
  }

  let body: { name?: unknown }
  try {
    body = (await request.json()) as { name?: unknown }
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

  const { data, error } = await supabase
    .from('custom_account_categories')
    .insert({ user_id: user.id, name: body.name })
    .select()
    .single()

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'その勘定科目名は既に登録されています' } },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'データの保存に失敗しました' } },
      { status: 500 }
    )
  }

  const category = mapRow(data as CustomCategoryRow)
  return NextResponse.json({ category }, { status: 201 })
}
