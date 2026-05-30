<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { CUISINES } from '@/types/recipe'
import { recipes } from '@/data/recipes'
import SearchBar from '@/components/ui/SearchBar.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import RecipeCard from '@/components/common/RecipeCard.vue'

const route = useRoute()
const searchQuery = ref((route.query.search as string) || '')
const selectedDifficulty = ref((route.query.difficulty as string) || '')
const selectedCuisine = ref((route.query.cuisine as string) || '')

const difficultyOptions = ['简单', '中等', '困难']
const difficultyMap: Record<string, string> = { '简单': 'easy', '中等': 'medium', '困难': 'hard' }

const filtered = computed(() => {
  let result = recipes

  if (selectedDifficulty.value) {
    const diffKey = difficultyMap[selectedDifficulty.value]
    result = result.filter(r => r.difficulty === diffKey)
  }

  if (selectedCuisine.value) {
    result = result.filter(r => r.cuisine === selectedCuisine.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(r => r.name.toLowerCase().includes(q))
  }

  return result
})
</script>

<template>
  <div class="page-container page-container--with-top">
    <h1 class="section-title">食谱大全</h1>

    <div class="list-toolbar">
      <SearchBar v-model="searchQuery" placeholder="搜索食谱..." />
      <div class="list-filters">
        <FilterBar v-model="selectedDifficulty" :options="difficultyOptions" label="难度" />
        <FilterBar v-model="selectedCuisine" :options="[...CUISINES]" label="菜系" />
      </div>
    </div>

    <div v-if="filtered.length > 0" class="card-grid">
      <RecipeCard v-for="item in filtered" :key="item.id" :recipe="item" />
    </div>

    <div v-else class="empty-state">
      <div class="empty-state__icon"></div>
      <p class="empty-state__text">没有找到匹配的食谱</p>
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

.list-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--component-gap);
}
</style>
