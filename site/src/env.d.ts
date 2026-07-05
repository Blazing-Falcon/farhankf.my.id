/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Per-request memoized getAbout() — see src/middleware.ts. */
    about: () => Promise<import('./lib/strapi').About | null>;
  }
}

interface ImportMetaEnv {
  readonly STRAPI_URL: string;
  readonly STRAPI_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
