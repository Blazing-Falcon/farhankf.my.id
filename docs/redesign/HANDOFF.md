# Redesign Handoff

This document hands the farhankf.my.id redesign to the agent who will plan and
carry out the migration in the real codebase. The design is decided. No site
code has been changed yet.

Your job has two parts, in this order:

1. Write a detailed implementation plan against the actual code and get the
   owner's approval.
2. Migrate the site to the new design without breaking anything that works
   today.

Read this whole file first, then open the reference files.

## Reference Files

| File | What It Is |
|---|---|
| `docs/redesign/mock.html` | The interactive mockup. Open it in a browser. It starts on the locked design. Use "Preview size" to see phone and tablet. |
| `docs/redesign/screens/desktop-*.webp` | Screenshots of each page at desktop width, dark theme. |
| `docs/redesign/screens/phone-*.webp` | The same pages at 390px. |

The mockup is the visual source of truth. Where this document and the mockup
disagree on a measurement, the mockup wins. Where they disagree on scope or
behaviour, this document wins.

The mockup is an explorer that still contains every option that was
considered. Only the locked combination below is the design. In its CSS, the
active rules are the base rules plus the selectors for these classes on
`#mock`: `sk-min` (without `sk-plain`), `hp-bio`, `t-dark` or `t-light`,
`c-medium`, `a-orange`, `f-mono`, `ib-right`, `g-box`, `hd-line`, `ft-wiki`,
`he-footer`, `hx-changes`, `hi-intro`, `ls-rows`, `pi-infobox`, `tr-orig`,
`pn-scroll`, `pb-compact`, `ps-open`. Ignore every other skin and variant.

The mockup shows `farhankf.my.id/wiki/...` in its fake address bar. That is
decoration. **Do not change the site's URLs.**

## Locked Design

| Area | Decision |
|---|---|
| Direction | A wiki article layout: infobox, sections with ruled headings, contents box, categories. No left sidebar. |
| Site name | `farhankf` (was `farhankf.cat`). Domain unchanged. |
| Palette | Gruvbox, dark and light, medium contrast. |
| Default theme | Dark. A header toggle switches to light and the choice persists. |
| Accent | Orange, used for links and the current-page marker. |
| Typeface | One monospace family everywhere. |
| Header | Single line: wordmark, links, theme toggle. |
| Homepage | An article: title, intro, infobox, contents, then sections. |
| Homepage infobox | "Intro block": the infobox shares the top with the intro and contents, and every section below starts under it at full width. |
| Lists (projects, posts) | Rows: date or year on the left, then title, summary, small meta line. No tables. |
| Project cover image | Inside the infobox. |
| Photo gallery | Framed boxes with captions ("commons boxes"). |
| Images | Original colours, no filter. |
| Footer | Three quiet lines: last edited, a row of links, how the site is built. |
| History | A "View history" link in the footer, opening a Recent Changes page. |
| Phone navigation | One row of links that scrolls sideways. |
| Phone infobox | Compact: small image on the left, facts beside it. |
| Phone sections | Open, not collapsed. |

Wiki furniture that is **on**: contents box, notice banners, categories bar,
new-page ("red") links.

Wiki furniture that is **off**: `[edit]` links, hatnotes, `[citation needed]`
marks, Talk and History tabs, link hover previews, ASCII cat logo, language
switch, search box.

Removed from the site entirely: the ticker, sticker badges, hard shadows,
graph-paper background, tilted cards, the fake terminal in the hero, scroll
reveal animations, easter eggs, and all cat illustrations.

## Design Tokens

### Colour

