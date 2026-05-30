<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<template>
  <button class="back-btn" @click="goBack" aria-label="返回上一页">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
    <span class="back-btn__text">返回</span>
  </button>
</template>

<style scoped>
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 16px 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-card-bg);
  color: var(--color-text-muted);
  font-size: var(--font-size-note);
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: var(--component-gap);
}

.back-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.back-btn__text {
  line-height: 1;
}
</style>
