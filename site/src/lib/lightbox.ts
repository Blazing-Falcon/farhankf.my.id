import { getImage } from 'astro:assets';
import { mediaUrl, type Photo } from './strapi';
import type { LightboxPhoto } from '../components/Lightbox';

// The lightbox never displays an image wider than ~1000px (max-width: 80vw
// desktop / 92vw phone), so re-encoding originals at native size buys nothing:
// the 10798px astro panorama cost ~6s of sharp per request — uncached, on every
// cold view — and 2.9MB on the wire. 2400px still covers a wide viewport at DPR 2+.
const MAX_WIDTH = 2400;

export async function toLightboxPhotos(photos: Photo[]): Promise<LightboxPhoto[]> {
  return Promise.all(
    photos.map(async (photo) => {
      const src = mediaUrl(photo.image);
      const base = {
        alt: photo.image?.alternativeText ?? photo.title,
        title: photo.title,
        caption: photo.caption ?? photo.title,
        gear: photo.gear ?? '',
      };

      if (!src || !photo.image?.width || !photo.image?.height) {
        return { ...base, src: '', width: 800, height: 600, alt: photo.title };
      }

      const width = Math.min(photo.image.width, MAX_WIDTH);
      const height = Math.round(photo.image.height * (width / photo.image.width));
      const optimized = await getImage({ src, width, height, format: 'webp' });

      return { ...base, src: optimized.src, width, height };
    })
  );
}
