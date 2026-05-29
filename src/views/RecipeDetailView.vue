<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DIFFICULTY_LABELS } from '@/types/recipe'
import { recipes } from '@/data/recipes'
import { useFavoritesStore } from '@/stores/favorites'
import PlaceholderImage from '@/components/common/PlaceholderImage.vue'

const route = useRoute()
const favoritesStore = useFavoritesStore()

const recipe = computed(() => recipes.find(r => r.id === route.params.id))
const isFavorite = computed(() => recipe.value ? favoritesStore.isRecipeFavorite(recipe.value.id) : false)

function toggleFavorite() {
  if (recipe.value) {
    favoritesStore.toggleRecipe(recipe.value.id)
  }
}
</script>

<template>
  <div class="page-container">
    <div v-if="!recipe" class="empty-state">
      <div class="empty-state__icon"></div>
      <p class="empty-state__text">食谱未找到</p>
    </div>

    <template v-else>
      <router-link to="/recipes" class="back-link">&larr; 返回食谱列表</router-link>

      <!-- Cover image -->
      <div class="cover-image">
        <PlaceholderImage :src="recipe.coverImage" :alt="recipe.name" aspect-ratio="16 / 9" />
      </div>

      <!-- Basic info -->
      <div class="recipe-header">
        <h1 class="detail-title">{{ recipe.name }}</h1>
        <div class="recipe-meta">
          <span class="recipe-meta__tag">{{ DIFFICULTY_LABELS[recipe.difficulty] }}</span>
          <span class="recipe-meta__tag">{{ recipe.duration }}</span>
          <span class="recipe-meta__tag">{{ recipe.cuisine }}</span>
        </div>
        <button class="fav-btn" :class="{ 'fav-btn--active': isFavorite }" @click="toggleFavorite">
          {{ isFavorite ? '★ 已收藏' : '☆ 收藏' }}
        </button>
      </div>

      <!-- Ingredients -->
      <section class="detail-section">
        <h2 class="section-title">食材清单</h2>
        <table class="ingredient-table">
          <thead>
            <tr>
              <th>食材</th>
              <th>用量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in recipe.ingredients" :key="item.name">
              <td>{{ item.name }}</td>
              <td>{{ item.amount }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Steps -->
      <section class="detail-section">
        <h2 class="section-title">烹饪步骤</h2>
        <div class="steps-list">
          <div v-for="step in recipe.steps" :key="step.order" class="step-item">
            <div class="step-item__image">
              <PlaceholderImage :src="step.image" alt="步骤配图" aspect-ratio="3 / 2" />
            </div>
            <div class="step-item__content">
              <span class="step-item__number">{{ step.order }}</span>
              <p class="step-item__text">{{ step.text }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Tips -->
      <section class="detail-section">
        <h2 class="section-title">新手贴士</h2>
        <div class="tips-box">
          <p>{{ recipe.tips }}</p>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-block;
  color: var(--color-text-muted);
  font-size: var(--font-size-note);
  margin-bottom: var(--component-gap);
}

.cover-image {
  max-width: 100%;
  margin-bottom: var(--component-gap);
  border-radius: var(--card-radius);
  overflow: hidden;
}

.recipe-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--element-gap);
  margin-bottom: var(--section-gap);
}

.detail-title {
  font-size: var(--font-size-title);
}

.recipe-meta {
  display: flex;
  gap: var(--element-gap-sm);
}

.recipe-meta__tag {
  padding: 2px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--btn-radius);
  font-size: var(--font-size-note);
  color: var(--color-text-body);
}

.fav-btn {
  margin-left: auto;
  height: var(--btn-height);
  padding: 0 20px;
  border: 1px solid var(--color-primary);
  border-radius: var(--btn-radius);
  background: transparent;
  color: var(--color-primary);
  font-size: var(--font-size-body);
  transition: all 0.2s;
}

.fav-btn--active {
  background: var(--color-primary);
  color: #fff;
}

.detail-section {
  margin-bottom: var(--section-gap);
}

.ingredient-table {
  width: 100%;
  border-collapse: collapse;
}

.ingredient-table th,
.ingredient-table td {
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.ingredient-table th {
  color: var(--color-text-muted);
  font-weight: 500;
  font-size: var(--font-size-note);
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: var(--component-gap);
}

.step-item {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: var(--component-gap);
}

.step-item__image {
  width: 300px;
}

.step-item__content {
  display: flex;
  gap: var(--element-gap);
}

.step-item__number {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 50%;
  font-size: var(--font-size-note);
}

.step-item__text {
  font-size: var(--font-size-body);
  line-height: var(--line-height-body);
}

.tips-box {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--card-radius);
  padding: var(--element-gap);
  color: var(--color-text-body);
}

@media (max-width: 768px) {
  .step-item {
    grid-template-columns: 1fr;
  }

  .step-item__image {
    width: 100%;
  }

  .fav-btn {
    margin-left: 0;
    width: 100%;
  }
}
</style>
