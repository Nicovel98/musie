import { beforeEach, describe, expect, it, vi } from 'vitest';

interface MockHowlInstance {
  options: {
    src: string[];
    onplay?: () => void;
    onpause?: () => void;
    onend?: () => void;
    onloaderror?: (id: number, error: unknown) => void;
    onplayerror?: (id: number, error: unknown) => void;
  };
  unload: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  playing: ReturnType<typeof vi.fn>;
  duration: ReturnType<typeof vi.fn>;
  seek: ReturnType<typeof vi.fn>;
}

const playbackProbe = vi.hoisted(() => ({
  beforePlay: null as ((instance: unknown) => void) | null,
  instances: [] as MockHowlInstance[],
}));

vi.mock('howler', () => ({
  Howl: class MockHowl {
    options: {
      src: string[];
      onplay?: () => void;
      onpause?: () => void;
      onend?: () => void;
      onloaderror?: (id: number, error: unknown) => void;
      onplayerror?: (id: number, error: unknown) => void;
    };
    unload = vi.fn();
    stop = vi.fn();
    playing = vi.fn(() => false);
    play = vi.fn(() => {
      playbackProbe.beforePlay?.(this);
      this.options.onplay?.();
      return 1;
    });
    duration = vi.fn(() => 180);
    seek = vi.fn(() => 0);

    constructor(options: {
      src: string[];
      onplay?: () => void;
      onpause?: () => void;
      onend?: () => void;
      onloaderror?: (id: number, error: unknown) => void;
      onplayerror?: (id: number, error: unknown) => void;
    }) {
      this.options = options;
      playbackProbe.instances.push(this);
    }
  },
  Howler: {
    ctx: {
      state: 'running',
      resume: vi.fn(async () => undefined),
      destination: {},
    },
  },
}));

vi.mock('idb-keyval', () => ({
  __esModule: true,
  get: vi.fn(async () => null),
  set: vi.fn(async () => undefined),
  del: vi.fn(async () => undefined),
}));

import { usePlayerStore } from './usePlayerStore';

const createTrack = (id: string) => ({
  id,
  title: id,
  artist: 'Test artist',
  coverUrl: '/cover.jpg',
  audioUrl: '',
  fileData: new File(['audio'], `${id}.mp3`, { type: 'audio/mpeg' }),
  source: 'local' as const,
});

