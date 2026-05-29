<script setup lang="ts">
import { ref } from 'vue'

const menuOpen = ref(false)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function closeMenu() {
  menuOpen.value = false
}
</script>

<template>
  <nav class="navbar">
    <div class="navbar__inner">
      <router-link to="/" class="navbar__logo" @click="closeMenu">知食</router-link>

      <button class="navbar__toggle" @click="toggleMenu" aria-label="菜单">
        <span class="navbar__toggle-bar" :class="{ 'navbar__toggle-bar--open': menuOpen }"></span>
        <span class="navbar__toggle-bar" :class="{ 'navbar__toggle-bar--open': menuOpen }"></span>
        <span class="navbar__toggle-bar" :class="{ 'navbar__toggle-bar--open': menuOpen }"></span>
      </button>

      <div class="navbar__menu" :class="{ 'navbar__menu--open': menuOpen }">
        <router-link to="/" class="navbar__link" @click="closeMenu">首页</router-link>
        <router-link to="/ingredients" class="navbar__link" @click="closeMenu">食材</router-link>
        <router-link to="/recipes" class="navbar__link" @click="closeMenu">食谱</router-link>
        <router-link to="/favorites" class="navbar__link navbar__link--icon" @click="closeMenu">
          收藏
        </router-link>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--navbar-height);
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
  z-index: 100;
}

.navbar__inner {
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: 0 var(--page-padding-x);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar__logo {
  font-size: var(--font-size-section);
  font-weight: 700;
  color: var(--color-primary);
}

.navbar__logo:hover {
  text-decoration: none;
}

.navbar__menu {
  display: flex;
  align-items: center;
  gap: var(--component-gap);
}

.navbar__link {
  font-size: var(--font-size-body);
  color: var(--color-text-body);
  transition: color 0.2s;
}

.navbar__link:hover {
  color: var(--color-primary);
  text-decoration: none;
}

.navbar__link.router-link-active {
  color: var(--color-primary);
}

.navbar__toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  padding: 4px;
}

.navbar__toggle-bar {
  display: block;
  width: 24px;
  height: 2px;
  background: var(--color-text-title);
  transition: transform 0.3s;
}

@media (max-width: 768px) {
  .navbar__toggle {
    display: flex;
  }

  .navbar__menu {
    display: none;
    position: absolute;
    top: var(--navbar-height);
    left: 0;
    right: 0;
    flex-direction: column;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
    padding: var(--element-gap) 0;
    gap: 0;
  }

  .navbar__menu--open {
    display: flex;
  }

  .navbar__link {
    width: 100%;
    padding: 12px var(--page-padding-x-mobile);
  }

  .navbar__link:hover {
    background: var(--color-border);
  }
}
</style>
