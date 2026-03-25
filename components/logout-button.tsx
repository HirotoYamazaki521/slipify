'use client'

import { signOut } from '@/app/actions/auth'

export function LogoutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        ログアウト
      </button>
    </form>
  )
}
