# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Website of THUSCC, the Tsinghua University Student Cluster Competition Team. Astro 7 static site, English-language UI, deployed on Cloudflare Pages (production domain `sc.team`; previews at https://new.sc.team/ and https://scc-homepage.pages.dev/). Development happens on `new-website-refactor`. `new-website-astro` is the pre-redesign Chinese-language Astro version; `new-website` (plain HTML SPA) and `master` (MkDocs) are frozen legacy branches. Do not port code from the legacy branches.

**All rendered content is English.** The owner asked for no Chinese anywhere on the site. Names are romanized (given name then family name, e.g. "Jidong Zhai"); the original Chinese data survives in git history up to commit `0a6a51e`, for verifying a spelling. When two people share a romanization they are told apart by class year in parentheses ("Yang Zhang (2023)"), and that exact string must be used everywhere the person appears.

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

`sharp` is a devDependency because Astro 7 does not bundle it; without it the build fails on every page that renders a photograph.

Stale wrangler remnants: `pnpm preview`, `pnpm deploy`, and `pnpm generate-types` still call wrangler, but `wrangler.jsonc` and the Cloudflare adapter were removed when the site moved from a Worker to Cloudflare Pages (commit 06f012b). They fail with "Missing entry-point". `tsconfig.json` also includes a `worker-configuration.d.ts` that no longer exists. Cloudflare Pages builds the branch itself; do not re-add an adapter.

## Architecture

### Rendering model

Fully static (`output: 'static'`), no client framework, single dark theme (no theme toggle). Client code is two small vanilla TypeScript files in `src/scripts/`: `nav.ts` (loaded by the layout) and `member-dialog.ts` (members page only, reads its data from a JSON `<script>` block rendered at build time). `Base.astro` also loads a site-wide analytics script (`rbt.dang.fan`); keep it when reworking the layout.

`Base.astro` takes `header="overlay"` and `bleed` for pages that open with a full-bleed photo (`.photo-hero`); those pages wrap each later section in `.container` themselves. Other pages get the sticky solid header and a contained `main`.

### Two content pipelines

1. **JSON data → typed helpers → Astro pages.** `src/data/*.json` is the source of truth for every fact about the team. `src/lib/competitions.ts` and `src/lib/members.ts` type the JSON and compute derived values (champion count and years, years of history, latest results, member count, slugs, the person → participations reverse index, English number words). Pages import from `src/lib`, never from the JSON directly, so a statistic is computed in exactly one place.
2. **Markdown content collection.** `src/content/pages/*.md` (schema in `src/content.config.ts`: optional `kicker`, `title`, `lead`) is rendered by `src/pages/[slug].astro` inside `.prose` for collaboration, honors, and join. The markdown bodies are mostly raw HTML that uses the global classes `.cards`, `.cards-sm`, `.card`, `.card-tag`, `.card-title`, `.card-desc`, `.card-center`, `.placeholder` from `global.css`; keep those classes working when touching the stylesheet.

### Data model and cross-references

- `competitions.json`: `competitions` (column names `ASC`, `ISC`, `SC`, `Other`), `grandSlamYears`, and `records[]` newest-first. Each record has one array per column; each entry has `type`, `label`, optional `id`, optional `note`. `type` (champion, runner-up, linpack, eprize, special, place, notHeld, absent) becomes the CSS class `badge-<type>`; `id` links to `/competition/<id>`.
- `competition-details.json`: object keyed by id (`sc18`, `asc25`, ...). Every key becomes a page. Fields: `name`, `date`, `location`, `awards[]`, `team` {coaches, players, support, training}, `problems[]`, `news[]` {title, url}, `photos[]`, `highlights`, `sortDate` (YYYY-MM, used for ordering when `date` is imprecise), `_notes` (rendered as a remark).
- `members.json`: `advisors` {current[] with name/title/url, former[] as plain names}, `active[]` and `alumni[]` grouped by `grade` ("Class of 2023"). Member fields: `name`, `dept?`, `url?`.
- Names must match character-for-character between `members.json` and the team lists in `competition-details.json`; that match drives the participation count on each person row, the dialog contents, and the name links on competition detail pages.
- The home page opener is the most recent championship that has photographs; the three "From the floor" cards are the next most recent events with photographs. Both are derived, not configured.
- Photos live in `src/assets/competition/<id>/NN.jpg` but are referenced in the JSON as `/img/competition/<id>/NN.jpg`; pages map the path with `import.meta.glob` and render `<Image>` (responsive WebP). A photo missing from `src/assets` falls back to a plain `<img>` pointing at the JSON path.

### Styling

- `src/styles/global.css` is the design system: tokens (colors, type scale, spacing) as CSS custom properties on `:root`, base styles, layout primitives (`.container`, `.page`, `.page-intro`, `.section`, `.section-head`, `.photo-hero`), shared components (`.timeline`, `.facts`, `.badge-*`, `.table`, `.photo-card`, `.cards`, `.link-list`, `.btn`, `.back-link`, `.placeholder`) and `.prose`. Page-specific styles are scoped `<style>` blocks in each page; component styles live in the component.
- Fonts are self-hosted latin subsets in `public/fonts` (OFL, see `public/fonts/LICENSE.md`): Newsreader variable (`fonts.css`) for display and names with `font-optical-sizing: auto`, IBM Plex Mono (`plex.css`) for years, dates and small uppercase labels. Running text is the system sans. Nothing loads from third-party font hosts; the audience includes mainland China where Google Fonts is unreliable.
- Passing `class` to a component only works with scoped styles if the component spreads `...rest` onto its root element (see `Logo.astro`); otherwise Astro's scoped attribute is dropped and the rule silently fails to match.
- Footer build time and commit hash come from `vite.define` in `astro.config.mjs`.

### Common edits

- New competition result: add an entry with an `id` to `competitions.json`, add the matching key to `competition-details.json`, and drop photos in `src/assets/competition/<id>/`.
- New member: add to `members.json` using the exact spelling used in competition team lists.
- New static page: create `src/content/pages/<slug>.md` with frontmatter, add it to `navLinks` in `src/components/SiteHeader.astro`, and optionally add it to `sections` in `index.astro`.

## Design rules

The site follows the "Chronicle" direction chosen by the owner from three canvas sketches on 2026-09-15: photo-led, people and story first, one committed dark world. Keep it that way:

- Aubergine ground (`--bg`), ivory text, and gold (`--gold`) reserved for championships and the one primary action per page. Silver, teal, lavender and orange are result-type colors only, never decoration.
- Newsreader carries the personality: page titles, section titles, names and paper titles. Do not add another display face.
- Photographs are the hero: every page that has one opens with it under an overlay header and a bottom scrim.
- One entrance animation (`.rise`) on hero content; nothing else moves. No gradients other than photo scrims, no blur, no glass.
- Cards are for genuinely equal sets (markdown pages); lists with hairline separators are the default elsewhere.
- URLs are stable: `/`, `/competition` (rows anchored as `#y2018`), `/competition/<id>`, `/members` with `#given-family` deep links, `/publications`, `/collaboration`, `/honors`, `/join`.
- Phone width is a first-class target; the competition table renders as a stacked list below 720px.