| Token | Dark | Light | Use |
|---|---|---|---|
| `--page` | `#282828` | `#fbf1c7` | Page background |
| `--bg1` | `#3c3836` | `#ebdbb2` | Infobox, contents box, banners, code, gallery frames |
| `--bg2` | `#504945` | `#d5c4a1` | Quiet rules: footer rule, code border, row separators |
| `--bg3` | `#665c54` | `#bdae93` | Borders and heading rules |
| `--fg` | `#ebdbb2` | `#3c3836` | Body text |
| `--fg0` | `#fbf1c7` | `#282828` | Headings, wordmark, current nav item |
| `--mute` | `#a89984` | `#7c6f64` | Meta text, captions, summaries in lists |
| `--link` (orange) | `#fe8019` | `#af3a03` | Links, current-page underline, selection |
| `--red` | `#fb4934` | `#9d0006` | Links to pages that do not exist yet |
| `--yellow` | `#fabd2f` | `#b57614` | Default notice banner stripe |
| `--blue` | `#83a598` | `#076678` | Informational banner stripe |
| `--green` | `#b8bb26` | `#79740e` | "post" type tag on Recent Changes |
| `--purple` | `#d3869b` | `#8f3f71` | "code" type tag on Recent Changes |

Replace the current "Ink & Tangerine" tokens in
`site/src/styles/tokens.css`. Keep the rule that components use tokens and
never hardcode hex values.

### Type

- One family: IBM Plex Mono, weights 400 and 700 (600 is used for a few
  labels; 700 is an acceptable substitute if you load only two weights).
- Body: 14.5px, line height 1.6.
- `h1`: 1.5em, weight 700, 1px `--bg3` rule underneath. 1.45em on phones.
- `h2`: 1.1em, weight 700, 1px `--bg3` rule underneath, margin `1.3em 0 .5em`.
- "From farhankf" line under each `h1`: 0.82em, `--mute`.
- Paragraphs: max width 70ch, margin-bottom 0.9em.

Fonts must be self-hosted. See the CSP note under Constraints.

### Layout

- One centered column, max width 50rem, side padding 22px (14px on phones).
- Single breakpoint at 680px.
- Links have no underline at rest and an underline on hover.

## UI Layout

### Page Shell, Desktop

```
+------------------------------------------------------------------+
| farhankf   Main page  Farhan  Projects  Blog  Photography  Links  [light] |
+------------------------------------------------------------------+   <- 1px rule
|                                                                  |
|  Page Title                                                      |
|  ----------------------------------------------------------      |
|  From farhankf                                                   |
|                                                                  |
|  ( page body, see the page types below )                         |
|                                                                  |
|  +------------------------------------------------------------+  |
|  | Categories: | First | Second                               |  |
|  +------------------------------------------------------------+  |
|  ------------------------------------------------------------    |
|  This page was last edited on <date>. View history.              |
|  About farhankf . Links . Random page . GitHub                   |
|  Built with Astro + Strapi, self-hosted on Proxmox.              |
+------------------------------------------------------------------+
```

Header details: the wordmark is bold and larger (1.35em). The current page's
link is `--fg0`, bold, with a 2px orange underline. The theme toggle is a
small bordered text button that names the theme it switches to ("light" while
dark is active).

### Page Shell, Phone

```
+------------------------------+
| farhankf            [light]  |
| Main page Farhan Projects Bl>|   <- one row, scrolls sideways, fades at right
+------------------------------+
| Page Title                   |
| ---------------------------- |
| From farhankf                |
| ( body, single column )      |
| [ Categories: | A | B ]      |
| ---------------------------- |
| footer lines, wrapping       |
+------------------------------+
```

### Article Pages (About, Project, Blog Post), Desktop

```
  Title
  ------------------------------------------------------------
  From farhankf
  [ notice banner, only when one applies                      ]
                                              +---------------+
  Lead paragraph, the first sentence          |    Title      |
  starts with the subject in bold.            |  [ image ]    |
                                              |---------------|
  +----------------+                          | Label  value  |
  | Contents       |                          | Label  value  |
  | 1. Section     |                          | Label  value  |
  | 2. Section     |                          +---------------+
  +----------------+
  Section
  ------------------------------------------------------------
  Body text wraps beside the infobox while it lasts, then
  runs the full column width.
```

