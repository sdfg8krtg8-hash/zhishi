<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  aspectRatio?: string
}>(), {
  src: '/src/assets/images/placeholders/placeholder.svg',
  alt: '',
  aspectRatio: '1 / 1',
})

const hasError = ref(false)

const computedSrc = computed(() => {
  if (hasError.value || !props.src) {
    return '/src/assets/images/placeholders/placeholder.svg'
  }
  return props.src
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
