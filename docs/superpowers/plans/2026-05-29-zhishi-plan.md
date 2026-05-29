# 知食 (Zhishi) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete food knowledge website (Vue 3 + TypeScript + Vite) with 6 pages covering ingredient lookup and recipe learning for cooking beginners.

**Architecture:** Layer-by-layer construction — types → mock data → global styles → layout components → shared components → views → router/store wiring. CSS variables drive the visual system; all components use `<script setup lang="ts">` with Composition API.

**Tech Stack:** Vue 3.5 + TypeScript 6 + Vite 8 + Vue Router 5 + Pinia 3 + Vitest 4

---

### Task 1: Project setup — update index.html and create asset directories

**Files:**
- Modify: `index.html`
- Create: `src/assets/images/ingredients/.gitkeep`
- Create: `src/assets/images/recipes/.gitkeep`
- Create: `src/assets/images/icons/.gitkeep`
- Create: `src/assets/images/placeholders/.gitkeep`

- [ ] **Step 1: Update page title**

Edit `index.html` — change `<title>Vite App</title>` to `<title>知食</title>` and set `lang="zh-CN"`.

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>知食</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 2: Create asset directories**

```bash
mkdir -p src/assets/images/ingredients
mkdir -p src/assets/images/recipes
mkdir -p src/assets/images/icons
mkdir -p src/assets/images/placeholders
# Create .gitkeep files to preserve empty directories
echo "" > src/assets/images/ingredients/.gitkeep
echo "" > src/assets/images/recipes/.gitkeep
echo "" > src/assets/images/icons/.gitkeep
echo "" > src/assets/images/placeholders/.gitkeep
```

- [ ] **Step 3: Commit**

```bash
git add index.html src/assets/images/
git commit -m "chore: set page title to 知食, create image asset directories"
```

---

### Task 2: Type definitions

**Files:**
- Create: `src/types/ingredient.ts`
- Create: `src/types/recipe.ts`

- [ ] **Step 1: Write ingredient type**

Create `src/types/ingredient.ts`:

```typescript
export type IngredientCategory =
  | '蔬菜'
  | '水果'
  | '肉类'
  | '禽蛋'
  | '水产'
  | '豆制品'
  | '菌菇'
  | '调味品'
  | '主食'

export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  '蔬菜',
  '水果',
  '肉类',
  '禽蛋',
  '水产',
  '豆制品',
  '菌菇',
  '调味品',
  '主食',
]

export interface Ingredient {
  id: string
  name: string
  alias: string[]
  category: IngredientCategory
  description: string
  tips: string
  storage: string
  pairings: string[]
  relatedRecipeIds: string[]
  image: string
}
```

- [ ] **Step 2: Write recipe type**

Create `src/types/recipe.ts`:

```typescript
export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
}

export const CUISINES = ['川菜', '粤菜', '鲁菜', '苏菜', '闽菜', '浙菜', '湘菜', '徽菜', '家常'] as const
export type Cuisine = (typeof CUISINES)[number]

export interface RecipeIngredient {
  name: string
  amount: string
}

export interface RecipeStep {
  order: number
  text: string
  image: string
}

export interface Recipe {
  id: string
  name: string
  difficulty: Difficulty
  duration: string
  cuisine: Cuisine
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  tips: string
  coverImage: string
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/
git commit -m "feat: add Ingredient and Recipe type definitions"
```

---

### Task 3: Mock data

**Files:**
- Create: `src/data/ingredients.ts`
- Create: `src/data/recipes.ts`

- [ ] **Step 1: Write placeholder constant and ingredient mock data**

Create `src/data/ingredients.ts`:

```typescript
import type { Ingredient } from '@/types/ingredient'

export const PLACEHOLDER = '/src/assets/images/placeholders/placeholder.svg'

export const ingredients: Ingredient[] = [
  {
    id: 'ing-1',
    name: '土豆',
    alias: ['马铃薯', '洋芋'],
    category: '蔬菜',
    description: '土豆是最常见的根茎类蔬菜之一，富含淀粉和维生素C，是全球重要的主食作物。口感软糯，适合多种烹饪方式。',
    tips: '挑选表皮光滑、无绿斑、无发芽的土豆。发芽或变绿的土豆含有龙葵素，不宜食用。手感坚实、沉甸甸的为佳。',
    storage: '存放在阴凉通风处，避免阳光直射。不要与洋葱一起存放，两者会加速发芽。',
    pairings: ['牛肉', '青椒', '茄子', '胡萝卜'],
    relatedRecipeIds: ['rec-1', 'rec-3'],
    image: PLACEHOLDER,
  },
  {
    id: 'ing-2',
    name: '番茄',
    alias: ['西红柿'],
    category: '蔬菜',
    description: '番茄富含番茄红素和维生素C，酸甜可口，既可生食也可烹饪入菜。',
    tips: '挑选颜色鲜红、表皮光滑有弹性、果蒂鲜绿的番茄。闻起来有清香为佳。',
    storage: '室温存放即可，避免冰箱冷藏导致风味流失。已切开的需冷藏并在两天内食用。',
    pairings: ['鸡蛋', '牛肉', '豆腐', '洋葱'],
    relatedRecipeIds: ['rec-2'],
    image: PLACEHOLDER,
  },
  {
    id: 'ing-3',
    name: '鸡蛋',
    alias: ['鸡子'],
    category: '禽蛋',
    description: '鸡蛋是最常见的优质蛋白质来源，含有全部必需氨基酸，烹饪简单多样化。',
    tips: '挑选蛋壳粗糙、无裂纹的鸡蛋。摇晃无声说明新鲜，放在水中沉底为新鲜蛋。',
    storage: '大头朝上冷藏保存，可延长保鲜期。使用前取出回温效果更佳。',
    pairings: ['番茄', '韭菜', '虾仁', '面粉'],
    relatedRecipeIds: ['rec-2', 'rec-4'],
    image: PLACEHOLDER,
  },
  {
    id: 'ing-4',
    name: '猪肉',
    alias: ['猪五花', '猪瘦肉'],
    category: '肉类',
    description: '猪肉是中国家庭最常食用的肉类，肉质细嫩，适合炒、炖、煮、炸等多种烹饪方式。',
    tips: '新鲜猪肉呈淡粉色，肉质有弹性，脂肪洁白。按压后能迅速回弹为佳。',
    storage: '冷藏可保存1-2天，冷冻可保存1-3个月。分装冷冻，解冻后不宜再次冷冻。',
    pairings: ['蒜苗', '青椒', '土豆', '白菜'],
    relatedRecipeIds: ['rec-1', 'rec-5'],
    image: PLACEHOLDER,
  },
  {
    id: 'ing-5',
    name: '豆腐',
    alias: ['水豆腐'],
    category: '豆制品',
    description: '豆腐由大豆制成，富含植物蛋白和钙质，质地嫩滑，清淡爽口。',
    tips: '挑选表面光滑细腻、无酸味的豆腐。按压有弹性，不散不碎为好。',
    storage: '用清水浸泡，放入冰箱冷藏，每天换水可保存2-3天。',
    pairings: ['葱', '肉末', '虾仁', '青菜'],
    relatedRecipeIds: ['rec-5'],
    image: PLACEHOLDER,
  },
  {
    id: 'ing-6',
    name: '大米',
    alias: ['米饭', '白米'],
    category: '主食',
    description: '大米是中国最主要的主食，提供碳水化合物能量，是日常饮食的基础。',
    tips: '挑选米粒饱满、色泽清白透明、无碎米、无异味的大米。新米有自然米香。',
    storage: '密封存放于阴凉干燥处，夏季可放入冰箱冷藏防虫。',
    pairings: ['各种蔬菜', '各种肉类', '鸡蛋'],
    relatedRecipeIds: ['rec-4'],
    image: PLACEHOLDER,
  },
  {
    id: 'ing-7',
    name: '青菜',
    alias: ['小白菜', '油菜'],
    category: '蔬菜',
    description: '青菜是餐桌上最常见的绿叶蔬菜，富含维生素和膳食纤维，清爽可口。',
    tips: '挑选叶片翠绿、茎部挺拔、无黄叶无虫眼的青菜。手感鲜嫩有水分。',
    storage: '用保鲜袋包好放入冰箱冷藏，尽快食用，不宜存放超过3天。',
    pairings: ['香菇', '蒜', '豆腐', '虾皮'],
    relatedRecipeIds: [],
    image: PLACEHOLDER,
  },
  {
    id: 'ing-8',
    name: '虾',
    alias: ['大虾', '对虾'],
    category: '水产',
    description: '虾肉质鲜嫩弹牙，富含优质蛋白和虾青素，是家常海鲜中最受欢迎的食材之一。',
    tips: '挑选虾体弯曲、壳色鲜亮、虾头与虾身连接紧密的虾。闻起来有淡淡海腥味，无臭味。',
    storage: '鲜虾去虾线后冷藏1-2天，或去头去壳冷冻保存，解冻后尽快烹饪。',
    pairings: ['鸡蛋', '豆腐', '葱姜', '西兰花'],
    relatedRecipeIds: [],
    image: PLACEHOLDER,
  },
]
```

