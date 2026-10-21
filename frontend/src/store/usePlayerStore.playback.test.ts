import { beforeEach, describe, expect, it, vi } from 'vitest';

interface MockHowlInstance {
  options: { src: string[]; onplay?: () => void; onend?: () => void };
  unload: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  duration: ReturnType<typeof vi.fn>;
}

const playbackProbe = vi.hoisted(() => ({
  beforePlay: null as ((instance: unknown) => void) | null,
  instances: [] as MockHowlInstance[],
}));

vi.mock('howler', () => ({
  Howl: class MockHowl {
    options: { src: string[]; onplay?: () => void; onend?: () => void };
    unload = vi.fn();
    play = vi.fn(() => {
      playbackProbe.beforePlay?.(this);
      this.options.onplay?.();
      return 1;
    });
    duration = vi.fn(() => 180);

    constructor(options: { src: string[]; onplay?: () => void; onend?: () => void }) {
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
      lastTrack: null,
      isPlaying: false,
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
    expect(secondHowl).toBe(usePlayerStore.getState().howl);
    expect(usePlayerStore.getState().currentTrack?.id).toBe('second');
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  it('revokes the previous local object URL when switching tracks', () => {
    const firstTrack = createTrack('first');
    const secondTrack = createTrack('second');

    usePlayerStore.getState().setTrack(firstTrack);
    usePlayerStore.getState().setTrack(secondTrack);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-audio');
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
});
