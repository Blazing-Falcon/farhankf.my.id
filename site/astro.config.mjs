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

  image: {
    remotePatterns: [{ protocol: 'http', hostname: 'localhost', port: '1337' }]
  }
});