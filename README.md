# juan.cat — Portfolio

Self-hosted portfolio site for Juan: statistics/ML student, photographer, home lab enthusiast, and tabletop RPG player. Astro (SSR) frontend with React islands, Strapi 5 CMS, GSAP motion.

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
