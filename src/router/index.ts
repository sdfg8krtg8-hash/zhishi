import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
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
