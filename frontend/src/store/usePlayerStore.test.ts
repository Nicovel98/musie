import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get, set } from 'idb-keyval';
import { usePlayerStore } from './usePlayerStore';

vi.mock('idb-keyval', () => {
  const storage = new Map<string, unknown>();

  return {
    __esModule: true,
    get: vi.fn(async (key: string) => (storage.has(key) ? storage.get(key) : null)),
    set: vi.fn(async (key: string, value: unknown) => {
      storage.set(key, value);
    }),
    del: vi.fn(async (key: string) => {
      storage.delete(key);
    }),
  };
});

describe('usePlayerStore favorites', () => {
  beforeEach(async () => {
    usePlayerStore.setState({
      libraryTracks: [],
      playlistTracks: [],
      favoriteTrackIds: [],
      currentTrack: null,
      lastTrack: null,
      isPlaying: false,
      volume: 0.5,
      seek: 0,
      duration: 0,
      howl: null,
      analyzer: null,
      mediaSource: null,
      gainNode: null,
      compressor: null,
      objectUrl: null,
      connectedMediaNode: null,
      audioCleanup: null,
      audioWatchdogId: null,
    });

    await usePlayerStore.persist.clearStorage();
  });

  it('toggles favorite track ids and clears them correctly', () => {
    const trackId = 'track-1';

    expect(usePlayerStore.getState().isTrackFavorite(trackId)).toBe(false);

    usePlayerStore.getState().toggleTrackFavorite(trackId);
    expect(usePlayerStore.getState().favoriteTrackIds).toEqual([trackId]);
    expect(usePlayerStore.getState().isTrackFavorite(trackId)).toBe(true);

    usePlayerStore.getState().toggleTrackFavorite(trackId);
    expect(usePlayerStore.getState().favoriteTrackIds).toEqual([]);

    usePlayerStore.getState().clearFavorites();
    expect(usePlayerStore.getState().favoriteTrackIds).toEqual([]);
  });

  it('persists favorites in storage and rehydrates them', async () => {
    const favoriteTrackIds = ['track-1', 'track-2'];

    usePlayerStore.setState({ favoriteTrackIds });
    await usePlayerStore.persist.rehydrate();

    const storedValue = await get('musie-pwa-storage');
    expect(storedValue).toMatchObject({ state: { favoriteTrackIds } });

    const rehydratedState = usePlayerStore.getState();
    expect(rehydratedState.favoriteTrackIds).toEqual(favoriteTrackIds);

    const nextTrackId = 'track-3';
    usePlayerStore.getState().toggleTrackFavorite(nextTrackId);
    await set('musie-pwa-storage', {
      state: {
        favoriteTrackIds: usePlayerStore.getState().favoriteTrackIds,
      },
    });

    expect(await get('musie-pwa-storage')).toMatchObject({
      state: { favoriteTrackIds: [...favoriteTrackIds, nextTrackId] },
    });
  });
});
