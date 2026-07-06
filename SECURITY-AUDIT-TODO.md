# Task: security audit pass

**For a future Claude session.** Read `CLAUDE.md` first — architecture, Strapi quirks (admin JWT recipes, rate limits, the read-only site token), and the verification workflow live there. Work in ranked order, one commit per change, verify each fix against the checks below, and stop rather than force a low-value change.

## Why this file exists

A quick triage (2026-07-06) confirmed real gaps — this is not speculative. Highlights: `cms/` has **33 known vulnerabilities in production deps (16 high, 11 moderate, 6 low)** per `npm audit --omit=dev`; the site sends **no security headers** (no CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy); CMS markdown is rendered through `marked` into `set:html` with **no sanitizer** and marked passes raw HTML through. Production context: home lab behind a Cloudflare Tunnel (CGNAT), so app-level hardening is the part the repo controls.

## Already verified OK (2026-07-06) — don't redo, just spot-check

- Public content API is token-gated: unauthenticated `GET /api/projects` → 403.
- `STRAPI_TOKEN` is read-only (all writes/uploads via `/api/*` → 403), server-only (no `PUBLIC_` prefix), and absent from `site/dist/client/`.
- No `.env` was ever committed; secrets exist only in gitignored files. The old placeholder admin password visible in git history (`README.md`) is dead — credentials were rotated 2026-07-06 (see CLAUDE.md → Strapi quirks for where they live).
- Admin login is rate-limited (5 / 5 min, `koa2-ratelimit`).
- `site/` prod deps: `npm audit --omit=dev` → 0 vulnerabilities.
- `/photography?category=` input is validated against the category enum before use; Astro escapes template interpolation by default.
- `astro.config.mjs` `image.remotePatterns` restricts `/_image` sources to `localhost:1337`.

## Ranked checklist

### P1 — patch the Strapi dependency tree (highest value, known risk)
`cd cms && npm audit --omit=dev` and work the list: upgrade Strapi to the latest 5.x patch release first (that alone usually clears most), then `npm audit fix` the rest; document any residuals that have no fix as accepted-with-reason here. ⚠️ Strapi upgrades regenerate types and can change admin behavior — stop the dev server first (CLAUDE.md scaffolding gotcha), and afterwards verify: admin panel loads, one entry publishes, public API responses unchanged (`403` unauth, `200` with token, same shapes).

### P2 — add HTTP security headers
`site/src/middleware.ts` already exists (the `locals.about` memo) — extend it to set headers on HTML responses: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`), `Permissions-Policy` minimal. **CSP needs care:** Astro inlines small scripts, `Lightbox.tsx` injects a `<style>` tag, and components use inline `style` attributes — start with `Content-Security-Policy-Report-Only`, browse all five pages + lightbox + easter eggs ("meow", konami) watching the console, then enforce. HSTS belongs at the Cloudflare layer (TLS terminates there) — note it for the owner, don't fake it app-side.

### P3 — sanitize CMS markdown before `set:html`
`marked.parse()` output goes into `set:html` in `about.astro` (bio) and `projects/[slug].astro` (body) unsanitized; marked passes raw HTML through, so one compromised admin session = persistent XSS for every visitor. Add a server-side sanitizer (e.g. `sanitize-html`) around both call sites, allowlisting the tags markdown actually produces. First check existing CMS content for intentional raw HTML (Handoff.md §10 seed copy is plain markdown). Verify with a throwaway project entry containing `<script>alert(1)</script>` + normal markdown via the admin-JWT recipe in CLAUDE.md (script stripped, bold/links/lists intact), then delete it (cleanup recipe in CLAUDE.md).

### P4 — confirm the exposure surface with the owner (infra, document only)
Both dev servers bind `0.0.0.0` by design (LAN access). For production, confirm the Cloudflare Tunnel maps **only** the Astro site — the Strapi admin (`:1337/admin`) must not be internet-reachable; if remote admin access is wanted, it belongs behind Cloudflare Access or Tailscale (already in the stack). This is config outside the repo: ask, then record the decision in CLAUDE.md. Related owner notes: `/_image` accepts arbitrary `w`/`h` for allowed sources (resize-abuse → Cloudflare caching/rate rules), and prod must run `NODE_ENV=production` (no Astro dev toolbar, Strapi without autoReload).

### P5 — small items
- Check `cms/config/middlewares.ts` CORS/defaults are stock-sane (public API is token-gated regardless).
- README documents API-token creation; confirm it also says tokens are shown once and how to rotate (`site/.env`).
- `npm audit` both projects once more at the end; record final counts here.

### Explicitly out of scope
- Changing the read-only-token model or making the content API anonymously readable.
- Rotating `APP_KEYS`/`JWT_SECRET`s casually (kills sessions; only if leakage is suspected).
- Cloudflare/Proxmox/tunnel changes themselves — document recommendations for the owner instead.

## Definition of done

Every checklist item is either fixed (with the verification evidence noted here), verified-OK, or explicitly deferred with a reason. `npx astro check` clean; all five pages render at narrow + wide viewports (Playwright loop per CLAUDE.md) including the lightbox; admin panel and publish flow still work. Durable outcomes (headers added, sanitizer convention, exposure decision) move into CLAUDE.md. Delete this file in the final commit of the pass.

## Results

_(fill in as you go)_

| Item | Check | Before | After |
|---|---|---|---|
