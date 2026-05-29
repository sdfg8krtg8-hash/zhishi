# 知食 — 设计规格说明

> 面向烹饪零基础用户的食材查询与食谱学习网站，Vue3 + TypeScript + Vite 构建。

## 一、技术栈

- Vue 3 + TypeScript + Vite
- Vue Router 5 + Pinia 3
- CSS 变量驱动视觉体系，无第三方 UI 框架

## 二、构建策略

**按层构建：** types → data → styles → layout 组件 → common/ui 组件 → views（首页 → 食材列表 → 食材详情 → 食谱列表 → 食谱详情 → 收藏页）→ 路由和状态串联

每一层完成后才进入下一层，确保共享基础设施在页面开发前稳定。

## 三、目录结构

```
src/
├── types/
│   ├── ingredient.ts
│   └── recipe.ts
├── data/
│   ├── ingredients.ts
│   └── recipes.ts
├── assets/styles/
│   ├── variables.css
│   ├── reset.css
│   └── global.css
├── components/
│   ├── layout/
│   │   ├── AppNavbar.vue
│   │   └── AppFooter.vue
│   ├── common/
│   │   ├── IngredientCard.vue
│   │   ├── RecipeCard.vue
│   │   └── PlaceholderImage.vue
│   └── ui/
│       ├── SearchBar.vue
│       └── FilterBar.vue
├── views/
│   ├── HomeView.vue
│   ├── IngredientListView.vue
│   ├── IngredientDetailView.vue
│   ├── RecipeListView.vue
│   ├── RecipeDetailView.vue
│   └── FavoritesView.vue
├── stores/
│   └── favorites.ts
├── router/index.ts
├── App.vue
└── main.ts
```

## 四、数据模型

### 4.1 食材 Ingredient

```typescript
interface Ingredient {
  id: string
  name: string
  alias: string[]
  category: IngredientCategory
  description: string
  tips: string           // 选购技巧
  storage: string        // 保存方法
  pairings: string[]     // 搭配食材名称
  relatedRecipeIds: string[]
  image: string          // 默认 PLACEHOLDER
}
```

食材分类枚举：蔬菜 / 水果 / 肉类 / 禽蛋 / 水产 / 豆制品 / 菌菇 / 调味品 / 主食

### 4.2 食谱 Recipe

```typescript
interface Recipe {
  id: string
  name: string
  difficulty: 'easy' | 'medium' | 'hard'
  duration: string
  cuisine: string
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  tips: string
  coverImage: string     // 默认 PLACEHOLDER
}

interface RecipeIngredient { name: string; amount: string }

interface RecipeStep { order: number; text: string; image: string }
```

### 4.3 图片规范

- 所有图片字段预置统一占位图常量
- 占位图组件 `<PlaceholderImage>` 接收宽高比参数，素雅灰底+浅色图标
- 图片目录预留：`@/assets/images/ingredients/`、`@/assets/images/recipes/`、`@/assets/images/icons/`、`@/assets/images/placeholders/`
- 图片加载失败时自动回退为占位图

## 五、视觉规范

### 5.1 色彩

| 用途 | 色值 |
|------|------|
| 主色（标题/按钮/选中态） | #8B6914（棕褐色） |
| 页面背景 | #FBF7F0（米杏色） |
| 卡片背景 | #FFFFFF |
| 边框/分割线 | #E0D5C1（浅棕灰） |
| 主标题文字 | #3D3226（深灰） |
| 正文文字 | #6B5E4E（中灰） |
| 备注/贴士 | #9B8E7E（浅灰） |

### 5.2 字体

- 优先：思源黑体 / Inter / 系统默认无衬线
- 层级：页面大标题 28px → 模块标题 22px → 正文 16px → 备注 14px
- 行间距：正文 1.75，标题 1.4

### 5.3 布局

- 页面最大宽度 1200px，居中，左右内边距 24px（移动端 16px）
- 组件间距统一 24px，卡片间距 20px
- 卡片：纯白底、1px #E0D5C1 边框、8px 圆角、无阴影、悬浮仅边框加深为 #C4B393

### 5.4 响应式

- PC：≥768px，4 列网格，左图右文布局
- 移动端：<768px，2 列网格，上下堆叠布局，导航折叠为汉堡菜单

## 六、公共组件

### 6.1 AppNavbar

