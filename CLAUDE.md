# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Official homepage of THUSCC (清华大学学生超算团队, the Tsinghua University Student Cluster Competition team). Astro 7 static site, Chinese-language UI, deployed on Cloudflare Pages (production domain `sc.team`; previews at https://new.sc.team/ and https://scc-homepage.pages.dev/). Development happens on `new-website-refactor`. `new-website-astro` is the pre-redesign Astro version; `new-website` (plain HTML SPA) and `master` (MkDocs) are frozen legacy branches. Do not port code from the legacy branches.

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

There is no lint, typecheck, or test setup, and `@astrojs/check` is not installed. Verify changes with `pnpm build` (must complete with no errors and emit one page per competition id plus the seven static routes) and by looking at the pages in a browser at desktop and phone widths, in both light and dark.

`sharp` is a devDependency because Astro 7 does not bundle it; without it the build fails on the competition photo pages.

Stale wrangler remnants: `pnpm preview`, `pnpm deploy`, and `pnpm generate-types` still call wrangler, but `wrangler.jsonc` and the Cloudflare adapter were removed when the site moved from a Worker to Cloudflare Pages (commit 06f012b). They fail with "Missing entry-point". `tsconfig.json` also includes a `worker-configuration.d.ts` that no longer exists. Cloudflare Pages builds the branch itself; do not re-add an adapter.

## Architecture

### Rendering model

Fully static (`output: 'static'`), no client framework. Client code is three small vanilla TypeScript files in `src/scripts/`: `theme.ts` and `nav.ts` are loaded by the layout on every page; `member-dialog.ts` is loaded only by the members page and reads its data from a JSON `<script>` block rendered at build time. `Base.astro` also loads a site-wide analytics script (`rbt.dang.fan`); keep it when reworking the layout.

### Two content pipelines

1. **JSON data → typed helpers → Astro pages.** `src/data/*.json` is the source of truth for every fact about the team. `src/lib/competitions.ts` and `src/lib/members.ts` type the JSON and compute derived values (champion count, years of history, latest results, member count, pinyin slugs, the person → participations reverse index). Pages import from `src/lib`, never from the JSON directly, so a statistic is computed in exactly one place.
2. **Markdown content collection.** `src/content/pages/*.md` (schema in `src/content.config.ts`: optional `kicker`, `title`, `lead`) is rendered by `src/pages/[slug].astro` inside `.prose` for collaboration, honors, and join. The markdown bodies are mostly raw HTML that uses the global classes `.cards`, `.cards-sm`, `.card`, `.card-tag`, `.card-title`, `.card-desc`, `.card-center`, `.placeholder` from `global.css`; keep those classes working when touching the stylesheet.

### Data model and cross-references

- `competitions.json`: `competitions` (column names `ASC`, `ISC`, `SC`, `其他`), `grandSlamYears`, and `records[]` newest-first. Each record has one array per column; each entry has `type`, `label`, optional `id`, optional `note`. `type` (champion, runner-up, linpack, eprize, special, place, notHeld, absent) becomes the CSS class `badge-<type>`; `id` links to `/competition/<id>`.
- `competition-details.json`: object keyed by id (`sc18`, `asc25`, ...). Every key becomes a page. Fields: `name`, `date`, `location`, `awards[]`, `team` {coaches, players, support, training}, `problems[]`, `news[]` {title, url}, `photos[]`, `highlights`, `sortDate` (YYYY-MM, used for ordering when `date` is imprecise), `_notes` (rendered as a remark).
- `members.json`: `advisors` {current[] with name/title/url, former[] as plain names}, `active[]` and `alumni[]` grouped by `grade`. Member fields: `name`, `dept?`, `url?`.
- Names must match character-for-character between `members.json` and the team lists in `competition-details.json`; that match drives the participation count on each person row, the dialog contents, and the name links on competition detail pages. Unifying name spellings has been a recurring data fix.
- Photos live in `src/assets/competition/<id>/NN.jpg` but are referenced in the JSON as `/img/competition/<id>/NN.jpg`; `competition/[id].astro` maps the path with `import.meta.glob` and renders `<Image>` (responsive WebP). A photo missing from `src/assets` falls back to a plain `<img>` pointing at the JSON path.

### Styling and theming

- `src/styles/global.css` is the design system: tokens (colors, type scale, spacing, radii) as CSS custom properties, base styles, layout primitives (`.container`, `.page`, `.page-intro`, `.section`, `.section-head`), shared components (`.facts`, `.badge-*`, `.table`, `.cards`, `.link-list`, `.btn`, `.back-link`, `.placeholder`) and `.prose`. Page-specific styles are scoped `<style>` blocks in each page; component styles live in the component.
- Theme tokens follow the three-state pattern: light on `:root`, dark under `@media (prefers-color-scheme: dark)` guarded with `:root:not([data-theme="light"])`, and dark again under `:root[data-theme="dark"]`. Style through tokens only; never put a color's only definition inside a media or `[data-theme]` block. The dark palette is duplicated in two blocks by design; edit both.
- The toggle stores `light` or `dark` in `localStorage['thuscc-theme-v2']`; no stored value means follow the system. The old key `thuscc-theme` is ignored on purpose: the previous site wrote `dark` to it on every visit, so it does not represent a choice. An inline script in `Base.astro`'s `<head>` applies the stored value before first paint. The sun/moon icon is chosen by the `--icon-sun` / `--icon-moon` tokens, not by JS.
- Fonts: Chinese text uses the system stack (PingFang, Microsoft YaHei, Noto Sans CJK). No Google Fonts: the audience is largely in mainland China. IBM Plex Mono is self-hosted in `public/fonts` (latin subset, weights 400/500/600, OFL) and reserved for years, scores, codes and small uppercase labels (`.mono`, `.num`, `.eyebrow`).
- Passing `class` to a component only works with scoped styles if the component spreads `...rest` onto its root element (see `Logo.astro`); otherwise Astro's scoped attribute is dropped and the rule silently fails to match.
- Footer build time and commit hash come from `vite.define` in `astro.config.mjs`.

### Common edits

- New competition result: add an entry with an `id` to `competitions.json`, add the matching key to `competition-details.json`, and drop photos in `src/assets/competition/<id>/`.
- New member: add to `members.json` using the exact name spelling used in competition team lists.
- New static page: create `src/content/pages/<slug>.md` with frontmatter, add it to `navLinks` in `src/components/SiteHeader.astro`, and optionally add it to `sections` in `index.astro`.

## Design rules

The 2026 redesign replaced an AI-generated look (WebGL shader backgrounds, glassmorphism, glowing gradient logo, floating animations) with a restrained one. Keep it that way:

- Tsinghua purple (`--accent`) is the only accent. Gold/silver/teal/orange are semantic result colors for badges, not decoration.
- No ambient animation, no backdrop blur, no gradients. Hover states change color or an underline, nothing moves.
- Cards are for content that is genuinely a set of equal objects (markdown pages, section index); lists with hairline separators are the default for everything else.
- Spacing comes from the `.page` / `.section` grid gaps, not per-element margins.
- URLs are stable: `/`, `/competition`, `/competition/<id>`, `/members` with `#<pinyin>` deep links, `/publications`, `/collaboration`, `/honors`, `/join`.
- Phone width is a first-class target; the competition table renders as a stacked list below 720px.
