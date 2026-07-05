import { defineMiddleware } from 'astro:middleware';
import { getAbout, type About } from './lib/strapi';

// Lazy per-request memo: pages and Footer share one getAbout() round-trip,
// and requests that never call it (e.g. /_image) never hit Strapi at all.
export const onRequest = defineMiddleware((context, next) => {
  let memo: Promise<About | null> | undefined;
  context.locals.about = () => (memo ??= getAbout());
  return next();
});
