import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/ingredients',
      name: 'ingredients',
      component: () => import('@/views/IngredientListView.vue'),
    },
    {
      path: '/ingredients/:id',
      name: 'ingredient-detail',
      component: () => import('@/views/IngredientDetailView.vue'),
    },
    {
      path: '/recipes',
      name: 'recipes',
      component: () => import('@/views/RecipeListView.vue'),
    },
    {
      path: '/recipes/:id',
      name: 'recipe-detail',
      component: () => import('@/views/RecipeDetailView.vue'),
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue'),
    },
  ],
})

export default router
