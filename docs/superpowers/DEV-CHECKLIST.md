# 知食 开发清单

> 面向烹饪零基础用户的食材查询与食谱学习网站 | Vue3 + TypeScript + Vite
> 仓库：https://github.com/sdfg8krtg8-hash/zhishi
> 访问：https://sdfg8krtg8-hash.github.io/zhishi/

## 快速回忆

```
src/
├── types/          ingredient.ts (9分类枚举) | recipe.ts (难度/菜系)
├── data/           ingredients.ts (265条) | recipes.ts (6条)
├── assets/styles/  variables.css | reset.css | global.css
├── components/
│   ├── layout/     AppNavbar.vue | AppFooter.vue
│   ├── common/     IngredientCard.vue | RecipeCard.vue | PlaceholderImage.vue
│   └── ui/         SearchBar.vue | FilterBar.vue
├── views/          6页面：Home/IngredientList/IngredientDetail/RecipeList/RecipeDetail/Favorites
├── stores/         favorites.ts (Pinia + localStorage)
├── router/         index.ts (createWebHashHistory, 6 routes)
├── App.vue         (Navbar + router-view + Footer)
└── main.ts
public/images/      ingredients/ | recipes/ | placeholders/
```

**关键配置：** `vite.config.ts` base='/zhishi/' | `router` 用 hash 模式 | 图片路径以 `/images/` 开头，PlaceholderImage 自动拼接 BASE_URL

**提交时用：** `git push` （有 GitHub Actions 自动部署到 gh-pages 分支）

---

## 一、图片补充

### 1.1 食材图片（263张待补齐）
图片目录：`public/images/ingredients/`（路径在 data 文件中对应 `/images/ingredients/xxx.png`）
文件名需和食材名完全一致（中文），例如：`白菜.png`、`胡萝卜.png`

已放图片（2张）：土豆、番茄
蛋炒饭.png 也在这个目录，但它实际是食谱封面（见下方说明）

### 1.2 食谱封面（3张待补齐）
目录：`public/images/recipes/`

| 食谱 | 文件名 | 状态 |
|------|--------|------|
| 土豆烧牛肉 | 土豆烧牛肉.png | ✅ |
| 番茄炒蛋 | 西红柿炒鸡蛋.png | ✅ |
| 酸辣土豆丝 | 酸辣土豆丝.png | ✅ |
| 蛋炒饭 | 蛋炒饭.png（目前在 ingredients/） | ⚠️ 需移到 recipes/ |
| 家常豆腐 | 家常豆腐.png | ❌ |
| 清炒青菜 | 清炒青菜.png | ❌ |

### 1.3 食谱步骤图（22张全部缺失）
每个食谱的每个步骤都有一张配图，数据结构是 `steps[].image`。
字段已预留，目前全是 PLACEHOLDER。图片放 `public/images/recipes/`，可命名如 `步骤-土豆烧牛肉-1.png` 等。

### 1.4 分类图标（缺失）
`public/images/icons/` — 9个分类可用图标，首页分类导航区目前只显示文字。

---

## 二、数据完善

### 2.1 食材搭配数据（pairings）
前8个食材（土豆、番茄、鸡蛋、猪肉、豆腐、大米、青菜、虾）有 `pairings` 数组，其余 257 个都是空数组 `[]`。需要按食材属性填写搭配建议。

### 2.2 步骤图路径
所有食谱步骤的 `image` 字段值为 `PLACEHOLDER`，放好图片后需更新。

### 2.3 蛋炒饭封面路径修正
`recipes.ts` 中 rec-4（蛋炒饭）的 coverImage 指向 `/images/ingredients/蛋炒饭.png`，应移到 recipes 目录并改为 `/images/recipes/蛋炒饭.png`。

### 2.4 关联食谱
食材的 `relatedRecipeIds` 目前只有前几个有值，后续可根据新增的食谱逐步关联。

---

## 三、样式/交互待完善

### 3.1 卡片固定尺寸
设计规格要求卡片 260×340px（图片区 260×200px），当前实现用 CSS aspect-ratio + content padding，未固定尺寸。需在 IngredientCard / RecipeCard 中添加固定宽高。

### 3.2 食谱详情封面图
规格要求 max-height: 480px，当前 CSS 缺少此限制。

### 3.3 首页分类导航图标
当前只显示文字，规格要求图标+文字网格。

### 3.4 响应式细节
- PC 端 4 列 → 移动端 2 列（已实现基础断点）
- 导航栏汉堡菜单（已实现）
- 需实测各页面移动端效果

### 3.5 面包屑导航
食材详情页和食谱详情页应有面包屑（规格中提到），当前未实现。

---

## 四、测试

- `src/__tests__/App.spec.ts` — 仅一个骨架测试
- 补充：组件测试、store 测试、路由测试

---

## 五、完成优先级建议

| 优先级 | 任务 | 影响 |
|--------|------|------|
| 🔴 高 | 补充食材图片 | 用户浏览核心体验 |
| 🔴 高 | 补充食谱封面 | 食谱列表/详情第一印象 |
| 🟡 中 | 分类图标 | 首页导航美观 |
| 🟡 中 | 卡片固定尺寸 | 视觉统一 |
| 🟡 中 | 食谱封面 max-height | 详情页布局 |
| 🟡 中 | 面包屑导航 | 用户导航体验 |
| 🟢 低 | 食材搭配数据 | 详情页信息完整度 |
| 🟢 低 | 步骤图 | 非关键视觉 |
| 🟢 低 | 测试 | 代码质量 |

---

## 图片连线流程

放好图片后告诉我，我按文件名匹配更新数据文件中的路径：
1. 你的图片文件名 → 我匹配数据中的食材/食谱名 → 更新 `image`/`coverImage` 字段
2. 提交推送 → GitHub Actions 自动部署
