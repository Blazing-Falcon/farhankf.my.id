# Development

Setup, content editing, and design tokens for the portfolio site.

Two independent Node projects, no monorepo tooling — `cd` into each and run its own npm scripts:

- **`cms/`** — Strapi 5 (SQLite), the admin panel and content API. Port `1337`.
- **`site/`** — Astro 7 in SSR mode, no client-side framework. Port `4321`.

Every page is server-rendered per request: Astro fetches from Strapi in the page frontmatter, so **Strapi should be running first**. If it isn't, list pages still render with a short notice in place of the missing content instead of a 500. Detail pages answer 502 and the sitemap answers 503.

## Prerequisites

- **Node.js — an even-numbered LTS** (v22/v24/v26). Strapi 5 rejects odd-numbered "current" releases, and `better-sqlite3` fails to build first.
- npm v10+. Nothing needs installing globally.

## First-time setup

The database and uploads are **not in git**, so a fresh clone starts with no content.

```bash
# 1. CMS
cd cms
cp .env.example .env          # then fill it in, see below
npm install
npm run develop               # http://localhost:1337/admin — create your admin account

# 2. Site (new terminal)
cd site
cp .env.example .env          # then paste the API token, see below
npm install
npm run dev                   # http://localhost:4321
```

**`cms/.env`** — replace every `tobemodified` placeholder with a random secret (`openssl rand -base64 32`), and add this line, which the scaffold leaves out:

```ini
DATABASE_FILENAME=data/data.db
```

Without it Strapi tries to open the `cms/` directory itself as the database and dies with `SqliteError: unable to open database file`.

**`site/.env`** — the site talks to Strapi with a read-only API token, so the content API isn't anonymously readable. In the admin panel: **Settings → API Tokens → Create new API Token**, type **Read-only**, duration **Unlimited**. The token is shown once:

```ini
STRAPI_URL=http://localhost:1337
STRAPI_TOKEN=<paste token here>
```

To rotate it, create a new one, update `site/.env`, restart the site, then delete the old token.

## Day-to-day

```bash
cd cms  && npm run develop    # CMS,  http://localhost:1337/admin
cd site && npm run dev        # site, http://localhost:4321
cd site && npx astro check    # typecheck — there is no test suite
```

Both dev servers bind to `0.0.0.0`, so they're reachable from other machines on the network; `astro dev` prints the LAN address on startup.

## Editing content

Everything — About, projects, blog posts, photos, lab notes, links — is edited in the Strapi admin at `http://localhost:1337/admin`.

**Click Publish on every entry.** Draft & Publish is on, and the API only returns published entries. If something you just added isn't showing up, check that first. (Responses are also cached for 60s, so give edits up to a minute to appear.)

Content types are defined **as code** in `cms/src/api/*/content-types/*/schema.json`. Add or change fields there and restart Strapi — don't use the admin UI's content-type builder.

### Content types

| Type | What it is |
|---|---|
| **About** (single) | Headline, bio (markdown), portrait, skills, contact links. |
| **Project** (collection) | Title, slug, summary, body (markdown), cover image, gallery, tech stack, links, `featured`, difficulty, stats. |
| **Blog post** (collection) | Title, slug, summary, `category`, cover image, `readTime`, `publishedDate`, and `contentBlocks`: markdown text, captioned image, PDF document, YouTube video. |
| **Blog category**, **Photo category** (collections) | `name`, `slug`, `order`. They feed the Keywords line on the Blog and Photography pages and the `?category=` filter. |
| **Photo** (collection) | Image, caption, `category` (a photo category), date, gear, `featured`. |
| **Lab note** (collection) | The homepage "Lab notes" section: `title` + `body` (max 280 chars) + `order`. Each is set as a numbered note. |
| **Cat** (collection) | No longer shown on the site. The type stays in Strapi so its content is kept. |
| **Social link** (collection) | The `/links` page: `label`, `url`, `icon` (one of `github`, `instagram`, `spotify`, `email`), `handle` (optional subtext), `order`. Use a full `mailto:` URL for the email entry. |
| **Ticker** (single) | `topics` — an array of uppercase strings for the homepage Keywords line, e.g. `["STATISTICS", "CATS", "COFFEE"]`. The site prints them in lower case and falls back to built-in defaults if the entry is missing. (The schema also has an unused `tools` field.) |

