'use client'


import { useMemo } from 'react'
import all, { type Recipe } from '../../../data/recipes'
import { catSlug } from '../../../lib/slug'



export default function CategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const { name, items } = useMemo(() => {
    const items = (all as Recipe[])
      .filter((r: Recipe) => catSlug(r.category || 'General') === slug)
      .slice()
      .sort((a: Recipe, b: Recipe) => a.title.localeCompare(b.title))
    const name = items[0]?.category || slug.replace(/-/g,' ')
    return { name, items }
    }, [slug])


if (!items.length) return <div className="space-y-4"><a href="/" className="text-sm text-blue-600 hover:underline">← All categories</a><p>No recipes found in this category.</p></div>


return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">{name}</h1>
      <a href="/" className="text-sm text-blue-600 hover:underline">All categories</a>
    </div>
    <ul className="grid gap-3">
      {items.map(r => (
        <li key={r.slug} className="rounded-xl border p-4 hover:bg-gray-50 dark:hover:bg-neutral-900">
          <a href={`/recipes/${r.slug}`} className="block">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{r.title}</h3>
              <span className="text-xs text-gray-500">{r.yieldCount} {r.yieldUnit}</span>
            </div>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{r.description}</p>
          </a>
        </li>
      ))}
    </ul>
  </div>
  )
}