'use client'

import Link from 'next/link'
import type { Route } from 'next'
import recipes from '../../data/recipes'
import { catSlug } from '../../lib/slug'
import { useMemo } from 'react'

export default function CategoriesPage() {
  const categories = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of recipes) {
      const name = (r.category || 'General').trim()
      map.set(name, (map.get(name) || 0) + 1)
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count, slug: catSlug(name) }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="h-condensed text-3xl mb-6">Categories</h1>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {categories.map(({ name, slug, count }) => (
          <Link
            key={slug}
            href={`/c/${slug}` as Route}
            className="block rounded-lg border border-black/10 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="h-condensed text-xl text-[var(--brand-red-dark)]">{name}</div>
            <div className="text-sm text-neutral-600">{count} recipes</div>
          </Link>
        ))}
      </div>
    </main>
  )
}
