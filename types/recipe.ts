export type Ingredient = {
  orderIndex: number
  name: string
  quantity: number
  unit: string
  // NEW (optional) — used in UI/conversions:
  prepNote?: string
  density_g_per_ml?: number
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
