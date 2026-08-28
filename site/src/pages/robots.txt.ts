import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site, url }) => {
  // Staging and preview deploys serve the same code on a different host; only
  // the configured public origin may be indexed, and the sitemap it advertises
  // has to point at whatever host the crawler actually reached.
  const isProduction = site !== undefined && url.host === site.host;
  // TLS terminates upstream, so the request origin is http even in production;
  // the configured site carries the scheme crawlers should actually use.
  const sitemapBase = isProduction ? site.origin : url.origin;
  const body = `User-agent: *
${isProduction ? 'Allow: /' : 'Disallow: /'}

Sitemap: ${new URL('/sitemap.xml', sitemapBase).href}
`;

  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
