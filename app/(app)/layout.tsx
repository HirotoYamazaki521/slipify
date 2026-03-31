import { AppHeader } from '@/components/app-header'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main>{children}</main>
    </div>
  )
}
