import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'anon.chat — анонимный чат',
  description: 'Анонимный чат без регистрации. История исчезает при закрытии вкладки.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}