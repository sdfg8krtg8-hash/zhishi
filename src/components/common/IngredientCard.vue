<script setup lang="ts">
import type { Ingredient } from '@/types/ingredient'
import PlaceholderImage from './PlaceholderImage.vue'

defineProps<{
  ingredient: Ingredient
}>()
</script>

<template>
  <router-link :to="`/ingredients/${ingredient.id}`" class="ingredient-card">
    <PlaceholderImage
      :src="ingredient.image"
      :alt="ingredient.name"
      aspect-ratio="1 / 1"
    />
    <div class="ingredient-card__info">
      <h3 class="ingredient-card__name">{{ ingredient.name }}</h3>
      <span class="ingredient-card__category">{{ ingredient.category }}</span>
    </div>
  </router-link>
</template>

<style scoped>
.ingredient-card {
  display: flex;
  flex-direction: column;
  background: var(--color-card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  overflow: hidden;
  transition: border-color 0.2s;
}

.ingredient-card:hover {
  border-color: var(--color-border-hover);
  text-decoration: none;
}

.ingredient-card__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
}

.ingredient-card__name {
  font-size: var(--font-size-body);
  color: var(--color-text-title);
}

.ingredient-card__category {
  font-size: var(--font-size-note);
  color: var(--color-text-muted);
}
</style>
