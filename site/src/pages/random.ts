import type { APIRoute } from 'astro';
import { photoPath } from '../lib/photos';
import { getBlogPosts, getPhotos, getProjects } from '../lib/strapi';

// The footer's "Random page" link. Every answer is a fresh draw, so nothing
// between the visitor and the server may cache it.
export const GET: APIRoute = async () => {
  const paths = ['/about', '/projects', '/blog', '/photography', '/links', '/changes'];

  try {
    const [projects, posts, photos] = await Promise.all([
      getProjects(),
      getBlogPosts({ withContent: false }),
      getPhotos(),
    ]);
    paths.push(
      ...projects.map((project) => `/projects/${project.slug}`),
      ...posts.map((post) => `/blog/${post.slug}`),
      ...photos.map(photoPath)
    );
  } catch {
    // Strapi is unavailable; draw from the pages that do not depend on it.
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: paths[Math.floor(Math.random() * paths.length)],
      'Cache-Control': 'no-store',
    },
  });
};
