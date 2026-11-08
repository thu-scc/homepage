# AGENTS.md

Instructions for AI coding agents (Codex, DeepSeek, Cursor, Claude Code and others) working in this repository.

Most people who bring an agent here want to do one thing: **add a write-up of a research collaboration project and open a pull request**. This file covers that job from start to finish. `CLAUDE.md` is the full architecture and design reference. If you are asked to change anything other than this kind of content, read it first and follow it.

## The repository in brief

This is the website of THUSCC, the Tsinghua University Student Cluster Competition Team (<https://sc.team>). It is a static Astro 7 site that Cloudflare Pages deploys from the `new-website-refactor` branch. Every piece of rendered text is in English.

Pull requests go to **`new-website-refactor` on `thu-scc/homepage`**. That is not GitHub's default branch for the repository, so always pass the base branch explicitly.

## Adding a project write-up

A project leader gives you a write-up of a collaboration project in whatever form it exists: Markdown, a Word file, a WeChat article, Chinese text, or an `.astro` or HTML page that another agent generated. Your job:

1. Turn it into **one Markdown file**.
2. Link that file from the Collaboration page.
3. Check that the site builds.
4. Open a PR.

You do not write Astro, CSS, TypeScript or JSON for any of this.

### Files a write-up PR may touch

| File | Contents |
|---|---|
| `src/content/pages/collaboration/<slug>.md` | The write-up, published at `https://sc.team/collaboration/<slug>` |
| `src/assets/projects/<slug>/NN.png` or `.jpg` | Figures used in the write-up, if there are any |
| `src/content/pages/collaboration.md` | The card that links to the write-up |

Touch nothing else. The page gets its back link to /collaboration and its highlighted item in the header automatically, so do not add either one yourself.

- If the draft arrived as an `.astro`, `.html`, `.vue` or `.jsx` page, do not commit it and do not put it in `src/pages/`. Copy its text and figures into the Markdown file and throw the page away. Its classes, components and styling go with it.
- Do not commit the original zip, docx or pdf.
- If the write-up seems to need something the site cannot render (math, video, an interactive chart, a custom layout), do not build it. Write the content plainly and list what you dropped in the PR description.
- Do not invent numbers, names, dates or affiliations. If the draft leaves one out, leave it out of the page too and list what is missing in the PR description, so the leader can supply it.

### Choosing the slug

The slug becomes the last part of the URL. Use lowercase ASCII letters, digits and hyphens, and name the project, not the team or the partner: `grid-data-preprocessing`, not `project1` or `thuscc-grid`. It must not match a file that is already in `src/content/pages/collaboration/`.

Once the PR merges, the URL is permanent, so pick it carefully the first time.

### The Markdown file

```markdown
---
title: GRID data preprocessing
lead: One sentence, under 30 words, saying what the project did and for whom.
---

Opening paragraph: the scientific problem, the partner group, and why computing was what held them back.

## The problem

## What we built

## Results

## Team
```

These headings are a default, not a form you have to fill in. Rename or merge them when the material calls for it, but keep the order: the problem, then the work, then the results, then the people.

Frontmatter:

- `title` is the project's name, in sentence case with no trailing period. It becomes the page's `<h1>`, so the body must not start with a `#` heading.
- `lead` is one sentence. It appears under the title as the page's introduction.
- Add no other keys. The schema in `src/content.config.ts` also accepts `kicker`, but that field is not displayed.

Body:

- Use only `##` and `###` headings. The title already takes `#`, and `####` has no styling.
- Write plain Markdown: paragraphs, lists, links, `inline code`, short fenced code blocks, tables and blockquotes. Do not use raw HTML, `style` or `class` attributes, `<script>`, `<iframe>` or emoji.
- Do not use LaTeX. The site has no math renderer, so `$O(n \log n)$` comes out as literal dollar signs. Write formulas in words or as `inline code`.
- Keep tables to at most four short columns. Tables do not scroll sideways, and the page has to read at a phone width of 375px.
- Report results as numbers against a baseline: "cut preprocessing of one day of telemetry from 6 hours to 40 minutes on 4 nodes", not "greatly improved performance". Say what hardware ran it, how big the input was, and what you compared against.
- A code block is for something the reader has to see, and should be no longer than about 15 lines. The page is written for readers, so link the repository instead of pasting the code.
- Write external links as full `https://` URLs and links within the site as root-relative paths (`/members`, `/competition/sc24`).

### Writing rules

These rules apply across the whole site, and they are the ones agents break most often.

- **English only.** No Chinese characters anywhere in the file, including alt text and link text. Translate the draft, and do not leave the Chinese in parentheses beside the English.
- **Names** are romanized with the given name first: "Jidong Zhai", not "Zhai Jidong". For anyone on the team, search `src/data/members.json` and copy the spelling exactly. Link the name to that person's row: `[Jidong Zhai](/members#jidong-zhai)`. The anchor is the name in lowercase with every run of other characters turned into a hyphen, so "Yang Zhang (2023)" becomes `#yang-zhang-2023`, while the link text stays "Yang Zhang". Name people outside the team, such as the partner group's researchers, in plain text with their affiliation.
- **No dashes or middle dots.** Do not use em dashes (—), en dashes (–) or middle dots (·) anywhere in the text. Use a comma, parentheses, a colon or a new sentence instead. Write ranges out in words ("2019 to 2021"). Hyphens inside words ("on-orbit") are fine.
- **Dates are spelled out**: "15 March 2026" or "March 2026", never "2026-03-15" or "3/15".
- **The tone is factual.** The site is a record, not a brochure. Do not use words like "cutting-edge", "revolutionary" or "empower". Do not use bold text in place of headings, do not use all-caps labels, and do not end with a summary that repeats the page.

### Figures

Save figures in `src/assets/projects/<slug>/`, named `01.png`, `02.jpg` and so on in reading order. Reference them by relative path so that Astro optimizes them:

```markdown
![Throughput of the old and new pipelines on one day of telemetry](../../../assets/projects/grid-data-preprocessing/01.png)
```

- Alt text is an English sentence saying what the figure shows.
- Use PNG for charts and diagrams and JPG for photographs. Keep each file at most about 2000px wide and 1 MB.
- Use a table rather than a chart when there are only a few numbers. The site has light and dark themes, and a chart with a white background shows up as a white block in dark mode.

### The card on /collaboration

`src/content/pages/collaboration.md` opens with a `<div class="cards">` block that holds one card per project. If a card there already describes this project, link that card instead of adding a second one. Otherwise, add a new card next to the cards that share its partner:

```html
<div class="card">
<p class="card-tag">GRID satellite project</p>
<h3 class="card-title"><a href="/collaboration/grid-data-preprocessing">Satellite data pipeline rebuild</a></h3>
<p class="card-desc">One or two sentences, under 40 words.</p>
</div>
```

- `card-tag` names the partner (a project, a research group or a department), the way the existing cards do.
- Copy the shape of the existing cards exactly, with no indentation, no blank lines and no extra classes. Markdown turns an indented line into a code block.
- Leave the "Work with us" section alone.
- Do not add the write-up to `navLinks` in `SiteHeader.astro`. `CLAUDE.md` says to do that when adding a new page, but that rule is for top-level sections. Readers reach write-ups from the Collaboration page.

### Check your work

```bash
mise install     # once per machine; any setup with Node 24 and pnpm 11 also works
pnpm install
pnpm build
```

The build must finish with no errors and list `/collaboration/<slug>/index.html` among the pages it generated. If `pnpm install` changed `pnpm-lock.yaml`, restore the file with `git checkout pnpm-lock.yaml`. `pnpm preview` and `pnpm deploy` are broken leftovers, so do not run them.

Then run the check below. It prints any Chinese characters, dashes or middle dots still in the files, and it should print nothing:

```bash
perl -CSD -ne 'print "$ARGV:$.: $_" if /[\p{Han}\x{2013}\x{2014}\x{00B7}]/; close ARGV if eof' src/content/pages/collaboration/<slug>.md src/content/pages/collaboration.md
```

Finally, run `pnpm dev` and open `http://localhost:4321/collaboration/<slug>` and `http://localhost:4321/collaboration`, first at desktop width and then at 375px. Check that:

- the card links to the write-up,
- every figure loads,
- tables fit without overflowing the page,
- the page reads well in both light and dark themes (use the theme switch in the header).

If your agent cannot open a browser, say so in the PR description so the reviewer knows to look.

### Opening the pull request

Open one PR per project. Run `git add` on the paths by name, never `git add -A`, so that the original draft and stray files stay out of the PR.

```bash
git switch new-website-refactor
git pull
git switch -c content/<slug>
git add src/content/pages/collaboration/<slug>.md src/content/pages/collaboration.md src/assets/projects/<slug>
git commit
git push -u origin content/<slug>
gh pr create --repo thu-scc/homepage --base new-website-refactor
```

If you cannot push to `thu-scc/homepage`, push the branch to your own fork and add `--head <your-github-name>:content/<slug>` to `gh pr create`. If there are no figures, leave `src/assets/projects/<slug>` out of the `git add`.

The commit subject is a short imperative sentence, for example "Add the GRID data preprocessing write-up". The body says who the partner is and where the draft came from.

The PR description covers:

- the project, the partner group and the project leader,
- the page's path (`/collaboration/<slug>`),
- where the draft came from (for example, "converted from an Astro page generated by DeepSeek"),
- anything you dropped or changed while converting it, and any facts that are missing,
- whether you checked the page in a browser at phone width.

## Any other change

For new competition results, members or news posts, follow "Common edits" in `CLAUDE.md`. For changes to code or design, read all of `CLAUDE.md` first. Its "Design rules" section applies to anything that changes how the site looks. Do not edit `CLAUDE.md` or `AGENTS.md` in a content PR.
