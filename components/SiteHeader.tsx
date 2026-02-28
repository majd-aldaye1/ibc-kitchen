'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SiteHeader() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialQ = (searchParams.get('q') || '').trim()
  const [q, setQ] = useState(initialQ)

  // Keep input synced if user navigates/back/forward
  useEffect(() => {
    setQ((searchParams.get('q') || '').trim())
  }, [searchParams])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next = q.trim()
    const url = next ? `/?q=${encodeURIComponent(next)}` : '/'
    router.push(url as any) // cast avoids Next typed-route TS errors
  }

  return (
    <header className="sticky top-0 z-40 shadow-sm">
      <div className="bg-[var(--brand-red)] bg-gradient-to-b from-[var(--brand-red)] to-[var(--brand-red-dark)]">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-condensed text-2xl text-white">IBC Kitchen</div>
          </Link>

          {/* Search */}
          <form onSubmit={submit} className="ml-auto flex w-full max-w-xl items-stretch gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search recipes..."
              className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-sm text-black placeholder:text-neutral-500"
            />
            <button
              type="submit"
              className="rounded-lg bg-black/15 px-4 py-2 text-sm font-semibold text-white hover:bg-black/25"
            >
              Go
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}