- [ ] **Step 2: Write recipe mock data**

Create `src/data/recipes.ts`:

```typescript
import type { Recipe } from '@/types/recipe'
import { PLACEHOLDER } from './ingredients'

export const recipes: Recipe[] = [
  {
    id: 'rec-1',
    name: '土豆烧牛肉',
    difficulty: 'medium',
    duration: '45分钟',
    cuisine: '家常',
    ingredients: [
      { name: '牛肉', amount: '300g' },
      { name: '土豆', amount: '2个' },
      { name: '胡萝卜', amount: '1根' },
      { name: '洋葱', amount: '半个' },
      { name: '生抽', amount: '2勺' },
      { name: '老抽', amount: '1勺' },
      { name: '姜', amount: '3片' },
      { name: '八角', amount: '2个' },
    ],
    steps: [
      { order: 1, text: '牛肉切块，冷水下锅焯水，水沸后捞出洗净浮沫。', image: PLACEHOLDER },
      { order: 2, text: '土豆、胡萝卜去皮切滚刀块，洋葱切片，姜切片备用。', image: PLACEHOLDER },
      { order: 3, text: '锅中倒油，放入姜片、八角爆香，加入牛肉翻炒至表面微黄。', image: PLACEHOLDER },
      { order: 4, text: '加入生抽、老抽翻炒上色，倒入没过牛肉的热水，大火烧开后转小火炖30分钟。', image: PLACEHOLDER },
      { order: 5, text: '加入土豆、胡萝卜和洋葱，继续炖15分钟至土豆软烂，收汁即可。', image: PLACEHOLDER },
    ],
    tips: '牛肉先焯水可以去除血水和腥味；炖牛肉时加热水，冷水会让肉质紧缩变柴。',
    coverImage: PLACEHOLDER,
  },
  {
    id: 'rec-2',
    name: '番茄炒蛋',
    difficulty: 'easy',
    duration: '10分钟',
    cuisine: '家常',
    ingredients: [
      { name: '番茄', amount: '2个' },
      { name: '鸡蛋', amount: '3个' },
      { name: '葱', amount: '1根' },
      { name: '盐', amount: '适量' },
      { name: '糖', amount: '半勺' },
      { name: '食用油', amount: '2勺' },
    ],
    steps: [
      { order: 1, text: '番茄洗净切小块，鸡蛋打散加少许盐搅匀，葱切葱花。', image: PLACEHOLDER },
      { order: 2, text: '锅中倒油烧热，倒入蛋液，用筷子快速划散，凝固后盛出备用。', image: PLACEHOLDER },
      { order: 3, text: '锅中再倒少许油，放入番茄翻炒，加糖和少许盐，炒至番茄出汁。', image: PLACEHOLDER },
      { order: 4, text: '倒回炒好的鸡蛋，翻炒均匀，撒上葱花出锅。', image: PLACEHOLDER },
    ],
    tips: '番茄加少许糖可以中和酸味；鸡蛋不要炒太老，嫩滑口感最好。',
    coverImage: PLACEHOLDER,
  },
  {
    id: 'rec-3',
    name: '酸辣土豆丝',
    difficulty: 'easy',
    duration: '15分钟',
    cuisine: '川菜',
    ingredients: [
      { name: '土豆', amount: '2个' },
      { name: '干辣椒', amount: '3个' },
      { name: '花椒', amount: '10粒' },
      { name: '醋', amount: '2勺' },
      { name: '盐', amount: '适量' },
      { name: '葱', amount: '1根' },
      { name: '食用油', amount: '2勺' },
    ],
    steps: [
      { order: 1, text: '土豆去皮切细丝，放入清水中浸泡去除多余淀粉，沥干备用。', image: PLACEHOLDER },
      { order: 2, text: '干辣椒剪段，葱切段。', image: PLACEHOLDER },
      { order: 3, text: '锅中倒油，放入花椒、干辣椒爆香。', image: PLACEHOLDER },
      { order: 4, text: '倒入土豆丝大火快炒，加盐和醋调味，翻炒均匀至土豆丝断生。', image: PLACEHOLDER },
      { order: 5, text: '撒上葱段翻匀出锅。土豆丝炒太久会失去脆感，全程大火快炒。', image: PLACEHOLDER },
    ],
    tips: '土豆丝切好后泡水去淀粉，炒出来才脆；全程大火快炒，不超过3分钟。',
    coverImage: PLACEHOLDER,
  },
  {
    id: 'rec-4',
    name: '蛋炒饭',
    difficulty: 'easy',
    duration: '10分钟',
    cuisine: '家常',
    ingredients: [
      { name: '隔夜米饭', amount: '1碗' },
      { name: '鸡蛋', amount: '2个' },
      { name: '葱', amount: '1根' },
      { name: '盐', amount: '适量' },
      { name: '食用油', amount: '2勺' },
    ],
    steps: [
      { order: 1, text: '鸡蛋打散，葱切葱花，隔夜米饭用手捏散备用。', image: PLACEHOLDER },
      { order: 2, text: '锅中倒油烧热，倒入蛋液快速划散，炒至凝固盛出。', image: PLACEHOLDER },
      { order: 3, text: '锅中加少许油，倒入米饭，用铲子压散炒热。', image: PLACEHOLDER },
      { order: 4, text: '倒回鸡蛋炒匀，加盐调味，撒葱花出锅。', image: PLACEHOLDER },
    ],
    tips: '隔夜米饭水分少，炒出来粒粒分明；炒饭时用大火，不停翻动防止粘锅。',
    coverImage: PLACEHOLDER,
  },
  {
    id: 'rec-5',
    name: '家常豆腐',
    difficulty: 'easy',
    duration: '20分钟',
    cuisine: '家常',
    ingredients: [
      { name: '豆腐', amount: '1块' },
      { name: '猪肉末', amount: '100g' },
      { name: '豆瓣酱', amount: '1勺' },
      { name: '生抽', amount: '1勺' },
      { name: '葱', amount: '1根' },
      { name: '姜', amount: '2片' },
      { name: '蒜', amount: '2瓣' },
      { name: '食用油', amount: '2勺' },
    ],
    steps: [
      { order: 1, text: '豆腐切成2cm方块，放入加盐的热水中焯2分钟，沥干备用。', image: PLACEHOLDER },
      { order: 2, text: '姜蒜切末，葱切段。', image: PLACEHOLDER },
      { order: 3, text: '锅中倒油，放入肉末煸炒至变色，加入姜蒜末、豆瓣酱炒出红油。', image: PLACEHOLDER },
      { order: 4, text: '加少许水，放入豆腐轻轻推匀，加生抽调味，小火煮5分钟入味。', image: PLACEHOLDER },
      { order: 5, text: '大火收汁，撒上葱段出锅。', image: PLACEHOLDER },
    ],
    tips: '豆腐焯水可以去除豆腥味并使其更紧实不易碎；煮豆腐时轻轻翻动，保持完整。',
    coverImage: PLACEHOLDER,
  },
  {
    id: 'rec-6',
    name: '清炒青菜',
    difficulty: 'easy',
    duration: '5分钟',
    cuisine: '家常',
    ingredients: [
      { name: '青菜', amount: '300g' },
      { name: '蒜', amount: '3瓣' },
      { name: '盐', amount: '适量' },
      { name: '食用油', amount: '2勺' },
    ],
    steps: [
      { order: 1, text: '青菜洗净切段，蒜拍碎切末。', image: PLACEHOLDER },
      { order: 2, text: '锅中倒油烧热，放入蒜末爆香。', image: PLACEHOLDER },
      { order: 3, text: '倒入青菜大火快炒，加盐调味，炒至叶片变软即可出锅。', image: PLACEHOLDER },
    ],
    tips: '炒青菜全程大火，时间不超过3分钟，保持脆嫩口感和翠绿色泽。',
    coverImage: PLACEHOLDER,
  },
]
```

