'use client'

import Fuse from 'fuse.js'
import { useMemo, useState } from 'react'
import recipes, { type Recipe } from '../data/recipes'
import { catSlug } from '../lib/slug'

export default function HomePage() {
  const [q, setQ] = useState('')

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
        threshold: 0.28, // stricter than before (was 0.35)
        distance: 150,
      }),
    []
  )

  // Helper: quick substring checks (case-insensitive)
  const qNorm = q.trim().toLowerCase()
  const titleContains = (r: any) => (r.title || '').toLowerCase().includes(qNorm)
  const titleStarts   = (r: any) => (r.title || '').toLowerCase().startsWith(qNorm)
  const ingContains   = (r: any) =>
    Array.isArray(r.ingredients) &&
    r.ingredients.some((i: any) => (i?.name || '').toLowerCase().includes(qNorm))
  const catContains   = (r: any) => (r.category || '').toLowerCase().includes(qNorm)

  // Compute results with tiered ranking:
  // 1) title prefix > 2) title contains > 3) ingredient contains > 4) category contains > 5) other fuzzy matches
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
    const tier5 = take(raw) // whatever’s left (fuzzy but not substring)

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

  const showCategories = q.trim().length === 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Search recipes or ingredients (e.g., smoked paprika, chicken)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      
  {showCategories ? (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-500">Categories</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {categories.map(c => (
          <li key={c.slug} className="rounded-xl border p-4 hover:bg-gray-50 dark:hover:bg-neutral-900">
            <a href={`/c/${c.slug}`} className="flex items-center justify-between">
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-gray-500">{c.count}</span>
            </a>
          </li>
        ))}
      </ul>

      <h2 className="mt-6 text-sm font-semibold text-gray-500">All recipes</h2>
      <ul className="grid gap-3">
        {results.map((r:Recipe) => (
          <li key={r.slug} className="rounded-xl border p-4 hover:bg-gray-50 dark:hover:bg-neutral-900">
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
      {results.map(r => (
        <li key={r.slug} className="rounded-xl border p-4 hover:bg-gray-50 dark:hover:bg-neutral-900">
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