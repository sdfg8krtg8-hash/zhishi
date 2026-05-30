<script setup lang="ts">
export interface BreadcrumbItem {
  label: string
  to?: string
}

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>

<template>
  <nav class="breadcrumb" aria-label="面包屑导航">
    <template v-for="(item, i) in items" :key="item.label">
      <router-link v-if="item.to" :to="item.to" class="breadcrumb__link">{{ item.label }}</router-link>
      <span v-else class="breadcrumb__current">{{ item.label }}</span>
      <span v-if="i < items.length - 1" class="breadcrumb__sep">/</span>
    </template>
  </nav>
</template>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: var(--component-gap);
  font-size: var(--font-size-note);
}

.breadcrumb__link {
  color: var(--color-text-muted);
  transition: color 0.15s;
}

.breadcrumb__link:hover {
  color: var(--color-primary);
}

.breadcrumb__sep {
  color: var(--color-border);
}

.breadcrumb__current {
  color: var(--color-text-title);
}
</style>
