# 知食视觉精细化 & 交互优化 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 hx.txt 优化文档与 visual-refinement-design 设计文档中的全部视觉精细化、交互优化内容。

**Architecture:** 纯 CSS + Vue 组件改造，不涉及路由/数据层/业务逻辑。遵循现有 CSS 变量体系，所有样式变更集中在 `variables.css`、`global.css` 及各组件 `<style scoped>` 中。图标使用手写 SVG inline 组件，零依赖。

**Tech Stack:** Vue 3 + TypeScript + CSS Custom Properties + SVG

---

### Task 1: 全局 CSS 变量升级

**Files:**
- Modify: `src/assets/styles/variables.css`

- [ ] **Step 1: 更新卡片圆角变量**

将 `--card-radius` 从 `8px` 改为 `12px`：

```css
--card-radius: 12px;
```

- [ ] **Step 2: 新增卡片阴影和过渡变量**

在 Card 区块新增阴影和过渡变量：

```css
--card-shadow: 0 1px 3px rgba(0,0,0,0.06);
--card-shadow-hover: 0 4px 12px rgba(0,0,0,0.08);
--card-transition: all 0.2s ease;
```

- [ ] **Step 3: 新增搜索框变量**

新增搜索框相关变量：

```css
--search-radius: 20px;
--search-height: 40px;
--search-focus-glow: 0 0 0 3px rgba(139,105,20,0.1);
```

- [ ] **Step 4: 验证变量文件**

运行 `npx vue-tsc --build --noEmit` 确认无类型错误。

- [ ] **Step 5: Commit**

```bash
git add src/assets/styles/variables.css
git commit -m "feat: 升级 CSS 变量 — 卡片圆角 12px、阴影、搜索框参数"
```

---

### Task 2: 卡片组件统一升级 (IngredientCard + RecipeCard)

**Files:**
- Modify: `src/components/common/IngredientCard.vue`
- Modify: `src/components/common/RecipeCard.vue`

- [ ] **Step 1: 升级 IngredientCard 样式**

修改 `.ingredient-card` 样式 — 添加阴影、hover 上浮效果、过渡：

```css
.ingredient-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 260px;
  background: var(--color-card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  transition: var(--card-transition);
}

.ingredient-card:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-4px);
  text-decoration: none;
}
```

同时删除原来的 `transition: border-color 0.2s;`。

- [ ] **Step 2: 升级 RecipeCard 样式**

同样修改 `.recipe-card` 样式：

```css
.recipe-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 260px;
  background: var(--color-card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
  overflow: hidden;
  transition: var(--card-transition);
}

.recipe-card:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-4px);
  text-decoration: none;
}
```

删除原来的 `transition: border-color 0.2s;`。

- [ ] **Step 3: 验证**

运行 `npx vue-tsc --build --noEmit`。

- [ ] **Step 4: Commit**

```bash
git add src/components/common/IngredientCard.vue src/components/common/RecipeCard.vue
git commit -m "feat: 卡片组件升级 — 12px 圆角、阴影、hover 上浮动效"
```

---

### Task 3: 搜索框药丸形改造

**Files:**
- Modify: `src/components/ui/SearchBar.vue`

- [ ] **Step 1: 重写 SearchBar 模板和样式**

将搜索框改为药丸形（`border-radius: 20px`，高度 `40px`），左侧嵌入 SVG 搜索图标，去掉搜索按钮：

```vue
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
```

- [ ] **Step 2: 更新调用处 placeholder**

`RecipeListView.vue` 中 SearchBar 的 placeholder 改为 `"搜索食谱..."`，`IngredientListView.vue` 中改为 `"搜索食材..."`（保持一致，但组件默认已是通用文案）。

- [ ] **Step 3: 验证**

运行 `npx vue-tsc --build --noEmit`。

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/SearchBar.vue
git commit -m "feat: 搜索框药丸形改造 — 20px 圆角、SVG 图标、聚焦外发光"
```

---

### Task 4: 分类按钮标准化

**Files:**
- Modify: `src/components/ui/FilterBar.vue`
- Modify: `src/views/HomeView.vue` (category-item 样式)

- [ ] **Step 1: 重写 FilterBar 按钮样式**

修改 `filter-bar__btn` — 选中态改为浅底 + 深色文字（而非当前的全色填充），hover 文字变 primary：

```css
.filter-bar__btn {
  height: var(--btn-height);
  padding: 0 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--btn-radius);
  background: var(--color-card-bg);
  color: var(--color-text-body);
  font-size: var(--font-size-note);
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.filter-bar__btn:hover {
  color: var(--color-primary);
}

