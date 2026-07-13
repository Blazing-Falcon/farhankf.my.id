import { defineMiddleware } from 'astro:middleware';
import { getAbout, type About } from './lib/strapi';

// Lazy per-request memo: pages and Footer share one getAbout() round-trip,
// and requests that never call it (e.g. /_image) never hit Strapi at all.
export const onRequest = defineMiddleware(async (context, next) => {
  let memo: Promise<About | null> | undefined;
  context.locals.about = () => (memo ??= getAbout());

  const response = await next();

  // Applies to every response type — stops MIME-sniffing on /_image etc. too.
  response.headers.set('X-Content-Type-Options', 'nosniff');

  if (response.headers.get('Content-Type')?.includes('text/html')) {
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-Frame-Options', 'DENY');
    // The Content-Security-Policy header comes from security.csp in
    // astro.config.mjs (SSR routes deliver it as a header) — never set() it
    // wholesale here, that would clobber Astro's script-src hashes.
    //
    // One surgical rewrite though: Astro hashes its islands-runtime <style>
    // (astro-island{display:contents}), and any hash in style-src makes
    // browsers ignore 'unsafe-inline' — which the design needs for its
    // ~20 inline style="" attributes (cat fills, card tilts, ticker timing)
    // and the <style> blocks inside the inline cat SVGs. Dropping the style
    // hashes keeps 'unsafe-inline' honored; script-src hashes stay intact.
    const csp = response.headers.get('Content-Security-Policy');
    if (csp) {
      response.headers.set(
        'Content-Security-Policy',
        csp.replace(/style-src [^;]*/, "style-src 'self' 'unsafe-inline'")
      );
    }
    response.headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
    );
  }
  // HSTS is deliberately absent: TLS terminates at Cloudflare, so it belongs
  // in the Cloudflare dashboard, not here.

  return response;
});
