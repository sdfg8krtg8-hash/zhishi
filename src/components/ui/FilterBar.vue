<script setup lang="ts">
defineProps<{
  options: string[]
  label?: string
}>()

const selected = defineModel<string>({ default: '' })
</script>

<template>
  <div class="filter-bar">
    <span v-if="label" class="filter-bar__label">{{ label }}</span>
    <div class="filter-bar__options">
      <button
        v-for="option in options"
        :key="option"
        class="filter-bar__btn"
        :class="{ 'filter-bar__btn--active': selected === option }"
        @click="selected = selected === option ? '' : option"
      >
        {{ option }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: var(--element-gap);
  flex-wrap: wrap;
}

.filter-bar__label {
  font-size: var(--font-size-body);
  color: var(--color-text-body);
  white-space: nowrap;
}

.filter-bar__options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--element-gap-sm);
}

.filter-bar__btn {
  height: var(--btn-height);
  padding: 0 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--btn-radius);
  background: var(--color-card-bg);
  color: var(--color-text-body);
  font-size: var(--font-size-note);
  transition: all 0.2s;
}

.filter-bar__btn:hover {
  border-color: var(--color-primary);
}

.filter-bar__btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}
</style>
