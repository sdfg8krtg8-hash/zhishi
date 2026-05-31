<script setup lang="ts">
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import BackToTop from '@/components/ui/BackToTop.vue'
</script>

<template>
  <AppNavbar />
  <main>
    <router-view v-slot="{ Component }">
      <transition name="fade">
        <keep-alive :include="['IngredientListView', 'RecipeListView']">
          <component :is="Component" />
        </keep-alive>
      </transition>
    </router-view>
  </main>
  <AppFooter />
  <BackToTop />
</template>

<style scoped>
main {
  min-height: calc(100vh - var(--navbar-height) - 80px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
