import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Slipify',
  description: 'レシート管理・CSV出力アプリ',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
