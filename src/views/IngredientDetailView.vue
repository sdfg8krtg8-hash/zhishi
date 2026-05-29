<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ingredients } from '@/data/ingredients'
import { recipes } from '@/data/recipes'
import PlaceholderImage from '@/components/common/PlaceholderImage.vue'
import RecipeCard from '@/components/common/RecipeCard.vue'

const route = useRoute()
const ingredient = computed(() => ingredients.find(i => i.id === route.params.id))

const relatedRecipes = computed(() => {
  if (!ingredient.value) return []
  return recipes.filter(r => ingredient.value!.relatedRecipeIds.includes(r.id))
})
</script>

<template>
  <div class="page-container">
    <div v-if="!ingredient" class="empty-state">
      <div class="empty-state__icon"></div>
      <p class="empty-state__text">食材未找到</p>
    </div>

    <template v-else>
      <router-link to="/ingredients" class="back-link">&larr; 返回食材列表</router-link>

      <div class="detail-layout">
        <div class="detail-layout__image">
          <PlaceholderImage :src="ingredient.image" :alt="ingredient.name" />
        </div>

        <div class="detail-layout__body">
          <h1 class="detail-title">{{ ingredient.name }}</h1>
          <span class="detail-category">{{ ingredient.category }}</span>

          <p v-if="ingredient.alias.length" class="detail-alias">
            别名：{{ ingredient.alias.join('、') }}
          </p>

          <section class="detail-section">
            <h2 class="detail-section__title">简介</h2>
            <p>{{ ingredient.description }}</p>
          </section>

          <section class="detail-section">
            <h2 class="detail-section__title">选购技巧</h2>
            <p>{{ ingredient.tips }}</p>
          </section>

          <section class="detail-section">
            <h2 class="detail-section__title">保存方法</h2>
            <p>{{ ingredient.storage }}</p>
          </section>

          <section v-if="ingredient.pairings.length" class="detail-section">
            <h2 class="detail-section__title">搭配食材</h2>
            <div class="pairing-tags">
              <span v-for="p in ingredient.pairings" :key="p" class="pairing-tag">{{ p }}</span>
            </div>
          </section>
        </div>
      </div>

      <div v-if="relatedRecipes.length > 0">
        <hr class="divider" />
        <section>
          <h2 class="section-title">相关食谱</h2>
          <div class="card-grid">
            <RecipeCard v-for="r in relatedRecipes" :key="r.id" :recipe="r" />
          </div>
        </section>
      </div>
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

.detail-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: var(--section-gap);
  align-items: start;
}

.detail-layout__image {
  width: 400px;
}

.detail-title {
  font-size: var(--font-size-title);
  margin-bottom: var(--element-gap-sm);
}

.detail-category {
  display: inline-block;
  padding: 2px 12px;
  border: 1px solid var(--color-primary);
  border-radius: var(--btn-radius);
  color: var(--color-primary);
  font-size: var(--font-size-note);
  margin-bottom: var(--element-gap);
}

.detail-alias {
  color: var(--color-text-muted);
  font-size: var(--font-size-note);
  margin-bottom: var(--component-gap);
}

.detail-section {
  margin-bottom: var(--component-gap);
}

.detail-section__title {
  font-size: var(--font-size-body);
  color: var(--color-text-title);
  margin-bottom: var(--element-gap-sm);
  padding-left: 8px;
  border-left: 3px solid var(--color-primary);
}

.pairing-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--element-gap-sm);
}

.pairing-tag {
  padding: 4px 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--btn-radius);
  font-size: var(--font-size-note);
  color: var(--color-text-body);
}

@media (max-width: 768px) {
  .detail-layout {
    grid-template-columns: 1fr;
    gap: var(--component-gap);
  }

  .detail-layout__image {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }
}
</style>
