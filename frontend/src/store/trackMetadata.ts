import type { Track } from '../types/track';

interface ParsedTags {
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  genre?: string;
  year?: number;
  coverUrl?: string;
}

interface MediaTags {
  title?: string;
  artist?: string;
  album?: string;
  albumartist?: string;
  genre?: string;
  year?: string | number;
  picture?: {
    data: number[];
    format: string;
  };
}

const MAX_EMBEDDED_COVER_BYTES = 512 * 1024;
const COVER_OPTIMIZATION_THRESHOLD = 350 * 1024;
const MAX_OPTIMIZED_COVER_DIMENSION = 512;
const MAX_DOWNLOADED_COVER_BYTES = 8 * 1024 * 1024;

const bytesToBase64 = (bytes: number[]) => {
  const chunkSize = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }

  return btoa(binary);
};

const getCoverUrl = (picture: MediaTags['picture']) => {
  if (!picture?.data?.length || !picture.format) return undefined;
  if (picture.data.length > MAX_EMBEDDED_COVER_BYTES) return undefined;

  return `data:${picture.format};base64,${bytesToBase64(picture.data)}`;
};

export const optimizeCoverUrl = async (coverUrl: string) => {
  if (
    !coverUrl.startsWith('data:image/') ||
    coverUrl.length <= COVER_OPTIMIZATION_THRESHOLD ||
    typeof Image === 'undefined' ||
    typeof document === 'undefined'
  ) {
    return coverUrl;
  }

  return new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const scale = Math.min(
          1,
          MAX_OPTIMIZED_COVER_DIMENSION / image.naturalWidth,
          MAX_OPTIMIZED_COVER_DIMENSION / image.naturalHeight
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          resolve(coverUrl);
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= coverUrl.length) {
              resolve(coverUrl);
              return;
            }

            const reader = new FileReader();
            reader.onload = () =>
              resolve(typeof reader.result === 'string' ? reader.result : coverUrl);
            reader.onerror = () => resolve(coverUrl);
            reader.readAsDataURL(blob);
          },
          'image/webp',
          0.82
        );
      } catch {
        resolve(coverUrl);
      }
    };
    image.onerror = () => resolve(coverUrl);
    image.src = coverUrl;
  });
};

interface DeezerSearchResponse {
  data?: Array<{
    title?: string;
    artist?: { name?: string };
    album?: {
      title?: string;
      cover_xl?: string;
      cover_big?: string;
      cover_medium?: string;
    };
  }>;
}

interface ItunesSearchResponse {
  results?: Array<{
    trackName?: string;
    artistName?: string;
    collectionName?: string;
    artworkUrl100?: string;
  }>;
}

const normalizeSearchText = (value: string | undefined) =>
  value
    ?.trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ') ?? '';

const readBlobAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Invalid cover response'));
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read cover'));
    reader.readAsDataURL(blob);
  });

const fetchImageAsDataUrl = async (url: string, signal: AbortSignal) => {
  const response = await fetch(url, { signal });
  if (!response.ok) return null;
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_DOWNLOADED_COVER_BYTES) {
    return null;
  }
  const blob = await response.blob();
  if (blob.size > MAX_DOWNLOADED_COVER_BYTES) return null;
  if (!blob.type.startsWith('image/')) return null;
  return optimizeCoverUrl(await readBlobAsDataUrl(blob));
};

export const getYouTubeThumbnail = (value: string) => {
  try {
    const url = new URL(value.trim());
    let videoId = url.searchParams.get('v');
    if (!videoId && (url.hostname === 'youtu.be' || url.hostname.endsWith('.youtu.be'))) {
      videoId = url.pathname.split('/').filter(Boolean)[0] ?? null;
    }
    if (!videoId && /youtube\.com$/i.test(url.hostname)) {
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments[0] === 'shorts' || segments[0] === 'embed') videoId = segments[1] ?? null;
    }
    if (!videoId || !/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) return null;
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  } catch {
    return null;
  }
};

export interface AutomaticCoverOption {
  imageUrl: string;
  title: string;
  artist: string;
  album: string;
  source: 'iTunes' | 'Deezer';
}

