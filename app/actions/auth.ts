'use server'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { validateAuthForm } from '@/lib/auth/validation'

export interface AuthState {
  error: string | null
  fieldErrors: { email: string | null; password: string | null }
}

export async function signUp(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const validation = validateAuthForm(email, password)
  if (validation.hasError) {
    return { error: null, fieldErrors: { email: validation.email, password: validation.password } }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return {
      error: 'アカウントの作成に失敗しました。しばらくしてからお試しください。',
      fieldErrors: { email: null, password: null },
    }
  }

  return {
    error: null,
    fieldErrors: { email: null, password: null },
  }
}

export async function signIn(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const validation = validateAuthForm(email, password)
  if (validation.hasError) {
    return { error: null, fieldErrors: { email: validation.email, password: validation.password } }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return {
      error: 'メールアドレスまたはパスワードが正しくありません',
      fieldErrors: { email: null, password: null },
    }
  }

  redirect('/receipts')
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}
