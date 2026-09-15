# THUSCC Homepage

清华大学学生超算团队官网。基于 [Astro](https://astro.build/) 7 静态站点生成，部署于 Cloudflare Pages。

预览地址：<https://new.sc.team/> 或 <https://scc-homepage.pages.dev/>

## 环境要求

- **Node.js 24**（最低 22.12.0，不可降级：Astro 7 + Vite 7 依赖 Node 22+ 特性）
- **pnpm 11**

推荐用 [mise](https://mise.jdx.dev/) 管理工具链，仓库内的 `mise.toml` 已锁定版本：

```bash
mise install
pnpm install
```

## 常用命令

```bash
pnpm dev                  # 开发服务器，默认 http://localhost:4321
pnpm build                # 构建到 dist/
pnpm exec astro preview   # 本地预览 dist/
```

构建产物为纯静态 HTML，Cloudflare Pages 直接构建本分支并发布 `dist/`。

## 项目结构

```
src/
├── styles/global.css        ← 设计系统：颜色/字体/间距 token、基础样式、通用组件、Markdown 排版
├── layouts/Base.astro       ← 全局 HTML 骨架（head、主题脚本、页头页脚）
├── components/
│   ├── SiteHeader.astro     ← 页头与导航（导航项在此维护）
│   ├── SiteFooter.astro     ← 页脚（含构建时间与 commit）
│   ├── ThemeToggle.astro    ← 浅色/深色切换
│   ├── Logo.astro           ← 队徽（单色矢量）
│   ├── PageIntro.astro      ← 页面标题区（eyebrow / title / lead）
│   ├── ResultBadge.astro    ← 成绩徽章
│   └── PersonItem.astro     ← 成员条目
├── lib/
│   ├── competitions.ts      ← 竞赛数据类型、统计（冠军数、年数、最新战绩）
│   └── members.ts           ← 成员数据、拼音 slug、参赛记录反向索引
├── data/                    ← 📝 结构化数据（事实来源）
│   ├── competitions.json    ← 历年成绩总表
│   ├── competition-details.json ← 每届比赛详情（队员、赛题、报道、照片）
│   ├── members.json         ← 成员名单
│   └── publications.json    ← 论文列表
├── content/pages/           ← 📝 Markdown 页面：collaboration / honors / join
├── assets/competition/<id>/ ← 比赛照片（构建时自动生成多尺寸 WebP）
├── pages/                   ← 路由
└── scripts/                 ← 少量原生 TS：主题、导航、成员弹窗
public/
├── fonts/                   ← 自托管 IBM Plex Mono（仅拉丁字符子集）
└── img/                     ← 队徽、favicon
```

## 如何修改内容

### 添加一届比赛成绩

1. 在 `src/data/competitions.json` 对应年份的列（`ASC` / `ISC` / `SC` / `其他`）中添加一条记录，带上 `id`（如 `sc26`）。`type` 决定徽章颜色：`champion`、`runner-up`、`linpack`、`eprize`、`special`、`place`、`notHeld`、`absent`。
2. 在 `src/data/competition-details.json` 中添加同名 `id` 的详情。每个 key 会生成 `/competition/<id>` 页面。
3. 照片放到 `src/assets/competition/<id>/01.jpg`，并在详情的 `photos` 中按 `/img/competition/<id>/01.jpg` 的形式列出。

### 添加成员

编辑 `src/data/members.json`。姓名必须与 `competition-details.json` 中 `team` 里的写法完全一致，否则参赛记录无法关联。成员页会为每个人生成拼音锚点，如 `/members#zhaijidong`。

### 编辑 Markdown 页面

编辑 `src/content/pages/` 下的 `.md` 文件。frontmatter：

```yaml
---
kicker: Join us      # 标题上方的小标签
title: 加入我们       # 主标题
lead: 一句话导语
---
```

正文支持 Markdown 与内嵌 HTML。可用的样式类：`.cards` / `.cards-sm`（卡片网格）、`.card`、`.card-tag`、`.card-title`、`.card-desc`、`.card-center`、`.placeholder`（占位提示）。

### 添加新页面

1. 新建 `src/content/pages/<slug>.md`
2. 在 `src/components/SiteHeader.astro` 的 `navLinks` 中添加导航项
3. 如需出现在首页“了解我们”列表，编辑 `src/pages/index.astro` 的 `sections`

## 设计说明

- **配色**：清华紫为唯一强调色，中性色带轻微紫调；浅色 / 深色主题跟随系统，可手动切换并记忆。
- **字体**：中文使用系统字体（苹方 / 微软雅黑 / 思源黑体），不加载中文 Web 字体；年份、成绩、编号等使用自托管的 IBM Plex Mono。
- **布局**：单栏内容区最大 1080px，手机端优先。

## 分支说明

| 分支 | 状态 | 说明 |
|------|------|------|
| `new-website-refactor` | **活跃开发** | 2026 年重构后的 UI |
| `new-website-astro` | 上一版 | Astro 版本，重构前的主线 |
| `new-website` | 冻结 | 纯 HTML/CSS/JS SPA 版本 |
| `master` | 旧版 | MkDocs 版本，已废弃 |
