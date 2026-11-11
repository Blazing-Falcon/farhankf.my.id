import { monthYear, parseDate } from './dates';
import type { Photo } from './strapi';

// Photos have no slug field, so the address is a readable prefix made from
// the title plus the start of the documentId. Only the id part identifies the
// photo; a renamed photo keeps working under its old address.
const ID_LENGTH = 8;

function titleSlug(title: string): string {
  return (
    title
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'photo'
  );
}

export function photoPath(photo: Photo): string {
  return `/photography/${titleSlug(photo.title)}-${photo.documentId.slice(0, ID_LENGTH)}`;
}

/** The photo a /photography/<segment> address names, or null. */
export function findPhoto(photos: Photo[], segment: string): Photo | null {
  const id = segment.slice(-ID_LENGTH);
  if (!/^[a-z0-9]+$/.test(id) || id.length !== ID_LENGTH) return null;
  const matches = photos.filter((photo) => photo.documentId.startsWith(id));
  return matches.length === 1 ? matches[0] : null;
}

export function aspect(photo: Photo): number {
  const { width, height } = photo.image ?? {};
  return width && height ? width / height : 1.5;
}

/** "Sony a6000, Mar 2026": the caption tail every plate shares. */
export function plateDetails(photo: Photo): string {
  return [photo.gear, monthYear(photo.shotAt)].filter(Boolean).join(', ');
}

/** "Aug 2025 to Jun 2026", a single month, or an empty string when undated. */
export function dateRange(photos: Photo[]): string {
  const dates = photos
    .map((photo) => parseDate(photo.shotAt))
    .filter((date): date is Date => date !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  if (dates.length === 0) return '';
  const first = monthYear(dates[0]);
  const last = monthYear(dates[dates.length - 1]);
  return first === last ? first : `${first} to ${last}`;
}

// Justified rows: photos are added to a row until, at the target height, the
// row would be as wide as the sheet. The browser then scales each row to the
// full width through flex-grow, so every photo in a row has the same height
// and none is cropped.
const SHEET_WIDTH = 1020;
const ROW_HEIGHT = 300;
const TARGET_RATIO = SHEET_WIDTH / ROW_HEIGHT;

export interface PhotoRow<T> {
  items: T[];
  /** Flex-grow of the empty space that keeps a short last row from stretching. */
  fill: number;
}

export function justifiedRows<T>(items: T[], ratio: (item: T) => number): PhotoRow<T>[] {
  const rows: PhotoRow<T>[] = [];
  let current: T[] = [];
  let sum = 0;

  for (const item of items) {
    current.push(item);
    sum += ratio(item);
    if (sum >= TARGET_RATIO) {
      rows.push({ items: current, fill: 0 });
      current = [];
      sum = 0;
    }
  }
  if (current.length > 0) rows.push({ items: current, fill: Math.max(0, TARGET_RATIO - sum) });
  return rows;
}
