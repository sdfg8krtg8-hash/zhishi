<script setup lang="ts">
const model = defineModel<string>({ default: '' })

defineProps<{
  placeholder?: string
}>()
</script>

<template>
  <div class="search-bar">
    <svg class="search-bar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
    <input
      v-model="model"
      type="text"
      class="search-bar__input"
      :placeholder="placeholder || '搜索食材或食谱...'"
    />
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 420px;
  width: 100%;
  height: var(--search-height);
  padding: 0 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--search-radius);
  background: var(--color-card-bg);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-bar:focus-within {
  border-color: var(--color-primary);
  box-shadow: var(--search-focus-glow);
}

.search-bar__icon {
  flex-shrink: 0;
  color: var(--color-text-muted);
}

.search-bar__input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--font-size-body);
  color: var(--color-text-body);
  font-family: inherit;
}

.search-bar__input::placeholder {
  color: var(--color-text-muted);
}
</style>
