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

Fully static (`output: 'static'`), no client framework. `Base.astro` mounts Astro's `ClientRouter`, so navigation between pages is client-side with view transitions; every script therefore initialises on `astro:page-load` (or delegates to the document) rather than at module top level. Client code is four small vanilla TypeScript files in `src/scripts/`: `nav.ts`, `reveal.ts` and `theme.ts` (loaded by the layout; `reveal.ts` fades in `[data-reveal]` sections once via IntersectionObserver, runs `data-count` counters, and does nothing under reduced motion; `theme.ts` drives the theme control) and `member-dialog.ts` (members page only, reads its data from a JSON `<script>` block rendered at build time).

**Theme.** Three states: system (default, nothing stamped, CSS follows `prefers-color-scheme`), light and dark (stamped as `data-theme` on `<html>`, stored under `localStorage['thuscc-theme-v2']`). An inline script in `Base.astro`'s head applies the stored choice before first paint; `theme.ts` re-applies it on `astro:after-swap` because the client router resets root attributes. Tokens follow the three-block pattern in `global.css`: light on bare `:root`, dark under `@media (prefers-color-scheme: dark)` guarded with `:root:not([data-theme="light"])`, and dark again under `:root[data-theme="dark"]`; edit both dark blocks together. Style through tokens only, never with a literal colour that works in one theme. The old key `thuscc-theme` is ignored on purpose: the pre-redesign site wrote `dark` to it on every visit. `Base.astro` also loads a site-wide analytics script (`rbt.dang.fan`); keep it when reworking the layout.

`Base.astro` takes `header="overlay"` and `bleed` for pages that open with a full-bleed photo (`.photo-hero`); those pages wrap each later section in `.container` themselves. Other pages get the sticky solid header and a contained `main`.

### Two content pipelines

1. **JSON data → typed helpers → Astro pages.** `src/data/*.json` is the source of truth for every fact about the team. `src/lib/competitions.ts` and `src/lib/members.ts` type the JSON and compute derived values (champion count and years, years of history, latest results, member count, slugs, the person → participations reverse index, English number words). Pages import from `src/lib`, never from the JSON directly, so a statistic is computed in exactly one place.
2. **Markdown content collection.** `src/content/pages/*.md` (schema in `src/content.config.ts`: optional `kicker`, `title`, `lead`) is rendered by `src/pages/[slug].astro` inside `.prose` for collaboration, honors, and join. The markdown bodies are mostly raw HTML that uses the global classes `.cards`, `.cards-sm`, `.card`, `.card-tag`, `.card-title`, `.card-desc`, `.card-center`, `.placeholder` from `global.css`; keep those classes working when touching the stylesheet.

### Data model and cross-references

- `competitions.json`: `competitions` (column names `ASC`, `ISC`, `SC`, `Other`), `grandSlamYears`, and `records[]` newest-first. Each record has one array per column; each entry has `type`, `label`, optional `id`, optional `note`. `type` (champion, runner-up, linpack, eprize, special, place, notHeld, absent) becomes the CSS class `badge-<type>`; `id` links to `/competition/<id>`.
- `competition-details.json`: object keyed by id (`sc18`, `asc25`, ...). Every key becomes a page. Fields: `name`, `date`, `location`, `awards[]`, `team` {coaches, players, support, training}, `problems[]`, `news[]` {title, url}, `photos[]`, `highlights`, `sortDate` (YYYY-MM, used for ordering when `date` is imprecise), `_notes` (rendered as a remark).
- `members.json`: `advisors` {current[] with name/title/url, former[] as plain names}, `active[]` and `alumni[]` grouped by `grade` ("Class of 2023"). Member fields: `name`, `dept?`, `url?`.
- Names must match character-for-character between `members.json` and the team lists in `competition-details.json`; that match drives the participation count on each person row, the dialog contents, and the name links on competition detail pages.
- The home page opener is the most recent championship that has photographs; the three "Recent competitions" cards are the next most recent events with photographs. Both are derived, not configured. The "What the team does" and "How a competition works" copy lives in `index.astro`; the FAQ is `src/data/faq.json`.
- Photos live in `src/assets/competition/<id>/NN.jpg` but are referenced in the JSON as `/img/competition/<id>/NN.jpg`; pages map the path with `import.meta.glob` and render `<Image>` (responsive WebP). A photo missing from `src/assets` falls back to a plain `<img>` pointing at the JSON path.

### Styling