The infobox floats right, 17rem wide, with a 22px left margin. The contents
box sits directly before the first `h2` and only appears when the page has at
least two `h2` headings.

A blog post adds one meta line under "From farhankf": date, category, reading
time. It ends with "Older" and "Newer" links in a row above the categories
bar.

### Article Pages, Phone

```
  Title
  ----------------------------
  From farhankf
  [ notice banner ]
  +--------------------------+
  | Title                    |
  | [img]  Label    value    |   <- image 84px, floated left
  | 84px   Label    value    |
  +--------------------------+
  Lead paragraph ...
  +----------------+
  | Contents       |
  +----------------+
  Section
  ----------------------------
```

### Homepage

Same article shape. Sections in order:

1. Title (the current hero headline) and "From farhankf".
2. Intro paragraph on the left, infobox on the right (image capped at 150px
   wide here), contents box under the intro.
3. The first `h2` clears the infobox, so everything from here is full width.
4. **Featured projects**: rows, then "See all projects".
5. **Latest posts**: the three newest posts as rows, then "See all posts".
6. **Photography**: one line of text, a three-image strip (3:2 crops), link to
   the gallery.
7. **Lab notes**: a two-column definition list (title, body).
8. **See also**: a short bullet list of links.

### List Pages (Projects, Blog)

```
  Title
  ------------------------------------------------------------
  From farhankf
  Lead sentence.
  All  Category  Category  Category          <- Blog only, text links

  2025        Project Title
              One or two lines of summary in muted text.
              Status . Stack . Stats           <- small muted meta line

  12 Oct 2026 Post Title
              Summary in muted text.
              Category . 6 min read
```

Row grid: a 6.2em first column, then the content. On phones the date moves
above the title and the row becomes one column.

### Photography

```
  Photography
  ------------------------------------------------------------
  Lead sentence.
  All  street  landscape  astrophotography  cat  ...

  +---------+ +---------+ +---------+ +---------+
  | [photo] | | [photo] | | [photo] | | [photo] |
  | Title   | | Title   | | Title   | | Title   |
  | gear.date| ...
  +---------+ +---------+ +---------+ +---------+
```

Grid: `repeat(auto-fill, minmax(150px, 1fr))`, 10px gap. Each figure is a
bordered `--bg1` box with 8px padding; the image is contained within 150px of
height, uncropped. Two columns on phones.

### Links

Title, one lead sentence, then a plain bullet list: label, then the linked
handle. External links carry a small arrow.

### Recent Changes

```
  Recent changes
  ------------------------------------------------------------
  New posts, projects, photos and code changes, newest first.

  12 Oct 2026
  ------------------------------
  post     Post Title
  28 Aug 2026
  ------------------------------
  code     fix(site): ...
  code     fix(cms): ...
  Jun 2026
  ------------------------------
  photo    Photo Title, Photo Title
```

Entries are grouped under a date heading. Each entry has a small coloured
type tag (post, project, photo, code) in a 4.6em column.

## Component Specs

| Component | Spec |
|---|---|
| Infobox | Border 1px `--bg3`, background `--bg1`, padding 10px, text 0.86em. Title centered and bold. Image centered, max 200px wide. Facts are a two-column grid (6.2em label, bold) with a 1px rule above. |
| Contents box | `display: table`, border 1px `--bg3`, background `--bg1`, padding `8px 14px 8px 10px`, text 0.88em. Bold centered "Contents", then a numbered list. |
| Notice banner | Border 1px `--bg3` with an 8px coloured left edge, background `--bg1`, padding `6px 12px`, text 0.9em, max width 46rem. |
| Categories bar | Border 1px `--bg3`, background `--bg1`, padding `5px 10px`, text 0.86em, margin-top 1.6em. "Categories:" then links separated by a muted bar. |
| Row list | Described under List Pages. Title weight 600. |
| Code block | Background `--bg1`, border 1px `--bg2`, padding `10px 12px`, text 0.86em, scrolls sideways inside its own box. |
| Figure in an article | Full column width, caption below at 0.84em in `--mute`. Caption and source come from the CMS image block. |
| Gallery row in a project | Three equal columns, 6px gap. |
| Footer | Text 0.82em in `--mute`, 1px `--bg2` rule above, three lines. |
| New-page link | Same as a link, coloured `--red`. |