describe('track switching playback', () => {
  beforeEach(() => {
    playbackProbe.beforePlay = null;
    playbackProbe.instances.length = 0;
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:test-audio'),
      revokeObjectURL: vi.fn(),
    });
    usePlayerStore.setState({
      libraryTracks: [],
      playlistTracks: [],
      currentTrack: null,
      playbackContext: 'library',
      playbackIndex: null,
      lastTrack: null,
      shuffleEnabled: false,
      shuffleHistoryIds: [],
      isPlaying: false,
      playbackError: null,
      seek: 0,
      howl: null,
      objectUrl: null,
      audioCleanup: null,
      audioWatchdogId: null,
      analyzer: null,
      mediaSource: null,
      gainNode: null,
      compressor: null,
      eqInput: null,
      eqOutput: null,
      eqFilters: [],
      connectedMediaNode: null,
    });
  });

  it('registers the new Howl before play when switching tracks', () => {
    const firstTrack = createTrack('first');
    const secondTrack = createTrack('second');
    let playCalls = 0;

    playbackProbe.beforePlay = (instance) => {
      playCalls += 1;
      expect(usePlayerStore.getState().howl).toBe(instance);
    };

    usePlayerStore.getState().setTrack(firstTrack);
    const firstHowl = playbackProbe.instances[0];
    usePlayerStore.getState().setTrack(secondTrack);
    const secondHowl = playbackProbe.instances[1];

    expect(playCalls).toBe(2);
    expect(firstHowl.unload).toHaveBeenCalledTimes(1);
    expect(firstHowl.stop).toHaveBeenCalledTimes(1);
    expect(secondHowl).toBe(usePlayerStore.getState().howl);
    expect(usePlayerStore.getState().currentTrack?.id).toBe('second');
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it('ignores a late end callback while replacing the active Howl', () => {
    const firstTrack = createTrack('first');
    const secondTrack = createTrack('second');

    usePlayerStore.getState().setTrack(firstTrack);
    const firstHowl = playbackProbe.instances[0];
    firstHowl.stop.mockImplementation(() => firstHowl.options.onend?.());

    usePlayerStore.getState().setTrack(secondTrack);

    expect(playbackProbe.instances).toHaveLength(2);
    expect(usePlayerStore.getState().currentTrack?.id).toBe('second');
    expect(usePlayerStore.getState().howl).toBe(playbackProbe.instances[1]);
  });

  it('stops at the end while keeping the current Howl replayable', () => {
    const track = createTrack('only');
    usePlayerStore.setState({ libraryTracks: [track] });
    usePlayerStore.getState().setTrack(track);
    const howl = playbackProbe.instances[0];

    usePlayerStore.getState().playNextTrack();

    expect(howl.stop).toHaveBeenCalledTimes(1);
    expect(usePlayerStore.getState().howl).toBe(howl);
    expect(usePlayerStore.getState().isPlaying).toBe(false);

    usePlayerStore.getState().togglePlay();

    expect(howl.play).toHaveBeenCalledTimes(2);
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it('does not start a second Howl playback when play is already active', () => {
    const track = createTrack('active');
    usePlayerStore.getState().setTrack(track);
    const howl = playbackProbe.instances[0];
    howl.playing.mockReturnValue(true);
    usePlayerStore.setState({ isPlaying: false });

    usePlayerStore.getState().togglePlay();

    expect(howl.play).toHaveBeenCalledTimes(1);
  });

  it('revokes the previous local object URL when switching tracks', () => {
    const firstTrack = createTrack('first');
    const secondTrack = createTrack('second');

    usePlayerStore.getState().setTrack(firstTrack);
    usePlayerStore.getState().setTrack(secondTrack);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-audio');
  });

  it('cleans up a local object URL when loading fails', () => {
    const track = createTrack('failed');

    usePlayerStore.getState().setTrack(track);
    const howl = playbackProbe.instances[0];
    howl.options.onloaderror?.(1, 'load failed');

    expect(howl.unload).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-audio');
    expect(usePlayerStore.getState().howl).toBeNull();
    expect(usePlayerStore.getState().objectUrl).toBeNull();
    expect(usePlayerStore.getState().playbackError).toContain('No se pudo reproducir');
  });

  it('clears the playback error when retrying the current track', () => {
    const track = createTrack('retry');

    usePlayerStore.getState().setTrack(track);
    const failedHowl = playbackProbe.instances[0];
    failedHowl.options.onloaderror?.(1, 'load failed');
    expect(usePlayerStore.getState().playbackError).not.toBeNull();

    usePlayerStore.getState().togglePlay();

    expect(playbackProbe.instances).toHaveLength(2);
    expect(usePlayerStore.getState().playbackError).toBeNull();
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it('clears a failed-track error when skipping at the end of the queue', () => {
    const track = createTrack('only-failed');
    usePlayerStore.setState({
      libraryTracks: [track],
      playbackError: 'No se pudo reproducir esta canción.',
    });
    usePlayerStore.getState().setTrack(track);
    usePlayerStore.setState({
      playbackError: 'No se pudo reproducir esta canción.',
      isPlaying: false,
    });

    usePlayerStore.getState().playNextTrack();

    expect(usePlayerStore.getState().playbackError).toBeNull();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  it('restores the saved position when replaying a rehydrated track', () => {
    const track = createTrack('resume');
    usePlayerStore.setState({
      currentTrack: track,
      playbackContext: 'library',
      seek: 42,
      howl: null,
      isPlaying: false,
    });

    usePlayerStore.getState().togglePlay();

    const howl = playbackProbe.instances[0];
    expect(howl.seek).toHaveBeenCalledWith(42);
    expect(usePlayerStore.getState().seek).toBe(42);
  });

  it('captures the exact position when pausing', () => {
    const track = createTrack('pause-position');
    usePlayerStore.getState().setTrack(track);
    const howl = playbackProbe.instances[0];
    howl.seek.mockReturnValue(27);

    howl.options.onpause?.();

    expect(usePlayerStore.getState().seek).toBe(27);
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  it('navigates previous and next tracks from library and playlist contexts', () => {
    const firstTrack = createTrack('first');
    const secondTrack = createTrack('second');
    const thirdTrack = createTrack('third');
    usePlayerStore.setState({ libraryTracks: [firstTrack, secondTrack, thirdTrack] });

    usePlayerStore.getState().setTrack(secondTrack);
    usePlayerStore.getState().playNextTrack();
    expect(usePlayerStore.getState().currentTrack?.id).toBe('third');

    usePlayerStore.getState().playPreviousTrack();
    expect(usePlayerStore.getState().currentTrack?.id).toBe('second');

    usePlayerStore.setState({ playlistTracks: [firstTrack, secondTrack, thirdTrack] });
    usePlayerStore.getState().playNextTrack();
    expect(usePlayerStore.getState().currentTrack?.id).toBe('third');

    usePlayerStore.getState().playPreviousTrack();
    expect(usePlayerStore.getState().currentTrack?.id).toBe('second');
  });

  it('keeps playlist navigation when the current track is removed from the playlist', () => {
    const firstTrack = createTrack('first');
    const secondTrack = createTrack('second');
    const thirdTrack = createTrack('third');
    usePlayerStore.setState({
      libraryTracks: [firstTrack, secondTrack, thirdTrack],
      playlistTracks: [firstTrack, secondTrack, thirdTrack],
      shuffleEnabled: true,
      shuffleHistoryIds: ['first', 'second', 'third'],
    });

    usePlayerStore.getState().setTrack(secondTrack, 'playlist');
    usePlayerStore.getState().removeFromPlaylist(secondTrack.id);
    expect(usePlayerStore.getState().shuffleHistoryIds).toEqual(['second']);
    usePlayerStore.getState().playNextTrack();

    expect(usePlayerStore.getState().currentTrack?.id).toBe('third');
    expect(usePlayerStore.getState().playbackContext).toBe('playlist');
  });

  it('continues with the first remaining track when the first current track is removed', () => {
    const firstTrack = createTrack('first');
    const secondTrack = createTrack('second');
    const thirdTrack = createTrack('third');
    usePlayerStore.setState({
      playlistTracks: [firstTrack, secondTrack, thirdTrack],
    });

    usePlayerStore.getState().setTrack(firstTrack, 'playlist');
    usePlayerStore.getState().removeFromPlaylist(firstTrack.id);
    usePlayerStore.getState().playNextTrack();

    expect(usePlayerStore.getState().currentTrack?.id).toBe('second');
    expect(usePlayerStore.getState().playbackContext).toBe('playlist');
  });

  it('does not let a library track with the same id change playlist context', () => {
    const sharedTrack = createTrack('shared');
    const playlistTrack = createTrack('playlist-next');
    usePlayerStore.setState({
      libraryTracks: [sharedTrack, playlistTrack],
      playlistTracks: [sharedTrack, playlistTrack],
    });

    usePlayerStore.getState().setTrack(sharedTrack, 'playlist');
    usePlayerStore.getState().setTrack(sharedTrack, 'library');
    usePlayerStore.getState().playNextTrack();

    expect(usePlayerStore.getState().currentTrack?.id).toBe('playlist-next');
    expect(usePlayerStore.getState().playbackContext).toBe('library');
  });

  it('inserts a new track immediately after the active playlist track', () => {
    const firstTrack = createTrack('first');
    const secondTrack = createTrack('second');
    const thirdTrack = createTrack('third');
    const insertedTrack = createTrack('inserted');
    usePlayerStore.setState({
      playlistTracks: [firstTrack, secondTrack, thirdTrack],
    });

    usePlayerStore.getState().setTrack(secondTrack, 'playlist');
    usePlayerStore.getState().addTrackNext(insertedTrack);

    expect(usePlayerStore.getState().playlistTracks.map((track) => track.id)).toEqual([
      'first',
      'second',
      'inserted',
      'third',
    ]);
  });

  it('keeps the active playlist anchor after reordering tracks', () => {
    const firstTrack = createTrack('first');
    const secondTrack = createTrack('second');
    const thirdTrack = createTrack('third');
    const insertedTrack = createTrack('inserted');
    usePlayerStore.setState({
      playlistTracks: [firstTrack, secondTrack, thirdTrack],
    });

    usePlayerStore.getState().setTrack(secondTrack, 'playlist');
    usePlayerStore.getState().movePlaylistTrackToEnd('first');
    usePlayerStore.getState().addTrackNext(insertedTrack);

    expect(usePlayerStore.getState().playlistTracks.map((track) => track.id)).toEqual([
      'second',
      'inserted',
      'third',
      'first',
    ]);
    expect(usePlayerStore.getState().playbackIndex).toBe(0);
  });

  it('appends only new tracks from a saved playlist without replacing the active queue', () => {
    const firstTrack = createTrack('first');
    const existingTrack = createTrack('existing');
    const appendedTrack = createTrack('appended');
    usePlayerStore.setState({
      libraryTracks: [firstTrack, existingTrack, appendedTrack],
      playlistTracks: [firstTrack, existingTrack],
      playlists: [
        {
          id: 'saved',
          name: 'Saved',
          description: '',
          coverUrl: '',
          trackIds: ['existing', 'appended'],
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    });

    usePlayerStore.getState().appendPlaylistToQueue('saved');

    expect(usePlayerStore.getState().playlistTracks.map((track) => track.id)).toEqual([
      'first',
      'existing',
      'appended',
    ]);
  });

  it('recalculates the playlist anchor when adding tracks after a library track', () => {
    const currentTrack = createTrack('current');
    const queuedTrack = createTrack('queued');
    const addedTrack = createTrack('added');
    usePlayerStore.setState({
      libraryTracks: [currentTrack, queuedTrack, addedTrack],
      playlistTracks: [queuedTrack],
      currentTrack,
      playbackContext: 'library',
      playlists: [
        {
          id: 'saved-next',
          name: 'Saved next',
          description: '',
          coverUrl: '',
          trackIds: ['added'],
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    });

    usePlayerStore.getState().addPlaylistNext('saved-next');

    expect(usePlayerStore.getState().playbackContext).toBe('playlist');
    expect(usePlayerStore.getState().playbackIndex).toBe(0);
    usePlayerStore.getState().playNextTrack();
    expect(usePlayerStore.getState().currentTrack?.id).toBe('added');
  });

  it('inserts a saved playlist after the current track without replacing the queue', () => {
    const currentTrack = createTrack('current');
    const existingTrack = createTrack('existing');
    const firstSavedTrack = createTrack('saved-first');
    const secondSavedTrack = createTrack('saved-second');
    usePlayerStore.setState({
      libraryTracks: [currentTrack, existingTrack, firstSavedTrack, secondSavedTrack],
      playlistTracks: [currentTrack, existingTrack],
      playlists: [
        {
          id: 'saved',
          name: 'Saved',
          description: '',
          coverUrl: '',
          trackIds: ['saved-first', 'saved-second'],
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    });

    usePlayerStore.getState().setTrack(currentTrack, 'playlist');
    usePlayerStore.getState().addPlaylistNext('saved');

    expect(usePlayerStore.getState().playlistTracks.map((track) => track.id)).toEqual([
      'current',
      'saved-first',
      'saved-second',
      'existing',
    ]);
    expect(usePlayerStore.getState().currentTrack?.id).toBe('current');
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it('clears only upcoming playlist tracks and keeps the current track', () => {
    const firstTrack = createTrack('first');
    const currentTrack = createTrack('current');
    const upcomingTrack = createTrack('upcoming');
    usePlayerStore.setState({
      playlistTracks: [firstTrack, currentTrack, upcomingTrack],
    });

    usePlayerStore.getState().setTrack(currentTrack, 'playlist');
    usePlayerStore.getState().clearUpcomingTracks();

    expect(usePlayerStore.getState().playlistTracks.map((track) => track.id)).toEqual([
      'first',
      'current',
    ]);
    expect(usePlayerStore.getState().currentTrack?.id).toBe('current');
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it('keeps a library track as the queue anchor when appending a saved playlist', () => {
    const libraryTrack = createTrack('library-current');
    const playlistTrack = createTrack('saved-next');
    usePlayerStore.setState({
      libraryTracks: [libraryTrack, playlistTrack],
      playlistTracks: [],
      playlists: [
        {
          id: 'saved',
          name: 'Saved',
          description: '',
          coverUrl: '',
          trackIds: ['saved-next'],
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    });

    usePlayerStore.getState().setTrack(libraryTrack, 'library');
    usePlayerStore.getState().appendPlaylistToQueue('saved');
    usePlayerStore.getState().playNextTrack();

    expect(usePlayerStore.getState().currentTrack?.id).toBe('saved-next');
    expect(usePlayerStore.getState().playbackContext).toBe('playlist');
  });

  it('removes unavailable track references from a saved playlist', () => {
    const availableTrack = createTrack('available');
    usePlayerStore.setState({
      libraryTracks: [availableTrack],
      playlistTracks: [],
      playlists: [
        {
          id: 'saved',
          name: 'Saved',
          description: '',
          coverUrl: '',
          trackIds: ['available', 'missing'],
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    });

    usePlayerStore.getState().removeUnavailableFromPlaylist('saved');

    expect(usePlayerStore.getState().playlists[0].trackIds).toEqual(['available']);
    expect(usePlayerStore.getState().playlists[0].updatedAt).not.toBe(1);
  });

  it('reorders tracks inside a saved playlist without changing the active queue', () => {
    const firstTrack = createTrack('first');
    const secondTrack = createTrack('second');
    const activeTrack = createTrack('active');
    usePlayerStore.setState({
      libraryTracks: [firstTrack, secondTrack, activeTrack],
      playlistTracks: [activeTrack],
      playlists: [
        {
          id: 'saved',
          name: 'Saved',
          description: '',
          coverUrl: '',
          trackIds: ['first', 'second'],
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    });

    usePlayerStore.getState().setTrack(activeTrack, 'library');
    usePlayerStore.getState().movePlaylistCollectionTrack('saved', 'second', 'up');

    expect(usePlayerStore.getState().playlists[0].trackIds).toEqual(['second', 'first']);
    expect(usePlayerStore.getState().playlistTracks.map((track) => track.id)).toEqual(['active']);
    expect(usePlayerStore.getState().currentTrack?.id).toBe('active');
  });

  it('advances automatically when the active track ends', () => {
    const firstTrack = createTrack('first');
    const secondTrack = createTrack('second');
    usePlayerStore.setState({ libraryTracks: [firstTrack, secondTrack] });

    usePlayerStore.getState().setTrack(firstTrack);
    playbackProbe.instances[0].options.onend?.();

    expect(usePlayerStore.getState().currentTrack?.id).toBe('second');
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it('supports repeat once and stops at the end when repeat is off', () => {
    const firstTrack = createTrack('first');
    const secondTrack = createTrack('second');
    usePlayerStore.setState({ libraryTracks: [firstTrack, secondTrack] });

    usePlayerStore.getState().setTrack(firstTrack);
    usePlayerStore.getState().cycleRepeatMode();
    usePlayerStore.getState().cycleRepeatMode();
    expect(usePlayerStore.getState().repeatMode).toBe('one');
    playbackProbe.instances[0].options.onend?.();
    expect(usePlayerStore.getState().currentTrack?.id).toBe('first');

    usePlayerStore.getState().cycleRepeatMode();
    expect(usePlayerStore.getState().repeatMode).toBe('off');
    usePlayerStore.getState().setTrack(secondTrack);
    playbackProbe.instances.at(-1)?.options.onend?.();
    expect(usePlayerStore.getState().currentTrack?.id).toBe('second');
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  it('selects another track when shuffle is enabled', () => {
    const firstTrack = createTrack('first');
    const secondTrack = createTrack('second');
    const thirdTrack = createTrack('third');
    usePlayerStore.setState({ libraryTracks: [firstTrack, secondTrack, thirdTrack] });
    usePlayerStore.getState().setTrack(firstTrack);
    usePlayerStore.getState().toggleShuffle();

    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    usePlayerStore.getState().playNextTrack();

    expect(usePlayerStore.getState().currentTrack?.id).toBe('third');
    vi.restoreAllMocks();
  });

  it('does not repeat shuffled tracks until the active list is exhausted', () => {
    const firstTrack = createTrack('first');
    const secondTrack = createTrack('second');
    const thirdTrack = createTrack('third');
    usePlayerStore.setState({ libraryTracks: [firstTrack, secondTrack, thirdTrack] });
    usePlayerStore.getState().setTrack(firstTrack);
    usePlayerStore.getState().toggleShuffle();

    vi.spyOn(Math, 'random').mockReturnValue(0);
    usePlayerStore.getState().playNextTrack();
    expect(usePlayerStore.getState().currentTrack?.id).toBe('second');

    usePlayerStore.getState().playNextTrack();
    expect(usePlayerStore.getState().currentTrack?.id).toBe('third');
    expect(usePlayerStore.getState().shuffleHistoryIds).toEqual(['first', 'second', 'third']);

    usePlayerStore.getState().playNextTrack();
    expect(usePlayerStore.getState().currentTrack?.id).toBe('first');
    expect(usePlayerStore.getState().shuffleHistoryIds).toEqual(['third', 'first']);
    vi.restoreAllMocks();
  });

  it('returns to the previously shuffled track when pressing previous', () => {
    const firstTrack = createTrack('first');
    const secondTrack = createTrack('second');
    const thirdTrack = createTrack('third');
    usePlayerStore.setState({ libraryTracks: [firstTrack, secondTrack, thirdTrack] });
    usePlayerStore.getState().setTrack(firstTrack);
    usePlayerStore.getState().toggleShuffle();

    vi.spyOn(Math, 'random').mockReturnValue(0);
    usePlayerStore.getState().playNextTrack();
    usePlayerStore.getState().playNextTrack();
    expect(usePlayerStore.getState().currentTrack?.id).toBe('third');

    usePlayerStore.getState().playPreviousTrack();

    expect(usePlayerStore.getState().currentTrack?.id).toBe('second');
    expect(usePlayerStore.getState().shuffleHistoryIds).toEqual(['first', 'second']);
    vi.restoreAllMocks();
  });
});
