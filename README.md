# juan.cat — Portfolio

Self-hosted portfolio site

Two independent Node projects, no monorepo tooling — `cd` into each and run its own npm scripts:

- **`cms/`** — Strapi 5 (SQLite), the admin panel and content API. Port `1337`.
- **`site/`** — Astro 5 in SSR mode, one React island (the photo lightbox), motion via the Web Animations API. Port `4321`.

Every page is server-rendered per request: Astro fetches from Strapi in the page frontmatter, so **Strapi should be running first**. If it isn't, pages still render — a cat illustration takes the place of the missing content instead of a 500.

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
DATABASE_FILENAME=.tmp/data.db
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

Everything — About, projects, photos, lab notes, the cat committee — is edited in the Strapi admin at `http://localhost:1337/admin`.

**Click Publish on every entry.** Draft & Publish is on, and the API only returns published entries. If something you just added isn't showing up, check that first. (Responses are also cached for 60s, so give edits up to a minute to appear.)

Content types are defined **as code** in `cms/src/api/*/content-types/*/schema.json`. Add or change fields there and restart Strapi — don't use the admin UI's content-type builder.

### Content types

| Type | What it is |
|---|---|
| **About** (single) | Headline, bio (markdown), portrait, skills, contact links. |
| **Project** (collection) | Title, slug, summary, body (markdown), cover image, gallery, tech stack, links, `featured`, difficulty, stats. |
| **Photo** (collection) | Image, caption, `category`, date, gear, `featured`. Categories: `street`, `landscape`, `portrait`, `macro`, `astrophotography`, `cat`, `other`. |
| **Lab note** (collection) | The homepage sticky-note board: `title` + `body` (max 280 chars) + `order` for placement. Color and tilt are automatic. |
| **Cat** (collection) | The About page's supervision committee: `name`, `role`, `photo`, `bio`, `order`. Cards open a click-through staff file. |
| **Ticker** (single) | `topics` — an array of uppercase strings for the homepage marquee, e.g. `["STATISTICS", "CATS", "COFFEE"]`. The site falls back to built-in defaults if it's missing. (The schema also has an unused `tools` field, left over from a second marquee that was removed.) |

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

**Project `stats`** — up to ~3 bragging numbers shown on the card:

```json
[
  { "label": "rows processed", "value": "340k" },
  { "label": "accuracy", "value": "0.94" }
]
```

**Project `difficulty`** — optional sticker on the card: `weekend-hack`, `semester-project`, `thesis-grade`, or `ongoing-saga`.

## Design system

"Ink & Tangerine": heavy ink borders, hard offset shadows that press in on hover, and a cat mascot drawn as inline SVG. All colors, spacing, and shapes are CSS custom properties in **`site/src/styles/tokens.css`** — use the tokens, don't hardcode hex values or magic pixel numbers.

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#FBF7EF` | Page background |
| `--ink` | `#1A1B23` | Text, borders, dark sections |
| `--tangerine` | `#FF5C00` | Primary accent: CTAs, marquee, focus ring |
| `--teal` | `#0E7C7B` | Links, tags |
| `--butter` | `#FFD23F` | Selection, sticker badges |
| `--blush` | `#FFC4B0` | Soft card fills |

Type: **Bricolage Grotesque** for display, **Instrument Sans** for body, **Space Mono** for tickers and captions.

## Deploying

Docker Compose, two containers. See **[DEPLOY.md](DEPLOY.md)** — the short version is that all persistent state is the `cms/.tmp/` (database) and `cms/public/uploads/` (media) directories, and the containers are disposable.