## Content Decisions

- The wordmark and every "farhankf.cat" become "farhankf".
- The **supervision committee** is gone: the committee section on About, the
  per-cat staff files, and the "Supervisors: cats" row in the profile facts
  (`site/src/lib/profileFacts.ts`).
- The owner said earlier that cats may be reduced but not removed entirely.
  These cat mentions have **not** been ruled on and should stay as they are
  until the owner says otherwise: the headline "Data, pixels, & one shy cat.",
  the two lab notes that mention cats, and the cat photos.
- The old footer's "systemctl status cats" line and cat fact are not part of
  the chosen footer.
- The mockup's dummy projects, dummy blog posts, and filler paragraphs are
  layout tests. Do not add them to the CMS or the seed data.
- The mockup bolds the subject at the start of each lead sentence. On About
  it prefixes the owner's tagline with their name. Confirm with the owner
  before rewriting any CMS copy.

## Mapping to the Codebase

The site is `site/` (Astro SSR, node standalone adapter, one React island)
and `cms/` (Strapi 5 on SQLite). Read `docs/development.md` and
`docs/deploy.md` before planning.

### Keep As Is

- All routes: `/`, `/about`, `/projects`, `/projects/[slug]`, `/blog`,
  `/blog/[slug]`, `/photography`, `/links`, `/media/[...path]`,
  `/robots.txt`, `/sitemap.xml`, and the 404 page.
- `site/src/lib/strapi.ts` data fetching, the 60 second cache, and the media
  URL helpers.
- `site/src/middleware.ts` security headers and the CSP rewrite.
- `site/src/lib/markdown.ts` sanitising, `site/src/lib/youtube.ts`.
- Everything SEO in `site/src/layouts/Layout.astro`: canonical URL, Open
  Graph and Twitter tags, JSON-LD. The `OWNER` constant stays the full name.
- Category filtering through the `?category=` query parameter on Blog and
  Photography.
- The PDF viewer and YouTube embed behaviour in
  `site/src/components/ArticleContent.astro` and `PdfViewer.astro`. Restyle
  only.
- Graceful degradation: when Strapi is down, pages render an empty state
  instead of a 500, and the sitemap returns 503.

### Rewrite or Restyle

- `site/src/styles/tokens.css` and `global.css`: new tokens, new base styles,
  both themes.
- `site/src/layouts/Layout.astro`: theme attribute on `<html>`, new
  `theme-color`, drop the easter-egg templates and the two script tags.
- `site/src/components/Header.astro` and `Footer.astro`.
- Every page under `site/src/pages/`: new markup and scoped styles.
- `site/src/components/ArticleContent.astro`: block styling.
- `site/src/components/EmptyState.astro`: becomes a plain notice banner with
  no cat.
- `site/src/components/ResearcherProfile.astro`: becomes, or is replaced by,
  the infobox.
- `site/src/components/ProjectCard.astro`: becomes a row.
- `site/src/pages/404.astro`.

### Remove

- `site/src/components/cats/` (18 files), `StickerBadge.astro`,
  `Ticker.astro`, `TechPill.astro` if nothing uses it afterwards.
- `site/src/scripts/easter-eggs.ts` and `motion.ts`, plus every `data-reveal`
  and `data-tilt` attribute.
- The `getCats()` and `getTicker()` calls in the pages. Leave the functions
  in `strapi.ts` only if something still imports them.
- The three old font packages, once nothing imports them.

### Add

- An infobox component, a contents box, a notice banner, a categories bar,
  and a row list.