- [ ] **Step 3: Commit**

```bash
git add src/data/
git commit -m "feat: add mock ingredient and recipe data with 8 ingredients and 6 recipes"
```

---

### Task 4: Global styles — CSS variables, reset, and global layout

**Files:**
- Create: `src/assets/styles/variables.css`
- Create: `src/assets/styles/reset.css`
- Create: `src/assets/styles/global.css`
- Modify: `src/main.ts`

- [ ] **Step 1: Write CSS variables**

Create `src/assets/styles/variables.css`:

```css
:root {
  /* Colors */
  --color-primary: #8B6914;
  --color-primary-light: #C4B393;
  --color-bg: #FBF7F0;
  --color-card-bg: #FFFFFF;
  --color-border: #E0D5C1;
  --color-border-hover: #C4B393;
  --color-text-title: #3D3226;
  --color-text-body: #6B5E4E;
  --color-text-muted: #9B8E7E;

  /* Typography */
  --font-family: 'Inter', 'Noto Sans SC', 'Source Han Sans CN', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-title: 28px;
  --font-size-section: 22px;
  --font-size-body: 16px;
  --font-size-note: 14px;
  --line-height-heading: 1.4;
  --line-height-body: 1.75;

  /* Spacing */
  --page-max-width: 1200px;
  --page-padding-x: 24px;
  --page-padding-x-mobile: 16px;
  --section-gap: 48px;
  --component-gap: 24px;
  --card-gap: 20px;
  --element-gap: 12px;
  --element-gap-sm: 8px;

  /* Card */
  --card-radius: 8px;
  --card-border: 1px solid var(--color-border);
  --card-img-ratio: 1 / 1;

  /* Button */
  --btn-radius: 4px;
  --btn-height: 36px;

  /* Navbar */
  --navbar-height: 64px;

  /* Breakpoints */
  --bp-mobile: 768px;
}
```

- [ ] **Step 2: Write CSS reset**

Create `src/assets/styles/reset.css`:

```css
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  line-height: var(--line-height-body);
  color: var(--color-text-body);
  background-color: var(--color-bg);
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

img {
  max-width: 100%;
  display: block;
}

button {
  cursor: pointer;
  font-family: inherit;
}

ul, ol {
  list-style: none;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: var(--line-height-heading);
  color: var(--color-text-title);
}
```

