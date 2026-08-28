// process.env first: import.meta.env is inlined at build time, which would
// bake these into the Docker image. process.env is read at container start;
// the import.meta.env fallback keeps `npm run dev` (.env-file) working.
const STRAPI_URL = process.env.STRAPI_URL ?? import.meta.env.STRAPI_URL;
const STRAPI_TOKEN = process.env.STRAPI_TOKEN ?? import.meta.env.STRAPI_TOKEN;

export interface StrapiMedia {
  id: number;
  documentId: string;
  url: string;
  alternativeText?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface SkillGroup {
  group: string;
  items: string[];
}

export interface About {
  id: number;
  documentId: string;
  headline: string;
  tagline?: string | null;
  bio: string;
  portrait?: StrapiMedia | null;
  skills?: SkillGroup[] | null;
  email?: string | null;
  githubUrl?: string | null;
  location?: string | null;
}

export type ProjectDifficulty =
  | 'weekend-hack'
  | 'semester-project'
  | 'thesis-grade'
  | 'ongoing-saga';

/** Convention-only shape for the `stats` json field, e.g. { label: "rows", value: "340k" }. */
export interface ProjectStat {
  label: string;
  value: string;
}

export interface MarkdownTextBlock {
  id: number;
  __component: 'article.markdown-text';
  body: string;
}

export interface ArticleImageBlock {
  id: number;
  __component: 'article.captioned-image';
  image: StrapiMedia;
  altText: string;
  caption?: string | null;
  source?: string | null;
}

export interface PdfDocumentBlock {
  id: number;
  __component: 'article.pdf-document';
  title: string;
  pdfFile: StrapiMedia;
  description?: string | null;
}

export interface YouTubeVideoBlock {
  id: number;
  __component: 'article.youtube-video';
  title: string;
  youtubeUrl: string;
  caption?: string | null;
}

export type ArticleContentBlock =
  | MarkdownTextBlock
  | ArticleImageBlock
  | PdfDocumentBlock
  | YouTubeVideoBlock;

export interface BlogCategory {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  order?: number;
}

export interface BlogPost {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  summary: string;
  category?: BlogCategory | string | null;
  coverImage?: StrapiMedia | null;
  featured: boolean;
  readTime?: string | null;
  publishedDate?: string | null;
  contentBlocks?: ArticleContentBlock[] | null;
}

export interface Project {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  summary: string;
  body?: string | null;
  contentBlocks?: ArticleContentBlock[] | null;
  coverImage?: StrapiMedia | null;
  gallery?: StrapiMedia[] | null;
  techStack?: string[] | null;
  projectUrl?: string | null;
  repoUrl?: string | null;
  featured: boolean;
  finishedAt?: string | null;
  difficulty?: ProjectDifficulty | null;
  stats?: ProjectStat[] | null;
}

export interface LabNote {
  id: number;
  documentId: string;
  title: string;
  body: string;
  order: number;
}

export type SocialIcon = 'github' | 'instagram' | 'spotify' | 'email';

export interface SocialLink {
  id: number;
  documentId: string;
  label: string;
  url: string;
  icon: SocialIcon;
  handle?: string | null;
  order: number;
}

export interface Ticker {
  id: number;
  documentId: string;
  topics?: string[] | null;
  tools?: string[] | null;
}

export interface Cat {
  id: number;
  documentId: string;
  name: string;
  role: string;
  bio?: string | null;
  photo?: StrapiMedia | null;
  order: number;
}

export interface PhotoCategory {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  order: number;
}

export interface Photo {
  id: number;
  documentId: string;
  title: string;
  image: StrapiMedia;
  caption?: string | null;
  category?: PhotoCategory | string | null;
  shotAt?: string | null;
  gear?: string | null;
  featured: boolean;
}

interface StrapiListResponse<T> {
  data: T[];
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiSingleResponse<T> {
  data: T | null;
  meta: Record<string, unknown>;
}

// Content changes rarely (owner edits via admin UI), so identical GET responses
// are cached for a short TTL. The cache stores the in-flight promise, which also
// collapses concurrent identical requests into one Strapi round-trip. Failed
// requests are evicted immediately: an outage degrades exactly like an uncached
// failure (pages render EmptyState) and recovery is picked up on the next view.
const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { expires: number; promise: Promise<unknown> }>();

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Strapi request failed (${res.status} ${res.statusText}): ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function strapiFetch<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${STRAPI_URL}/api${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const key = url.toString();

  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return hit.promise as Promise<T>;
  }

  const promise = fetchJson<T>(key);
  cache.set(key, { expires: Date.now() + CACHE_TTL_MS, promise });
  promise.catch(() => {
    if (cache.get(key)?.promise === promise) cache.delete(key);
  });
  return promise;
}

// Strapi caps pageSize at 100, so any list that can outgrow that must walk the
// pages itself. Page 1 carries the pageCount, so the extra pages are only
// fetched when they exist.
async function strapiFetchAll<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T[]> {
  const first = await strapiFetch<StrapiListResponse<T>>(path, {
    ...params,
    'pagination[pageSize]': '100',
    'pagination[page]': '1',
  });
  const pageCount = first.meta.pagination?.pageCount ?? 1;
  if (pageCount <= 1) return first.data;

  const rest = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, i) =>
      strapiFetch<StrapiListResponse<T>>(path, {
        ...params,
        'pagination[pageSize]': '100',
        'pagination[page]': String(i + 2),
      })
    )
  );
  return first.data.concat(...rest.map((res) => res.data));
}

