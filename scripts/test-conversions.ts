import assert from 'node:assert'
import { convertQuantity, toDisplayFraction } from '../lib/conversions'


// mass → mass
assert(Math.abs(convertQuantity({ amount: 1000, from: 'g', to: 'kg' }) - 1) < 1e-6, '1000 g → 1 kg')


// volume → volume
assert(Math.abs(convertQuantity({ amount: 2, from: 'cup', to: 'ml' }) - 473.176) < 1e-3, '2 cup → 473.176 ml')


// mass ↔ volume without density should throw
assert.throws(() => convertQuantity({ amount: 100, from: 'g', to: 'ml' }), /density/, 'g → ml without density throws')


// mass ↔ volume with density
const ml = convertQuantity({ amount: 100, from: 'g', to: 'ml', density_g_per_ml: 0.91 })
assert(Math.abs(ml - (100 / 0.91)) < 1e-6, 'g → ml with density 0.91')


// Fractions
assert(toDisplayFraction(1.5) === '1 1/2', '1.5 → 1 1/2')
assert(toDisplayFraction(0.3333).includes('1/3') || toDisplayFraction(0.3333) === '0.33', '≈1/3 formatting')


console.log('All tests passed ✅')