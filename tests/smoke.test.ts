import { describe, it, expect} from 'vitest'
import data from '../data/recipes/imported'

describe('recipes data loads', () => {
  it('is an array (smoke test)', () => {
    expect(Array.isArray(data)).toBe(true)
  })
})