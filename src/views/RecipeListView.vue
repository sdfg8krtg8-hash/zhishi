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
const sortBy = ref('')

const difficultyOptions = ['简单', '中等', '困难']
const sortOptions = ['简单优先', '时长短→长', '时长长→短']
const difficultyMap: Record<string, string> = { '简单': 'easy', '中等': 'medium', '困难': 'hard' }
const difficultyOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 }

function parseMinutes(duration: string): number {
  const match = duration.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 60
}

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

  if (sortBy.value === '简单优先') {
    result = [...result].sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty])
  } else if (sortBy.value === '时长短→长') {
    result = [...result].sort((a, b) => parseMinutes(a.duration) - parseMinutes(b.duration))
  } else if (sortBy.value === '时长长→短') {
    result = [...result].sort((a, b) => parseMinutes(b.duration) - parseMinutes(a.duration))
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

    <div class="list-header">
      <p class="list-count">共 {{ filtered.length }} 道食谱</p>
      <FilterBar v-model="sortBy" :options="sortOptions" label="排序" />
    </div>

    <div v-if="filtered.length > 0" class="card-grid">
      <RecipeCard v-for="item in filtered" :key="item.id" :recipe="item" />
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
  margin-bottom: var(--element-gap);
}

.list-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--component-gap);
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--element-gap);
  margin-bottom: var(--component-gap);
}

.list-count {
  font-size: var(--font-size-note);
  color: var(--color-text-muted);
}
</style>
