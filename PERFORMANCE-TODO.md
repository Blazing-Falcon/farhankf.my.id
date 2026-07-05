# Task: performance optimization pass

**For a future Claude session.** Read `CLAUDE.md` first — it has the architecture, the dev-loop gotchas, and the verification workflow this task depends on. Work in ranked order, one commit per change, measure before/after for every item, and stop rather than force a low-value change.

## Why this file exists

A code audit (2026-07-05) confirmed real optimization headroom — this is not speculative. Baseline on local dev hardware: homepage TTFB ≈ 0.08–0.12s, homepage HTML ≈ 151KB, GSAP 72KB min served on every page, and every page view triggers 2–5 uncached Strapi round-trips. The production target is Juan's home lab (Proxmox, reverse-proxied through Cloudflare Tunnel behind CGNAT), where every wasted round-trip and byte costs far more than on localhost.

## Measurement protocol (do this first, and after every change)

- TTFB: `for i in 1 2 3; do curl -s -o /dev/null -w "%{time_total}s\n" http://localhost:4321/; done` (all five pages).
- Page weight + requests: drive headless Chromium via the npx-cached Playwright (finding it: see CLAUDE.md → Dev loop) and read `performance.getEntriesByType('resource')` totals; or run Lighthouse if available.
- Record numbers in this file under "Results" as you go. A change that doesn't move a number gets reverted, not shipped.

## Ranked opportunities

### P1 — kill the duplicate `getAbout()` (guaranteed win, low risk)
`Footer.astro` calls `getAbout()` on **every page**, and `index.astro` / `about.astro` call it again — two identical Strapi requests per view. Options: per-request memoization inside `strapi.ts` (a module-level cache keyed by URL that lives for one request is NOT safe in SSR — requests interleave; use `Astro.locals` via middleware, or accept a tiny TTL cache, see P2). Simplest correct fix: fetch once in a middleware/layout and pass `email`/`githubUrl` to Footer as props.

### P2 — small TTL cache for Strapi responses in `strapi.ts`
Content changes rarely (owner edits via admin UI). A 30–60s in-memory TTL cache around `strapiFetch` collapses all per-view Strapi round-trips after first hit and keeps content near-fresh. Keep the existing try/catch + `EmptyState` behavior; on cache miss + Strapi down, pages must degrade exactly as today. Invalidation nicety (optional): accept a `?nocache` param or short TTL only.

### P3 — right-size images
`<Image>` calls pass the media's natural `width`/`height`, so thumbnails can ship far larger files than their rendered size (committee cards ~170px, polaroids ~220px, project covers ~45% column). Use `width` + `widths`/`sizes` for responsive srcset on: `ProjectCard` cover, homepage polaroids, photography masonry thumbs, colony portraits, about portrait. Do NOT shrink the lightbox images (they're intentionally full-size, precomputed with `getImage()` in `photography.astro`). ⚠️ Remember the `height: auto` / `aspect-ratio` gotcha in CLAUDE.md.

### P4 — stop over-fetching with `populate=*`
`getProjects()` pulls full markdown `body` + `gallery` for every project on list pages that render neither. Switch list queries to explicit `fields=[...]` + targeted `populate[coverImage]=true`; keep full populate only in `getProjectBySlug`. Note: a quick test of the `fields` syntax returned an empty response — verify the exact Strapi 5 query syntax against its docs before assuming it works, and confirm json fields (`techStack`, `stats`) are includable via `fields`.

### P5 — replace or defer GSAP (measure the tradeoff honestly)
72KB min (+ScrollTrigger) on every page powers: hero line slide-up, scroll fade-reveals, one parallax paw. All are achievable with IntersectionObserver + CSS transitions at ~1KB. Alternatives in ascending effort: (a) `import()` GSAP dynamically so it doesn't block, (b) rewrite `motion.ts` without GSAP. If rewriting: keep the `data-reveal` contract (base CSS must never hide content — see CLAUDE.md), keep timings/easings feeling identical, and verify side-by-side screenshots.

### P6 — one-liners
- Enable Astro prefetch (`prefetch: true` in `astro.config.mjs`, `data-astro-prefetch` on nav links).
- Check Fontsource imports in `global.css` for unused weights (instrument-sans 400/500/600, space-mono 400/700 — confirm all are actually used before cutting).

### Explicitly out of scope
- Switching rendering modes (SSR stays; no static builds — content must reflect Strapi edits).
- Anything that changes the visual design, the cat behavior, or the reduced-motion decision (see CLAUDE.md ⚠️ notes).
- Infra-level work (reverse-proxy caching headers, CDN) — worth discussing with Juan separately, not code.

## Definition of done

Every shipped change has: before/after numbers recorded below, `npx astro check` clean, and screenshot verification (all five pages, narrow + wide viewport) confirming zero visual regressions. Granular commits per CLAUDE.md conventions. Delete this file in the final commit of the pass (its results move into CLAUDE.md if durable).

## Results

_(fill in as you go)_

| Change | Metric | Before | After |
|---|---|---|---|
