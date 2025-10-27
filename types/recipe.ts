export type Ingredient = {
  orderIndex: number
  name: string
  quantity: number
  unit: string
}

export type Recipe = {
  slug: string
  title: string
  category?: string
  description?: string
  yieldCount?: number
  yieldUnit?: string
  ingredients: Ingredient[]
  steps: string[]
}
