<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  aspectRatio?: string
}>(), {
  src: '/images/placeholders/placeholder.svg',
  alt: '',
  aspectRatio: '1 / 1',
})

function resolvePath(path: string): string {
  if (path.startsWith('/images/')) {
    return import.meta.env.BASE_URL + path.slice(1)
  }
  return path
}

const hasError = ref(false)

const computedSrc = computed(() => {
  if (hasError.value || !props.src) {
    return import.meta.env.BASE_URL + 'images/placeholders/placeholder.svg'
  }
  return resolvePath(props.src)
})

function onError() {
  hasError.value = true
}
</script>

<template>
  <div class="placeholder-image" :style="{ aspectRatio }">
    <img
      :src="computedSrc"
      :alt="alt"
      class="placeholder-image__img"
      @error="onError"
    />
  </div>
</template>

<style scoped>
.placeholder-image {
  width: 100%;
  overflow: hidden;
  background-color: var(--color-border);
  border-radius: var(--card-radius);
}

.placeholder-image__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
