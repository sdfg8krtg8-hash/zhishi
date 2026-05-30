<script setup lang="ts">
import { computed } from 'vue'
import { INGREDIENT_CATEGORIES } from '@/types/ingredient'
import { ingredients } from '@/data/ingredients'
import { recipes } from '@/data/recipes'
import IngredientCard from '@/components/common/IngredientCard.vue'
import RecipeCard from '@/components/common/RecipeCard.vue'

const starterIngredients = computed(() => ingredients.slice(0, 2))
const starterRecipes = computed(() => recipes.filter(r => r.difficulty === 'easy').slice(0, 2))
const popularRecipes = computed(() => recipes.slice(0, 4))
</script>

<template>
  <div class="page-container">
    <!-- Starter section -->
    <section class="home-section">
      <h2 class="section-title">新手入门</h2>
      <div class="card-grid">
        <IngredientCard v-for="item in starterIngredients" :key="item.id" :ingredient="item" />
        <RecipeCard v-for="item in starterRecipes" :key="item.id" :recipe="item" />
      </div>
    </section>

    <hr class="divider" />

    <!-- Category navigation -->
    <section class="home-section">
      <h2 class="section-title">食材分类</h2>
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
      <h2 class="section-title">热门食谱</h2>
      <div class="scroll-row">
        <RecipeCard v-for="item in popularRecipes" :key="item.id" :recipe="item" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-section {
  margin-bottom: var(--component-gap);
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

.scroll-row {
  display: flex;
  gap: var(--card-gap);
  overflow-x: auto;
  padding-bottom: 8px;
}

.scroll-row > * {
  flex-shrink: 0;
  width: 260px;
}

@media (max-width: 768px) {
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .scroll-row > * {
    width: calc(50% - var(--card-gap) / 2);
  }
}
</style>
