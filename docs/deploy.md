# Deploying with Docker

The stack is two containers built from `cms/Dockerfile` and `site/Dockerfile`,
wired together by `docker-compose.yml`. The site reaches Strapi over the
internal compose network (`http://cms:1337`); on the host, two ports are
published:

| | host port | who should reach it |
|---|---|---|
| site | `7100` | the world, via the Cloudflare Tunnel |
| admin | `7108` | you only — LAN / Tailscale |

Both bind all interfaces, so they work over Tailscale (a `127.0.0.1` binding
accepts loopback only, so a request arriving on the `tailscale0` interface
never lands). **This assumes the host is not directly internet-exposed.** On a
public VPS, `7108` would put the Strapi admin on the internet — bind it to the
Tailscale IP there instead: `"100.x.y.z:7108:1337"`.

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
# site:  http://localhost:7100
# admin: http://localhost:7108/admin
```

Both are also reachable from any other machine on the LAN or Tailscale, at
`http://<host-ip>:7100` / `:7108`.

`docker compose down` tears it down; content is untouched (it lives in the bind
mounts). The dev servers use different ports (`4321`/`1337`), so they can run
alongside the containers — but they share the same SQLite file, and two
processes writing it will corrupt it. Run one or the other, not both.

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

Open `http://<host>:7108/admin` over the LAN or Tailscale. The admin must never
be *internet*-reachable — keep it out of the Cloudflare Tunnel, and if the host
ever gets a public IP, bind the port to the Tailscale address as noted above.

## Exposing the site

Front `:7100` with the Cloudflare Tunnel (map the tunnel to
`http://<host>:7100` — the site only, never `:7108`). HSTS and caching/rate
rules for `/_image` belong in the Cloudflare dashboard.

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
