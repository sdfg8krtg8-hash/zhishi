<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFavoritesStore } from '@/stores/favorites'
import { ingredients } from '@/data/ingredients'
import { recipes } from '@/data/recipes'
import SearchBar from '@/components/ui/SearchBar.vue'
import IngredientCard from '@/components/common/IngredientCard.vue'
import RecipeCard from '@/components/common/RecipeCard.vue'

const favoritesStore = useFavoritesStore()
const activeTab = ref<'ingredients' | 'recipes'>('ingredients')
const searchQuery = ref('')

const favoriteIngredientItems = computed(() => {
  const items = ingredients.filter(i => favoritesStore.isIngredientFavorite(i.id))
  if (!searchQuery.value.trim()) return items
  const q = searchQuery.value.trim().toLowerCase()
  return items.filter(i =>
    i.name.toLowerCase().includes(q) ||
    i.alias.some(a => a.toLowerCase().includes(q))
  )
})

const favoriteRecipeItems = computed(() => {
  const items = recipes.filter(r => favoritesStore.isRecipeFavorite(r.id))
  if (!searchQuery.value.trim()) return items
  const q = searchQuery.value.trim().toLowerCase()
  return items.filter(r => r.name.toLowerCase().includes(q))
})
</script>

<template>
  <div class="page-container page-container--with-top">
    <h1 class="section-title">我的收藏</h1>

    <div class="tabs">
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'ingredients' }"
        @click="activeTab = 'ingredients'"
      >
        食材 ({{ favoriteIngredientItems.length }})
      </button>
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'recipes' }"
        @click="activeTab = 'recipes'"
      >
        食谱 ({{ favoriteRecipeItems.length }})
      </button>
    </div>

    <div class="fav-search">
      <SearchBar v-model="searchQuery" :placeholder="activeTab === 'ingredients' ? '搜索收藏的食材...' : '搜索收藏的食谱...'" />
    </div>

    <div v-if="activeTab === 'ingredients'">
      <div v-if="favoriteIngredientItems.length > 0" class="card-grid">
        <IngredientCard v-for="item in favoriteIngredientItems" :key="item.id" :ingredient="item" />
      </div>
      <div v-else class="empty-state">
        <svg class="empty-state__icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <p class="empty-state__text">还没有收藏的食材</p>
        <router-link to="/ingredients" class="empty-state__link">去食材列表看看</router-link>
      </div>
    </div>

    <div v-if="activeTab === 'recipes'">
      <div v-if="favoriteRecipeItems.length > 0" class="card-grid">
        <RecipeCard v-for="item in favoriteRecipeItems" :key="item.id" :recipe="item" />
      </div>
      <div v-else class="empty-state">
        <svg class="empty-state__icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <p class="empty-state__text">还没有收藏的食谱</p>
        <router-link to="/recipes" class="empty-state__link">去食谱列表看看</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: var(--element-gap-sm);
  margin-bottom: var(--element-gap);
}

.tab-btn {
  height: var(--btn-height);
  padding: 0 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--btn-radius);
  background: var(--color-card-bg);
  color: var(--color-text-body);
  font-size: var(--font-size-body);
  transition: all 0.2s;
  cursor: pointer;
  font-family: inherit;
}

.tab-btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.fav-search {
  max-width: 420px;
  margin-bottom: var(--component-gap);
}

.empty-state__link {
  color: var(--color-primary);
  font-size: var(--font-size-body);
}
</style>
