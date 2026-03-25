'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { signUp, type AuthState } from '@/app/actions/auth'

const initialState: AuthState = {
  error: null,
  fieldErrors: { email: null, password: null },
}

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUp, initialState)
  const [submitted, setSubmitted] = useState(false)

  if (submitted && !state.error && !state.fieldErrors.email && !state.fieldErrors.password) {
    return (
      <div className="rounded-lg bg-white p-8 shadow-md text-center">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">確認メールを送信しました</h1>
        <p className="text-gray-600">
          登録したメールアドレスに確認メールを送信しました。
          <br />
          メール内のリンクをクリックしてアカウントを有効化してください。
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-blue-600 hover:underline"
        >
          ログインページへ
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-8 shadow-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">新規登録</h1>

      <form
        action={(formData) => {
          setSubmitted(true)
          formAction(formData)
        }}
        className="space-y-4"
      >
        {state.error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {state.fieldErrors.email && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            パスワード
            <span className="ml-1 text-xs text-gray-500">（6文字以上）</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {state.fieldErrors.password && (
            <p className="mt-1 text-xs text-red-600">{state.fieldErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? '登録中...' : 'アカウントを作成'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        すでにアカウントをお持ちの方は{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  )
}
