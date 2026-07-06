// @ts-check
import { defineConfig } from 'astro/config';

import node from '@astrojs/node';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'server',

  prefetch: true,

  adapter: node({
    mode: 'standalone'
  }),

  integrations: [react()],

  build: {
    // Keep all styles as external <link>s: if any stylesheet were inlined,
    // Astro's CSP would emit a style-src hash for it, and a hash in style-src
    // makes browsers ignore 'unsafe-inline' — killing every inline style=""
    // attribute the design relies on (cat fills, card tilts, ticker timing).
    inlineStylesheets: 'never'
  },

  security: {
    // Hash-based CSP: Astro emits sha256 hashes for exactly the inline
    // scripts it renders, so injected <script> (e.g. via CMS content) won't
    // execute. Delivered as a <meta> tag; frame-ancestors and the other
    // response headers live in src/middleware.ts (meta CSP can't carry them).
    csp: {
      scriptDirective: { resources: ["'self'"] },
      styleDirective: { resources: ["'self'", "'unsafe-inline'"] },
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
      ]
    }
  },

  image: {
    remotePatterns: [{ protocol: 'http', hostname: 'localhost', port: '1337' }]
  }
});