export async function getAbout(): Promise<About | null> {
  const res = await strapiFetch<StrapiSingleResponse<About>>('/about', { populate: '*' });
  return res.data;
}

// Everything ProjectCard renders — list pages skip the markdown `body` and
// `gallery`, which only getProjectBySlug needs.
const PROJECT_CARD_FIELDS = [
  'title',
  'slug',
  'summary',
  'techStack',
  'projectUrl',
  'repoUrl',
  'featured',
  'finishedAt',
  'difficulty',
  'stats',
];

export async function getProjects({
  featuredOnly = false,
}: { featuredOnly?: boolean } = {}): Promise<Project[]> {
  const params: Record<string, string> = {
    'populate[coverImage]': 'true',
    sort: 'finishedAt:desc',
  };
  PROJECT_CARD_FIELDS.forEach((field, i) => {
    params[`fields[${i}]`] = field;
  });
  if (featuredOnly) {
    params['filters[featured][$eq]'] = 'true';
  }
  return strapiFetchAll<Project>('/projects', params);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const res = await strapiFetch<StrapiListResponse<Project>>('/projects', {
    'populate[coverImage]': 'true',
    'populate[gallery]': 'true',
    // populate=* stops one level deep, which leaves the media inside each
    // contentBlocks component unpopulated and renders those blocks as nothing.
    'populate[contentBlocks][populate]': '*',
    'filters[slug][$eq]': slug,
  });
  return res.data[0] ?? null;
}

export async function getPhotoCategories(): Promise<PhotoCategory[]> {
  return strapiFetchAll<PhotoCategory>('/photo-categories', { sort: 'order:asc' });
}

export async function getPhotos({
  category,
  featuredOnly = false,
}: { category?: string; featuredOnly?: boolean } = {}): Promise<Photo[]> {
  const params: Record<string, string> = {
    populate: '*',
    sort: 'shotAt:desc',
  };
  if (category) {
    params['filters[category][slug][$eq]'] = category;
  }
  if (featuredOnly) {
    params['filters[featured][$eq]'] = 'true';
  }
  return strapiFetchAll<Photo>('/photos', params);
}

export async function getCats(): Promise<Cat[]> {
  const res = await strapiFetch<StrapiListResponse<Cat>>('/cats', {
    populate: '*',
    sort: 'order:asc',
    'pagination[pageSize]': '50',
  });
  return res.data;
}

export async function getTicker(): Promise<Ticker | null> {
  const res = await strapiFetch<StrapiSingleResponse<Ticker>>('/ticker');
  return res.data;
}

export async function getLabNotes(): Promise<LabNote[]> {
  const res = await strapiFetch<StrapiListResponse<LabNote>>('/lab-notes', {
    sort: 'order:asc',
    'pagination[pageSize]': '12',
  });
  return res.data;
}

export async function getSocialLinks(): Promise<SocialLink[]> {
  const res = await strapiFetch<StrapiListResponse<SocialLink>>('/social-links', {
    sort: 'order:asc',
    'pagination[pageSize]': '12',
  });
  return res.data;
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
  return strapiFetchAll<BlogCategory>('/blog-categories', { sort: 'order:asc' });
}

export async function getBlogPosts({
  category,
  featuredOnly = false,
  withContent = true,
}: { category?: string; featuredOnly?: boolean; withContent?: boolean } = {}): Promise<
  BlogPost[]
> {
  const params: Record<string, string> = {
    'populate[coverImage]': 'true',
    'populate[category]': 'true',
    sort: 'publishedDate:desc',
  };
  // Article bodies, their images and their PDF metadata are megabytes that only
  // the detail page reads; callers that render cards or URLs opt out.
  if (withContent) {
    params['populate[contentBlocks][populate]'] = '*';
  }
  if (category) {
    params['filters[category][slug][$eq]'] = category;
  }
  if (featuredOnly) {
    params['filters[featured][$eq]'] = 'true';
  }
  return strapiFetchAll<BlogPost>('/blog-posts', params);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const res = await strapiFetch<StrapiListResponse<BlogPost>>('/blog-posts', {
    'populate[coverImage]': 'true',
    'populate[category]': 'true',
    'populate[contentBlocks][populate]': '*',
    'filters[slug][$eq]': slug,
  });
  return res.data[0] ?? null;
}

export function mediaUrl(media: StrapiMedia | null | undefined): string {
  if (!media?.url) return '';
  if (media.url.startsWith('/documents/') || media.url.startsWith('/images/')) return media.url;
  return media.url.startsWith('http') ? media.url : `${STRAPI_URL}${media.url}`;
}

export function pdfUrl(media: StrapiMedia | null | undefined): string {
  return mediaUrl(media);
}
