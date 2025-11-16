'use client'

import Fuse from 'fuse.js'
import { useMemo } from 'react'
import recipes, { type Recipe } from '../data/recipes'
import { catSlug } from '../lib/slug'
import Link from 'next/link'
import type { Route } from 'next'
import { useSearchParams } from 'next/navigation'
import Hero from '../components/Hero'

export default function HomePage() {
  // Read q from URL so the header search controls results
  const searchParams = useSearchParams()
  const q = (searchParams.get('q') || '').trim()
  const qNorm = q.toLowerCase()

  // Build a single Fuse index (slightly stricter, include scores)
  const fuse = useMemo(
    () =>
      new Fuse(recipes, {
        keys: [
          { name: 'title', weight: 0.6 },
          { name: 'ingredients.name', weight: 0.3 },
          { name: 'category', weight: 0.1 },
        ],
        includeScore: true,
        ignoreLocation: true,
        minMatchCharLength: 3,
        threshold: 0.28,
        distance: 150,
      }),
    []
  )

  // Quick helpers
  const titleContains = (r: any) => (r.title || '').toLowerCase().includes(qNorm)
  const titleStarts   = (r: any) => (r.title || '').toLowerCase().startsWith(qNorm)
  const ingContains   = (r: any) =>
    Array.isArray(r.ingredients) &&
    r.ingredients.some((i: any) => (i?.name || '').toLowerCase().includes(qNorm))
  const catContains   = (r: any) => (r.category || '').toLowerCase().includes(qNorm)

  // Tiered ranking
  const results: Recipe[] = useMemo(() => {
    if (!qNorm) return recipes

    const raw = fuse.search(qNorm).map((r) => ({ item: r.item, score: r.score ?? 1 }))

    const seen = new Set<string>()
    const take = (xs: any[]) =>
      xs.filter((x) => {
        const id = x.item.slug
        if (seen.has(id)) return false
        seen.add(id)
        return true
      })

    const tier1 = take(raw.filter((x) => titleStarts(x.item))).sort((a, b) => a.score - b.score)
    const tier2 = take(raw.filter((x) => titleContains(x.item))).sort((a, b) => a.score - b.score)
    const tier3 = take(raw.filter((x) => ingContains(x.item))).sort((a, b) => a.score - b.score)
    const tier4 = take(raw.filter((x) => catContains(x.item))).sort((a, b) => a.score - b.score)
    const tier5 = take(raw)

    return [...tier1, ...tier2, ...tier3, ...tier4, ...tier5].map((x) => x.item as Recipe)
  }, [fuse, qNorm])

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

  const showCategories = q.length === 0

  return (
    <div className="space-y-6">
      {/* NOTE: dark search bar removed */}

      {showCategories ? (
        <section className="space-y-3">
          <h2 className="h-condensed text-xl mb-2">Categories</h2>

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

          <h2 className="mt-8 h-condensed text-xl">All recipes</h2>
          <ul className="grid gap-3">
            {results.map((r: Recipe) => (
              <li key={r.slug} className="rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-neutral-900">
                <a href={`/recipes/${r.slug}`} className="block">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{r.title}</h3>
                    <span className="text-xs text-gray-500">{r.category}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{r.description}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500">Search results</h2>
          {results.length === 0 && <p className="text-sm text-gray-500">No matches.</p>}
          <ul className="grid gap-3">
            {results.map((r) => (
              <li key={r.slug} className="rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-neutral-900">
                <a href={`/recipes/${r.slug}`} className="block">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{r.title}</h3>
                    <span className="text-xs text-gray-500">{r.category}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{r.description}</p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