- [ ] **Step 3: Write global utility styles**

Create `src/assets/styles/global.css`:

```css
@import './variables.css';
@import './reset.css';

/* Page container */
.page-container {
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: 0 var(--page-padding-x);
  padding-top: calc(var(--navbar-height) + var(--component-gap));
  padding-bottom: var(--section-gap);
}

/* Section titles */
.section-title {
  font-size: var(--font-size-section);
  color: var(--color-text-title);
  margin-bottom: var(--component-gap);
}

/* Card grid layout */
.card-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--card-gap);
}

@media (max-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: 0 var(--page-padding-x-mobile);
    padding-top: calc(var(--navbar-height) + var(--element-gap));
    padding-bottom: var(--component-gap);
  }

  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Divider */
.divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--section-gap) 0;
}

/* Empty state */
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
  width: 120px;
  height: 120px;
  margin-bottom: var(--component-gap);
  background: var(--color-border);
  border-radius: 50%;
}

.empty-state__text {
  font-size: var(--font-size-body);
  margin-bottom: var(--element-gap);
}
```

- [ ] **Step 4: Import global styles in main.ts**

Edit `src/main.ts`:

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import '@/assets/styles/global.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
```

- [ ] **Step 5: Commit**

```bash
git add src/assets/styles/ src/main.ts
git commit -m "feat: add global CSS variables, reset, and utility styles"
```

---

### Task 5: PlaceholderImage component

**Files:**
- Create: `src/components/common/PlaceholderImage.vue`

- [ ] **Step 1: Write PlaceholderImage component**

Create `src/components/common/PlaceholderImage.vue`:

```vue
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/common/PlaceholderImage.vue
git commit -m "feat: add PlaceholderImage component with error fallback"
```

---

### Task 6: IngredientCard and RecipeCard components

**Files:**
- Create: `src/components/common/IngredientCard.vue`
- Create: `src/components/common/RecipeCard.vue`

- [ ] **Step 1: Write IngredientCard component**

Create `src/components/common/IngredientCard.vue`:

```vue
<script setup lang="ts">
import type { Ingredient } from '@/types/ingredient'
import PlaceholderImage from './PlaceholderImage.vue'

defineProps<{
  ingredient: Ingredient
}>()
</script>

<template>
  <router-link :to="`/ingredients/${ingredient.id}`" class="ingredient-card">
    <PlaceholderImage
      :src="ingredient.image"
      :alt="ingredient.name"
      aspect-ratio="1 / 1"
    />
    <div class="ingredient-card__info">
      <h3 class="ingredient-card__name">{{ ingredient.name }}</h3>
      <span class="ingredient-card__category">{{ ingredient.category }}</span>
    </div>
  </router-link>
</template>

<style scoped>
.ingredient-card {
  display: flex;
  flex-direction: column;
  background: var(--color-card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  overflow: hidden;
  transition: border-color 0.2s;
}

.ingredient-card:hover {
  border-color: var(--color-border-hover);
  text-decoration: none;
}

.ingredient-card__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
}

.ingredient-card__name {
  font-size: var(--font-size-body);
  color: var(--color-text-title);
}

.ingredient-card__category {
  font-size: var(--font-size-note);
  color: var(--color-text-muted);
}
</style>
```

- [ ] **Step 2: Write RecipeCard component**

Create `src/components/common/RecipeCard.vue`:

```vue
<script setup lang="ts">
import type { Recipe } from '@/types/recipe'
import { DIFFICULTY_LABELS } from '@/types/recipe'
import PlaceholderImage from './PlaceholderImage.vue'

defineProps<{
  recipe: Recipe
}>()
</script>

<template>
  <router-link :to="`/recipes/${recipe.id}`" class="recipe-card">
    <PlaceholderImage
      :src="recipe.coverImage"
      :alt="recipe.name"
      aspect-ratio="1 / 1"
    />
    <div class="recipe-card__info">
      <h3 class="recipe-card__name">{{ recipe.name }}</h3>
      <div class="recipe-card__meta">
        <span class="recipe-card__difficulty">{{ DIFFICULTY_LABELS[recipe.difficulty] }}</span>
        <span class="recipe-card__duration">{{ recipe.duration }}</span>
      </div>
    </div>
  </router-link>
</template>

<style scoped>
.recipe-card {
  display: flex;
  flex-direction: column;
  background: var(--color-card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  overflow: hidden;
  transition: border-color 0.2s;
}

.recipe-card:hover {
  border-color: var(--color-border-hover);
  text-decoration: none;
}

.recipe-card__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px;
}

.recipe-card__name {
  font-size: var(--font-size-body);
  color: var(--color-text-title);
}

.recipe-card__meta {
  display: flex;
  gap: var(--element-gap-sm);
  font-size: var(--font-size-note);
  color: var(--color-text-muted);
}
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/common/
git commit -m "feat: add IngredientCard and RecipeCard components"
```

---

### Task 7: SearchBar and FilterBar components

**Files:**
- Create: `src/components/ui/SearchBar.vue`
- Create: `src/components/ui/FilterBar.vue`

- [ ] **Step 1: Write SearchBar component**

Create `src/components/ui/SearchBar.vue`:

```vue
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
```

- [ ] **Step 2: Write FilterBar component**

Create `src/components/ui/FilterBar.vue`:

```vue
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
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add SearchBar and FilterBar components"
```

---

### Task 8: Layout components — AppNavbar and AppFooter

**Files:**
- Create: `src/components/layout/AppNavbar.vue`
- Create: `src/components/layout/AppFooter.vue`
- Modify: `src/router/index.ts`

- [ ] **Step 1: Write AppNavbar component**

Create `src/components/layout/AppNavbar.vue`:

```vue
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
```

- [ ] **Step 2: Write AppFooter component**

Create `src/components/layout/AppFooter.vue`:

```vue
<template>
  <footer class="footer">
    <p class="footer__name">知食</p>
    <p class="footer__copy">&copy; 2026 知食</p>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--color-border);
  padding: var(--component-gap) 0;
  text-align: center;
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding-left: var(--page-padding-x);
  padding-right: var(--page-padding-x);
}

.footer__name {
  font-size: var(--font-size-body);
  color: var(--color-text-body);
}

