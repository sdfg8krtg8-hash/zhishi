# 知食 — 视觉精细化 & 交互优化设计文档

> 日期：2026-05-30 | 参考：hx.txt 优化开发文档

## 一、设计原则

- 保持现有暖色系（`--color-primary: #8B6914`）不变
- 简约清新、素雅高级
- 全站样式统一，PC/移动端双端适配
- 不改动路由、数据层、业务逻辑

## 二、卡片组件统一升级

**IngredientCard & RecipeCard**

| 属性 | 当前 | 优化后 |
|------|------|--------|
| 圆角 | 8px | 12px |
| 阴影 | 无 | `0 1px 3px rgba(0,0,0,0.06)` |
| Hover 上浮 | 无 | `translateY(-4px)` |
| Hover 阴影 | 无变化 | `0 4px 12px rgba(0,0,0,0.08)` |
| Hover 边框 | `#E0D5C1` → `#C4B393` | 不变 |
| 过渡 | 0.2s border-color | `all 0.2s ease` |

**全局卡片网格**：`repeat(auto-fill, 260px)` + `justify-content: center`，移动端 `repeat(2, 1fr)`。

## 三、搜索框标准化

- 形状：药丸形，`border-radius: 20px`，高度 `40px`
- 左侧内嵌 18px 搜索 SVG 图标，颜色 `--color-text-muted`
- 占位文字："搜索食材或食谱..."
- 默认边框 `--color-border`，聚焦时 `--color-primary` + 外发光 `0 0 0 3px rgba(139,105,20,0.1)`
- 过渡 `0.2s`

## 四、分类按钮标准化

- 圆角 `4px`，高度 `36px`，padding `0 16px`
- 默认：白底 + `--color-border` 边框 + `--color-text-body` 文字
- 选中：`--color-primary-light` 浅底 + `--color-text-title` 深色文字
- Hover：文字变 `--color-primary`
- 适用于 FilterBar 和导航栏分类标签

## 五、板块标题图标

手写 SVG 线性图标（24×24px，描边 1.5px，`currentColor`），各板块标题前加图标：

| 板块 | 图标 |
|------|------|
| 新手入门 | 幼苗图标 |
| 食材分类 | 网格图标 |
| 热门食谱 | 菜谱图标 |
| 食材清单 | 列表图标 |
| 烹饪步骤 | 步骤图标 |
| 新手贴士 | 灯泡图标 |

## 六、首页 Banner 区

新增页面头部介绍区（导航栏下方）：

- 简约厨具装饰图标（居中）
- 标题"知食"，36px 加粗，`--color-text-title`
- 标语"从食材认知到烹饪入门"，16px，`--color-text-muted`
- 副标语"面向零基础小白的食材百科与家常食谱指南"，14px
- 上下留白各 `48px`
- 纯白背景，预留后期配图接口
- 移动端：标题 28px，标语 14px

## 七、页面过渡 & 分割线 & 空状态

**页面过渡**：`<router-view>` 淡入 `opacity 0→1`，250ms，全局应用。

**分割线**：`<hr>` 细线，`--color-border`，上下各 `48px`。

**空状态**：搜索无结果 / 筛选无匹配时显示"未找到相关内容，试试其他关键词"，搭配图标。

## 八、回到顶部按钮

- 圆形按钮，`width: 44px; height: 44px; border-radius: 50%`
- 白色背景 + `--color-border` 边框 + 轻微阴影 `0 1px 3px rgba(0,0,0,0.06)`
- 内部为向上箭头 SVG 图标（24×24px，描边 1.5px，`currentColor`，颜色 `--color-text-muted`）
- 固定定位 `position: fixed; bottom: 32px; right: 32px`，移动端 `bottom: 24px; right: 24px`
- 滚动超过一屏高度后才显示，顶部时隐藏（`v-show` + scroll 监听）
- Hover：阴影加深 + 图标颜色变为 `--color-primary`，过渡 `0.2s`
- 点击平滑滚动到页面顶部（`scroll-behavior: smooth`）
- 移动端尺寸不变

## 九、移动端适配

- Banner 字号缩小（36→28px）
- 搜索框满宽
- 分类按钮自动换行
- 详情页步骤图自适应（已实现）

## 十、不涉及

- 路由、数据层、业务逻辑不变
- 配色体系不变
- 收藏功能已实现，无需改动
- 食谱数据已完成扩展（105道），无需再添加
