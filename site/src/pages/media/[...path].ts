import type { APIRoute } from 'astro';

// Strapi is only published on the private/admin side, so its origin is not
// reachable from a browser. Media the browser fetches directly — PDF sources,
// download links, plain <img> — goes through here instead, keeping every asset
// same-origin. <Image> does not use this route: Astro fetches those server-side.
const STRAPI_URL = process.env.STRAPI_URL ?? import.meta.env.STRAPI_URL;

export const GET: APIRoute = async ({ params, request }) => {
  const path = params.path ?? '';

  // Confine the proxy to the upload directory; anything else would expose the
  // whole Strapi origin, admin routes included.
  if (!/^uploads\/[A-Za-z0-9._\-/]+$/.test(path) || path.includes('..')) {
    return new Response('Not found', { status: 404 });
  }

  const range = request.headers.get('Range');
  let upstream: Response;
  try {
    upstream = await fetch(`${STRAPI_URL}/${path}`, {
      headers: range ? { Range: range } : undefined,
    });
  } catch {
    return new Response('Bad gateway', { status: 502 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response('Not found', { status: upstream.status === 404 ? 404 : 502 });
  }

  const headers = new Headers();
  for (const name of ['Content-Type', 'Content-Length', 'Content-Range', 'ETag', 'Last-Modified']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  // pdf.js asks for byte ranges; without this it downloads whole documents.
  headers.set('Accept-Ranges', 'bytes');
  // Strapi appends a content hash to every upload filename, so a stored file
  // never changes under the same URL.
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(upstream.body, { status: upstream.status, headers });
};