.footer__copy {
  font-size: var(--font-size-note);
  color: var(--color-text-muted);
  margin-top: 4px;
}
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add AppNavbar and AppFooter layout components"
```

---

### Task 9: Router and App.vue shell

**Files:**
- Modify: `src/router/index.ts`
- Modify: `src/App.vue`

- [ ] **Step 1: Configure routes**

Edit `src/router/index.ts`:

```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/ingredients',
      name: 'ingredients',
      component: () => import('@/views/IngredientListView.vue'),
    },
    {
      path: '/ingredients/:id',
      name: 'ingredient-detail',
      component: () => import('@/views/IngredientDetailView.vue'),
    },
    {
      path: '/recipes',
      name: 'recipes',
      component: () => import('@/views/RecipeListView.vue'),
    },
    {
      path: '/recipes/:id',
      name: 'recipe-detail',
      component: () => import('@/views/RecipeDetailView.vue'),
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue'),
    },
  ],
})

export default router
```

- [ ] **Step 2: Update App.vue shell**

Edit `src/App.vue`:

```vue
<script setup lang="ts">
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
</script>

<template>
  <AppNavbar />
  <main>
    <router-view />
  </main>
  <AppFooter />
</template>

<style scoped>
main {
  min-height: calc(100vh - var(--navbar-height) - 80px);
}
</style>
```

- [ ] **Step 3: Update the existing test**

Edit `src/__tests__/App.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'

describe('App', () => {
  it('renders navbar and footer', () => {
    const router = createRouter({
      history: createWebHistory(),
      routes: [{ path: '/', component: { template: '<div>home</div>' } }],
    })

    const wrapper = mount(App, {
      global: { plugins: [router] },
    })

    expect(wrapper.text()).toContain('知食')
  })
})
```

- [ ] **Step 4: Commit**

```bash
git add src/router/index.ts src/App.vue src/__tests__/App.spec.ts
git commit -m "feat: configure routes and update App.vue shell with navbar and footer"
```

---

### Task 10: HomeView page

**Files:**
- Create: `src/views/HomeView.vue`

- [ ] **Step 1: Write HomeView**

Create `src/views/HomeView.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { INGREDIENT_CATEGORIES } from '@/types/ingredient'
import { ingredients } from '@/data/ingredients'
import { recipes } from '@/data/recipes'
import IngredientCard from '@/components/common/IngredientCard.vue'
import RecipeCard from '@/components/common/RecipeCard.vue'

const starterIngredients = computed(() => ingredients.slice(0, 2))
const starterRecipes = computed(() => recipes.filter(r => r.difficulty === 'easy').slice(0, 2))
const popularRecipes = computed(() => recipes.slice(0, 4))
</script>

<template>
  <div class="page-container">
    <!-- Starter section -->
    <section class="home-section">
      <h2 class="section-title">新手入门</h2>
      <div class="card-grid">
        <IngredientCard v-for="item in starterIngredients" :key="item.id" :ingredient="item" />
        <RecipeCard v-for="item in starterRecipes" :key="item.id" :recipe="item" />
      </div>
    </section>

    <hr class="divider" />

    <!-- Category navigation -->
    <section class="home-section">
      <h2 class="section-title">食材分类</h2>
      <div class="category-grid">
        <router-link
          v-for="cat in INGREDIENT_CATEGORIES"
          :key="cat"
          :to="`/ingredients?category=${cat}`"
          class="category-item"
        >
          <span class="category-item__text">{{ cat }}</span>
        </router-link>
      </div>
    </section>

    <hr class="divider" />

    <!-- Popular recipes -->
    <section class="home-section">
      <h2 class="section-title">热门食谱</h2>
      <div class="scroll-row">
        <RecipeCard v-for="item in popularRecipes" :key="item.id" :recipe="item" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-section {
  margin-bottom: var(--component-gap);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--element-gap);
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--color-card-bg);
  border: var(--card-border);
  border-radius: var(--card-radius);
  transition: border-color 0.2s;
}

.category-item:hover {
  border-color: var(--color-primary);
  text-decoration: none;
}

.category-item__text {
  font-size: var(--font-size-body);
  color: var(--color-text-body);
}

.scroll-row {
  display: flex;
  gap: var(--card-gap);
  overflow-x: auto;
  padding-bottom: 8px;
}

.scroll-row > * {
  flex-shrink: 0;
  width: 260px;
}

@media (max-width: 768px) {
  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .scroll-row > * {
    width: calc(50% - var(--card-gap) / 2);
  }
}
</style>
```

- [ ] **Step 2: Verify the page renders**

Run: `npm run dev` and check that the home page loads at `http://localhost:5173`.

- [ ] **Step 3: Commit**

```bash
git add src/views/HomeView.vue
git commit -m "feat: add HomeView with starter section, category nav, and popular recipes"
```

---

### Task 11: IngredientListView page

**Files:**
- Create: `src/views/IngredientListView.vue`

- [ ] **Step 1: Write IngredientListView**

Create `src/views/IngredientListView.vue`:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { INGREDIENT_CATEGORIES } from '@/types/ingredient'
import { ingredients } from '@/data/ingredients'
import SearchBar from '@/components/ui/SearchBar.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import IngredientCard from '@/components/common/IngredientCard.vue'

const route = useRoute()
const searchQuery = ref((route.query.search as string) || '')
const selectedCategory = ref((route.query.category as string) || '')

const filtered = computed(() => {
  let result = ingredients

  if (selectedCategory.value) {
    result = result.filter(i => i.category === selectedCategory.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      i =>
        i.name.toLowerCase().includes(q) ||
        i.alias.some(a => a.toLowerCase().includes(q)),
    )
  }

  return result
})
</script>

<template>
  <div class="page-container">
    <h1 class="section-title">食材大全</h1>

    <div class="list-toolbar">
      <SearchBar v-model="searchQuery" placeholder="搜索食材..." />
      <FilterBar
        v-model="selectedCategory"
        :options="[...INGREDIENT_CATEGORIES]"
        label="分类"
      />
    </div>

    <div v-if="filtered.length > 0" class="card-grid">
      <IngredientCard v-for="item in filtered" :key="item.id" :ingredient="item" />
    </div>

    <div v-else class="empty-state">
      <div class="empty-state__icon"></div>
      <p class="empty-state__text">没有找到匹配的食材</p>
    </div>
  </div>
</template>

<style scoped>
.list-toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--element-gap);
  margin-bottom: var(--component-gap);
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/IngredientListView.vue
git commit -m "feat: add IngredientListView with search and category filter"
```

---

### Task 12: IngredientDetailView page

**Files:**
- Create: `src/views/IngredientDetailView.vue`

- [ ] **Step 1: Write IngredientDetailView**

Create `src/views/IngredientDetailView.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ingredients } from '@/data/ingredients'
import { recipes } from '@/data/recipes'
import PlaceholderImage from '@/components/common/PlaceholderImage.vue'
import RecipeCard from '@/components/common/RecipeCard.vue'