.filter-bar__btn--active {
  background: var(--color-primary-light);
  border-color: var(--color-primary-light);
  color: var(--color-text-title);
}
```

- [ ] **Step 2: 同步 HomeView 分类标签样式**

修改 `HomeView.vue` 中 `.category-item` 的 hover 效果，使文字变 primary：

```css
.category-item:hover {
  border-color: var(--color-primary);
  text-decoration: none;
}

.category-item:hover .category-item__text {
  color: var(--color-primary);
}
```

- [ ] **Step 3: 验证**

运行 `npx vue-tsc --build --noEmit`。

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/FilterBar.vue src/views/HomeView.vue
git commit -m "feat: 分类按钮标准化 — 浅底选中态、hover 文字变色"
```

---

### Task 5: 板块标题 SVG 图标组件

**Files:**
- Create: `src/components/icons/SeedlingIcon.vue`
- Create: `src/components/icons/GridIcon.vue`
- Create: `src/components/icons/RecipeBookIcon.vue`
- Create: `src/components/icons/ListIcon.vue`
- Create: `src/components/icons/StepsIcon.vue`
- Create: `src/components/icons/BulbIcon.vue`
- Create: `src/components/icons/ArrowUpIcon.vue`
- Create: `src/components/icons/index.ts`
- Modify: `src/views/HomeView.vue`
- Modify: `src/views/RecipeDetailView.vue`
- Modify: `src/views/IngredientDetailView.vue`

- [ ] **Step 1: 创建幼苗图标 SeedlingIcon.vue**

```vue
<template>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22v-7" />
    <path d="M9 18c-2.5-1.5-5-4-5-8 3 0 5.5 2 8 5 2.5-3 5-5 8-5 0 4-2.5 6.5-5 8" />
    <path d="M12 22c-1 0-2-1-2-2s1-2 2-2 2 1 2 2-1 2-2 2z" />
  </svg>
</template>
```

- [ ] **Step 2: 创建网格图标 GridIcon.vue**

```vue
<template>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
</template>
```

- [ ] **Step 3: 创建菜谱图标 RecipeBookIcon.vue**

```vue
<template>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" />
    <path d="M8 7h8" />
    <path d="M8 11h8" />
    <path d="M8 15h5" />
  </svg>
</template>
```

- [ ] **Step 4: 创建列表图标 ListIcon.vue**

```vue
<template>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none" />
  </svg>
</template>
```

- [ ] **Step 5: 创建步骤图标 StepsIcon.vue**

```vue
<template>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
    <line x1="12" y1="7" x2="12" y2="10" />
    <line x1="12" y1="14" x2="12" y2="17" />
  </svg>
</template>
```

- [ ] **Step 6: 创建灯泡图标 BulbIcon.vue**

```vue
<template>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2C8.69 2 6 4.69 6 8c0 2.21 1.21 4.15 3 5.19V16h6v-2.81c1.79-1.04 3-2.98 3-5.19 0-3.31-2.69-6-6-6z" />
  </svg>
</template>
```

- [ ] **Step 7: 创建上箭头图标 ArrowUpIcon.vue（回到顶部按钮用）**

```vue
<template>
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="m18 15-6-6-6 6" />
  </svg>
</template>
```

- [ ] **Step 8: 创建图标统一导出 index.ts**

```typescript
export { default as SeedlingIcon } from './SeedlingIcon.vue'
export { default as GridIcon } from './GridIcon.vue'
export { default as RecipeBookIcon } from './RecipeBookIcon.vue'
export { default as ListIcon } from './ListIcon.vue'
export { default as StepsIcon } from './StepsIcon.vue'
export { default as BulbIcon } from './BulbIcon.vue'
export { default as ArrowUpIcon } from './ArrowUpIcon.vue'
```

- [ ] **Step 9: 验证**

运行 `npx vue-tsc --build --noEmit`。

- [ ] **Step 10: Commit**

```bash
git add src/components/icons/
git commit -m "feat: 添加板块标题 SVG 图标组件（幼苗、网格、菜谱、列表、步骤、灯泡、上箭头）"
```

---

### Task 6: 板块标题加图标 — HomeView、详情页

**Files:**
- Modify: `src/views/HomeView.vue`
- Modify: `src/views/RecipeDetailView.vue`
- Modify: `src/views/IngredientDetailView.vue`
- Modify: `src/assets/styles/global.css`

- [ ] **Step 1: global.css 新增标题带图标样式**

在 `global.css` 的 `.section-title` 后新增：

```css
.section-title--icon {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-title);
}

.section-title--icon svg {
  flex-shrink: 0;
  color: var(--color-primary-light);
}
```

- [ ] **Step 2: HomeView 标题加图标**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { INGREDIENT_CATEGORIES } from '@/types/ingredient'
import { ingredients } from '@/data/ingredients'
import { recipes } from '@/data/recipes'
import IngredientCard from '@/components/common/IngredientCard.vue'
import RecipeCard from '@/components/common/RecipeCard.vue'
import { SeedlingIcon, GridIcon, RecipeBookIcon } from '@/components/icons'
// ... rest unchanged
</script>

