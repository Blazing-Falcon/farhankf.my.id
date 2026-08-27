const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);
const VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;

export function youtubeEmbedUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return '';
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split('/').filter(Boolean);
  let videoId = '';

  if (host === 'youtu.be') {
    videoId = segments[0] ?? '';
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (url.pathname === '/watch') videoId = url.searchParams.get('v') ?? '';
    else if (['embed', 'shorts', 'live'].includes(segments[0])) videoId = segments[1] ?? '';
  }

  return VIDEO_ID.test(videoId)
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
    : '';
}
