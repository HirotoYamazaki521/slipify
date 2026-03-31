export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
