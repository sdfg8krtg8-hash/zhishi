<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { INGREDIENT_CATEGORIES } from '@/types/ingredient'
import { ingredients } from '@/data/ingredients'
import SearchBar from '@/components/ui/SearchBar.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import IngredientCard from '@/components/common/IngredientCard.vue'

const route = useRoute()
const searchQuery = ref((route.query.search as string) || '')
const selectedCategory = ref((route.query.category as string) || '')

const filtered = computed(() => {
  let result = ingredients

  if (selectedCategory.value) {
    result = result.filter(i => i.category === selectedCategory.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      i =>
        i.name.toLowerCase().includes(q) ||
        i.alias.some(a => a.toLowerCase().includes(q)),
    )
  }

  return result
})
</script>

<template>
  <div class="page-container page-container--with-top">
    <h1 class="section-title">食材大全</h1>

    <div class="list-toolbar">
      <SearchBar v-model="searchQuery" placeholder="搜索食材..." />
      <FilterBar
        v-model="selectedCategory"
        :options="[...INGREDIENT_CATEGORIES]"
        label="分类"
      />
    </div>

    <div v-if="filtered.length > 0" class="card-grid">
      <IngredientCard v-for="item in filtered" :key="item.id" :ingredient="item" />
    </div>

    <div v-else class="empty-state">
      <svg class="empty-state__icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
      <p class="empty-state__text">未找到相关内容，试试其他关键词</p>
    </div>
  </div>
</template>

<style scoped>
.list-toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--element-gap);
  margin-bottom: var(--component-gap);
}
</style>
