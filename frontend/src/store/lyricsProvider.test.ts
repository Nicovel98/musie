import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAutomaticLyrics } from './lyricsProvider';

const track = {
  title: 'Canción',
  artist: 'Artista',
  album: 'Álbum',
  durationSeconds: 180,
};

describe('LRCLIB lyrics provider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts a matching response and parses its lyrics', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          trackName: 'Cancion',
          artistName: 'Artista',
          duration: 183,
          syncedLyrics: '[00:01.00] Primera línea',
        }),
      })
    );

    await expect(fetchAutomaticLyrics(track)).resolves.toMatchObject({
      source: 'automatic',
      provider: 'lrclib',
      format: 'synced',
      lines: [{ text: 'Primera línea', startTimeMs: 1000 }],
    });
  });

  it('rejects a response for a different song or a different duration', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          trackName: 'Otra canción',
          artistName: 'Artista',
          plainLyrics: 'Texto',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          trackName: 'Cancion',
          artistName: 'Artista',
          duration: 190,
          plainLyrics: 'Texto',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchAutomaticLyrics(track)).resolves.toBeNull();
    await expect(fetchAutomaticLyrics(track)).resolves.toBeNull();
  });

  it('propagates cancellation to the network request', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockImplementation(
      (_url: string, options: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        })
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = fetchAutomaticLyrics(track, controller.signal);
    controller.abort();

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
