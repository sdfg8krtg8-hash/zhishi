<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { INGREDIENT_CATEGORIES } from '@/types/ingredient'
import { ingredients } from '@/data/ingredients'
import { recipes } from '@/data/recipes'
import { SeedlingIcon, GridIcon, RecipeBookIcon } from '@/components/icons'
import HomeBanner from '@/components/layout/HomeBanner.vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import IngredientCard from '@/components/common/IngredientCard.vue'
import RecipeCard from '@/components/common/RecipeCard.vue'

const router = useRouter()
const searchQuery = ref('')

function onSearch() {
  if (searchQuery.value.trim()) {
    router.push(`/recipes?search=${encodeURIComponent(searchQuery.value.trim())}`)
  }
}

const starterIngredients = computed(() => ingredients.slice(0, 2))
const starterRecipes = computed(() => recipes.filter(r => r.difficulty === 'easy').slice(0, 2))
const popularRecipes = computed(() => recipes.slice(0, 4))
</script>

<template>
  <HomeBanner />
  <div class="page-container">
    <!-- Search -->
    <div class="home-search">
      <SearchBar v-model="searchQuery" placeholder="搜索食材或食谱..." @keyup.enter="onSearch" />
    </div>

    <!-- Starter section -->
    <section class="home-section">
      <h2 class="section-title section-title--icon"><SeedlingIcon /> 新手入门</h2>
      <div class="card-grid">
        <IngredientCard v-for="item in starterIngredients" :key="item.id" :ingredient="item" />
        <RecipeCard v-for="item in starterRecipes" :key="item.id" :recipe="item" />
      </div>
    </section>

    <hr class="divider" />

    <!-- Category navigation -->
    <section class="home-section">
      <div class="section-header">
        <h2 class="section-title section-title--icon"><GridIcon /> 食材分类</h2>
        <router-link to="/ingredients" class="section-header__more">查看全部 &rarr;</router-link>
      </div>
      <div class="category-grid">
        <router-link
          v-for="cat in INGREDIENT_CATEGORIES"
          :key="cat"
          :to="`/ingredients?category=${cat}`"
          class="category-item"
        >
          <span class="category-item__text">{{ cat }}</span>
        </router-link>
      </div>
    </section>

    <hr class="divider" />

    <!-- Popular recipes -->
    <section class="home-section">
      <div class="section-header">
        <h2 class="section-title section-title--icon"><RecipeBookIcon /> 热门食谱</h2>
        <router-link to="/recipes" class="section-header__more">查看全部 &rarr;</router-link>
      </div>
      <div class="card-grid">
        <RecipeCard v-for="item in popularRecipes" :key="item.id" :recipe="item" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-search {
  max-width: 600px;
  margin: 0 auto var(--section-gap);
}

.home-search :deep(.search-bar) {
  max-width: 100%;
  height: 48px;
  border-radius: 24px;
  padding: 0 20px;
}

.home-section {
  margin-bottom: var(--component-gap);
}

.section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--component-gap);
}

.section-header .section-title {
  margin-bottom: 0;
}

.section-header__more {
  font-size: var(--font-size-note);
  color: var(--color-text-muted);
  white-space: nowrap;
  transition: color 0.2s;
}

.section-header__more:hover {
  color: var(--color-primary);
  text-decoration: none;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--element-gap);
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--color-card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  transition: border-color 0.2s;
}

.category-item:hover {
  border-color: var(--color-primary);
  text-decoration: none;
}

.category-item:hover .category-item__text {
  color: var(--color-primary);
}

.category-item__text {
  font-size: var(--font-size-body);
  color: var(--color-text-body);
}

@media (max-width: 768px) {
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
