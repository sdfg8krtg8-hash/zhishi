<script setup lang="ts">
const model = defineModel<string>({ default: '' })

defineProps<{
  placeholder?: string
}>()
</script>

<template>
  <div class="search-bar">
    <input
      v-model="model"
      type="text"
      class="search-bar__input"
      :placeholder="placeholder || '搜索...'"
    />
    <button class="search-bar__btn">搜索</button>
  </div>
</template>

<style scoped>
.search-bar {
  display: flex;
  gap: var(--element-gap-sm);
  max-width: 400px;
  width: 100%;
}

.search-bar__input {
  flex: 1;
  height: var(--btn-height);
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: var(--font-size-body);
  color: var(--color-text-body);
  background: var(--color-card-bg);
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.search-bar__input:focus {
  border-color: var(--color-primary);
}

.search-bar__input::placeholder {
  color: var(--color-text-muted);
}

.search-bar__btn {
  height: var(--btn-height);
  padding: 0 20px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: var(--font-size-body);
  white-space: nowrap;
}
</style>
