'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { signUp, type AuthState } from '@/app/actions/auth'
import { INPUT_CLASS, PRIMARY_BUTTON_CLASS, LABEL_CLASS, ERROR_BOX_CLASS } from '@/lib/styles/form'

const initialState: AuthState = {
  error: null,
  fieldErrors: { email: null, password: null },
}

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUp, initialState)
  const [submitted, setSubmitted] = useState(false)

  if (submitted && !state.error && !state.fieldErrors.email && !state.fieldErrors.password) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-lg text-center">
        <p className="text-2xl font-bold text-indigo-600">Slipify</p>
        <h1 className="mt-4 text-xl font-bold text-gray-900">確認メールを送信しました</h1>
        <p className="mt-3 text-gray-600">
          登録したメールアドレスに確認メールを送信しました。
          <br />
          メール内のリンクをクリックしてアカウントを有効化してください。
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-indigo-600 hover:underline"
        >
          ログインページへ
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-8 shadow-lg">
      <div className="mb-6 text-center">
        <p className="text-2xl font-bold text-indigo-600">Slipify</p>
        <h1 className="mt-1 text-lg font-semibold text-gray-900">新規登録</h1>
      </div>

      <form
        action={(formData) => {
          setSubmitted(true)
          formAction(formData)
        }}
        className="space-y-4"
      >
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
            <span className="ml-1 text-xs text-gray-500">（6文字以上）</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
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
          {isPending ? '登録中...' : 'アカウントを作成'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        すでにアカウントをお持ちの方は{' '}
        <Link href="/login" className="text-indigo-600 hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  )
}
