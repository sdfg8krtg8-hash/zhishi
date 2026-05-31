<script setup lang="ts">
import type { Recipe } from '@/types/recipe'
import { DIFFICULTY_LABELS } from '@/types/recipe'
import PlaceholderImage from './PlaceholderImage.vue'

defineProps<{
  recipe: Recipe
}>()
</script>

<template>
  <router-link :to="`/recipes/${recipe.id}`" class="recipe-card">
    <PlaceholderImage
      :src="recipe.coverImage"
      :alt="recipe.name"
      aspect-ratio="1 / 1"
    />
    <div class="recipe-card__info">
      <h3 class="recipe-card__name">{{ recipe.name }}</h3>
      <div class="recipe-card__meta">
        <span class="recipe-card__difficulty">{{ DIFFICULTY_LABELS[recipe.difficulty] }}</span>
        <span class="recipe-card__duration">{{ recipe.duration }}</span>
      </div>
    </div>
  </router-link>
</template>

<style scoped>
.recipe-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 260px;
  background: var(--color-card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  overflow: hidden;
  box-shadow: var(--card-shadow);
  transition: var(--card-transition);
}

.recipe-card:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-4px);
  text-decoration: none;
}

.recipe-card__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
}

.recipe-card__name {
  font-size: var(--font-size-body);
  color: var(--color-text-title);
}

.recipe-card__meta {
  display: flex;
  gap: var(--element-gap-sm);
  font-size: var(--font-size-note);
  color: var(--color-text-muted);
}
</style>
