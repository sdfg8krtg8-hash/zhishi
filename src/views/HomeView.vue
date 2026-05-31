<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { INGREDIENT_CATEGORIES } from '@/types/ingredient'
import { CUISINES } from '@/types/recipe'
import { ingredients } from '@/data/ingredients'
import { recipes } from '@/data/recipes'
import { SeedlingIcon, GridIcon, RecipeBookIcon } from '@/components/icons'
import HomeBanner from '@/components/layout/HomeBanner.vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import IngredientCard from '@/components/common/IngredientCard.vue'
import RecipeCard from '@/components/common/RecipeCard.vue'

const router = useRouter()
const searchQuery = ref('')
const showResults = ref(false)

const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return { ingredients: [], recipes: [] }
  return {
    ingredients: ingredients.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.alias.some(a => a.toLowerCase().includes(q))
    ).slice(0, 4),
    recipes: recipes.filter(r =>
      r.name.toLowerCase().includes(q)
    ).slice(0, 4),
  }
})

const hasResults = computed(() =>
  searchResults.value.ingredients.length > 0 || searchResults.value.recipes.length > 0
)

function onSearch() {
  const q = searchQuery.value.trim()
  if (!q) return
  showResults.value = false
  router.push(`/recipes?search=${encodeURIComponent(q)}`)
}

function goToIngredient(id: string) {
  showResults.value = false
  searchQuery.value = ''
  router.push(`/ingredients/${id}`)
}

function goToRecipe(id: string) {
  showResults.value = false
  searchQuery.value = ''
  router.push(`/recipes/${id}`)
}

function closeResults(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.home-search')) {
    showResults.value = false
  }
}

watch(searchQuery, () => {
  showResults.value = hasResults.value
})

onMounted(() => document.addEventListener('click', closeResults))
onUnmounted(() => document.removeEventListener('click', closeResults))

const isSearching = computed(() => searchQuery.value.trim().length > 0)

const fullResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return { ingredients: [], recipes: [] }
  return {
    ingredients: ingredients.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.alias.some(a => a.toLowerCase().includes(q))
    ),
    recipes: recipes.filter(r =>
      r.name.toLowerCase().includes(q)
    ),
  }
})

// Top ingredients by recipe usage (up to 12)
const topIngredients = computed(() =>
  [...ingredients]
    .filter(i => i.relatedRecipeIds?.length > 0)
    .sort((a, b) => (b.relatedRecipeIds?.length || 0) - (a.relatedRecipeIds?.length || 0))
    .slice(0, 12)
)

// Easy recipes from diverse cuisines (up to 8)
const starterRecipes = computed(() => {
  const easy = recipes.filter(r => r.difficulty === 'easy')
  const seen = new Set<string>()
  const diverse: typeof easy = []
  for (const r of easy) {
    if (!seen.has(r.cuisine) || diverse.length < 3) {
      diverse.push(r)
      seen.add(r.cuisine)
    }
    if (diverse.length >= 8) break
  }
  return diverse
})

// Carousel: build slides mixing ingredients and recipes
type SlideItem = { type: 'ingredient'; data: typeof ingredients[number] } | { type: 'recipe'; data: typeof recipes[number] }

const carouselSlides = computed<{ items: SlideItem[] }[]>(() => {
  const items: SlideItem[] = [
    ...topIngredients.value.map(i => ({ type: 'ingredient' as const, data: i })),
    ...starterRecipes.value.map(r => ({ type: 'recipe' as const, data: r })),
  ]
  const slides: { items: SlideItem[] }[] = []
  for (let i = 0; i < items.length; i += 4) {
    slides.push({ items: items.slice(i, i + 4) })
  }
  return slides
})

// Carousel state
const currentSlide = ref(0)
const carouselEl = ref<HTMLElement | null>(null)
let carouselTimer: ReturnType<typeof setInterval> | null = null
const CAROUSEL_INTERVAL = 5000

function nextSlide() {
  currentSlide.value = (currentSlide.value + 1) % carouselSlides.value.length
}

function goToSlide(index: number) {
  currentSlide.value = index
  resetCarouselTimer()
}

function resetCarouselTimer() {
  if (carouselTimer) clearInterval(carouselTimer)
  carouselTimer = setInterval(nextSlide, CAROUSEL_INTERVAL)
}