<template>
  <div class="page-container">
    <section class="home-section">
      <h2 class="section-title section-title--icon">
        <SeedlingIcon /> 新手入门
      </h2>
      <!-- ... rest unchanged -->
    </section>

    <hr class="divider" />

    <section class="home-section">
      <h2 class="section-title section-title--icon">
        <GridIcon /> 食材分类
      </h2>
      <!-- ... rest unchanged -->
    </section>

    <hr class="divider" />

    <section class="home-section">
      <h2 class="section-title section-title--icon">
        <RecipeBookIcon /> 热门食谱
      </h2>
      <!-- ... rest unchanged -->
    </section>
  </div>
</template>
```

- [ ] **Step 3: RecipeDetailView 标题加图标**

在食材清单、烹饪步骤、新手贴士标题前分别添加 ListIcon、StepsIcon、BulbIcon：

```vue
<script setup lang="ts">
// ... existing imports
import { ListIcon, StepsIcon, BulbIcon } from '@/components/icons'
// ...
</script>

<!-- 食材清单 -->
<h2 class="section-title section-title--icon">
  <ListIcon /> 食材清单
</h2>

<!-- 烹饪步骤 -->
<h2 class="section-title section-title--icon">
  <StepsIcon /> 烹饪步骤
</h2>

<!-- 新手贴士 -->
<h2 class="section-title section-title--icon">
  <BulbIcon /> 新手贴士
</h2>
```

- [ ] **Step 4: IngredientDetailView 标题加图标**

在简介、选购技巧、保存方法、搭配食材标题前添加对应图标（复用现有图标或使用简单的装饰图标）。

- [ ] **Step 5: 验证**

运行 `npx vue-tsc --build --noEmit`。

- [ ] **Step 6: Commit**

```bash
git add src/views/HomeView.vue src/views/RecipeDetailView.vue src/views/IngredientDetailView.vue src/assets/styles/global.css
git commit -m "feat: 板块标题添加 SVG 图标点缀"
```

---

### Task 7: 首页 Banner 区域

**Files:**
- Create: `src/components/layout/HomeBanner.vue`
- Modify: `src/views/HomeView.vue`

- [ ] **Step 1: 创建 HomeBanner 组件**

```vue
<template>
  <div class="banner">
    <div class="banner__inner">
      <svg class="banner__decor" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2v0a5 5 0 0 0-5 5v1c0 1.1.9 2 2 2h3Zm0 0v7" />
      </svg>
      <h1 class="banner__title">知食</h1>
      <p class="banner__tagline">从食材认知到烹饪入门</p>
      <p class="banner__subtitle">面向零基础小白的食材百科与家常食谱指南</p>
    </div>
  </div>
</template>

<style scoped>
.banner {
  padding: 48px 24px;
  background: var(--color-card-bg);
  text-align: center;
}

.banner__inner {
  max-width: var(--page-max-width);
  margin: 0 auto;
}

.banner__decor {
  color: var(--color-primary-light);
  margin-bottom: 16px;
}

.banner__title {
  font-size: 36px;
  font-weight: 700;
  color: var(--color-text-title);
  margin-bottom: 8px;
}