### JSON field shapes

These are conventions the frontend expects, not schema-validated — get them wrong and the field just won't render.

**About `skills`** — grouped:

```json
[
  { "group": "ML & Statistics", "items": ["Python", "scikit-learn", "XGBoost"] },
  { "group": "Infrastructure", "items": ["Proxmox", "TrueNAS SCALE", "ZFS"] }
]
```

**Project `techStack`** — a flat array of strings: `["Python", "scikit-learn", "SMOTE"]`.

**Project `stats`** — up to ~3 numbers shown as rows of the project's Specification table:

```json
[
  { "label": "rows processed", "value": "340k" },
  { "label": "accuracy", "value": "0.94" }
]
```

**Project `difficulty`** — optional status, shown in the project list and the Specification table. `ongoing-saga` also adds the "Preprint." line under the title: `weekend-hack`, `semester-project`, `thesis-grade`, or `ongoing-saga`.

## Design system

"Preprint": every page is typeset like a LaTeX paper in the Gruvbox palette. A page has a centered title block, an abstract, numbered sections, three-rule tables, numbered figures, and a footer set as footnotes. Lists of projects and posts are bibliography entries.

All colors and the main measures are CSS custom properties in **`site/src/styles/tokens.css`**. The shared page furniture is in **`site/src/styles/global.css`**. Use the tokens, and do not hardcode hex values in components.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#282828` | `#fbf1c7` | Page |
| `--bg1` | `#3c3836` | `#ebdbb2` | Code listings, PDF and video frames |
| `--bg3` | `#665c54` | `#bdae93` | Running-head rule, listing rules |
| `--fg` | `#ebdbb2` | `#3c3836` | Body text, table rules |
| `--fg0` | `#fbf1c7` | `#282828` | Title, headings |
| `--mute` | `#a89984` | `#665c54` | The identifier line |
| `--orange` | `#fe8019` | `#af3a03` | Links, current page, focus ring |

Type: **Libertinus Serif** for all text, **Libertinus Mono** for code and URLs. Both are self-hosted through `@fontsource` packages, because the Content Security Policy allows no external hosts.

**Theme.** Dark is the default. A first-time visitor gets the theme of their system. The header toggle stores the choice in a `theme` cookie, which the server reads to set `data-theme` on `<html>`, so a page never flashes the other theme.

**Numbering.** Sections, figures, tables and reference entries are numbered by CSS counters that start on `.sheet`. Never store a number in the CMS. A level-2 heading (`##`) in a post or project body becomes a numbered section.

**Components.** `TitleBlock`, `Abstract`, `PaperTable`, `RefList` (bibliography entries), `AuthorFigure` (portrait beside the facts table), `CategoryKeywords` (category filter links) and `ArticleContent` (the article blocks) are in `site/src/components/`.

## Writing posts

Markdown in a post or project body is sanitized before it is rendered. Raw HTML is removed.

- Each heading gets an `id` that the site generates from its text, so a section can be linked directly.
- LaTeX maths is rendered with KaTeX: `$a^2 + b^2$` inline, and `$$ ... $$` on its own lines for a display equation. A dollar sign followed by a space, or a closing one followed by a digit, is read as money.

## Photos and revision history

- Each photo has its own page at `/photography/<title>-<id>`. Only the id part identifies the photo, so the address still works after the title changes.
- `/changes` lists the newest commits. `site/scripts/generate-changes.mjs` writes the list to `site/src/data/changes.json` before every build. It reads the local `git log` when one exists. The Docker build has no `.git` directory, so there it reads the public GitHub repository. If neither source answers, the build continues and the page says that the list is not available.

## Deploying

Docker Compose, two containers. See **[deploy.md](deploy.md)** — the short version is that all persistent state is the `cms/data/` (database) and `cms/public/uploads/` (media) directories, and the containers are disposable.