- `src/styles/global.css` is the design system: tokens (colors, type scale, spacing) as CSS custom properties on `:root`, base styles, layout primitives (`.container`, `.page`, `.page-intro`, `.section`, `.section-head`, `.photo-hero`), shared components (`.timeline`, `.facts`, `.badge-*`, `.table`, `.photo-card`, `.cards`, `.link-list`, `.btn`, `.back-link`, `.placeholder`) and `.prose`. Page-specific styles are scoped `<style>` blocks in each page; component styles live in the component.
- Fonts are self-hosted latin subsets in `public/fonts` (OFL, see `public/fonts/LICENSE.md`): Newsreader variable (`fonts.css`) for display and names with `font-optical-sizing: auto`, IBM Plex Mono (`plex.css`) for years, dates and small uppercase labels. Running text is the system sans. Nothing loads from third-party font hosts; the audience includes mainland China where Google Fonts is unreliable.
- Icons are Phosphor Light, inlined at build time by `Icon.astro` from `@phosphor-icons/core` (`<Icon name="trophy" size={20} />`; an unknown name fails the build). Never hand-draw icon paths or use text glyphs like arrows; the only hand-authored SVG is the team mark in `Logo.astro`.
- Passing `class` to a component only works with scoped styles if the component spreads `...rest` onto its root element (see `Logo.astro`); otherwise Astro's scoped attribute is dropped and the rule silently fails to match.
- Build time and commit hash come from `vite.define` in `astro.config.mjs` and are emitted as `<meta name="build">` in `Base.astro`.

### Common edits

- New competition result: add an entry with an `id` to `competitions.json`, add the matching key to `competition-details.json`, and drop photos in `src/assets/competition/<id>/`.
- New member: add to `members.json` using the exact spelling used in competition team lists.
- New static page: create `src/content/pages/<slug>.md` with frontmatter, add it to `navLinks` in `src/components/SiteHeader.astro`, and optionally add it to `sections` in `index.astro`.

## Design rules

The site follows the "Chronicle" direction chosen by the owner from three canvas sketches on 2026-09-15, then audited against the `design-taste-frontend` skill in `.agents/skills/` (the owner's "taste-skill"). Run that skill's pre-flight checklist before shipping visual changes. The rules that came out of it:

- Two accent families. `--accent*` is the interactive accent: buttons, links, icons, active states, the hero emphasis. It is gold in dark and Tsinghua purple in light. `--gold*` marks a championship and nothing else: chips (`--gold-soft` fill, `--gold-ink` text, `--gold-line` border), timeline dots and grand-slam rows; it stays a bright gold in both themes. Every other result is a neutral outline; do not add per-result-type colours back. Text on the accent uses `--on-accent`; photo scrims use `--scrim-rgb`. The primary button class is `.btn-primary`.
- Newsreader carries the personality: page titles, section titles, names and paper titles. It is justified because the site is a publication-style record; do not add another display face.
- At most one small label per page (the home hero's event line, a detail page's date and place). No uppercase mono eyebrows above section titles, no all-caps class or role labels.
- No middle dots or dashes as separators in visible copy; use commas, line breaks or parentheses. Dates are spelled out ("15 November 2018") via `formatDate`.
- Square corners everywhere (`--radius` tokens are 0). Shadows are tinted to the ground.
- Photographs are the hero: every page that has one opens with it under an overlay header and a bottom scrim. Hero copy is at most an event line, a two-line headline, a subtext under 20 words and two buttons.
- Motion dial is 6 and every piece is motivated: Astro's `ClientRouter` gives a short cross-page fade, and a photo card's `transition:name="photo-<id>"` morphs into the matching event opener; hero photographs settle from a slight zoom; below-the-fold sections fade up once (`data-reveal`) with children of a `.stagger` container following in sequence (`--i` set inline); the championship timeline draws its rail and dots in year order; the overlay header becomes solid over the first 320px of scrolling via a CSS scroll-driven animation (fixed only where supported); record figures with `data-count` count up; FAQ answers, the mobile menu and the member dialog have open and close transitions. All of it collapses to static under `prefers-reduced-motion`. No looping animation, no scroll listeners, no gradients other than photo scrims, no blur, no glass.
- No boxed cards. Markdown `.cards` render as rule-topped blocks; equal-card rows are avoided (recent competitions use one featured story plus two).
- The build hash lives in a `<meta name="build">` tag, not in the footer.
- URLs are stable: `/`, `/competition` (rows anchored as `#y2018`), `/competition/<id>`, `/members` with `#given-family` deep links, `/publications`, `/collaboration`, `/honors`, `/join`.
- Phone width is a first-class target; the competition table renders as a stacked list below 720px.
- Home page sections each use a different layout family (photo hero, icon grid, steps rail, timeline, featured photo trio, name row, FAQ disclosure, two-column call to action). Do not add a section that repeats one of these families.
- `src/pages/404.astro` is the not-found page; keep it when adding routes.