const route = useRoute()
const ingredient = computed(() => ingredients.find(i => i.id === route.params.id))

const relatedRecipes = computed(() => {
  if (!ingredient.value) return []
  return recipes.filter(r => ingredient.value!.relatedRecipeIds.includes(r.id))
})
</script>

<template>
  <div class="page-container">
    <div v-if="!ingredient" class="empty-state">
      <div class="empty-state__icon"></div>
      <p class="empty-state__text">食材未找到</p>
    </div>

    <template v-else>
      <router-link to="/ingredients" class="back-link">&larr; 返回食材列表</router-link>

      <div class="detail-layout">
        <div class="detail-layout__image">
          <PlaceholderImage :src="ingredient.image" :alt="ingredient.name" />
        </div>

        <div class="detail-layout__body">
          <h1 class="detail-title">{{ ingredient.name }}</h1>
          <span class="detail-category">{{ ingredient.category }}</span>

          <p v-if="ingredient.alias.length" class="detail-alias">
            别名：{{ ingredient.alias.join('、') }}
          </p>

          <section class="detail-section">
            <h2 class="detail-section__title">简介</h2>
            <p>{{ ingredient.description }}</p>
          </section>

          <section class="detail-section">
            <h2 class="detail-section__title">选购技巧</h2>
            <p>{{ ingredient.tips }}</p>
          </section>

          <section class="detail-section">
            <h2 class="detail-section__title">保存方法</h2>
            <p>{{ ingredient.storage }}</p>
          </section>

          <section v-if="ingredient.pairings.length" class="detail-section">
            <h2 class="detail-section__title">搭配食材</h2>
            <div class="pairing-tags">
              <span v-for="p in ingredient.pairings" :key="p" class="pairing-tag">{{ p }}</span>
            </div>
          </section>
        </div>
      </div>

      <div v-if="relatedRecipes.length > 0">
        <hr class="divider" />
        <section>
          <h2 class="section-title">相关食谱</h2>
          <div class="card-grid">
            <RecipeCard v-for="r in relatedRecipes" :key="r.id" :recipe="r" />
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-block;
  color: var(--color-text-muted);
  font-size: var(--font-size-note);
  margin-bottom: var(--component-gap);
}

.detail-layout {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: var(--section-gap);
  align-items: start;
}

.detail-layout__image {
  width: 400px;
}

.detail-title {
  font-size: var(--font-size-title);
  margin-bottom: var(--element-gap-sm);
}

.detail-category {
  display: inline-block;
  padding: 2px 12px;
  border: 1px solid var(--color-primary);
  border-radius: var(--btn-radius);
  color: var(--color-primary);
  font-size: var(--font-size-note);
  margin-bottom: var(--element-gap);
}

.detail-alias {
  color: var(--color-text-muted);
  font-size: var(--font-size-note);
  margin-bottom: var(--component-gap);
}

.detail-section {
  margin-bottom: var(--component-gap);
}

.detail-section__title {
  font-size: var(--font-size-body);
  color: var(--color-text-title);
  margin-bottom: var(--element-gap-sm);
  padding-left: 8px;
  border-left: 3px solid var(--color-primary);
}

.pairing-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--element-gap-sm);
}

.pairing-tag {
  padding: 4px 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--btn-radius);
  font-size: var(--font-size-note);
  color: var(--color-text-body);
}

