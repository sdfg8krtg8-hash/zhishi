export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

export const CUISINES = ['川菜', '粤菜', '鲁菜', '苏菜', '闽菜', '浙菜', '湘菜', '徽菜', '家常'] as const
export type Cuisine = (typeof CUISINES)[number]

export interface RecipeIngredient {
  name: string
  amount: string
}

export interface RecipeStep {
  order: number
  text: string
  image: string
}

export interface Recipe {
  id: string
  name: string
  difficulty: Difficulty
  duration: string
  cuisine: Cuisine
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  tips: string
  coverImage: string
}
