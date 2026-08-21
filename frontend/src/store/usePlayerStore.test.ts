import { beforeEach, describe, expect, it, vi } from 'vitest';
import { get, set } from 'idb-keyval';
import {
  DEFAULT_EQ_BANDS,
  DEFAULT_EQ_PRESET,
  applyEqBandsToFilters,
  buildEqFilters,
  clampEqGain,
  getEqPreset,
} from './eq';
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

describe('audio equalizer presets', () => {
  it('returns a valid flat preset and respects gain limits', () => {
    const flatPreset = getEqPreset(DEFAULT_EQ_PRESET);

    expect(flatPreset).toHaveLength(DEFAULT_EQ_BANDS.length);
    expect(flatPreset.every((band) => band.gain === 0)).toBe(true);
    expect(clampEqGain(99, -12, 12)).toBe(12);
    expect(clampEqGain(-99, -12, 12)).toBe(-12);
  });

  it('applies preset gains to true peaking filters and respects min/max limits', () => {
    const ctx = {
      currentTime: 0,
      createBiquadFilter: () => ({
        type: 'peaking',
        frequency: { value: 0 },
        Q: { value: 0 },
        gain: { value: 0 },
        context: { currentTime: 0 },
        connect: vi.fn(),
      }),
      createGain: () => ({ connect: vi.fn() }),
    } as unknown as AudioContext;

    const { nodes } = buildEqFilters(ctx, DEFAULT_EQ_BANDS);
    const preset = getEqPreset('rock');

    expect(nodes).toHaveLength(DEFAULT_EQ_BANDS.length);
    expect(nodes.every((node) => node.type === 'peaking')).toBe(true);
    expect(nodes.map((node) => node.frequency.value)).toEqual(
      DEFAULT_EQ_BANDS.map((band) => band.frequency)
    );
    expect(preset.every((band, index) => band.gain >= DEFAULT_EQ_BANDS[index].minGain)).toBe(true);
    expect(preset.every((band, index) => band.gain <= DEFAULT_EQ_BANDS[index].maxGain)).toBe(true);
  });

  it('applies gains to filters when enabled and disables them when turned off', () => {
    const setTargetAtTime = vi.fn();
    const filters = DEFAULT_EQ_BANDS.map(() => ({
      gain: { setTargetAtTime },
      context: { currentTime: 0 },
    }));

    const bands = getEqPreset('bass');

    applyEqBandsToFilters(filters as unknown as BiquadFilterNode[], bands, true);
    expect(setTargetAtTime).toHaveBeenCalledWith(5, 0, 0.02);

    applyEqBandsToFilters(filters as unknown as BiquadFilterNode[], bands, false);
    expect(setTargetAtTime).toHaveBeenLastCalledWith(0, 0, 0.02);
  });
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