- Heading ids on rendered markdown so the contents box can link to sections.
  `markdown.ts` currently strips ids; the sanitiser allowlist needs `id` on
  headings, and the ids must be generated by the site, never taken from CMS
  HTML.
- `/changes`: the Recent Changes page.
- A Random page link target, for example a `/random` route that redirects to
  a random published page.
- "Latest posts" on the homepage (three newest, without article bodies; use
  `getBlogPosts({ withContent: false })`).
- A "last edited" date in the footer. Decide in the plan where it comes from
  (the page's own `updatedAt` where one exists is the honest choice).

### Infobox Fields

| Page | Image | Fields | Source |
|---|---|---|---|
| Home, About | Portrait | Field, Based in, Coffee intake, Uptime | `profileFacts.ts` and the About single type |
| Project | Cover image | Year, Status, Stats, Stack | `finishedAt`, `difficulty`, `stats`, `techStack` |
| Blog post | Cover image | Published, Category, Reading time | `publishedDate`, `category`, `readTime` |

A missing field is omitted. A missing image leaves the infobox without one.

## CMS Impact

Plan for **no schema changes in the first release**.

- The Cat and Ticker content types stay in Strapi and are simply no longer
  read. Removing a content type makes Strapi drop its table on the next boot.
  If the owner wants them gone, do it as a separate, later change with a
  backup of `cms/data/data.db` first.
- Lab notes, social links, photos, photo categories, blog posts, blog
  categories, projects and About are used as they are.
- All real content lives in the SQLite file and the uploads directory, which
  are not in git. You cannot see production content from the repo. The
  public site at `https://farhankf.my.id` shows what is published.

## Constraints and Pitfalls

- **CSP.** `site/astro.config.mjs` sets a hash-based Content Security Policy
  and `default-src 'self'`. No external font or script hosts will load. Use
  an `@fontsource` package for the font, as the current fonts do. The mockup
  loads Google Fonts only because it is a standalone file.
- **Inline styles.** `build.inlineStylesheets` is `'never'` and the
  middleware rewrites `style-src` so inline `style=""` attributes work. Read
  the comments in `astro.config.mjs` and `middleware.ts` before touching
  either. The redesign needs far fewer inline styles, but do not loosen the
  policy.
- **Theme without a flash.** The site is server-rendered per request, so the
  theme choice can live in a cookie that the server reads to set the
  attribute on `<html>`. That avoids an inline script and a flash of the
  wrong theme. If you prefer a script, confirm against the current Astro
  docs how inline scripts get CSP hashes before relying on it.
- **Images.** Server-side images go through `astro:assets` with
  `mediaUrl()`. Anything the browser fetches directly must use
  `publicMediaUrl()`, because the Strapi origin is not reachable from a
  browser. Keep `sharp` in the production image (see the Dockerfile comment).
- **React.** The only island is the photo lightbox. Keep it, restyled, for
  the first release. The mockup opens a per-photo page instead; treat that as
  optional later work.
- **Mono text is wide.** Long words and URLs overflow narrow columns sooner
  than in a proportional font. Check `overflow-wrap` on body text and make
  code blocks and tables scroll inside their own box.
- **Deploy.** The owner deploys by copying the project and running
  `docker compose up -d --build`. A new npm dependency needs an updated
  `package-lock.json`, because the Dockerfile runs `npm ci`.
- **Search and languages are out.** Do not build either.

## Known Issues Found Before the Redesign

These exist today. Do not make them worse, and raise them in your plan.

1. `cms/.dockerignore` excludes `database`, and `cms/Dockerfile` only creates
   an empty `database/migrations`. Strapi loads migrations from
   `<app root>/database/migrations`, so the three category migrations never
   run in the Docker image.
2. `npm audit --omit=dev` reports vulnerabilities in both apps, including a
   critical advisory against the installed Astro range.
3. `cms/src/index.ts` grants the public role read access to every content
   type, while `docs/development.md` says the API is not anonymously
   readable.
4. `SEED_EXAMPLES` is read two ways: any non-empty value in the CMS, exactly
   `true` in the site.
5. Uploaded SVGs are served same-origin through `/media` without a CSP.
6. The README and `docs/development.md` say Astro 5; `package.json` has
   Astro 7. `docs/deploy.md` refers to a `portfolio/` directory.
7. `site/public/og.png` may still carry the old branding. Check it and
   regenerate it if so.

## Open Decisions for the Owner

Ask these before or while writing the plan. Each has a recommended default.

| Question | Recommended Default |
|---|---|
| Does Recent Changes include git commits? The Docker build has no `.git`. | Content only (posts, projects, photos by their dates) in the first release. Commits later through a generated JSON file. |
| When do notice banners appear? The mockup's banner texts were written for the mockup. | Only from real state: an empty Blog ("nothing published yet") and projects with the "ongoing saga" difficulty. |
| What are a page's categories? | Blog posts show their category. Photography shows photo categories. Other pages show no categories bar until a taxonomy exists. |
| What counts as a new-page (red) link? | A manual style for links to content that is not published. No automatic detection. |
| Keep the lightbox or build per-photo pages? | Keep the lightbox. |
| Follow the visitor's system theme on first visit, or always start dark? | Always start dark, as picked. |
| Which remaining cat mentions stay? | Leave copy unchanged until told. |
| Remove the Cat and Ticker content types from Strapi? | Not in this release. |

## Migration and Verification

The owner's requirement is that nothing breaks. Build the plan around that.

### Before Changing Anything

Record a baseline from the current site so you can compare afterwards:

- Every route and its status code, including one project detail page, the
  404 page, `/robots.txt` and `/sitemap.xml`.
- For each page: `<title>`, meta description, canonical URL, Open Graph tags,
  and the JSON-LD block.
- The response headers set by the middleware, including the CSP.
- `npx astro check` and `npm run build` results in `site/` (both pass today:
  0 errors, 0 warnings).

You will need a running Strapi with content to render real pages. The repo
has seed code behind `SEED_EXAMPLES`; see `docs/development.md` for setup.

### Suggested Order

1. Tokens, fonts, base styles, and the theme mechanism.
2. Header and footer.
3. Shared components: infobox, contents box, banner, categories bar, rows.
4. Pages one at a time: About, project detail, blog post, Projects, Blog,
   Photography, Links, homepage, 404.
5. New routes: Recent Changes, Random page.
6. Delete dead components, scripts, fonts and tokens.
7. Update `docs/development.md` (design system section) and the README.

Keep each step a separate commit that builds and type-checks on its own.

### Checks Before Calling It Done

- `npx astro check` reports 0 errors and `npm run build` succeeds.
- Every baseline route returns the same status code as before.
- Titles, descriptions, canonical URLs, Open Graph tags and JSON-LD match the
  baseline, apart from intended wording changes.
- The sitemap lists the same URLs plus any new routes you decide to include.
- Response headers and the CSP match the baseline, and the browser console
  shows no CSP violations on any page.
- With Strapi stopped, every page still renders with an empty state.
- Each page looks right at 390, 768 and 1280 pixels wide, in dark and light,
  with no horizontal page scroll. Compare against `docs/redesign/screens/`.
- The theme toggle persists across pages and reloads with no flash.
- Blog and Photography category filters work through `?category=`.
- The PDF viewer loads a document and the YouTube embed plays.
- The lightbox opens, moves between photos, and closes with the keyboard.
- Keyboard focus is visible on every link and control, and the skip link
  works.
- `docker compose build` succeeds for the site image.

The repo has no test suite. A small Playwright script that loads every route
at the three widths and fails on console errors or horizontal overflow is the
one test worth adding, because it guards the whole migration.

## Working Agreements

- Work on a branch and open no pull request unless the owner asks.
- Conventional Commits, no attribution trailers.
- Present the plan and the open decisions first. Start implementation after
  the owner approves.
- Challenge anything in this document that the code contradicts, with
  evidence.
