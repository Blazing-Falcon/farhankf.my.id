import type { APIRoute } from 'astro';
import { getBlogPosts, getProjects } from '../lib/strapi';

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Returns a W3C date, or null for anything Date cannot parse — one bad value
// from the CMS must not take the whole sitemap down.
function lastmod(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
}

function urlEntry(loc: string, mod: string | null, changefreq: string, priority: string): string {
  return [
    '  <url>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    ...(mod ? [`    <lastmod>${mod}</lastmod>`] : []),
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n');
}

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = (site?.href ?? 'https://farhankf.my.id').replace(/\/$/, '');

  const staticRoutes = [
    { path: '/', changefreq: 'weekly', priority: '1.0' },
    { path: '/about', changefreq: 'monthly', priority: '0.8' },
    { path: '/projects', changefreq: 'weekly', priority: '0.9' },
    { path: '/blog', changefreq: 'daily', priority: '0.9' },
    { path: '/photography', changefreq: 'weekly', priority: '0.8' },
    { path: '/links', changefreq: 'monthly', priority: '0.6' },
  ];

  let blogPosts: { slug: string; publishedDate?: string | null }[];
  let projects: { slug: string; finishedAt?: string | null }[];

  try {
    [blogPosts, projects] = await Promise.all([
      getBlogPosts({ withContent: false }),
      getProjects(),
    ]);
  } catch {
    // Serving the static routes alone would tell crawlers that every post and
    // project URL was removed, and the cache header would hold that claim for
    // an hour. A 503 makes them retry instead.
    return new Response(null, { status: 503 });
  }

  const sitemapEntries = [
    ...staticRoutes.map((route) =>
      urlEntry(`${baseUrl}${route.path}`, null, route.changefreq, route.priority)
    ),
    ...projects.map((project) =>
      urlEntry(`${baseUrl}/projects/${project.slug}`, lastmod(project.finishedAt), 'monthly', '0.8')
    ),
    ...blogPosts.map((post) =>
      urlEntry(`${baseUrl}/blog/${post.slug}`, lastmod(post.publishedDate), 'monthly', '0.8')
    ),
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join('\n')}
</urlset>`;

  return new Response(sitemapXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
