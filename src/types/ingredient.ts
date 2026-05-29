export type IngredientCategory =
  | '蔬菜'
  | '水果'
  | '肉类'
  | '禽蛋'
  | '水产'
  | '豆制品'
  | '菌菇'
  | '调味品'
  | '主食'

export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  '蔬菜',
  '水果',
  '肉类',
  '禽蛋',
  '水产',
  '豆制品',
  '菌菇',
  '调味品',
  '主食',
]

export interface Ingredient {
  id: string
  name: string
  alias: string[]
  category: IngredientCategory
  description: string
  tips: string
  storage: string
  pairings: string[]
  relatedRecipeIds: string[]
  image: string
}
