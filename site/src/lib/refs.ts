import type { RefItem } from '../components/RefList.astro';
import { shortDate, year } from './dates';
import type { BlogCategory, BlogPost, Project, ProjectDifficulty } from './strapi';

const difficultyLabels: Record<ProjectDifficulty, string> = {
  'weekend-hack': 'Weekend hack',
  'semester-project': 'Semester project',
  'thesis-grade': 'Thesis grade',
  'ongoing-saga': 'Ongoing saga',
};

export function difficultyLabel(difficulty: ProjectDifficulty | null | undefined): string | null {
  return difficulty ? (difficultyLabels[difficulty] ?? null) : null;
}

export function categoryName(category: BlogCategory | string | null | undefined): string {
  if (!category) return '';
  return typeof category === 'string' ? category : category.name;
}

export function categorySlug(category: BlogCategory | string | null | undefined): string {
  if (!category) return '';
  return typeof category === 'string' ? category : category.slug;
}

export function projectRef(project: Project): RefItem {
  const finished = year(project.finishedAt);
  return {
    href: `/projects/${project.slug}`,
    title: project.title,
    summary: project.summary,
    meta: difficultyLabel(project.difficulty),
    date: finished ? String(finished) : null,
  };
}

export function postRef(post: BlogPost): RefItem {
  return {
    href: `/blog/${post.slug}`,
    title: post.title,
    summary: post.summary,
    meta: categoryName(post.category) || null,
    date: shortDate(post.publishedDate) || null,
    tail: post.readTime,
  };
}