@media (max-width: 768px) {
  .detail-layout {
    grid-template-columns: 1fr;
    gap: var(--component-gap);
  }

  .detail-layout__image {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/IngredientDetailView.vue
git commit -m "feat: add IngredientDetailView with left-right layout and related recipes"
```

---

### Task 13: RecipeListView page

**Files:**
- Create: `src/views/RecipeListView.vue`

- [ ] **Step 1: Write RecipeListView**

Create `src/views/RecipeListView.vue`:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { CUISINES } from '@/types/recipe'
import { recipes } from '@/data/recipes'
import SearchBar from '@/components/ui/SearchBar.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import RecipeCard from '@/components/common/RecipeCard.vue'

const route = useRoute()
const searchQuery = ref((route.query.search as string) || '')
const selectedDifficulty = ref((route.query.difficulty as string) || '')
const selectedCuisine = ref((route.query.cuisine as string) || '')

const difficultyOptions = ['简单', '中等', '困难']
const difficultyMap: Record<string, string> = { '简单': 'easy', '中等': 'medium', '困难': 'hard' }

const filtered = computed(() => {
  let result = recipes

  if (selectedDifficulty.value) {
    const diffKey = difficultyMap[selectedDifficulty.value]
    result = result.filter(r => r.difficulty === diffKey)
  }

  if (selectedCuisine.value) {
    result = result.filter(r => r.cuisine === selectedCuisine.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(r => r.name.toLowerCase().includes(q))
  }

  return result
})
</script>

<template>
  <div class="page-container">
    <h1 class="section-title">食谱大全</h1>

    <div class="list-toolbar">
      <SearchBar v-model="searchQuery" placeholder="搜索食谱..." />
      <div class="list-filters">
        <FilterBar v-model="selectedDifficulty" :options="difficultyOptions" label="难度" />
        <FilterBar v-model="selectedCuisine" :options="[...CUISINES]" label="菜系" />
      </div>
    </div>

    <div v-if="filtered.length > 0" class="card-grid">
      <RecipeCard v-for="item in filtered" :key="item.id" :recipe="item" />
    </div>

    <div v-else class="empty-state">
      <div class="empty-state__icon"></div>
      <p class="empty-state__text">没有找到匹配的食谱</p>
    </div>
  </div>
</template>

<style scoped>
.list-toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--element-gap);
  margin-bottom: var(--component-gap);
}

.list-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--component-gap);
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/RecipeListView.vue
git commit -m "feat: add RecipeListView with difficulty and cuisine filters"
```

---

### Task 14: RecipeDetailView page

**Files:**
- Create: `src/views/RecipeDetailView.vue`

- [ ] **Step 1: Write RecipeDetailView**

Create `src/views/RecipeDetailView.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DIFFICULTY_LABELS } from '@/types/recipe'
import { recipes } from '@/data/recipes'
import { useFavoritesStore } from '@/stores/favorites'
import PlaceholderImage from '@/components/common/PlaceholderImage.vue'

const route = useRoute()
const favoritesStore = useFavoritesStore()

const recipe = computed(() => recipes.find(r => r.id === route.params.id))
const isFavorite = computed(() => recipe.value ? favoritesStore.isRecipeFavorite(recipe.value.id) : false)

function toggleFavorite() {
  if (recipe.value) {
    favoritesStore.toggleRecipe(recipe.value.id)
  }
}
</script>

<template>
  <div class="page-container">
    <div v-if="!recipe" class="empty-state">
      <div class="empty-state__icon"></div>
      <p class="empty-state__text">食谱未找到</p>
    </div>

    <template v-else>
      <router-link to="/recipes" class="back-link">&larr; 返回食谱列表</router-link>

      <!-- Cover image -->
      <div class="cover-image">
        <PlaceholderImage :src="recipe.coverImage" :alt="recipe.name" aspect-ratio="16 / 9" />
      </div>

      <!-- Basic info -->
      <div class="recipe-header">
        <h1 class="detail-title">{{ recipe.name }}</h1>
        <div class="recipe-meta">
          <span class="recipe-meta__tag">{{ DIFFICULTY_LABELS[recipe.difficulty] }}</span>
          <span class="recipe-meta__tag">{{ recipe.duration }}</span>
          <span class="recipe-meta__tag">{{ recipe.cuisine }}</span>
        </div>
        <button class="fav-btn" :class="{ 'fav-btn--active': isFavorite }" @click="toggleFavorite">
          {{ isFavorite ? '★ 已收藏' : '☆ 收藏' }}
        </button>
      </div>

      <!-- Ingredients -->
      <section class="detail-section">
        <h2 class="section-title">食材清单</h2>
        <table class="ingredient-table">
          <thead>
            <tr>
              <th>食材</th>
              <th>用量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in recipe.ingredients" :key="item.name">
              <td>{{ item.name }}</td>
              <td>{{ item.amount }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Steps -->
      <section class="detail-section">
        <h2 class="section-title">烹饪步骤</h2>
        <div class="steps-list">
          <div v-for="step in recipe.steps" :key="step.order" class="step-item">
            <div class="step-item__image">
              <PlaceholderImage :src="step.image" alt="步骤配图" aspect-ratio="3 / 2" />
            </div>
            <div class="step-item__content">
              <span class="step-item__number">{{ step.order }}</span>
              <p class="step-item__text">{{ step.text }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Tips -->
      <section class="detail-section">
        <h2 class="section-title">新手贴士</h2>
        <div class="tips-box">
          <p>{{ recipe.tips }}</p>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-block;
  color: var(--color-text-muted);
  font-size: var(--font-size-note);
  margin-bottom: var(--component-gap);
}

.cover-image {
  max-width: 100%;
  margin-bottom: var(--component-gap);
  border-radius: var(--card-radius);
  overflow: hidden;
}

.recipe-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--element-gap);
  margin-bottom: var(--section-gap);
}

.detail-title {
  font-size: var(--font-size-title);
}

.recipe-meta {
  display: flex;
  gap: var(--element-gap-sm);
}

.recipe-meta__tag {
  padding: 2px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--btn-radius);
  font-size: var(--font-size-note);
  color: var(--color-text-body);
}

.fav-btn {
  margin-left: auto;
  height: var(--btn-height);
  padding: 0 20px;
  border: 1px solid var(--color-primary);
  border-radius: var(--btn-radius);
  background: transparent;
  color: var(--color-primary);
  font-size: var(--font-size-body);
  transition: all 0.2s;
}

.fav-btn--active {
  background: var(--color-primary);
  color: #fff;
}

.detail-section {
  margin-bottom: var(--section-gap);
}

.ingredient-table {
  width: 100%;
  border-collapse: collapse;
}

.ingredient-table th,
.ingredient-table td {
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.ingredient-table th {
  color: var(--color-text-muted);
  font-weight: 500;
  font-size: var(--font-size-note);
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: var(--component-gap);
}

.step-item {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: var(--component-gap);
}

.step-item__image {
  width: 300px;
}

.step-item__content {
  display: flex;
  gap: var(--element-gap);
}

.step-item__number {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 50%;
  font-size: var(--font-size-note);
}

.step-item__text {
  font-size: var(--font-size-body);
  line-height: var(--line-height-body);
}

.tips-box {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--card-radius);
  padding: var(--element-gap);
  color: var(--color-text-body);
}

@media (max-width: 768px) {
  .step-item {
    grid-template-columns: 1fr;
  }

  .step-item__image {
    width: 100%;
  }

  .fav-btn {
    margin-left: 0;
    width: 100%;
  }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/RecipeDetailView.vue
git commit -m "feat: add RecipeDetailView with cover, ingredients table, steps, and tips"
```

---

### Task 15: Favorites store

**Files:**
- Create: `src/stores/favorites.ts`

- [ ] **Step 1: Write favorites Pinia store**

Create `src/stores/favorites.ts`:

```typescript
import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'zhishi-favorites'

function loadFromStorage(): { ingredients: string[]; recipes: string[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { ingredients: [], recipes: [] }
}

export const useFavoritesStore = defineStore('favorites', () => {
  const saved = loadFromStorage()
  const favoriteIngredients = ref<string[]>(saved.ingredients)
  const favoriteRecipes = ref<string[]>(saved.recipes)

  function persist() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ingredients: favoriteIngredients.value,
        recipes: favoriteRecipes.value,
      }),
    )
  }

  function toggleIngredient(id: string) {
    const idx = favoriteIngredients.value.indexOf(id)
    if (idx === -1) {
      favoriteIngredients.value.push(id)
    } else {
      favoriteIngredients.value.splice(idx, 1)
    }
    persist()
  }

  function toggleRecipe(id: string) {
    const idx = favoriteRecipes.value.indexOf(id)
    if (idx === -1) {
      favoriteRecipes.value.push(id)
    } else {
      favoriteRecipes.value.splice(idx, 1)
    }
    persist()
  }

  function isIngredientFavorite(id: string): boolean {
    return favoriteIngredients.value.includes(id)
  }

  function isRecipeFavorite(id: string): boolean {
    return favoriteRecipes.value.includes(id)
  }

  return {
    favoriteIngredients,
    favoriteRecipes,
    toggleIngredient,
    toggleRecipe,
    isIngredientFavorite,
    isRecipeFavorite,
  }
})
```

- [ ] **Step 2: Remove old counter store**

```bash
rm src/stores/counter.ts
```

- [ ] **Step 3: Commit**

```bash
git add src/stores/
git commit -m "feat: add favorites store with localStorage persistence, remove counter store"
```

---

### Task 16: FavoritesView page

**Files:**
- Create: `src/views/FavoritesView.vue`

- [ ] **Step 1: Write FavoritesView**

Create `src/views/FavoritesView.vue`:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFavoritesStore } from '@/stores/favorites'
import { ingredients } from '@/data/ingredients'
import { recipes } from '@/data/recipes'
import IngredientCard from '@/components/common/IngredientCard.vue'
import RecipeCard from '@/components/common/RecipeCard.vue'

const favoritesStore = useFavoritesStore()
const activeTab = ref<'ingredients' | 'recipes'>('ingredients')

const favoriteIngredientItems = computed(() =>
  ingredients.filter(i => favoritesStore.isIngredientFavorite(i.id)),
)

const favoriteRecipeItems = computed(() =>
  recipes.filter(r => favoritesStore.isRecipeFavorite(r.id)),
)
</script>

<template>
  <div class="page-container">
    <h1 class="section-title">我的收藏</h1>

    <div class="tabs">
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'ingredients' }"
        @click="activeTab = 'ingredients'"
      >
        收藏的食材 ({{ favoriteIngredientItems.length }})
      </button>
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'recipes' }"
        @click="activeTab = 'recipes'"
      >
        收藏的食谱 ({{ favoriteRecipeItems.length }})
      </button>
    </div>

    <!-- Favorited Ingredients -->
    <div v-if="activeTab === 'ingredients'">
      <div v-if="favoriteIngredientItems.length > 0" class="card-grid">
        <IngredientCard v-for="item in favoriteIngredientItems" :key="item.id" :ingredient="item" />
      </div>
      <div v-else class="empty-state">
        <div class="empty-state__icon"></div>
        <p class="empty-state__text">暂无收藏的食材</p>
        <router-link to="/ingredients" class="empty-state__link">去食材列表看看</router-link>
      </div>
    </div>

    <!-- Favorited Recipes -->
    <div v-if="activeTab === 'recipes'">
      <div v-if="favoriteRecipeItems.length > 0" class="card-grid">
        <RecipeCard v-for="item in favoriteRecipeItems" :key="item.id" :recipe="item" />
      </div>
      <div v-else class="empty-state">
        <div class="empty-state__icon"></div>
        <p class="empty-state__text">暂无收藏的食谱</p>
        <router-link to="/recipes" class="empty-state__link">去食谱列表看看</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: var(--element-gap-sm);
  margin-bottom: var(--component-gap);
}

