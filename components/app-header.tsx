import Link from 'next/link'
import { LogoutButton } from '@/components/logout-button'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/receipts"
          className="text-lg font-bold text-indigo-600 hover:text-indigo-700"
        >
          Slipify
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/settings/csv-format"
            className="min-h-[44px] min-w-[44px] text-sm text-gray-600 hover:text-gray-900 flex items-center"
          >
            設定
          </Link>
          <div className="min-h-[44px] min-w-[44px] flex items-center">
            <LogoutButton />
          </div>
        </nav>
      </div>
    </header>
  )
}
