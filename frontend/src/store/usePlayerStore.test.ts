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
      playlists: [],
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

  it('persists playback context and restores the current track without autoplay', async () => {
    const track = {
      id: 'track-current',
      title: 'Current track',
      artist: 'Artist',
      coverUrl: '/cover.jpg',
      audioUrl: 'https://example.com/audio.mp3',
      source: 'remote' as const,
    };

    usePlayerStore.setState({
      libraryTracks: [track],
      currentTrack: track,
      playbackContext: 'library',
      playbackIndex: 0,
      seek: 37,
      shuffleEnabled: true,
      shuffleHistoryIds: [track.id],
      repeatMode: 'all',
      isPlaying: false,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    const storedValue = await get('musie-pwa-storage');
    expect(storedValue).toMatchObject({
      state: {
        currentTrack: { id: track.id },
        playbackIndex: 0,
        shuffleEnabled: true,
        shuffleHistoryIds: [track.id],
        repeatMode: 'all',
      },
    });

    usePlayerStore.setState({
      currentTrack: null,
      playbackIndex: null,
      seek: 0,
      shuffleEnabled: false,
      shuffleHistoryIds: [],
      repeatMode: 'off',
    });
    await set('musie-pwa-storage', storedValue);
    await usePlayerStore.persist.rehydrate();

    expect(usePlayerStore.getState().currentTrack?.id).toBe(track.id);
    expect(usePlayerStore.getState().playbackIndex).toBe(0);
    expect(usePlayerStore.getState().seek).toBe(37);
    expect(usePlayerStore.getState().shuffleHistoryIds).toEqual([track.id]);
    expect(usePlayerStore.getState().repeatMode).toBe('all');
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  it('persists a shared audio blob once and restores it to both lists', async () => {
    const audioFile = new Blob(['audio'], { type: 'audio/mpeg' });
    const track = {
      id: 'track-1',
      title: 'Track 1',
      artist: 'Artist',
      coverUrl: '/cover.jpg',
      audioUrl: '',
      fileData: audioFile,
      source: 'local' as const,
    };

    usePlayerStore.setState({
      libraryTracks: [track],
      playlistTracks: [track],
      lastTrack: track,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    const storedValue = await get('musie-pwa-storage');
    const storedState = (storedValue as { state: Record<string, unknown> }).state;
    const storedLibrary = storedState.libraryTracks as Record<string, unknown>[];
    const storedPlaylist = storedState.playlistTracks as Record<string, unknown>[];
    const storedAudioFiles = storedState.audioFiles as Record<string, Blob>;

    expect(storedLibrary[0]).not.toHaveProperty('fileData');
    expect(storedPlaylist[0]).not.toHaveProperty('fileData');
    expect(storedAudioFiles['track-1']).toBeInstanceOf(Blob);
    expect(storedAudioFiles['track-1']).toMatchObject({
      size: audioFile.size,
      type: audioFile.type,
    });

    usePlayerStore.setState({ libraryTracks: [], playlistTracks: [], lastTrack: null });
    await set('musie-pwa-storage', storedValue);
    await usePlayerStore.persist.rehydrate();

    const rehydratedState = usePlayerStore.getState();
    expect(rehydratedState.libraryTracks[0].fileData).toMatchObject({
      size: audioFile.size,
      type: audioFile.type,
    });
    expect(rehydratedState.playlistTracks[0].fileData).toMatchObject({
      size: audioFile.size,
      type: audioFile.type,
    });
  });

  it('creates, persists, loads, and deletes independent playlists', async () => {
    const firstTrack = {
      id: 'track-1',
      title: 'Track 1',
      artist: 'Artist',
      coverUrl: '/cover.jpg',
      audioUrl: '',
      source: 'local' as const,
    };
    const secondTrack = { ...firstTrack, id: 'track-2', title: 'Track 2' };

    usePlayerStore.setState({
      libraryTracks: [firstTrack, secondTrack],
      playlistTracks: [secondTrack, firstTrack],
    });
    usePlayerStore.getState().createPlaylist({
      name: 'Road trip',
      description: 'Favorites for the road',
      coverUrl: '/cover.jpg',
      trackIds: ['track-2', 'track-1', 'track-2'],
    });

    const savedPlaylist = usePlayerStore.getState().playlists[0];
    expect(savedPlaylist).toMatchObject({
      name: 'Road trip',
      description: 'Favorites for the road',
      trackIds: ['track-2', 'track-1'],
    });

    usePlayerStore.setState({ playlistTracks: [] });
    usePlayerStore.setState({
      shuffleEnabled: true,
      shuffleHistoryIds: ['stale-track'],
    });
    usePlayerStore.getState().loadPlaylist(savedPlaylist.id);
    expect(usePlayerStore.getState().playlistTracks.map((track) => track.id)).toEqual([
      'track-2',
      'track-1',
    ]);
    expect(usePlayerStore.getState().playbackContext).toBe('playlist');
    expect(usePlayerStore.getState().shuffleHistoryIds).toEqual([]);

    usePlayerStore.getState().updatePlaylist(savedPlaylist.id, {
      name: 'Road trip updated',
      description: 'Updated description',
      trackIds: ['track-1', 'track-1'],
    });
    expect(usePlayerStore.getState().playlists[0]).toMatchObject({
      name: 'Road trip updated',
      description: 'Updated description',
      trackIds: ['track-1'],
    });
    expect(usePlayerStore.getState().playlistTracks.map((track) => track.id)).toEqual([
      'track-2',
      'track-1',
    ]);

    usePlayerStore.getState().duplicatePlaylist(savedPlaylist.id);
    expect(usePlayerStore.getState().playlists).toHaveLength(2);
    expect(usePlayerStore.getState().playlists[1]).toMatchObject({
      name: 'Road trip updated (copia)',
      trackIds: ['track-1'],
    });
    expect(usePlayerStore.getState().playlistTracks.map((track) => track.id)).toEqual([
      'track-2',
      'track-1',
    ]);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(await get('musie-pwa-storage')).toMatchObject({
      state: { playlists: [expect.objectContaining({ name: 'Road trip' })] },
    });

    usePlayerStore.getState().deletePlaylist(savedPlaylist.id);
    expect(usePlayerStore.getState().playlists).toHaveLength(1);

    usePlayerStore.getState().restorePlaylist(savedPlaylist);
    expect(usePlayerStore.getState().playlists).toHaveLength(2);
    expect(usePlayerStore.getState().playlists[1].id).toBe(savedPlaylist.id);
  });
});
