# THUSCC Homepage

Website of the Tsinghua University Student Cluster Competition Team. Built with [Astro](https://astro.build/) 7 as a static site and deployed on Cloudflare Pages.

Preview: <https://new.sc.team/> or <https://scc-homepage.pages.dev/>

## Requirements

- **Node.js 24** (minimum 22.12.0; Astro 7 and Vite 7 need Node 22 features, do not downgrade)
- **pnpm 11**

The toolchain is pinned in `mise.toml`; with [mise](https://mise.jdx.dev/) installed:

```bash
mise install
pnpm install
```

## Commands

```bash
pnpm dev                  # dev server at http://localhost:4321
pnpm build                # static build to dist/
pnpm exec astro preview   # serve dist/ locally
```

The output is plain static HTML. Cloudflare Pages builds this branch and publishes `dist/`.

## Project layout

```
src/
├── styles/
│   ├── global.css           ← design system: tokens, base styles, shared components, markdown prose
│   ├── fonts.css            ← Newsreader @font-face
│   └── plex.css             ← IBM Plex Mono @font-face
├── layouts/Base.astro       ← HTML shell (head, header, footer)
├── components/
│   ├── SiteHeader.astro     ← header and navigation (edit navLinks here)
│   ├── SiteFooter.astro     ← footer with build time and commit
│   ├── ChampionTimeline.astro ← championship-years strip used on the home and competitions pages
│   ├── PageIntro.astro      ← page title block (eyebrow / title / lead)
│   ├── ResultBadge.astro    ← result chip
│   ├── PersonItem.astro     ← member row
│   └── Logo.astro           ← the team mark as a flat SVG
├── lib/
│   ├── competitions.ts      ← typed competition data, statistics, latest results, number words
│   └── members.ts           ← typed member data, slugs, person → participation index
├── data/                    ← structured data, the source of truth
│   ├── competitions.json    ← results grid by year
│   ├── competition-details.json ← one entry per event: team, problems, coverage, photos
│   ├── members.json         ← advisors, current members, alumni
│   └── publications.json
├── content/pages/           ← markdown pages: collaboration, honors, join
├── assets/competition/<id>/ ← photographs (built into responsive WebP)
├── pages/                   ← routes
└── scripts/                 ← small vanilla TS: navigation, member dialog
public/
├── fonts/                   ← self-hosted Newsreader and IBM Plex Mono (latin subsets)
└── img/                     ← logo and favicon
```

## Editing content

### Adding a competition result

1. Add an entry to the year's column (`ASC`, `ISC`, `SC` or `Other`) in `src/data/competitions.json` with an `id` such as `sc26`. The `type` picks the chip colour: `champion`, `runner-up`, `linpack`, `eprize`, `special`, `place`, `notHeld` or `absent`.
2. Add the matching key to `src/data/competition-details.json`. Every key becomes a `/competition/<id>` page.
3. Put photographs in `src/assets/competition/<id>/01.jpg` and list them in `photos` as `/img/competition/<id>/01.jpg`. The first photo becomes the page's opener.

### Adding a member

Edit `src/data/members.json`. Names must match the spelling used in the `team` lists of `competition-details.json` exactly, otherwise their competition record will not link up. Two members with the same romanized name are distinguished by class year in parentheses, for example `Yang Zhang (2023)`. Each member gets an anchor such as `/members#jidong-zhai`.

### Editing a markdown page

Edit the file under `src/content/pages/`. Frontmatter:

```yaml
---
kicker: Join us        # small label above the title
title: Join the team
lead: One-sentence introduction.
---
```

The body is Markdown with inline HTML allowed. Available classes: `.cards` / `.cards-sm` (card grid), `.card`, `.card-tag`, `.card-title`, `.card-desc`, `.card-center`, `.placeholder`.

### Adding a page

1. Create `src/content/pages/<slug>.md`
2. Add it to `navLinks` in `src/components/SiteHeader.astro`
3. Optionally add it to `sections` in `src/pages/index.astro`

## Design notes

- **Palette**: plum and gold. Dark renders a plum ground with ivory text and gold as the accent. Light renders a violet-tinted ivory ground with plum ink and Tsinghua purple as the accent. In both, a bright gold is reserved for championships. The theme follows the system by default, with a light/dark choice in the header.
- **Type**: Newsreader (variable, optical sizes) for display and names, the system sans for running text, IBM Plex Mono for years, dates and small labels. Both web fonts are self-hosted latin subsets; nothing loads from third-party font hosts.
- **Layout**: a 1200 px content column, full-bleed photo openers, phone first.

## Branches

| Branch | Status | Notes |
|--------|--------|-------|
| `new-website-refactor` | **active** | 2026 redesign (English) |
| `new-website-astro` | previous | Astro version before the redesign |
| `new-website` | frozen | plain HTML/CSS/JS SPA |
| `master` | legacy | MkDocs version, retired |
