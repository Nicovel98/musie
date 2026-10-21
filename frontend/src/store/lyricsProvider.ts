import type { LyricsDocument } from '../types/lyrics';
import { normalizeLyricsDocument, parseLyricsText } from '../types/lyrics';

interface LrclibResponse {
  id?: number;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  duration?: number;
  plainLyrics?: string;
  syncedLyrics?: string;
}

const LRCLIB_ENDPOINT = 'https://lrclib.net/api/get';

const normalizeMetadata = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

export const fetchAutomaticLyrics = async (
  track: { title: string; artist: string; album?: string; durationSeconds?: number },
  signal?: AbortSignal
): Promise<LyricsDocument | null> => {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 8000);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });

  try {
    const query = new URLSearchParams({
      track_name: track.title,
      artist_name: track.artist,
    });
    if (track.album) query.set('album_name', track.album);
    if (track.durationSeconds && Number.isFinite(track.durationSeconds)) {
      query.set('duration', String(track.durationSeconds));
    }

    const response = await fetch(`${LRCLIB_ENDPOINT}?${query}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as LrclibResponse;
    if (
      payload.trackName &&
      normalizeMetadata(payload.trackName) !== normalizeMetadata(track.title)
    ) {
      return null;
    }
    if (
      payload.artistName &&
      normalizeMetadata(payload.artistName) !== normalizeMetadata(track.artist)
    ) {
      return null;
    }
    if (
      payload.duration !== undefined &&
      track.durationSeconds !== undefined &&
      Number.isFinite(track.durationSeconds) &&
      Math.abs(payload.duration - track.durationSeconds) > 5
    ) {
      return null;
    }
    const lyricsText = payload.syncedLyrics || payload.plainLyrics;
    if (!lyricsText?.trim()) return null;

    const document = parseLyricsText(lyricsText, 'automatic', 'lrclib');
    return normalizeLyricsDocument(document);
  } finally {
    globalThis.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abort);
  }
};
