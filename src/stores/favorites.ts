import { ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'zhishi-favorites'

function loadFromStorage(): { ingredients: string[]; recipes: string[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { ingredients: [], recipes: [] }
}

export const useFavoritesStore = defineStore('favorites', () => {
  const saved = loadFromStorage()
  const favoriteIngredients = ref<string[]>(saved.ingredients)
  const favoriteRecipes = ref<string[]>(saved.recipes)

  function persist() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ingredients: favoriteIngredients.value,
        recipes: favoriteRecipes.value,
      }),
    )
  }

  function toggleIngredient(id: string) {
    const idx = favoriteIngredients.value.indexOf(id)
    if (idx === -1) {
      favoriteIngredients.value.push(id)
    } else {
      favoriteIngredients.value.splice(idx, 1)
    }
    persist()
  }

  function toggleRecipe(id: string) {
    const idx = favoriteRecipes.value.indexOf(id)
    if (idx === -1) {
      favoriteRecipes.value.push(id)
    } else {
      favoriteRecipes.value.splice(idx, 1)
    }
    persist()
  }

  function isIngredientFavorite(id: string): boolean {
    return favoriteIngredients.value.includes(id)
  }

  function isRecipeFavorite(id: string): boolean {
    return favoriteRecipes.value.includes(id)
  }

  return {
    favoriteIngredients,
    favoriteRecipes,
    toggleIngredient,
    toggleRecipe,
    isIngredientFavorite,
    isRecipeFavorite,
  }
})