顶部固定，高度 64px。左侧 Logo 占位 + 导航链接（首页/食材/食谱），右侧搜索入口 + 收藏入口。导航栏底色米杏色，底部 1px 分割线。移动端导航折叠为汉堡菜单。

### 6.2 AppFooter

居中排布，两行：项目名"知食" + "© 2026 知食"。文字色浅灰，间距均匀，顶部 1px 分割线。

### 6.3 IngredientCard / RecipeCard

统一尺寸 260×340px（卡片容器），图片区 260×200px，文字区 80px 居中。移动端宽度自适应为 calc(50% - 10px)。悬浮仅边框颜色加深，无缩放动效。

### 6.4 SearchBar

输入框 + 搜索按钮水平排列。输入框圆角 6px，主色边框，宽度自适应（最大 400px）。按钮主色填充白字。

### 6.5 FilterBar

横向按钮组，每个按钮代表一个筛选条件。默认态浅灰边框+中灰字，选中态主色填充+白色字。按钮高度 36px，圆角 4px，间距 8px。移动端允许换行。

### 6.6 PlaceholderImage

接收 `aspectRatio`（默认 '1/1'）和 `alt` 属性。渲染灰底容器 + 居中山形图标。支持 `@load` 和 `@error` 事件。

## 七、页面设计

### 7.1 首页 HomeView

三段式自上而下：
1. 新手快捷专区：4 张卡片（常见食材×2 + 新手食谱×2），居中排列
2. 食材分类导航：图标+文字网格（3-4列），点击跳转食材列表页并传递分类参数
3. 热门食谱推荐：横向可滚动卡片列表，间距均等

区块间用细分割线隔开，整体留白充足。

### 7.2 食材列表页 IngredientListView

顶部 FilterBar（所有分类选项），下方食材卡片 CSS Grid（PC 4 列 / 移动端 2 列），卡片间距均等。支持关键词搜索。URL 查询参数支持 `?category=蔬菜` 预设筛选。

### 7.3 食材详情页 IngredientDetailView

PC 左图右文（图片 400×400，文字区自适应）；移动端上下堆叠。右侧：名称 → 分类标签 → 描述 → 选购技巧 → 保存方法 → 搭配食材列表。底部关联食谱卡片横排（最多 4 张），点击跳转。面包屑导航返回食材列表。

### 7.4 食谱列表页 RecipeListView

顶部 FilterBar（难度 + 菜系筛选），下方食谱卡片 CSS Grid（PC 4 列 / 移动端 2 列）。支持关键词搜索。URL 查询参数支持 `?difficulty=easy&cuisine=川菜`。

### 7.5 食谱详情页 RecipeDetailView

流式自上而下：封面大图（16:9，最大高度 480px）→ 基本信息栏（难度/时长/菜系标签）→ 食材清单（表格样式）→ 烹饪步骤（图文交替，每步图片 300×200，步骤间等距）→ 新手贴士 → 底部收藏按钮（主色填充）。面包屑导航返回食谱列表。

### 7.6 收藏页 FavoritesView

顶部切换标签（收藏的食材 / 收藏的食谱），下方复用标准卡片网格。空状态：居中占位图 + "暂无收藏"文字，引导返回首页浏览。

## 八、路由设计

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | HomeView | 首页 |
| `/ingredients` | IngredientListView | 食材列表（支持 ?category= & ?search=） |
| `/ingredients/:id` | IngredientDetailView | 食材详情 |
| `/recipes` | RecipeListView | 食谱列表（支持 ?difficulty= & ?cuisine= & ?search=） |
| `/recipes/:id` | RecipeDetailView | 食谱详情 |
| `/favorites` | FavoritesView | 我的收藏 |

## 九、状态管理

`stores/favorites.ts` — Pinia store：
- `favoriteIngredients: string[]`（存储食材 ID）
- `favoriteRecipes: string[]`（存储食谱 ID）
- `toggleIngredient(id)` / `toggleRecipe(id)`
- `isIngredientFavorite(id)` / `isRecipeFavorite(id)`
- 状态持久化到 localStorage

## 十、不做的内容

- 不接入后端 API —— 使用本地模拟数据
- 不做用户登录注册
- 不做搜索联想/自动补全
- 不做分页 —— 数据量小，单页展示即可
- 不做评论/评分系统
