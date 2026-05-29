<script setup lang="ts">
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
</script>

<template>
  <AppNavbar />
  <main>
    <router-view />
  </main>
  <AppFooter />
</template>

<style scoped>
main {
  min-height: calc(100vh - var(--navbar-height) - 80px);
}
</style>
