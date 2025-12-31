import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '28hub-connect - ERP Integration Dashboard',
  description: 'Full-stack ERP integration system with WhatsApp notifications and AI capabilities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
