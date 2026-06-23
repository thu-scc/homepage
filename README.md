# THUSCC Homepage

清华大学学生超算团队官网。基于 [Astro](https://astro.build/) 7 静态站点生成。

## 环境要求

- **Node.js >= 22.12.0**（必须，不接受降级。项目使用 Astro 7 + Vite 7，依赖 Node 22+ 特性）
- **pnpm**（包管理器）

```bash
node --version   # 确认 >= 22.12.0
pnpm --version   # 确认已安装
```

## 快速开始

```bash
pnpm install
pnpm dev          # 启动开发服务器（默认 localhost:4321）
pnpm build        # 构建到 dist/
pnpm preview      # 预览构建产物
```

## 项目结构

```
├── src/
│   ├── layouts/
│   │   └── Base.astro          ← 全局布局（head、CSS 变量、nav/footer slot）
│   ├── components/
│   │   ├── Nav.astro           ← 导航栏
│   │   ├── Footer.astro        ← 页脚
│   │   └── DiabloLogo.astro    ← Diablo logo（nav 小版 + hero 大版）
│   ├── pages/
│   │   ├── index.astro         ← 首页
│   │   └── [slug].astro        ← 内容页动态路由
│   ├── content/
│   │   └── pages/              ← 📝 页面内容（Markdown）
│   │       ├── collaboration.md
│   │       ├── competition.md
│   │       ├── publications.md
│   │       ├── members.md
│   │       ├── honors.md
│   │       └── join.md
│   ├── content.config.ts       ← Content Collection schema + loader
│   └── scripts/
│       ├── theme.ts            ← Dark/Light/Auto 主题切换
│       ├── webgl.ts            ← WebGL 双背景 shader
│       └── nav-toggle.ts       ← 移动端导航展开
├── public/
│   ├── CNAME                   ← GitHub Pages 自定义域名
│   └── img/                    ← 静态图片资源
├── .nvmrc                      ← Node 版本锁定（24）
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## 如何修改内容

### 编辑已有页面

编辑 `src/content/pages/` 下对应的 `.md` 文件。支持完整 Markdown + 内嵌 HTML。

每个文件开头的 frontmatter：

```yaml
---
kicker: Competition Record    # 页面顶部英文小标签
title: 竞赛情况              # 主标题
lead: 全球唯一...            # 导语
---
```

### 可用的 CSS 组件

在 Markdown 中直接内嵌 HTML 使用：

| 类名 | 用途 |
|------|------|
| `.cards` | 卡片网格容器 |
| `.cards-sm` | 小卡片网格 |
| `.card` | 单个卡片 |
| `.card-tag` | 卡片标签 |
| `.card-title` | 卡片标题 |
| `.card-desc` | 卡片描述 |
| `.stats-row` | 统计数字行 |
| `.stat-item` + `.n` + `.l` | 统计项 |
| `.members-grid` | 成员列表 |
| `.grade-title` | 年级标题 |
| `.gold` | 冠军金色徽章 |
| `.table-wrap` + `table.dt` | 数据表格 |

### 添加新页面

1. 在 `src/content/pages/` 下新建 `xxx.md`（写好 frontmatter）
2. 在 `src/components/Nav.astro` 的 `links` 数组中添加导航项
3. 如需在首页卡片中显示，编辑 `src/pages/index.astro`

### 修改首页

直接编辑 `src/pages/index.astro`。

## 部署

构建产物为纯静态 HTML，部署到 GitHub Pages / Vercel / Cloudflare Pages 均可。

```bash
pnpm build
# dist/ 即为部署目录
```

GitHub Pages：配置 GitHub Actions 运行 `pnpm build`，部署 `dist/` 目录。

## 技术栈

- **框架**: [Astro](https://astro.build/) 7 — 静态站点生成，Content Layer API
- **语言**: TypeScript
- **包管理**: pnpm
- **运行时**: Node.js 24 LTS（最低要求 22.12.0，不可降级）
- **WebGL 背景**: 双 shader 实时渲染（暗色全息 + 浅色银色涡流）
- **主题**: Dark / Light / Auto，localStorage 持久化
- **字体**: Playfair Display + Noto Serif SC + Noto Sans SC + IBM Plex Mono
- **配色**: 靛蓝瓷（Indigo Porcelain）+ 紫色强调色

## 分支说明

| 分支 | 状态 | 说明 |
|------|------|------|
| `new-website-astro` | **活跃开发** | Astro 版本，当前主线 |
| `new-website` | 冻结 | 纯 HTML/CSS/JS SPA 版本，不再维护 |
| `master` | 旧版 | MkDocs 版本，已废弃 |
