# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Official homepage of THUSCC (清华大学学生超算团队, the Tsinghua University Student Cluster Competition team). Astro 7 static site, Chinese-language UI, deployed on Cloudflare Pages (production domain `sc.team`; previews at https://new.sc.team/ and https://scc-homepage.pages.dev/). Active branch is `new-website-astro`. `new-website` (plain HTML SPA) and `master` (MkDocs) are frozen legacy branches; do not port code from them.

## Toolchain and commands

The toolchain is pinned in `mise.toml` (node 24, pnpm 11.22.0). Node >= 22.12.0 is a hard requirement (Astro 7 + Vite 7); never downgrade. Keep the node major in `.nvmrc` in sync with `mise.toml` because Cloudflare Pages reads `.nvmrc`.

```bash
mise install               # once per machine
pnpm install
pnpm dev                   # http://localhost:4321
pnpm build                 # static output to dist/
pnpm exec astro preview    # serve dist/ locally
```

For the in-app browser, `.claude/launch.json` defines the `astro-dev` server (runs `pnpm dev` through mise on port 4321).

There is no lint, typecheck, or test setup, and `@astrojs/check` is not installed. Verify changes with `pnpm build` (must complete with no errors and emit one page per competition id plus the seven static routes) and by looking at the pages in a browser at desktop and phone widths.

Stale wrangler remnants: `pnpm preview`, `pnpm deploy`, and `pnpm generate-types` still call wrangler, but `wrangler.jsonc` and the Cloudflare adapter were removed when the site moved from a Worker to Cloudflare Pages (commit 06f012b). They fail with "Missing entry-point". `tsconfig.json` also includes a `worker-configuration.d.ts` that no longer exists. Cloudflare Pages builds the branch itself; do not re-add an adapter.

## Architecture

### Rendering model

Fully static (`output: 'static'`), no client framework. All interactivity is vanilla TypeScript: three scripts in `src/scripts/` (WebGL background, theme toggle, mobile nav) are loaded by the layout on every page, and the members page has an inline `define:vars` script for the profile modal. `Base.astro` also loads a site-wide analytics script (`rbt.dang.fan`); keep it when reworking the layout.

### Two content pipelines

1. **JSON data → Astro pages.** `src/data/*.json` is imported directly in page frontmatter and drives `competition.astro`, `competition/[id].astro`, `members.astro`, `publications.astro`, and the hero stats on `index.astro`. This is the source of truth for every fact about the team.
2. **Markdown content collection.** `src/content/pages/*.md` (schema in `src/content.config.ts`: optional `kicker`, `title`, `lead`) is rendered by `src/pages/[slug].astro` for collaboration, honors, and join. The markdown bodies are mostly raw HTML that uses the global CSS classes defined in `Base.astro` (`.cards`, `.card`, `.card-tag`, `.card-title`, `.card-desc`, `.cards-sm`, `.card-center`). The exclusion filter in `[slug].astro` for members/competition/publications is a leftover from when those were markdown; those files no longer exist.

### Data model and cross-references

- `competitions.json`: `competitions` (column names `ASC`, `ISC`, `SC`, `其他`), `grandSlamYears`, and `records[]` newest-first. Each record has one array per column; each entry has `type`, `label`, optional `id`, optional `note`. `type` (champion, runner-up, linpack, eprize, special, place, notHeld, absent) becomes the CSS class `badge-<type>`; `id` links to `/competition/<id>`.
- `competition-details.json`: object keyed by id (`sc18`, `asc25`, ...). Every key becomes a page. Fields: `name`, `date`, `location`, `awards[]`, `team` {coaches, players, support, training}, `problems[]`, `news[]` {title, url}, `photos[]`, `highlights`, `sortDate` (YYYY-MM, used for ordering when `date` is imprecise), `_notes` (rendered as a warning).
- `members.json`: `advisors` {current[] with name/title/url, former[] as plain names}, `active[]` and `alumni[]` grouped by `grade`. Member fields: `name`, `dept?`, `url?`.
- `members.astro` builds a reverse index (person name → competition participations) at build time from the `team` fields in `competition-details.json`, and generates pinyin URL slugs with `pinyin-pro` so profiles are deep-linkable as `/members#zhaijidong`. Names must match character-for-character between `members.json` and the team lists, otherwise the profile shows "暂无参赛记录". Unifying name spellings has been a recurring data fix.
- Champion count, years of history, and grand slam count are computed from `competitions.json` in both `index.astro` and `competition.astro` (duplicated logic); the "100+" member count is hardcoded.
- Photos live in `public/img/competition/<id>/NN.jpg` and are listed explicitly in the details JSON, not globbed.

### Styling and theming

- All shared styles are in `<style is:global>` in `src/layouts/Base.astro`: design tokens as CSS custom properties, theme palettes, hero/section/card/stat/table primitives, and the responsive breakpoints (1023px, 767px, 480px, plus 1440px and 1920px upscaling). Page-specific styles are scoped `<style>` blocks in each page.
- Theme is `data-theme="dark|light"` on `<html>`, set by `theme.ts`. The toggle cycles Dark → Light → Auto and persists in `localStorage['thuscc-theme']`. `dark` is hardcoded in the HTML, so light-mode users get a flash until the script runs.
- The members modal is JS-generated DOM, so its styles must stay `is:global`.
- Fonts come from Google Fonts: Playfair Display (English numerals), Noto Serif SC (headings), Noto Sans SC (body), IBM Plex Mono (kickers and labels).
- Footer build time and commit hash come from `vite.define` in `astro.config.mjs`.

### Common edits

- New competition result: add an entry with an `id` to `competitions.json`, add the matching key to `competition-details.json`, and drop photos in `public/img/competition/<id>/`.
- New member: add to `members.json` using the exact name spelling used in competition team lists.
- New static page: create `src/content/pages/<slug>.md` with frontmatter, add it to `links` in `src/components/Nav.astro`, and optionally add a card in `index.astro`.

## Redesign direction

The current UI was AI-generated and the owner considers it generic: animated WebGL shader backgrounds, glassmorphism cards, a glowing gradient logo, a floating hero animation, uppercase mono kickers on every block, and oversized stat counters. The goal is a restrained, modern UI/UX. When working on the redesign:

- Treat it as a presentation-layer change. Keep `src/data`, `content.config.ts`, the members reverse index, and the pinyin slugs intact.
- Keep URLs stable: `/`, `/competition`, `/competition/<id>`, `/members` with `#<pinyin>` deep links, `/publications`, `/collaboration`, `/honors`, `/join`.
- Chinese stays the primary language. Keep a light/dark theme, but fix the dark-default flash (inline the theme resolution in `<head>` or follow the system theme).
- Prefer removing decoration over adding it. Fewer type families, consistent spacing tokens instead of `vh`-based margins, and no ambient animation unless it carries meaning.
- Phone width is a first-class target; several past PRs were responsive fixes.