function pauseCarousel() {
  if (carouselTimer) clearInterval(carouselTimer)
}

onMounted(() => {
  if (carouselSlides.value.length > 1) {
    carouselTimer = setInterval(nextSlide, CAROUSEL_INTERVAL)
  }
})

onUnmounted(() => {
  if (carouselTimer) clearInterval(carouselTimer)
})

// "Hot" recipes: those using the most common ingredients
const commonIngredientNames = computed(() => {
  const top = [...ingredients]
    .filter(i => i.relatedRecipeIds?.length > 0)
    .sort((a, b) => (b.relatedRecipeIds?.length || 0) - (a.relatedRecipeIds?.length || 0))
    .slice(0, 15)
    .map(i => i.name)
  return new Set(top)
})

const popularRecipes = computed(() =>
  [...recipes]
    .map(r => ({
      ...r,
      _score: r.ingredients.filter(ri => commonIngredientNames.value.has(ri.name)).length,
    }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 4)
)

const stats = computed(() => ({
  ingredients: ingredients.length,
  recipes: recipes.length,
}))
</script>

<template>
  <HomeBanner />
  <div class="page-container">
    <!-- Search -->
    <div class="home-search">
      <SearchBar
        v-model="searchQuery"
        placeholder="搜索食材或食谱..."
        @keyup.enter="onSearch"
      />
      <div v-if="showResults && hasResults" class="search-results">
        <template v-if="searchResults.ingredients.length">
          <div class="search-results__label">食材</div>
          <button
            v-for="item in searchResults.ingredients"
            :key="item.id"
            class="search-results__item"
            @mousedown.prevent="goToIngredient(item.id)"
          >
            <span class="search-results__name">{{ item.name }}</span>
            <span class="search-results__cat">{{ item.category }}</span>
          </button>
        </template>
        <template v-if="searchResults.recipes.length">
          <div class="search-results__label">食谱</div>
          <button
            v-for="item in searchResults.recipes"
            :key="item.id"
            class="search-results__item"
            @mousedown.prevent="goToRecipe(item.id)"
          >
            <span class="search-results__name">{{ item.name }}</span>
            <span class="search-results__cat">{{ item.cuisine }}</span>
          </button>
        </template>
        <div class="search-results__footer" @mousedown.prevent="onSearch">
          查看全部结果 &rarr;
        </div>
      </div>
    </div>

    <!-- Search results -->
    <template v-if="isSearching">
      <template v-if="fullResults.ingredients.length">
        <section class="home-section">
          <h2 class="section-title section-title--icon"><GridIcon /> 食材 ({{ fullResults.ingredients.length }})</h2>
          <div class="card-grid">
            <IngredientCard v-for="item in fullResults.ingredients" :key="item.id" :ingredient="item" />
          </div>
        </section>
        <hr class="divider" />
      </template>
      <template v-if="fullResults.recipes.length">
        <section class="home-section">
          <h2 class="section-title section-title--icon"><RecipeBookIcon /> 食谱 ({{ fullResults.recipes.length }})</h2>
          <div class="card-grid">
            <RecipeCard v-for="item in fullResults.recipes" :key="item.id" :recipe="item" />
          </div>
        </section>
      </template>
      <div v-if="!fullResults.ingredients.length && !fullResults.recipes.length" class="empty-state">
        <svg class="empty-state__icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
        <p class="empty-state__text">未找到相关内容，试试其他关键词</p>
      </div>
    </template>

    <!-- Normal homepage -->
    <template v-else>
      <!-- Stats -->
      <div class="stats-bar">
        <span>共收录 <strong>{{ stats.ingredients }}</strong> 种食材</span>
        <span class="stats-bar__sep">·</span>
        <span><strong>{{ stats.recipes }}</strong> 道家常菜谱</span>
      </div>

      <hr class="divider" />

      <!-- Starter Carousel -->
      <section class="home-section">
        <h2 class="section-title section-title--icon"><SeedlingIcon /> 新手入门</h2>
        <p class="section-desc">从最常见的食材开始，迈出烹饪第一步</p>
        <div
          ref="carouselEl"
          class="carousel"
          @mouseenter="pauseCarousel"
          @mouseleave="resetCarouselTimer"
        >
          <div class="carousel__track" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
            <div
              v-for="(slide, si) in carouselSlides"
              :key="si"
              class="carousel__slide"
            >
              <div class="card-grid">
                <template v-for="item in slide.items" :key="item.type === 'ingredient' ? item.data.id : item.data.id">
                  <IngredientCard v-if="item.type === 'ingredient'" :ingredient="item.data" />
                  <RecipeCard v-else :recipe="item.data" />
                </template>
              </div>
            </div>
          </div>
          <div v-if="carouselSlides.length > 1" class="carousel__dots">
            <button
              v-for="(_, si) in carouselSlides"
              :key="si"
              :class="['carousel__dot', { 'carousel__dot--active': si === currentSlide }]"
              @click="goToSlide(si)"
            />
          </div>
        </div>
      </section>

      <hr class="divider" />

      <!-- Ingredient Categories -->
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

      <!-- Cuisines -->
      <section class="home-section">
        <div class="section-header">
          <h2 class="section-title section-title--icon"><RecipeBookIcon /> 菜系浏览</h2>
          <router-link to="/recipes" class="section-header__more">查看全部 &rarr;</router-link>
        </div>
        <div class="category-grid">
          <router-link
            v-for="c in CUISINES"
            :key="c"
            :to="`/recipes?cuisine=${c}`"
            class="category-item"
          >
            <span class="category-item__text">{{ c }}</span>
          </router-link>
        </div>
      </section>

      <hr class="divider" />

      <!-- Hot Recipes -->
      <section class="home-section">
        <div class="section-header">
          <h2 class="section-title section-title--icon"><RecipeBookIcon /> 热门食谱</h2>
          <router-link to="/recipes" class="section-header__more">查看全部 &rarr;</router-link>
        </div>
        <div class="card-grid">
          <RecipeCard v-for="item in popularRecipes" :key="item.id" :recipe="item" />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.home-search {
  position: relative;
  max-width: 600px;
  margin: 0 auto var(--section-gap);
}

.home-search :deep(.search-bar) {
  max-width: 100%;
  height: 48px;
  border-radius: 24px;
  padding: 0 20px;
}

.search-results {
  position: absolute;
  top: 56px;
  left: 0;
  right: 0;
  background: var(--color-card-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  padding: 8px;
  z-index: 60;
}

.search-results__label {
  padding: 8px 12px 4px;
  font-size: 12px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.search-results__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font-family: inherit;
  font-size: var(--font-size-body);
  color: var(--color-text-body);
  cursor: pointer;
  transition: background 0.15s;
}

.search-results__item:hover {
  background: var(--color-bg);
}

.search-results__name {
  color: var(--color-text-title);
}

.search-results__cat {
  font-size: var(--font-size-note);
  color: var(--color-text-muted);
}

.search-results__footer {
  padding: 10px 12px;
  border-top: 1px solid var(--color-border);
  margin-top: 4px;
  font-size: var(--font-size-note);
  color: var(--color-primary);
  cursor: pointer;
  transition: color 0.15s;
}

.search-results__footer:hover {
  color: var(--color-text-title);
}

.home-section {
  margin-bottom: var(--component-gap);
}

.section-desc {
  font-size: var(--font-size-note);
  color: var(--color-text-muted);
  margin: -12px 0 16px;
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

.stats-bar {
  text-align: center;
  font-size: var(--font-size-note);
  color: var(--color-text-muted);
  padding: 8px 0 4px;
}

.stats-bar strong {
  color: var(--color-primary);
  font-weight: 600;
}

.stats-bar__sep {
  margin: 0 8px;
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

/* Carousel */
.carousel {
  overflow: hidden;
  position: relative;
}

.carousel__track {
  display: flex;
  transition: transform 0.5s ease;
}

.carousel__slide {
  min-width: 100%;
  flex-shrink: 0;
}

.carousel__dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.carousel__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: var(--color-border);
  cursor: pointer;
  padding: 0;
  transition: background 0.3s, transform 0.3s;
}

.carousel__dot--active {
  background: var(--color-primary);
  transform: scale(1.3);
}

.carousel__dot:hover {
  background: var(--color-text-muted);
}

@media (max-width: 768px) {
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
