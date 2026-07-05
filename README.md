# juan.cat — Portfolio

Self-hosted portfolio site for Juan: statistics/ML student, photographer, home lab enthusiast, and tabletop RPG player. Astro (SSR) frontend with React islands, Strapi 5 CMS, GSAP motion.

## Prerequisites

- Node.js: an even-numbered LTS release (v22.x, v24.x, or v26.x). Strapi 5 does not support odd-numbered "current" releases.
- npm v10+
- No global installs needed — everything lives in `cms/node_modules` and `site/node_modules`.

## Running Locally

Two dev servers run side by side:

```bash
# Terminal 1 — CMS (Strapi), http://localhost:1337
cd cms
npm run develop

# Terminal 2 — Site (Astro), http://localhost:4321
cd site
npm run dev
```

Astro's data layer (`site/src/lib/strapi.ts`) fetches from Strapi server-side on every request, so Strapi should be running first. If Strapi is down, pages still render (with a cat empty-state illustration in place of the missing content) instead of a 500.

Both dev servers bind to all network interfaces (`0.0.0.0`), not just `localhost`, so they're reachable from other machines on the same network (e.g. `http://<this-machine-ip>:4321`). Strapi picks this up from `HOST=0.0.0.0` in `cms/.env`; Astro uses the `--host` flag on `npm run dev` / `npm run preview`. `astro dev` prints the exact LAN/Tailscale addresses to use on startup.

## Content Editing

All content (About, Projects, Photos) is managed through the Strapi admin panel:

- URL: `http://localhost:1337/admin`

Content types are defined as code in `cms/src/api/*/content-types/*/schema.json` — edit the schema files and restart `npm run develop` to change fields, rather than using the admin UI's content-type builder.

**Remember to click Publish** on any entry — Draft & Publish is enabled, and only published entries are returned by the API.

## Strapi API Token Setup

The Astro site authenticates to Strapi with a read-only API token (not the public role), so the content API isn't anonymously readable.

1. In the admin panel: Settings → API Tokens → Create new API Token.
2. Name: `astro-site`. Type: **Read-only**. Duration: **Unlimited**.
3. Copy the token (shown once) into `site/.env`:

   ```
   STRAPI_URL=http://localhost:1337
   STRAPI_TOKEN=<paste token here>
   ```

   `site/.env.example` documents the same keys with placeholders and is the only one committed to git.

## Local Dev Credentials

Strapi admin (local only, placeholder — change before any real deployment):

- URL: `http://localhost:1337/admin`
- Email: `admin@example.com`
- Password: `AdminPass123!`

## Content Conventions

These JSON/array fields are free-form in Strapi and not schema-validated beyond "json"/"array of string", so the shape is a convention enforced by the Astro client and seed data only.

**About `skills` (JSON field):**

```json
[
  { "group": "ML & Statistics", "items": ["Python", "scikit-learn", "XGBoost"] },
  { "group": "Infrastructure", "items": ["Proxmox", "TrueNAS SCALE", "ZFS"] }
]
```

**Project `techStack` (JSON field):** flat array of strings, e.g. `["Python", "scikit-learn", "SMOTE"]`.

**Project `stats` (JSON field):** up to ~3 tiny bragging numbers shown on the card, e.g.

```json
[
  { "label": "rows processed", "value": "340k" },
  { "label": "accuracy", "value": "0.94" }
]
```

**Project `difficulty` (enum):** one of `weekend-hack`, `semester-project`, `thesis-grade`, `ongoing-saga` — rendered as a sticker on the project card. Optional.

**Lab notes (collection):** the homepage sticky-note board. Each entry is a `title` + short `body` (max 280 chars) + `order` integer that controls left-to-right placement. Colors and tilt are assigned automatically by position — just write the note and publish it.

## Design Token Reference

Defined in `site/src/styles/tokens.css` as CSS custom properties; every color/size in components should derive from these rather than hardcoded values.

**Color — "Ink & Tangerine"**

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#FBF7EF` | Page background |
| `--ink` | `#1A1B23` | Text, borders, dark sections |
| `--tangerine` | `#FF5C00` | Primary accent: CTAs, marquee, focus ring |
| `--teal` | `#0E7C7B` | Secondary accent: links, tags |
| `--butter` | `#FFD23F` | Highlight: selection, sticker badges |
| `--blush` | `#FFC4B0` | Soft fill: card backgrounds |

**Typography**

| Role | Face | Usage |
|---|---|---|
| Display | Bricolage Grotesque (variable) | Headlines, weight 700–800 |
| Body | Instrument Sans | Paragraphs, UI text |
| Utility | Space Mono | Tickers, tags, captions |

**Shape:** `2px solid var(--ink)` borders, hard drop shadows (`6px 6px 0 var(--ink)`, pressing to `3px 3px 0` on hover), `12px` card radius, `999px` pill radius, spacing scale in steps of 4px (4/8/12/16/24/32/48/64/96/128).
