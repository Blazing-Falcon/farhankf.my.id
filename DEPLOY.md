# Deploying with Docker

The stack is two containers built from `cms/Dockerfile` and `site/Dockerfile`,
wired together by `docker-compose.yml`. The site reaches Strapi over the
internal compose network (`http://cms:1337`); only the site's port is meant to
be reachable from outside.

**All persistent state lives in two host directories** (bind-mounted into the
CMS container):

- `cms/data/` — the SQLite database (all content)
- `cms/public/uploads/` — the media library

The containers themselves are disposable. Those two directories plus the two
`.env` files are the things that must survive.

## Run it locally

```bash
cd portfolio
docker compose up -d --build
# site:  http://localhost:4321
# admin: http://localhost:1337/admin (loopback only)
```

Stop your dev servers first (both want the same ports). `docker compose down`
tears it down; content is untouched (it lives in the bind mounts).

## First deploy to the VPS

1. Install Docker Engine + the compose plugin on the VPS.

2. Copy the project over — the whole directory works as-is, minus build
   artifacts (`node_modules` alone is hundreds of MB you don't need to send;
   the images build their own):

   ```bash
   rsync -av \
     --exclude node_modules --exclude dist --exclude .astro \
     --exclude .cache --exclude .git \
     portfolio/ user@vps:~/portfolio/
   ```

   Do **not** exclude `cms/data`, `cms/public/uploads`, `cms/.env`, or
   `site/.env` — that's your content and secrets; none of it is in git.
   (Consider stripping the credentials comment from the bottom of `cms/.env`
   before it leaves your machine.)

3. On the VPS:

   ```bash
   cd ~/portfolio && docker compose up -d --build
   ```

## Reaching the admin panel

`1337` is bound to loopback on purpose — the admin must not be
internet-reachable. From your machine:

```bash
ssh -L 1337:localhost:1337 user@vps
# then open http://localhost:1337/admin locally
```

## Exposing the site

Front `:4321` with the Cloudflare Tunnel (map the tunnel to
`http://localhost:4321`, site only — never `:1337`). Once the tunnel works,
tighten the site port in `docker-compose.yml` to `"127.0.0.1:4321:4321"` and
`docker compose up -d` again. HSTS and caching/rate rules for `/_image` belong
in the Cloudflare dashboard.

## Updating

- **Content** (admin UI edits, uploads): nothing to do — it's in the bind
  mounts, live immediately (minus the site's 60s response cache).
- **Code or schema changes**: rsync again (same excludes), then
  `docker compose up -d --build` on the VPS. Schema changes are baked into the
  image at build time, so a rebuild is required — restarting is not enough.

## Backups

Everything is `cms/data/data.db` + `cms/public/uploads/` + the two `.env`
files. A cron'd `tar` of those, shipped anywhere off the box, is a complete
backup. Restore = put the files back, `docker compose up -d`.
