export type Dimension = 'mass' | 'volume'
export type Unit = keyof typeof unitDimension | string // allows custom keys


type ConvertConfig = {
amount: number
from: Unit
to: Unit
density_g_per_ml?: number
}


// Canonical unit dimensions for built-ins
const unitDimension: Record<string, Dimension> = {
g: 'mass', kg: 'mass', oz: 'mass', lb: 'mass',
ml: 'volume', l: 'volume', tsp: 'volume', tbsp: 'volume', cup: 'volume', 'fl oz': 'volume', qt: 'volume', gal: 'volume'
}


const massFactors: Record<string, number> = {
g: 1,
kg: 1000,
oz: 28.3495,
lb: 453.592
}


const volumeFactors: Record<string, number> = {
ml: 1,
l: 1000,
tsp: 4.92892,
tbsp: 14.7868,
cup: 236.588,
'fl oz': 29.5735,
qt: 946.353,
gal: 3785.41
}


export const conversions = {
mass: { base: 'g', factors: massFactors, units: Object.keys(massFactors) },
volume: { base: 'ml', factors: volumeFactors, units: Object.keys(volumeFactors) }
}


export function dimensionOf(u: Unit): Dimension {
return (unitDimension as any)[u] ?? 'volume' // unknowns treated as volume; UI guards special units like 'count'
}


export function toBase(amount: number, unit: Unit): { value: number, base: 'g'|'ml', dim: Dimension } {
const dim = dimensionOf(unit)
if (dim === 'mass') {
const f = massFactors[unit as string]
const v = f ? amount * f : amount
return { value: v, base: 'g', dim }
} else {
const f = volumeFactors[unit as string]
const v = f ? amount * f : amount
return { value: v, base: 'ml', dim }
}
}


export function fromBase(amountBase: number, target: Unit, dim: Dimension): number {
if (dim === 'mass') {
const f = massFactors[target as string]
return f ? amountBase / f : amountBase
} else {
const f = volumeFactors[target as string]
return f ? amountBase / f : amountBase
}
}


export function convertQuantity(cfg: ConvertConfig): number {
const { amount, from, to, density_g_per_ml } = cfg
if (from === 'count' || to === 'count') {
throw new Error('Count is not convertible')
}


// Same unit shortcut
if (from === to) return amount


const fromDim = dimensionOf(from)
const toDim = dimensionOf(to)


// Same dimension → convert via base
if (fromDim === toDim) {
const base = toBase(amount, from)
return fromBase(base.value, to, fromDim)
}


// Cross-dimension requires density
if (density_g_per_ml == null) {
throw new Error('Needs density to convert mass ⇄ volume')
}


if (fromDim === 'mass' && toDim === 'volume') {
const g = toBase(amount, from).value
const ml = g / density_g_per_ml
return fromBase(ml, to, 'volume')
}


if (fromDim === 'volume' && toDim === 'mass') {
const ml = toBase(amount, from).value
const g = ml * density_g_per_ml
return fromBase(g, to, 'mass')
}


return amount
}


export function toDisplayFraction(n: number): string {
// Show neat fractions for common kitchen values
const rounded = Math.round(n * 48) / 48 // snap to 1/48
const whole = Math.trunc(rounded)
const frac = rounded - whole
const mapping: Record<number, string> = {
[1/2]: '1/2', [1/3]: '1/3', [2/3]: '2/3', [1/4]: '1/4', [3/4]: '3/4',
[1/8]: '1/8', [3/8]: '3/8', [5/8]: '5/8', [7/8]: '7/8',
[1/16]: '1/16', [3/16]: '3/16', [5/16]: '5/16', [7/16]: '7/16', [9/16]: '9/16', [11/16]: '11/16', [13/16]: '13/16', [15/16]: '15/16'
}
let fracStr = ''
const keys = Object.keys(mapping).map(parseFloat)
for (const k of keys) {
if (Math.abs(frac - k) < 1e-6) { fracStr = mapping[k]; break }
}
if (!whole && !fracStr) return rounded.toFixed(2)
  if (!whole) return fracStr
return fracStr ? `${whole} ${fracStr}` : `${whole}`
}