.banner__tagline {
  font-size: 16px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.banner__subtitle {
  font-size: 14px;
  color: var(--color-text-muted);
}

@media (max-width: 768px) {
  .banner {
    padding: 32px 16px;
  }

  .banner__title {
    font-size: 28px;
  }

  .banner__tagline {
    font-size: 14px;
  }

  .banner__subtitle {
    font-size: 13px;
  }
}
</style>
```

- [ ] **Step 2: 将 Banner 放入 HomeView 顶部**

在 `HomeView.vue` 的 template 中，`.page-container` 之前添加 `<HomeBanner />`，同时去除 `.page-container` 的 `padding-top`（Banner 紧贴导航栏下方）。

修改 global.css 的 `.page-container` 中 padding-top 逻辑，让首页没有 padding-top（Banner 已在导航栏下方）：

```css
.page-container {
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: 0 var(--page-padding-x);
  padding-bottom: var(--section-gap);
}

.page-container--with-top {
  padding-top: calc(var(--navbar-height) + var(--component-gap));
}
```

其他页面（列表页、详情页）使用 `page-container--with-top` 类。

- [ ] **Step 3: 更新所有其他视图添加 --with-top 类**

给 `IngredientListView.vue`、`RecipeListView.vue`、`IngredientDetailView.vue`、`RecipeDetailView.vue`、`FavoritesView.vue` 的 `.page-container` 添加 `page-container--with-top` 类。

- [ ] **Step 4: 验证**

运行 `npx vue-tsc --build --noEmit`。

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/HomeBanner.vue src/views/HomeView.vue src/assets/styles/global.css src/views/IngredientListView.vue src/views/RecipeListView.vue src/views/IngredientDetailView.vue src/views/RecipeDetailView.vue src/views/FavoritesView.vue
git commit -m "feat: 首页 Banner 区 — 知食品牌标识 + 标语"
```

---

### Task 8: 页面过渡动画

**Files:**
- Modify: `src/App.vue`
- Modify: `src/router/index.ts`

- [ ] **Step 1: App.vue 添加过渡**

```vue
<script setup lang="ts">
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
</script>

<template>
  <AppNavbar />
  <main>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
  <AppFooter />
</template>

<style scoped>
main {
  min-height: calc(100vh - var(--navbar-height) - 80px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

- [ ] **Step 2: 验证**

运行 `npx vue-tsc --build --noEmit`，确认路由切换时淡入淡出效果。

- [ ] **Step 3: Commit**

```bash
git add src/App.vue
git commit -m "feat: 页面过渡淡入动画 — 250ms opacity 过渡"
```

---

### Task 9: 空状态优化

**Files:**
- Modify: `src/assets/styles/global.css`
- Modify: `src/views/RecipeListView.vue`
- Modify: `src/views/IngredientListView.vue`

- [ ] **Step 1: global.css 更新空状态样式**

用 SVG 图标替换 `.empty-state__icon` 的灰色方块，优化空状态文案样式：

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  color: var(--color-text-muted);
  text-align: center;
}

.empty-state__icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  color: var(--color-border);
}

.empty-state__text {
  font-size: var(--font-size-body);
  margin-bottom: var(--element-gap);
}
```

- [ ] **Step 2: 更新列表页空状态模板**

在 `RecipeListView.vue` 和 `IngredientListView.vue` 中更新空状态 HTML，使用内联 SVG 图标和更友好的文案：

```vue
<div v-else class="empty-state">
  <svg class="empty-state__icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
    <path d="M8 11h6" />
  </svg>
  <p class="empty-state__text">未找到相关内容，试试其他关键词</p>
</div>
```

- [ ] **Step 3: 同步收藏页空状态**

同样更新 `FavoritesView.vue` 的空状态，使用合适的图标。

- [ ] **Step 4: 验证**

运行 `npx vue-tsc --build --noEmit`。

- [ ] **Step 5: Commit**

```bash
git add src/assets/styles/global.css src/views/RecipeListView.vue src/views/IngredientListView.vue src/views/FavoritesView.vue
git commit -m "feat: 空状态优化 — SVG 图标 + 友好提示文案"
```

---

### Task 10: 回到顶部按钮

**Files:**
- Create: `src/components/ui/BackToTop.vue`
- Modify: `src/App.vue`

- [ ] **Step 1: 创建 BackToTop 组件**

```vue
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
```

- [ ] **Step 2: 在 App.vue 中引入**

```vue
<script setup lang="ts">
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import BackToTop from '@/components/ui/BackToTop.vue'
</script>

<template>
  <AppNavbar />
  <main>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </main>
  <AppFooter />
  <BackToTop />
</template>
```

- [ ] **Step 3: 验证**

运行 `npx vue-tsc --build --noEmit`。

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/BackToTop.vue src/App.vue
git commit -m "feat: 回到顶部按钮 — 圆形按钮、平滑滚动、hover 动效"
```

---

### Task 11: 分割线 & 细节样式统一

**Files:**
- Modify: `src/assets/styles/global.css`
- Modify: `src/components/layout/AppFooter.vue`

- [ ] **Step 1: 更新分割线样式**

```css
.divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--section-gap) 0;
}
```

（当前已是此值，确认无需修改。如有遗漏的分割线使用处，统一为 `hr class="divider"`。）

- [ ] **Step 2: 检查全局样式一致性**

浏览所有页面，确认：卡片圆角一致（12px）、按钮尺寸一致（36px）、搜索框一致（40px 药丸形）、过渡时间一致（0.2s）。

- [ ] **Step 3: Commit**

```bash
git add src/assets/styles/global.css
git commit -m "style: 分割线与细节样式统一"
```

---

### Task 12: 最终验证与测试

- [ ] **Step 1: 类型检查**

```bash
npx vue-tsc --build --noEmit
```
预期：0 错误。

- [ ] **Step 2: 运行测试**

```bash
npx vitest run
```
预期：全部通过。

- [ ] **Step 3: 启动开发服务器验证**

```bash
npx vite --host
```
在浏览器中验证：首页 Banner、卡片阴影/hover、搜索框药丸形、分类按钮三态、板块图标、页面切换过渡、回到顶部按钮、移动端布局。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: 最终验证通过"
```