.tab-btn {
  height: var(--btn-height);
  padding: 0 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--btn-radius);
  background: var(--color-card-bg);
  color: var(--color-text-body);
  font-size: var(--font-size-body);
  transition: all 0.2s;
}

.tab-btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.empty-state__link {
  color: var(--color-primary);
  font-size: var(--font-size-body);
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/FavoritesView.vue
git commit -m "feat: add FavoritesView with tab switching and empty states"
```

---

### Task 17: Add favorite toggle to IngredientDetailView

**Files:**
- Modify: `src/views/IngredientDetailView.vue`

- [ ] **Step 1: Add favorite button to ingredient detail**

Edit `src/views/IngredientDetailView.vue` — add the store import and favorite toggle in the header area, after the category tag:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ingredients } from '@/data/ingredients'
import { recipes } from '@/data/recipes'
import { useFavoritesStore } from '@/stores/favorites'
import PlaceholderImage from '@/components/common/PlaceholderImage.vue'
import RecipeCard from '@/components/common/RecipeCard.vue'

const route = useRoute()
const favoritesStore = useFavoritesStore()

const ingredient = computed(() => ingredients.find(i => i.id === route.params.id))

const isFavorite = computed(() =>
  ingredient.value ? favoritesStore.isIngredientFavorite(ingredient.value.id) : false,
)

function toggleFavorite() {
  if (ingredient.value) {
    favoritesStore.toggleIngredient(ingredient.value.id)
  }
}

const relatedRecipes = computed(() => {
  if (!ingredient.value) return []
  return recipes.filter(r => ingredient.value!.relatedRecipeIds.includes(r.id))
})
</script>
```

Add the favorite button in the template, after `<span class="detail-category">{{ ingredient.category }}</span>`:

```html
<button class="fav-btn" :class="{ 'fav-btn--active': isFavorite }" @click="toggleFavorite">
  {{ isFavorite ? '★ 已收藏' : '☆ 收藏' }}
</button>
```

Add to scoped styles:

```css
.fav-btn {
  display: block;
  height: var(--btn-height);
  padding: 0 20px;
  border: 1px solid var(--color-primary);
  border-radius: var(--btn-radius);
  background: transparent;
  color: var(--color-primary);
  font-size: var(--font-size-body);
  transition: all 0.2s;
  margin-bottom: var(--element-gap);
}

.fav-btn--active {
  background: var(--color-primary);
  color: #fff;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/views/IngredientDetailView.vue
git commit -m "feat: add favorite toggle to IngredientDetailView"
```

---

### Task 18: Create placeholder SVG asset

**Files:**
- Create: `src/assets/images/placeholders/placeholder.svg`

- [ ] **Step 1: Write placeholder SVG**

Create `src/assets/images/placeholders/placeholder.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#E0D5C1"/>
  <g transform="translate(50,55)" fill="none" stroke="#9B8E7E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="0" y="0" width="100" height="80" rx="4"/>
    <circle cx="35" cy="30" r="10"/>
    <path d="M20 60 L20 90 L80 90 L80 60"/>
  </g>
  <text x="100" y="160" text-anchor="middle" fill="#9B8E7E" font-size="14" font-family="sans-serif">暂无图片</text>
</svg>
```

- [ ] **Step 2: Verify dev server works**

Run: `npm run dev` and check pages render without broken images.

- [ ] **Step 3: Final commit**

```bash
git add src/assets/images/placeholders/placeholder.svg
git commit -m "feat: add placeholder SVG image"
```

---

### Task 19: Final verification

- [ ] **Step 1: Type check**

Run: `npm run type-check`
Expected: PASS, no errors.

- [ ] **Step 2: Unit tests**

Run: `npm run test:unit`
Expected: PASS, App renders without error.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: PASS, no lint errors.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS, production build succeeds.
