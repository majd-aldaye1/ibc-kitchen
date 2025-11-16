'use client'
import Link from 'next/link'
import type { Route } from 'next'

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 shadow-sm">
      <div className="bg-[var(--brand-red)] bg-gradient-to-b from-[var(--brand-red)] to-[var(--brand-red-dark)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
          {/* Logo */}
          <Link href={"/" as Route} className="flex items-center gap-3 py-3">
            <div className="h-condensed text-2xl text-white">IBC Kitchen</div>
          </Link>

          {/* Only one nav item now */}
          <nav className="hidden md:flex items-stretch">
            <Link
              href={"/categories" as Route}
              className="px-4 py-3 text-white/95 hover:text-white h-condensed tracking-wide"
            >
              Categories
            </Link>
          </nav>

          {/* Mobile shortcut */}
          <Link
            href={"/categories" as Route}
            className="md:hidden px-3 py-2 rounded text-white/90 border border-white/20"
          >
            Categories
          </Link>
        </div>
      </div>
    </header>
  )
}
