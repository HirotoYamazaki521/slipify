'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signIn, type AuthState } from '@/app/actions/auth'
import { INPUT_CLASS, PRIMARY_BUTTON_CLASS, LABEL_CLASS, ERROR_BOX_CLASS } from '@/lib/styles/form'

const initialState: AuthState = {
  error: null,
  fieldErrors: { email: null, password: null },
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, initialState)

  return (
    <div className="rounded-xl bg-white p-8 shadow-lg">
      <div className="mb-6 text-center">
        <p className="text-2xl font-bold text-indigo-600">Slipify</p>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">ログイン</h1>
      </div>

      <form action={formAction} className="space-y-4">
        {state.error && (
          <div className={ERROR_BOX_CLASS}>{state.error}</div>
        )}

        <div>
          <label htmlFor="email" className={LABEL_CLASS}>
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={`mt-1 ${INPUT_CLASS}`}
          />
          {state.fieldErrors.email && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className={LABEL_CLASS}>
            パスワード
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={`mt-1 ${INPUT_CLASS}`}
          />
          {state.fieldErrors.password && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className={`w-full ${PRIMARY_BUTTON_CLASS}`}
        >
          {isPending ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        アカウントをお持ちでない方は{' '}
        <Link href="/signup" className="text-indigo-600 hover:underline">
          新規登録
        </Link>
      </p>
    </div>
  )
}
