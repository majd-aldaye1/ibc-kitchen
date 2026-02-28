// app/layout.tsx
import './globals.css'
import type { ReactNode } from 'react'
import { Suspense } from 'react'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'

export const metadata = {
  title: 'IBC Kitchen',
  description: 'Search, scale, and convert recipe ingredients in your kitchen.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* ✅ This fixes the build error caused by useSearchParams() in SiteHeader */}
        <Suspense fallback={<div className="h-14 bg-[var(--brand-red)]" />}>
          <SiteHeader />
        </Suspense>

        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}