# THUSCC Homepage

清华大学学生超算团队官网。零构建纯静态站，支持 Markdown 编辑内容。

## 项目结构

```
├── index.html          ← 页面骨架（导航栏、首页模板、footer）
├── css/
│   └── style.css       ← 全部样式（主题色、布局、组件）
├── js/
│   ├── app.js          ← 路由 + 主题切换 + Markdown 渲染
│   └── webgl.js        ← WebGL 双背景（暗色全息 + 浅色涡流）
└── pages/              ← 📝 页面内容（Markdown 格式）
    ├── collaboration.md
    ├── competition.md
    ├── publications.md
    ├── members.md
    ├── honors.md
    └── join.md
```

## 如何修改内容

### 编辑已有页面

直接编辑 `pages/` 目录下对应的 `.md` 文件。**支持完整的 Markdown 语法**：

```markdown
---
kicker: Section Label (英文小标签)
title: 页面标题
lead: 页面导语（一两句话的简要描述）
---

正文用标准 Markdown 编写：

## 二级标题

普通段落文字，支持 **加粗**、*斜体*、`行内代码`、[链接](url)。

- 列表项 1
- 列表项 2

| 表头1 | 表头2 |
|-------|-------|
| 内容  | 内容  |
```

### Front Matter（页头元数据）

每个 `.md` 文件开头用 `---` 包裹的 YAML 块：

| 字段 | 作用 | 示例 |
|------|------|------|
| `kicker` | 页面顶部的英文小标签 | `Competition Record` |
| `title` | 页面主标题 | `竞赛情况` |
| `lead` | 标题下方的导语 | `全球唯一...` |

### 混合 HTML

Markdown 中可以直接嵌入 HTML，用于实现卡片网格等复杂布局：

```markdown
<div class="cards">
<div class="card">
<h3 class="card-title">项目名称</h3>
<p class="card-desc">项目描述</p>
</div>
</div>
```

### 可用的 CSS 组件

| 类名 | 用途 |
|------|------|
| `.cards` | 卡片网格容器 |
| `.cards-sm` | 小卡片网格（加在 `.cards` 上）|
| `.card` | 单个卡片 |
| `.card-tag` | 卡片标签（等宽小字）|
| `.card-title` | 卡片标题 |
| `.card-desc` | 卡片描述 |
| `.card-center` | 居中卡片（加在 `.card` 上）|
| `.stats-row` | 统计数字行 |
| `.stat-item` | 单个统计项（内含 `.n` 和 `.l`）|
| `.members-grid` | 成员网格列表 |
| `.grade-title` | 年级标题 |
| `.gold` | 冠军金色徽章 |
| `.placeholder` | 占位框（待填充内容）|
| `.divider` | 分割线 |

### 添加新页面

1. 在 `pages/` 下新建 `xxx.md` 文件
2. 在 `index.html` 的 `<ul class="nav-links">` 中添加导航项：
   ```html
   <li><a href="#xxx" data-page="xxx">页面名</a></li>
   ```
3. 如需在首页卡片中显示，编辑 `<template id="tpl-home">` 中的卡片列表

### 修改首页

首页内容直接在 `index.html` 的 `<template id="tpl-home">` 标签内编辑。

## 本地预览

```bash
# 任何静态服务器都行
python3 -m http.server 8000
# 或
npx serve .
```

打开 `http://localhost:8000` 即可预览。

## 部署

纯静态文件，直接部署到 GitHub Pages / Vercel / Cloudflare Pages / 任何 CDN。

GitHub Pages 配置：Settings → Pages → Source 选 `new-website` 分支，目录选 `/`（root）。

## 技术栈

- **零依赖零构建**：不需要 Node.js / npm / 任何构建工具
- **Markdown 渲染**：[marked.js](https://github.com/markedjs/marked)（CDN 加载，7KB gzip）
- **WebGL 背景**：双 shader 实时渲染（暗色全息色散 + 浅色银色涡流）
- **SPA 路由**：hash-based，页面切换无刷新
- **主题切换**：Dark / Light / Auto，localStorage 持久化
- **字体**：Playfair Display + Noto Serif SC + Noto Sans SC + IBM Plex Mono
- **配色**：靛蓝瓷（Indigo Porcelain）+ 清华紫强调色
