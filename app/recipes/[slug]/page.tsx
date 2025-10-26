'use client'


import { useEffect, useMemo, useState } from 'react'
import all from '../../../data/recipes'
import { conversions, Unit, dimensionOf, convertQuantity, toDisplayFraction } from '../../../lib/conversions'
import { useLocalStorage } from '../../../lib/useLocalStorage'
import Timer from '../../../components/Timer'


export default function RecipePage({ params }: { params: { slug: string } }) {
const recipe = useMemo(() => all.find(r => r.slug === params.slug), [params.slug])
const [servings, setServings] = useState<number>(recipe?.yieldCount ?? 1)
const [checked, setChecked] = useLocalStorage<Record<string, boolean>>(`chk:${recipe?.slug}`, {})
const [unitPrefs, setUnitPrefs] = useLocalStorage<Record<string, Unit>>(`unit:${recipe?.slug}`, {})
const [customMap, setCustomMap] = useLocalStorage<Record<string, { name: string, factor: number, base: 'mass'|'volume' }>>('custom:units', {})

useEffect(() => {
if (!recipe) return
setServings(recipe.yieldCount)
}, [recipe])


if (!recipe) return <p>Not found.</p>


const scale = servings / recipe.yieldCount

return (
  <div className="space-y-8">
    <header className="space-y-2">
      <h1 className="text-2xl font-bold">{recipe.title}</h1>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-500">Yield:</span>
        <input
          type="number"
          min={0.1}
          step={0.1}
          value={servings}
          onChange={e => setServings(parseFloat(e.target.value) || recipe.yieldCount)}
          className="w-24 rounded-lg border px-2 py-1"
          aria-label="Servings"
        />
        <span className="text-gray-500">{recipe.yieldUnit}</span>
      </div>
      <p className="text-gray-600 dark:text-gray-300">{recipe.description}</p>
    </header>

    <section>
      <h2 className="mb-3 font-semibold">Ingredients</h2>
        <ul className="space-y-2">
          {recipe.ingredients.map((ing) => {
            const id = `${ing.name}-${ing.orderIndex}`
            const original = ing.quantity * scale
            const isCount = ing.unit === 'count'
            const targetUnit = unitPrefs[id] ?? ing.unit
            const dim = dimensionOf(ing.unit)


            let displayQty: string
            let warn = ''
            if (isCount) {
            displayQty = toDisplayFraction(original)
            } else {
            try {
            const q = convertQuantity({
            amount: original,
            from: ing.unit as Unit,
            to: targetUnit as Unit,
            density_g_per_ml: ing.density_g_per_ml
            })
            displayQty = toDisplayFraction(q)
            } catch (e: any) {
            warn = e?.message || 'Conversion error'
            displayQty = toDisplayFraction(original) + ' '
            }
            }


            const dimensionUnits = conversions[dim].units as Unit[]

            return (
<li key={id} className="rounded-lg border p-3">
<div className="flex items-start gap-3">
<input
type="checkbox"
className="mt-1 h-5 w-5"
checked={!!checked[id]}
onChange={() => setChecked({ ...checked, [id]: !checked[id] })}
aria-label={`Mark ${ing.name} as done`}
/>
<div className="flex-1">
<div className="flex flex-wrap items-center gap-2">
<span className="font-medium">{ing.name}</span>
{ing.prepNote && (
<span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">{ing.prepNote}</span>
)}
</div>


<div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
<span className="tabular-nums">{displayQty}</span>
{!isCount && (
<select
className="rounded border px-2 py-1"
value={targetUnit}
onChange={(e) => setUnitPrefs({ ...unitPrefs, [id]: e.target.value as Unit })}
aria-label={`Unit for ${ing.name}`}
>
{dimensionUnits.map(u => (
<option key={u} value={u}>{u}</option>
))}
{/* Custom units of same base dimension */}
{Object.entries(customMap)
.filter(([_, c]) => c.base === dim)
.map(([key, c]) => (
<option key={`custom-${key}`} value={key as Unit}>{c.name} (custom)</option>
))}
</select>
)}
{warn && <span className="text-xs text-rose-600">{warn}</span>}
</div>
</div>
</div>
</li>
)
})}
</ul>
<CustomUnitEditor customMap={customMap} setCustomMap={setCustomMap} />
</section>

<section className="space-y-2">
<h2 className="font-semibold">Steps</h2>
<ol className="list-decimal space-y-2 pl-6">
{recipe.steps.map((s, i) => (
<li key={i} className="leading-relaxed">{s}</li>
))}
</ol>
</section>


<section>
<h2 className="mb-2 font-semibold">Timers</h2>
<div className="grid gap-3 sm:grid-cols-2">
<Timer />
<Timer />
</div>
</section>
</div>
)
}

function CustomUnitEditor({ customMap, setCustomMap }: {
customMap: Record<string, { name: string, factor: number, base: 'mass'|'volume' }>
setCustomMap: (v: Record<string, { name: string, factor: number, base: 'mass'|'volume' }>) => void
}) {
const [name, setName] = useState('can (6 fl oz)')
const [factor, setFactor] = useState<number>(177.441) // 6 fl oz → ml
const [base, setBase] = useState<'mass'|'volume'>('volume')


const add = () => {
if (!name || !factor || factor <= 0) return
const key = `custom:${name}`
setCustomMap({ ...customMap, [key]: { name, factor, base } })
}

return (
<div className="mt-6 rounded-xl border p-4">
<h3 className="font-semibold">Custom Units</h3>
<p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Define units in base terms. Example: <code>can (6 fl oz)</code> with factor <code>177.441</code> milliliters (volume).</p>
<div className="mt-3 grid gap-2 sm:grid-cols-5">
<input className="rounded border px-2 py-1 sm:col-span-2" placeholder="Name (e.g., can 6 fl oz)" value={name} onChange={e => setName(e.target.value)} />
<input className="rounded border px-2 py-1" type="number" step="0.001" placeholder="Factor" value={factor} onChange={e => setFactor(parseFloat(e.target.value))} />
<select className="rounded border px-2 py-1" value={base} onChange={e => setBase(e.target.value as any)}>
<option value="mass">mass (grams)</option>
<option value="volume">volume (milliliters)</option>
</select>
<button onClick={add} className="rounded-lg border px-3 py-1.5 font-medium hover:bg-gray-50 dark:hover:bg-neutral-900">Add</button>
</div>
<ul className="mt-3 text-sm">
{Object.entries(customMap).map(([k, v]) => (
<li key={k} className="flex items-center justify-between py-1">
<span>{v.name} → {v.factor} {v.base === 'mass' ? 'g' : 'ml'}</span>
<button onClick={() => { const { [k]:_, ...rest } = customMap; setCustomMap(rest) }} className="text-rose-600 hover:underline">Remove</button>
</li>
))}
</ul>
</div>
)
}