/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  downloadAutomaticCover,
  findAutomaticCover,
  findAutomaticCoverOptions,
  getYouTubeThumbnail,
} from './trackMetadata';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('automatic cover lookup', () => {
  it('extracts thumbnails from supported YouTube URL formats', () => {
    expect(getYouTubeThumbnail('https://www.youtube.com/watch?v=abc123_XY')).toBe(
      'https://i.ytimg.com/vi/abc123_XY/hqdefault.jpg'
    );
    expect(getYouTubeThumbnail('https://youtu.be/abc123_XY')).toBe(
      'https://i.ytimg.com/vi/abc123_XY/hqdefault.jpg'
    );
    expect(getYouTubeThumbnail('https://www.youtube.com/shorts/abc123_XY')).toBe(
      'https://i.ytimg.com/vi/abc123_XY/hqdefault.jpg'
    );
    expect(getYouTubeThumbnail('https://example.com/video/abc123_XY')).toBeNull();
  });

  it('returns multiple iTunes cover choices without downloading them yet', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: [
            {
              trackName: 'Song One',
              artistName: 'Artist One',
              collectionName: 'Album One',
              artworkUrl100: 'https://is1-ssl.mzstatic.com/image/100x100bb.jpg',
            },
            {
              trackName: 'Song One',
              artistName: 'Artist One',
              collectionName: 'Album Two',
              artworkUrl100: 'https://is1-ssl.mzstatic.com/image-two/100x100bb.jpg',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const options = await findAutomaticCoverOptions({
      title: 'Song One',
      artist: 'Artist One',
    });

    expect(options).toHaveLength(2);
    expect(options.map((option) => option.album)).toEqual(['Album One', 'Album Two']);
    expect(options.every((option) => option.source === 'iTunes')).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('term')).toBe(
      'Song One Artist One'
    );
  });

  it('tries a readable title when a local filename uses separators', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: [
              {
                title: 'We All Become',
                artist: { name: 'Transistor' },
                album: { title: 'Album One', cover_xl: 'https://cdn.deezer.com/cover.jpg' },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    vi.stubGlobal('fetch', fetchMock);

    const options = await findAutomaticCoverOptions({
      title: 'We-All-Become',
      artist: 'Archivo Local',
    });

    expect(options).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain('itunes.apple.com/search');
    expect(fetchMock.mock.calls[1][0]).toContain('api.deezer.com/search');
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get('q')).toBe('track:"We-All-Become"');
  });

  it('propagates cancellation to the provider request', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      controller.abort();
      return Promise.reject(new DOMException('Aborted', 'AbortError'));
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      findAutomaticCoverOptions({ title: 'Song One', artist: 'Artist One' }, controller.signal)
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('propagates cancellation while downloading a selected cover', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      expect(init?.signal).toBeInstanceOf(AbortSignal);
      controller.abort();
      return Promise.reject(new DOMException('Aborted', 'AbortError'));
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      downloadAutomaticCover('https://cdn.example.com/cover.jpg', controller.signal)
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('finds a cover using track metadata and returns a data URL', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            results: [
              {
                trackName: 'Song One',
                artistName: 'Artist One',
                collectionName: 'Album One',
                artworkUrl100: 'https://is1-ssl.mzstatic.com/image/100x100bb.jpg',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      )
      .mockResolvedValueOnce(
        new Response(new Blob(['cover'], { type: 'image/png' }), {
          status: 200,
          headers: { 'Content-Type': 'image/png' },
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    const coverUrl = await findAutomaticCover({
      title: 'Song One',
      artist: 'Artist One',
      album: 'Album One',
    });

    expect(coverUrl).toMatch(/^data:image\/png;base64,/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain('itunes.apple.com/search');
    expect(fetchMock.mock.calls[1][0]).toContain('600x600bb.jpg');
  });
});