export const findAutomaticCoverOptions = async (
  track: Pick<Track, 'title' | 'artist'>,
  signal?: AbortSignal
): Promise<AutomaticCoverOption[]> => {
  const title = track.title.trim();
  const artist = track.artist.trim();
  if (!title) return [];

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);
  const genericArtists = new Set(['archivo local', 'audio externo', 'unknown artist', 'unknown']);

  try {
    const normalizedArtist = normalizeSearchText(artist);
    const titleVariants = Array.from(
      new Set([title, title.replace(/[-_]+/g, ' '), title.replace(/\s+/g, ' ')])
    );
    const readableTitle = titleVariants[1] ?? title;
    const itunesResponse = await fetch(
      `https://itunes.apple.com/search?${new URLSearchParams({
        term: genericArtists.has(normalizedArtist) ? readableTitle : `${readableTitle} ${artist}`,
        entity: 'song',
        limit: '8',
      })}`,
      { signal: controller.signal }
    );

    if (itunesResponse.ok) {
      const itunesData = (await itunesResponse.json()) as ItunesSearchResponse;
      const itunesOptions = (itunesData.results ?? [])
        .map((item) => ({
          imageUrl: item.artworkUrl100?.replace(/100x100bb\./, '600x600bb.'),
          title: item.trackName ?? title,
          artist: item.artistName ?? artist,
          album: item.collectionName ?? 'Álbum desconocido',
          source: 'iTunes' as const,
        }))
        .filter((option): option is Omit<typeof option, 'imageUrl'> & { imageUrl: string } =>
          Boolean(option.imageUrl)
        );

      if (itunesOptions.length > 0) {
        return Array.from(
          new Map(itunesOptions.map((option) => [option.imageUrl, option])).values()
        );
      }
    }

    const queries = genericArtists.has(normalizedArtist)
      ? titleVariants.map((variant) => `track:"${variant}"`)
      : [
          `track:"${title}" artist:"${artist}"`,
          `track:"${readableTitle}" artist:"${artist}"`,
          `track:"${readableTitle}"`,
        ];
    let results: DeezerSearchResponse['data'] = [];

    for (const query of queries) {
      const response = await fetch(
        `https://api.deezer.com/search?${new URLSearchParams({ q: query, limit: '8' })}`,
        { signal: controller.signal }
      );
      if (!response.ok) continue;

      const data = (await response.json()) as DeezerSearchResponse;
      results = data.data ?? [];
      if (results.length > 0) break;
    }

    const normalizedTitle = normalizeSearchText(title);
    const options = results
      .map((item) => ({
        imageUrl: item.album?.cover_xl ?? item.album?.cover_big ?? item.album?.cover_medium,
        title: item.title ?? title,
        artist: item.artist?.name ?? artist,
        album: item.album?.title ?? 'Álbum desconocido',
        source: 'Deezer' as const,
        titleMatches: normalizeSearchText(item.title) === normalizedTitle,
        artistMatches:
          genericArtists.has(normalizedArtist) ||
          normalizeSearchText(item.artist?.name) === normalizedArtist,
      }))
      .filter(
        (
          option
        ): option is Omit<typeof option, 'imageUrl'> & { imageUrl: string } & {
          titleMatches: boolean;
          artistMatches: boolean;
        } => Boolean(option.imageUrl)
      )
      .sort(
        (left, right) =>
          Number(right.titleMatches && right.artistMatches) -
          Number(left.titleMatches && left.artistMatches)
      );

    return Array.from(new Map(options.map((option) => [option.imageUrl, option])).values());
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abort);
  }
};

export const downloadAutomaticCover = async (imageUrl: string, signal?: AbortSignal) => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);
  try {
    return await fetchImageAsDataUrl(imageUrl, controller.signal);
  } finally {
    window.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abort);
  }
};

export const findAutomaticCover = async (
  track: Pick<Track, 'title' | 'artist' | 'album'>
): Promise<string | null> => {
  const options = await findAutomaticCoverOptions(track);
  if (options.length === 0) return null;
  return downloadAutomaticCover(options[0].imageUrl);
};

const readEmbeddedTags = async (file: File): Promise<ParsedTags> => {
  try {
    const { default: jsmediatags } = await import('jsmediatags/dist/jsmediatags.min.js');

    return await new Promise((resolve) => {
      jsmediatags.read(file, {
        onSuccess: ({ tags }) => {
          const mediaTags = tags as MediaTags;
          const parsedYear = Number(mediaTags.year);

          resolve({
            title: mediaTags.title?.trim() || undefined,
            artist: mediaTags.artist?.trim() || undefined,
            album: mediaTags.album?.trim() || undefined,
            albumArtist: mediaTags.albumartist?.trim() || undefined,
            genre: mediaTags.genre?.trim() || undefined,
            year: Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : undefined,
            coverUrl: getCoverUrl(mediaTags.picture),
          });
        },
        onError: () => resolve({}),
      });
    });
  } catch {
    return {};
  }
};

export const readTrackDuration = (
  source: Blob | string,
  signal?: AbortSignal
): Promise<number | undefined> =>
  new Promise((resolve) => {
    const objectUrl = typeof source === 'string' ? source : URL.createObjectURL(source);
    const audio = new Audio();
    let settled = false;

    function finish(duration?: number) {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      signal?.removeEventListener('abort', handleAbort);
      audio.pause();
      if (typeof source !== 'string') URL.revokeObjectURL(objectUrl);
      audio.removeAttribute('src');
      resolve(duration);
    }

    const handleAbort = () => finish();

    const timeoutId = window.setTimeout(() => finish(), 15000);

    const handleDurationChange = () => {
      const duration =
        Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : undefined;
      if (duration !== undefined) finish(duration);
    };

    audio.preload = 'metadata';
    audio.onloadedmetadata = handleDurationChange;
    audio.ondurationchange = handleDurationChange;
    audio.onerror = () => finish();
    if (signal?.aborted) {
      finish();
      return;
    }
    signal?.addEventListener('abort', handleAbort, { once: true });
    audio.src = objectUrl;
    audio.load();
  });

export const readTrackMetadata = async (
  file: File
): Promise<ParsedTags & { durationSeconds?: number }> => {
  const [tags, durationSeconds] = await Promise.all([
    readEmbeddedTags(file),
    readTrackDuration(file),
  ]);
  return { ...tags, durationSeconds };
};
