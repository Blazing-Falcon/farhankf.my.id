const STRAPI_URL = import.meta.env.STRAPI_URL;
const STRAPI_TOKEN = import.meta.env.STRAPI_TOKEN;

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

export interface Project {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  summary: string;
  body?: string | null;
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

export type PhotoCategory = 'street' | 'landscape' | 'portrait' | 'macro' | 'other';

export interface Photo {
  id: number;
  documentId: string;
  title: string;
  image: StrapiMedia;
  caption?: string | null;
  category: PhotoCategory;
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

export async function strapiFetch<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${STRAPI_URL}/api${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Strapi request failed (${res.status} ${res.statusText}): ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function getAbout(): Promise<About | null> {
  const res = await strapiFetch<StrapiSingleResponse<About>>('/about', { populate: '*' });
  return res.data;
}

export async function getProjects({
  featuredOnly = false,
}: { featuredOnly?: boolean } = {}): Promise<Project[]> {
  const params: Record<string, string> = {
    populate: '*',
    sort: 'finishedAt:desc',
    'pagination[pageSize]': '100',
  };
  if (featuredOnly) {
    params['filters[featured][$eq]'] = 'true';
  }
  const res = await strapiFetch<StrapiListResponse<Project>>('/projects', params);
  return res.data;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const res = await strapiFetch<StrapiListResponse<Project>>('/projects', {
    populate: '*',
    'filters[slug][$eq]': slug,
  });
  return res.data[0] ?? null;
}

export async function getPhotos({
  category,
  featuredOnly = false,
}: { category?: PhotoCategory; featuredOnly?: boolean } = {}): Promise<Photo[]> {
  const params: Record<string, string> = {
    populate: '*',
    sort: 'shotAt:desc',
    'pagination[pageSize]': '100',
  };
  if (category) {
    params['filters[category][$eq]'] = category;
  }
  if (featuredOnly) {
    params['filters[featured][$eq]'] = 'true';
  }
  const res = await strapiFetch<StrapiListResponse<Photo>>('/photos', params);
  return res.data;
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

export function mediaUrl(media: StrapiMedia | null | undefined): string {
  if (!media?.url) return '';
  return media.url.startsWith('http') ? media.url : `${STRAPI_URL}${media.url}`;
}
