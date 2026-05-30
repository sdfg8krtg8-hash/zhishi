<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ArrowUpIcon } from '@/components/icons'

const visible = ref(false)

function onScroll() {
  visible.value = window.scrollY > window.innerHeight
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <button
    v-show="visible"
    class="back-to-top"
    @click="scrollToTop"
    aria-label="回到顶部"
  >
    <ArrowUpIcon />
  </button>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--color-border);
  background: var(--color-card-bg);
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 50;
}

.back-to-top:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  color: var(--color-primary);
}

@media (max-width: 768px) {
  .back-to-top {
    bottom: 24px;
    right: 24px;
  }
}
</style>
