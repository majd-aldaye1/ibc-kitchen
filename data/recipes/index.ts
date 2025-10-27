import type { Recipe, Ingredient } from '../../types/recipe'
import imported from './imported'

const all: Recipe[] = imported as unknown as Recipe[]

export default all
export type { Recipe, Ingredient }
