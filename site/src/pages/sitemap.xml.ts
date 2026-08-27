import type { APIRoute } from 'astro';
import { getBlogPosts, getProjects } from '../lib/strapi';

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = (site?.href ?? 'https://farhankf.my.id').replace(/\/$/, '');

  const staticRoutes = [
    { path: '', changefreq: 'weekly', priority: '1.0' },
    { path: '/about', changefreq: 'monthly', priority: '0.8' },
    { path: '/projects', changefreq: 'weekly', priority: '0.9' },
    { path: '/blog', changefreq: 'daily', priority: '0.9' },
    { path: '/photography', changefreq: 'weekly', priority: '0.8' },
    { path: '/links', changefreq: 'monthly', priority: '0.6' },
  ];

  let blogPosts: { slug: string; publishedDate?: string | null }[] = [];
  let projects: { slug: string; finishedAt?: string | null }[] = [];

  try {
    const [fetchedPosts, fetchedProjects] = await Promise.all([
      getBlogPosts(),
      getProjects(),
    ]);
    blogPosts = fetchedPosts;
    projects = fetchedProjects;
  } catch {
    // If Strapi is temporarily unavailable, sitemap still renders static routes.
  }

  const sitemapEntries = [
    ...staticRoutes.map((route) => `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`),
    ...projects.map((project) => `  <url>
    <loc>${baseUrl}/projects/${project.slug}</loc>
    ${project.finishedAt ? `<lastmod>${new Date(project.finishedAt).toISOString().split('T')[0]}</lastmod>` : ''}
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`),
    ...blogPosts.map((post) => `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    ${post.publishedDate ? `<lastmod>${new Date(post.publishedDate).toISOString().split('T')[0]}</lastmod>` : ''}
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`),
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.join('\n')}
</urlset>`.trim();

  return new Response(sitemapXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
