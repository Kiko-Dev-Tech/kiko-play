const VIDEO_ID = /^[\w-]{11}$/;

/** Extracts the video ID from youtu.be, watch, shorts, live and embed links. */
export function youtubeVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^(www\.|m\.|music\.)/, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = parsed.pathname.slice(1).split('/')[0];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, first, second] = parsed.pathname.split('/');
    id =
      first === 'watch'
        ? parsed.searchParams.get('v')
        : ['shorts', 'embed', 'live'].includes(first)
          ? second
          : null;
  }
  return id && VIDEO_ID.test(id) ? id : null;
}

/** Parses `90`, `1:30` or `1:02:03` into seconds. Empty input means no time. */
export function parseTime(text: string): number | undefined | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!/^\d+(:\d{1,2}){0,2}$/.test(trimmed)) {
    return null;
  }
  return trimmed.split(':').reduce((total, part) => total * 60 + Number(part), 0);
}

/** Formats seconds as `m:ss` or `h:mm:ss`. */
export function formatTime(seconds: number | undefined): string {
  if (seconds === undefined) {
    return '';
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** Reads a start time from a link like `?t=1m30s` or `?t=90`. */
function startFromUrl(url: string): number | undefined {
  try {
    const params = new URL(url.trim()).searchParams;
    const t = params.get('t') ?? params.get('start');
    if (!t) {
      return undefined;
    }
    const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/.exec(t);
    if (!match) {
      return undefined;
    }
    const [, h = '0', m = '0', s = '0'] = match;
    return Number(h) * 3600 + Number(m) * 60 + Number(s);
  } catch {
    return undefined;
  }
}

/** The privacy-friendly embed URL. Only built from a validated video ID. */
export function youtubeEmbedUrl(
  url: string,
  options: { start?: number; end?: number; autoplay: boolean },
): string | null {
  const id = youtubeVideoId(url);
  if (!id) {
    return null;
  }
  const params = new URLSearchParams({ rel: '0', autoplay: options.autoplay ? '1' : '0' });
  const start = options.start ?? startFromUrl(url);
  if (start !== undefined) {
    params.set('start', String(start));
  }
  if (options.end !== undefined) {
    params.set('end', String(options.end));
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}
