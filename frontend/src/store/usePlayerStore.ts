import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { Howl, Howler } from 'howler';
import type { Track } from '../types/track';
import type { AlbumCollection } from '../types/album';
import heroThumbnail from '../assets/hero.png';
import {
  DEFAULT_EQ_BANDS,
  DEFAULT_EQ_PRESET,
  type EqBand,
  type EqPresetName,
  buildEqFilters,
  getEqPreset,
  applyEqBandsToFilters,
} from './eq';
import { optimizeCoverUrl, readTrackMetadata } from './trackMetadata';

const debugAudio = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.debug(...args);
};

type PersistedTrack = Omit<Track, 'fileData'>;

interface PersistedPlayerState {
  libraryTracks: PersistedTrack[];
  playlistTracks: PersistedTrack[];
  audioFiles: Record<string, Blob>;
  favoriteTrackIds: string[];
  volume: number;
  lastTrack: Track | null;
  eqBands: EqBand[];
  eqPreset: EqPresetName;
  eqEnabled: boolean;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  albums: AlbumCollection[];
}

interface HowlInternal extends Howl {
  _sounds: { _node: HTMLAudioElement }[];
}

let pendingStorageWrite = Promise.resolve();
let storageWriteActive = false;
let lastQueuedPersistedState: PersistedPlayerState | null = null;
const MAX_PERSISTED_COVER_LENGTH = 350 * 1024;

const isQuotaError = (error: unknown) => {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') return true;
  return error instanceof Error && /quota|storage|space/i.test(error.message);
};

const optimizePersistedCovers = async (value: StorageValue<PersistedPlayerState>) => {
  const state = value.state;
  const tracks = [...state.libraryTracks, ...state.playlistTracks];
  const covers = new Map<string, string>();

  for (const track of tracks) {
    if (
      !track.coverUrl.startsWith('data:image/') ||
      track.coverUrl.length <= MAX_PERSISTED_COVER_LENGTH
    ) {
      continue;
    }

    covers.set(track.id, await optimizeCoverUrl(track.coverUrl));
  }

  const updateTracks = (items: PersistedTrack[]) =>
    items.map((track) => {
      const optimizedCover = covers.get(track.id);
      if (!optimizedCover || optimizedCover.length < track.coverUrl.length) {
        return optimizedCover ? { ...track, coverUrl: optimizedCover } : track;
      }

      return { ...track, coverUrl: heroThumbnail };
    });

  return {
    ...value,
    state: {
      ...state,
      libraryTracks: updateTracks(state.libraryTracks),
      playlistTracks: updateTracks(state.playlistTracks),
      lastTrack: state.lastTrack ? updateTracks([state.lastTrack])[0] : state.lastTrack,
    },
  };
};

const persistWithRecovery = async (name: string, value: StorageValue<PersistedPlayerState>) => {
  try {
    await set(name, value);
  } catch (error) {
    if (!isQuotaError(error)) throw error;

    const recoveredValue = await optimizePersistedCovers(value);
    await set(name, recoveredValue);
  }
};

const customBinaryStorage: PersistStorage<PersistedPlayerState> = {
  getItem: async (name) => {
    await pendingStorageWrite;
    return (await get<StorageValue<PersistedPlayerState>>(name)) || null;
  },
  setItem: async (name, value) => {
    if (value.state === lastQueuedPersistedState) return;

    lastQueuedPersistedState = value.state;
    const write = storageWriteActive
      ? pendingStorageWrite.catch(() => undefined).then(() => persistWithRecovery(name, value))
      : persistWithRecovery(name, value);
    storageWriteActive = true;
    pendingStorageWrite = write.then(
      () => {
        storageWriteActive = false;
      },
      (error) => {
        storageWriteActive = false;
        if (lastQueuedPersistedState === value.state) {
          lastQueuedPersistedState = null;
        }
        console.error('[storage] failed to persist player state', error);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('musie-storage-error'));
        }
      }
    );
    return write;
  },
  removeItem: async (name) => {
    lastQueuedPersistedState = null;
    await del(name);
  },
};

const stripTrackFile = (track: Track): PersistedTrack => {
  const persistedTrack = { ...track };
  delete persistedTrack.fileData;
  return persistedTrack;
};

const collectAudioFiles = (tracks: Track[], audioFiles: Record<string, Blob>) => {
  tracks.forEach((track) => {
    if (track.fileData) audioFiles[track.id] = track.fileData;
  });
};

const restoreTrackFiles = (tracks: Track[], audioFiles: Record<string, Blob>) =>
  tracks.map((track) => {
    const fileData = track.fileData ?? audioFiles[track.id];
    return fileData ? { ...track, fileData } : track;
  });

interface PlayerState {
  libraryTracks: Track[];
  playlistTracks: Track[];
  favoriteTrackIds: string[];
  currentTrack: Track | null;
  lastTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  seek: number;
  duration: number;
  howl: Howl | null;
  analyzer: AnalyserNode | null;
  mediaSource: MediaElementAudioSourceNode | null;
  gainNode: GainNode | null;
  compressor: DynamicsCompressorNode | null;
  eqInput: GainNode | null;
  eqOutput: GainNode | null;
  eqFilters: BiquadFilterNode[];
  eqBands: EqBand[];
  eqPreset: EqPresetName;
  eqEnabled: boolean;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  albums: AlbumCollection[];
  objectUrl: string | null;
  connectedMediaNode: HTMLAudioElement | null;
  audioCleanup?: (() => void) | null;
  audioWatchdogId?: number | null;
  addSongs: (files: File[]) => Promise<void>;
  optimizeStoredCovers: () => Promise<void>;
  updateTrackMetadata: (
    trackId: string,
    metadata: Partial<
      Pick<Track, 'coverUrl' | 'durationSeconds' | 'lastPlayedAt' | 'playCount' | 'lyrics'>
    >
  ) => void;
  clearLibrary: () => void;
  clearPlaylist: () => void;
  addToPlaylist: (track: Track) => void;
  removeFromPlaylist: (trackId: string) => void;
  movePlaylistTrack: (draggedTrackId: string, targetTrackId: string) => void;
  movePlaylistTrackToEnd: (draggedTrackId: string) => void;
  isTrackFavorite: (trackId: string) => boolean;
  toggleTrackFavorite: (trackId: string) => void;
  clearFavorites: () => void;
  setTrack: (track: Track) => void;
  playPreviousTrack: () => void;
  playNextTrack: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  createAlbum: (album: Omit<AlbumCollection, 'id' | 'createdAt'>) => void;
  updateAlbum: (albumId: string, album: Partial<Omit<AlbumCollection, 'id'>>) => void;
  deleteAlbum: (albumId: string) => void;
  togglePlay: () => void;
  setVolume: (val: number) => void;
  setSeek: (val: number) => void;
  fastSeek: (val: number) => void;
  updateProgress: () => void;
  setEqPreset: (preset: EqPresetName) => void;
  updateEqBand: (bandIndex: number, gain: number) => void;
  setEqEnabled: (enabled: boolean) => void;
  resetEq: () => void;
}

export type RepeatMode = 'off' | 'all' | 'one';

const normalizeRepeatMode = (value: unknown): RepeatMode =>
  value === 'all' || value === 'one' ? value : 'off';

const clampSeekValue = (val: number, duration: number) => {
  if (!Number.isFinite(val)) return 0;
  if (!Number.isFinite(duration) || duration <= 0) return Math.max(0, val);
  return Math.min(Math.max(0, val), duration);
};

const getTrackIndex = (songs: Track[], currentTrack: Track | null) =>
  currentTrack ? songs.findIndex((song) => song.id === currentTrack.id) : -1;

const getNextTrackIndex = (
  tracks: Track[],
  currentIndex: number,
  shuffleEnabled: boolean,
  repeatMode: RepeatMode
) => {
  if (shuffleEnabled && tracks.length > 1) {
    const candidates = tracks.map((_, index) => index).filter((index) => index !== currentIndex);
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  const nextIndex = currentIndex + 1;
  if (nextIndex < tracks.length) return nextIndex;
  return repeatMode === 'all' ? 0 : -1;
};

const normalizeTrack = (track: Track): Track => ({
  ...track,
  addedAt: track.addedAt ?? 0,
  source: track.source ?? (track.audioUrl ? 'remote' : 'local'),
});

const getTrackListByPlaybackContext = (
  state: Pick<PlayerState, 'libraryTracks' | 'playlistTracks' | 'currentTrack'>
) => {
  if (state.playlistTracks.length === 0) return state.libraryTracks;

  const currentTrack = state.currentTrack;

  if (currentTrack) {
    const isInPlaylist = state.playlistTracks.some((track) => track.id === currentTrack.id);
    if (isInPlaylist) return state.playlistTracks;

    const isInLibrary = state.libraryTracks.some((track) => track.id === currentTrack.id);
    if (isInLibrary) return state.libraryTracks;
  }

  return state.playlistTracks;
};

const moveArrayItem = <T>(items: T[], fromIndex: number, toIndex: number) => {
  if (fromIndex === toIndex) return items;
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
};

const mapWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
) => {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const runWorker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index]);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()));

  return results;
};

let cachedPersistedState: PersistedPlayerState | null = null;
let cachedPersistedInputs: {
  libraryTracks: Track[];
  playlistTracks: Track[];
  favoriteTrackIds: string[];
  volume: number;
  lastTrack: Track | null;
  eqBands: EqBand[];
  eqPreset: EqPresetName;
  eqEnabled: boolean;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  albums: AlbumCollection[];
} | null = null;

const createPersistedState = (state: PlayerState): PersistedPlayerState => {
  const previous = cachedPersistedInputs;
  if (
    previous &&
    previous.libraryTracks === state.libraryTracks &&
    previous.playlistTracks === state.playlistTracks &&
    previous.favoriteTrackIds === state.favoriteTrackIds &&
    previous.volume === state.volume &&
    previous.lastTrack === state.lastTrack &&
    previous.eqBands === state.eqBands &&
    previous.eqPreset === state.eqPreset &&
    previous.eqEnabled === state.eqEnabled &&
    previous.shuffleEnabled === state.shuffleEnabled &&
    previous.repeatMode === state.repeatMode &&
    previous.albums === state.albums &&
    cachedPersistedState
  ) {
    return cachedPersistedState;
  }

  const audioFiles: Record<string, Blob> = {};
  collectAudioFiles(state.libraryTracks, audioFiles);
  collectAudioFiles(state.playlistTracks, audioFiles);
  if (state.lastTrack) collectAudioFiles([state.lastTrack], audioFiles);

  cachedPersistedInputs = {
    libraryTracks: state.libraryTracks,
    playlistTracks: state.playlistTracks,
    favoriteTrackIds: state.favoriteTrackIds,
    volume: state.volume,
    lastTrack: state.lastTrack,
    eqBands: state.eqBands,
    eqPreset: state.eqPreset,
    eqEnabled: state.eqEnabled,
    shuffleEnabled: state.shuffleEnabled,
    repeatMode: state.repeatMode,
    albums: state.albums,
  };
  cachedPersistedState = {
    libraryTracks: state.libraryTracks.map(stripTrackFile),
    playlistTracks: state.playlistTracks.map(stripTrackFile),
    audioFiles,
    favoriteTrackIds: state.favoriteTrackIds,
    volume: state.volume,
    lastTrack: state.lastTrack ? stripTrackFile(state.lastTrack) : null,
    eqBands: state.eqBands,
    eqPreset: state.eqPreset,
    eqEnabled: state.eqEnabled,
    shuffleEnabled: state.shuffleEnabled,
    repeatMode: state.repeatMode,
    albums: state.albums,
  };

  return cachedPersistedState;
};

const disconnectAudioNode = (node: AudioNode | null) => {
  try {
    node?.disconnect();
  } catch {
    // Audio nodes may already be disconnected by the browser.
  }
};

interface AudioResources {
  howl: Howl | null;
  mediaSource: MediaElementAudioSourceNode | null;
  gainNode: GainNode | null;
  compressor: DynamicsCompressorNode | null;
  analyzer: AnalyserNode | null;
  eqInput: GainNode | null;
  eqOutput: GainNode | null;
  eqFilters: BiquadFilterNode[];
  objectUrl: string | null;
  audioCleanup?: (() => void) | null;
  audioWatchdogId?: number | null;
}

const cleanupAudioResources = (resources: AudioResources) => {
  resources.howl?.unload();
  resources.audioCleanup?.();
  disconnectAudioNode(resources.mediaSource);
  disconnectAudioNode(resources.gainNode);
  disconnectAudioNode(resources.compressor);
  disconnectAudioNode(resources.analyzer);
  disconnectAudioNode(resources.eqInput);
  disconnectAudioNode(resources.eqOutput);
  resources.eqFilters.forEach(disconnectAudioNode);
  if (resources.objectUrl) URL.revokeObjectURL(resources.objectUrl);
  if (resources.audioWatchdogId) clearInterval(resources.audioWatchdogId);
};

const mediaSourceNodes = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();

const getTrackSource = (track: Track) => {
  if (track.fileData) {
    const file = track.fileData;
    const filename = 'name' in file && typeof file.name === 'string' ? file.name : '';
    const filenameFormat = filename.split('.').pop()?.toLowerCase();
    const mimeFormat = file.type.split('/')[1]?.split(';')[0].toLowerCase();
    const normalizedMimeFormat =
      mimeFormat === 'mpeg'
        ? 'mp3'
        : mimeFormat === 'mp4' || mimeFormat === 'x-m4a'
          ? 'm4a'
          : mimeFormat === 'x-wav' || mimeFormat === 'wave'
            ? 'wav'
            : mimeFormat;
    const format = filenameFormat || normalizedMimeFormat || undefined;

    return {
      src: URL.createObjectURL(file),
      format,
      isObjectUrl: true,
    };
  }

  const remoteUrl = track.audioUrl?.trim();
  if (!remoteUrl) return null;

  const extension = remoteUrl.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase();
  return {
    src: remoteUrl,
    format: extension || undefined,
    isObjectUrl: false,
  };
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
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
      eqInput: null,
      eqOutput: null,
      eqFilters: [],
      eqBands: DEFAULT_EQ_BANDS,
      eqPreset: DEFAULT_EQ_PRESET,
      eqEnabled: true,
      shuffleEnabled: false,
      repeatMode: 'off' as RepeatMode,
      albums: [],
      objectUrl: null,
      connectedMediaNode: null,
      audioCleanup: null,
      audioWatchdogId: null,

      addSongs: async (files) => {
        const newTracks = await mapWithConcurrency(files, 2, async (file) => {
          const metadata = await readTrackMetadata(file);
          const coverUrl = await optimizeCoverUrl(metadata.coverUrl || heroThumbnail);

          return {
            id: crypto.randomUUID(),
            title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
            artist: metadata.artist || 'Archivo Local',
            album: metadata.album,
            albumArtist: metadata.albumArtist,
            genre: metadata.genre,
            year: metadata.year,
            coverUrl,
            audioUrl: '',
            fileData: file,
            durationSeconds: metadata.durationSeconds,
            addedAt: Date.now(),
            source: 'local' as const,
          };
        });
        set((state) => ({ libraryTracks: [...state.libraryTracks, ...newTracks] }));
      },

      optimizeStoredCovers: async () => {
        const { libraryTracks, playlistTracks, lastTrack } = get();
        const tracks = Array.from(
          new Map(
            [...libraryTracks, ...playlistTracks, ...(lastTrack ? [lastTrack] : [])].map(
              (track) => [track.id, track]
            )
          ).values()
        ).filter(
          (track) => track.coverUrl.startsWith('data:image/') && track.coverUrl.length > 350 * 1024
        );

        const optimizedTracks = await mapWithConcurrency(tracks, 2, async (track) => ({
          id: track.id,
          coverUrl: await optimizeCoverUrl(track.coverUrl),
        }));
        const optimizedById = new Map(
          optimizedTracks
            .filter(({ coverUrl }, index) => coverUrl.length < tracks[index].coverUrl.length)
            .map(({ id, coverUrl }) => [id, coverUrl])
        );

        if (optimizedById.size === 0) return;

        const updateCovers = (tracksToUpdate: Track[]) =>
          tracksToUpdate.map((track) => {
            const coverUrl = optimizedById.get(track.id);
            return coverUrl ? { ...track, coverUrl } : track;
          });

        set((state) => ({
          libraryTracks: updateCovers(state.libraryTracks),
          playlistTracks: updateCovers(state.playlistTracks),
          currentTrack: state.currentTrack
            ? updateCovers([state.currentTrack])[0]
            : state.currentTrack,
          lastTrack: state.lastTrack ? updateCovers([state.lastTrack])[0] : state.lastTrack,
        }));
      },

      updateTrackMetadata: (trackId, metadata) => {
        set((state) => {
          const updateTracks = (tracks: Track[]) =>
            tracks.map((track) => (track.id === trackId ? { ...track, ...metadata } : track));
          const currentTrack =
            state.currentTrack?.id === trackId
              ? { ...state.currentTrack, ...metadata }
              : state.currentTrack;
          const lastTrack =
            state.lastTrack?.id === trackId ? { ...state.lastTrack, ...metadata } : state.lastTrack;

          return {
            libraryTracks: updateTracks(state.libraryTracks),
            playlistTracks: updateTracks(state.playlistTracks),
            currentTrack,
            lastTrack,
          };
        });
      },

      clearLibrary: () => {
        const { libraryTracks, playlistTracks, currentTrack } = get();
        const currentTrackInLibrary = currentTrack
          ? libraryTracks.some((track) => track.id === currentTrack.id)
          : false;
        const currentTrackInPlaylist = currentTrack
          ? playlistTracks.some((track) => track.id === currentTrack.id)
          : false;
        const shouldStopPlayback = currentTrackInLibrary && !currentTrackInPlaylist;

        if (shouldStopPlayback) {
          cleanupAudioResources(get());
        }

        set((state) => ({
          libraryTracks: [],
          albums: [],
          favoriteTrackIds: state.favoriteTrackIds.filter((favoriteTrackId) =>
            state.playlistTracks.some((track) => track.id === favoriteTrackId)
          ),
          currentTrack: shouldStopPlayback ? null : state.currentTrack,
          lastTrack: shouldStopPlayback ? null : state.lastTrack,
          isPlaying: shouldStopPlayback ? false : state.isPlaying,
          seek: shouldStopPlayback ? 0 : state.seek,
          duration: shouldStopPlayback ? 0 : state.duration,
          analyzer: shouldStopPlayback ? null : state.analyzer,
          howl: shouldStopPlayback ? null : state.howl,
          mediaSource: shouldStopPlayback ? null : state.mediaSource,
          gainNode: shouldStopPlayback ? null : state.gainNode,
          compressor: shouldStopPlayback ? null : state.compressor,
          eqInput: shouldStopPlayback ? null : state.eqInput,
          eqOutput: shouldStopPlayback ? null : state.eqOutput,
          eqFilters: shouldStopPlayback ? [] : state.eqFilters,
          objectUrl: shouldStopPlayback ? null : state.objectUrl,
          connectedMediaNode: shouldStopPlayback ? null : state.connectedMediaNode,
          audioCleanup: shouldStopPlayback ? null : state.audioCleanup,
          audioWatchdogId: shouldStopPlayback ? null : state.audioWatchdogId,
        }));
      },

      clearPlaylist: () => {
        const { currentTrack, playlistTracks, libraryTracks } = get();
        const currentTrackInPlaylist = currentTrack
          ? playlistTracks.some((track) => track.id === currentTrack.id)
          : false;
        const currentTrackInLibrary = currentTrack
          ? libraryTracks.some((track) => track.id === currentTrack.id)
          : false;
        const shouldStopPlayback = currentTrackInPlaylist && !currentTrackInLibrary;

        if (shouldStopPlayback) {
          cleanupAudioResources(get());
        }

        set((state) => ({
          playlistTracks: [],
          currentTrack: shouldStopPlayback ? null : state.currentTrack,
          lastTrack:
            shouldStopPlayback ||
            state.playlistTracks.some((track) => track.id === state.lastTrack?.id)
              ? null
              : state.lastTrack,
          isPlaying: shouldStopPlayback ? false : state.isPlaying,
          seek: shouldStopPlayback ? 0 : state.seek,
          duration: shouldStopPlayback ? 0 : state.duration,
          analyzer: shouldStopPlayback ? null : state.analyzer,
          howl: shouldStopPlayback ? null : state.howl,
          mediaSource: shouldStopPlayback ? null : state.mediaSource,
          gainNode: shouldStopPlayback ? null : state.gainNode,
          compressor: shouldStopPlayback ? null : state.compressor,
          eqInput: shouldStopPlayback ? null : state.eqInput,
          eqOutput: shouldStopPlayback ? null : state.eqOutput,
          eqFilters: shouldStopPlayback ? [] : state.eqFilters,
          objectUrl: shouldStopPlayback ? null : state.objectUrl,
          connectedMediaNode: shouldStopPlayback ? null : state.connectedMediaNode,
          audioCleanup: shouldStopPlayback ? null : state.audioCleanup,
          audioWatchdogId: shouldStopPlayback ? null : state.audioWatchdogId,
        }));
      },

      addToPlaylist: (track) => {
        set((state) => {
          if (state.playlistTracks.some((playlistTrack) => playlistTrack.id === track.id)) {
            return state;
          }

          return { playlistTracks: [...state.playlistTracks, track] };
        });
      },

      removeFromPlaylist: (trackId) => {
        set((state) => ({
          playlistTracks: state.playlistTracks.filter((track) => track.id !== trackId),
        }));
      },

      movePlaylistTrack: (draggedTrackId, targetTrackId) => {
        set((state) => {
          const fromIndex = state.playlistTracks.findIndex((track) => track.id === draggedTrackId);
          const toIndex = state.playlistTracks.findIndex((track) => track.id === targetTrackId);

          if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
            return state;
          }

          return {
            playlistTracks: moveArrayItem(state.playlistTracks, fromIndex, toIndex),
          };
        });
      },

      movePlaylistTrackToEnd: (draggedTrackId) => {
        set((state) => {
          const fromIndex = state.playlistTracks.findIndex((track) => track.id === draggedTrackId);

          if (fromIndex < 0 || fromIndex === state.playlistTracks.length - 1) {
            return state;
          }

          const [movedTrack] = state.playlistTracks.slice(fromIndex, fromIndex + 1);
          const nextTracks = state.playlistTracks.filter((track) => track.id !== draggedTrackId);

          return {
            playlistTracks: [...nextTracks, movedTrack],
          };
        });
      },

      isTrackFavorite: (trackId) => get().favoriteTrackIds.includes(trackId),

      toggleTrackFavorite: (trackId) => {
        set((state) => {
          const isFavorite = state.favoriteTrackIds.includes(trackId);

          return {
            favoriteTrackIds: isFavorite
              ? state.favoriteTrackIds.filter((id) => id !== trackId)
              : [...state.favoriteTrackIds, trackId],
          };
        });
      },

      clearFavorites: () => {
        set({ favoriteTrackIds: [] });
      },

      setTrack: (track) => {
        // Cleanup existing Howl and audio graph before creating a new one
        const {
          howl: oldHowl,
          objectUrl,
          mediaSource,
          gainNode,
          compressor,
          analyzer,
          eqInput,
          eqOutput,
          eqFilters,
          audioCleanup,
          audioWatchdogId,
        } = get();
        if (oldHowl) oldHowl.unload();

        try {
          audioCleanup?.();
        } catch (e) {
          void e;
        }
        disconnectAudioNode(mediaSource);
        disconnectAudioNode(gainNode);
        disconnectAudioNode(compressor);
        disconnectAudioNode(analyzer);
        disconnectAudioNode(eqInput);
        disconnectAudioNode(eqOutput);
        eqFilters.forEach(disconnectAudioNode);
        if (audioWatchdogId) clearInterval(audioWatchdogId);
        try {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        } catch (e) {
          void e;
        }

        // Clear references
        set({
          howl: null,
          isPlaying: false,
          analyzer: null,
          mediaSource: null,
          gainNode: null,
          compressor: null,
          eqInput: null,
          eqOutput: null,
          eqFilters: [],
          connectedMediaNode: null,
          objectUrl: null,
          audioCleanup: null,
          audioWatchdogId: null,
          seek: 0,
          duration: 0,
        });

        const trackSource = getTrackSource(track);
        if (!trackSource) return;

        const activeUrl = trackSource.src;
        let activeHowl: Howl | null = null;
        const handlePlaybackFailure = () => {
          if (get().howl !== activeHowl) return;

          const {
            audioCleanup: cleanup,
            mediaSource: currentMediaSource,
            gainNode: currentGainNode,
            compressor: currentCompressor,
            analyzer: currentAnalyzer,
            eqInput: currentEqInput,
            eqOutput: currentEqOutput,
            eqFilters: currentEqFilters,
            audioWatchdogId: currentWatchdogId,
          } = get();

          activeHowl?.unload();
          cleanup?.();
          disconnectAudioNode(currentMediaSource);
          disconnectAudioNode(currentGainNode);
          disconnectAudioNode(currentCompressor);
          disconnectAudioNode(currentAnalyzer);
          disconnectAudioNode(currentEqInput);
          disconnectAudioNode(currentEqOutput);
          currentEqFilters.forEach(disconnectAudioNode);
          if (currentWatchdogId) clearInterval(currentWatchdogId);
          if (trackSource.isObjectUrl) URL.revokeObjectURL(activeUrl);

          set({
            howl: null,
            isPlaying: false,
            duration: 0,
            analyzer: null,
            mediaSource: null,
            gainNode: null,
            compressor: null,
            eqInput: null,
            eqOutput: null,
            eqFilters: [],
            connectedMediaNode: null,
            objectUrl: null,
            audioCleanup: null,
            audioWatchdogId: null,
          });
        };

        // Creamos Howl con volumen a 1. El control de ganancia real lo haremos
        // mediante un GainNode conectado al contexto de Howler.
        const newHowl = new Howl({
          src: [activeUrl],
          format: trackSource.format ? [trackSource.format] : undefined,
          html5: true,
          volume: 1,
          onplay: () => {
            if (get().howl !== newHowl) return;
            set({ isPlaying: true, duration: newHowl.duration() });

            // Ensure we never accumulate watchdog intervals across resumes/tracks.
            try {
              const { audioWatchdogId: existingWatchdogId } = get();
              if (existingWatchdogId) clearInterval(existingWatchdogId);
            } catch (e) {
              void e;
            }

            // Conexión del Analizador + GainNode + Compressor para amplificación segura
            const node = (newHowl as unknown as HowlInternal)._sounds?.[0]?._node;
            if (node) {
              try {
                const ctx = Howler.ctx;
                const {
                  connectedMediaNode: existingConnectedNode,
                  mediaSource: existingMediaSource,
                  gainNode: existingGainNode,
                  compressor: existingCompressor,
                  analyzer: existingAnalyzer,
                } = get();

                if (existingConnectedNode === node && existingMediaSource) {
                  set({ objectUrl: trackSource.isObjectUrl ? activeUrl : null });
                  return;
                }

                if (existingConnectedNode && existingConnectedNode !== node) {
                  try {
                    existingMediaSource?.disconnect();
                  } catch (e) {
                    void e;
                  }
                  try {
                    existingGainNode?.disconnect();
                  } catch (e) {
                    void e;
                  }
                  try {
                    existingCompressor?.disconnect();
                  } catch (e) {
                    void e;
                  }
                  try {
                    existingAnalyzer?.disconnect();
                  } catch (e) {
                    void e;
                  }
                  try {
                    get().eqInput?.disconnect();
                  } catch (e) {
                    void e;
                  }
                  try {
                    get().eqOutput?.disconnect();
                  } catch (e) {
                    void e;
                  }
                  get().eqFilters.forEach((filter) => {
                    try {
                      filter.disconnect();
                    } catch (e) {
                      void e;
                    }
                  });
                }

                // Un elemento HTMLAudioElement solo puede tener una MediaElementSourceNode.
                const mediaSourceNode =
                  mediaSourceNodes.get(node) ?? ctx.createMediaElementSource(node);
                mediaSourceNodes.set(node, mediaSourceNode);

                // Attach lightweight listeners to help diagnose unexpected pauses
                const onPause = () =>
                  debugAudio('[audio-event] pause', { currentTime: node.currentTime });
                const onEnded = () =>
                  debugAudio('[audio-event] ended', { currentTime: node.currentTime });
                const onStalled = () =>
                  debugAudio('[audio-event] stalled', { currentTime: node.currentTime });
                const onSuspend = () =>
                  debugAudio('[audio-event] suspend', { currentTime: node.currentTime });
                const onError = (ev: Event) => debugAudio('[audio-event] error', ev);

                try {
                  node.addEventListener('pause', onPause);
                  node.addEventListener('ended', onEnded);
                  node.addEventListener('stalled', onStalled);
                  node.addEventListener('suspend', onSuspend);
                  node.addEventListener('error', onError as EventListener);
                } catch (e) {
                  void e;
                }

                const cleanupListeners = () => {
                  try {
                    node.removeEventListener('pause', onPause);
                  } catch (e) {
                    void e;
                  }
                  try {
                    node.removeEventListener('ended', onEnded);
                  } catch (e) {
                    void e;
                  }
                  try {
                    node.removeEventListener('stalled', onStalled);
                  } catch (e) {
                    void e;
                  }
                  try {
                    node.removeEventListener('suspend', onSuspend);
                  } catch (e) {
                    void e;
                  }
                  try {
                    node.removeEventListener('error', onError as EventListener);
                  } catch (e) {
                    void e;
                  }
                };

                // Gain para amplificación (valor en state.volume, puede ser >1)
                const gainNode = ctx.createGain();
                gainNode.gain.value = get().volume ?? 0.5;

                // Compressor para proteger contra clipping/distorsión
                const compressor = ctx.createDynamicsCompressor();
                compressor.threshold.setValueAtTime(-6, ctx.currentTime);
                compressor.knee.setValueAtTime(30, ctx.currentTime);
                compressor.ratio.setValueAtTime(12, ctx.currentTime);
                compressor.attack.setValueAtTime(0.003, ctx.currentTime);
                compressor.release.setValueAtTime(0.25, ctx.currentTime);

                const analyzer = Howler.ctx.createAnalyser();
                analyzer.fftSize = 256;

                const {
                  input: eqInput,
                  output: eqOutput,
                  nodes: eqNodes,
                } = buildEqFilters(Howler.ctx, get().eqBands);

                // Cadena: source -> gain -> compressor -> EQ -> analyzer -> destination
                mediaSourceNode.connect(gainNode);
                gainNode.connect(compressor);
                compressor.connect(eqInput);
                eqOutput.connect(analyzer);
                analyzer.connect(Howler.ctx.destination);

                // persist references so we can disconnect later
                set({
                  analyzer,
                  gainNode,
                  compressor,
                  eqInput,
                  eqOutput,
                  eqFilters: eqNodes,
                  mediaSource: mediaSourceNode,
                  connectedMediaNode: node,
                  objectUrl: trackSource.isObjectUrl ? activeUrl : null,
                  audioCleanup: cleanupListeners,
                });

                applyEqBandsToFilters(eqNodes, get().eqBands, get().eqEnabled);

                // Expose lightweight debug references for test instrumentation
                try {
                  // @ts-expect-error - adding debug refs to window
                  window.__musie_debug = window.__musie_debug || {};
                  // @ts-expect-error adding non-standard debug prop to window
                  window.__musie_debug.analyzer = analyzer;
                  // @ts-expect-error adding non-standard debug prop to window
                  window.__musie_debug.mediaNode = node;
                  // @ts-expect-error adding non-standard debug prop to window
                  window.__musie_debug.source = mediaSourceNode;
                  try {
                    debugAudio('[audio-event] onplay - debug refs exposed', {
                      currentTime: node?.currentTime,
                      src: activeUrl,
                    });
                  } catch (e) {
                    void e;
                  }
                } catch (e) {
                  void e;
                }

                // Start a small watchdog that tries to resume the audio context if it becomes suspended
                try {
                  const watchdogId = setInterval(() => {
                    try {
                      if (Howler.ctx && Howler.ctx.state === 'suspended') {
                        Howler.ctx.resume().catch(() => {});
                        debugAudio('[audio-watchdog] attempted resume');
                      }
                    } catch (e) {
                      void e;
                    }
                  }, 3000);

                  // store watchdog id
                  // browser setInterval returns number in browsers
                  set({ audioWatchdogId: Number(watchdogId) });
                } catch (e) {
                  void e;
                }
              } catch (err) {
                debugAudio('Audio node already connected or connection failed', err);
              }
            }
          },
          onpause: () => {
            if (get().howl !== newHowl) return;
            try {
              const { audioWatchdogId: existingWatchdogId } = get();
              if (existingWatchdogId) clearInterval(existingWatchdogId);
            } catch (e) {
              void e;
            }
            set({ isPlaying: false, audioWatchdogId: null });
          },
          onend: () => {
            if (get().howl !== newHowl) return;
            try {
              const { audioWatchdogId: existingWatchdogId } = get();
              if (existingWatchdogId) clearInterval(existingWatchdogId);
            } catch (e) {
              void e;
            }
            if (get().repeatMode === 'one') {
              set({ isPlaying: false, seek: 0, audioWatchdogId: null });
              get().setTrack(track);
              return;
            }
            set({ isPlaying: false, seek: 0, audioWatchdogId: null });
            get().playNextTrack();
          },
          onloaderror: (_id, error) => {
            if (get().howl !== newHowl) return;
            debugAudio('[audio-event] load error', { trackId: track.id, error });
            handlePlaybackFailure();
          },
          onplayerror: (_id, error) => {
            if (get().howl !== newHowl) return;
            debugAudio('[audio-event] play error', { trackId: track.id, error });
            handlePlaybackFailure();
          },
          onload: function () {
            if (get().howl !== newHowl) return;
            const duration = newHowl.duration();
            set({ duration });
            if (Number.isFinite(duration) && duration > 0) {
              get().updateTrackMetadata(track.id, { durationSeconds: duration });
            }
          },
        });
        activeHowl = newHowl;

        set({
          currentTrack: track,
          lastTrack: track,
          howl: newHowl,
          isPlaying: true,
          objectUrl: trackSource.isObjectUrl ? activeUrl : null,
        });
        if (Howler.ctx?.state === 'suspended') void Howler.ctx.resume();
        newHowl.play();
      },

      playPreviousTrack: () => {
        const { libraryTracks, playlistTracks, currentTrack } = get();
        const activeTracks = getTrackListByPlaybackContext({
          libraryTracks,
          playlistTracks,
          currentTrack,
        });
        if (activeTracks.length === 0) return;

        const currentIndex = getTrackIndex(activeTracks, currentTrack);
        if (currentIndex === -1) return;

        const previousIndex = (currentIndex - 1 + activeTracks.length) % activeTracks.length;
        get().setTrack(activeTracks[previousIndex]);
      },

      playNextTrack: () => {
        const { libraryTracks, playlistTracks, currentTrack, shuffleEnabled, repeatMode } = get();
        const activeTracks = getTrackListByPlaybackContext({
          libraryTracks,
          playlistTracks,
          currentTrack,
        });
        if (activeTracks.length === 0) return;

        const currentIndex = getTrackIndex(activeTracks, currentTrack);
        if (currentIndex === -1) return;

        const nextIndex = getNextTrackIndex(activeTracks, currentIndex, shuffleEnabled, repeatMode);
        if (nextIndex < 0) {
          set({ isPlaying: false, seek: 0 });
          return;
        }
        get().setTrack(activeTracks[nextIndex]);
      },

      toggleShuffle: () => {
        set((state) => ({ shuffleEnabled: !state.shuffleEnabled }));
      },

      cycleRepeatMode: () => {
        set((state) => ({
          repeatMode:
            state.repeatMode === 'off' ? 'all' : state.repeatMode === 'all' ? 'one' : 'off',
        }));
      },

      createAlbum: (album) => {
        set((state) => ({
          albums: [...state.albums, { ...album, id: crypto.randomUUID(), createdAt: Date.now() }],
        }));
      },

      updateAlbum: (albumId, album) => {
        set((state) => ({
          albums: state.albums.map((item) => (item.id === albumId ? { ...item, ...album } : item)),
        }));
      },

      deleteAlbum: (albumId) => {
        set((state) => ({ albums: state.albums.filter((album) => album.id !== albumId) }));
      },

      togglePlay: () => {
        const { howl, isPlaying } = get();
        if (!howl) return;

        if (isPlaying) {
          howl.pause();
        } else {
          if (Howler.ctx.state === 'suspended') Howler.ctx.resume();
          howl.play();
        }
      },

      setVolume: (val) => {
        const { howl, gainNode } = get();

        // Si tenemos un GainNode en el WebAudio, usarlo para permitir >1
        if (gainNode) {
          try {
            gainNode.gain.value = val;
          } catch {
            /* empty */
          }
        } else if (howl) {
          // Fallback: limitar al rango que Howl soporta
          howl.volume(Math.min(val, 1));
        }

        set({ volume: val });
      },

      setSeek: (val) => {
        const { howl, duration } = get();
        if (howl) {
          const nextSeek = clampSeekValue(val, duration);
          howl.seek(nextSeek);
          set({ seek: nextSeek });
        }
      },

      fastSeek: (val) => {
        const { howl, duration } = get();
        if (!howl) return;

        const nextSeek = clampSeekValue(val, duration);

        try {
          const node = (howl as unknown as HowlInternal)._sounds?.[0]?._node;
          if (node && typeof (node as unknown as HTMLMediaElement).fastSeek === 'function') {
            try {
              // Some browsers (Chromium) support fastSeek on HTMLMediaElement
              (node as unknown as HTMLMediaElement).fastSeek(nextSeek);
              set({ seek: nextSeek });
              return;
            } catch (err) {
              debugAudio('fastSeek failed, falling back to howl.seek()', err);
            }
          }
        } catch (err) {
          debugAudio('error accessing audio node for fastSeek', err);
        }

        // Fallback
        try {
          howl.seek(nextSeek);
          set({ seek: nextSeek });
        } catch (err) {
          debugAudio('howl.seek failed in fastSeek', err);
        }
      },

      updateProgress: () => {
        const { howl, isPlaying } = get();
        if (howl && isPlaying) {
          const s = howl.seek();
          if (typeof s === 'number') set({ seek: s });
        }
      },

      setEqPreset: (preset) => {
        const nextBands = getEqPreset(preset).map((band, index) => ({
          ...DEFAULT_EQ_BANDS[index],
          ...band,
        }));

        set({ eqPreset: preset, eqBands: nextBands });

        const { eqFilters, eqEnabled } = get();
        applyEqBandsToFilters(eqFilters, nextBands, eqEnabled);
      },

      updateEqBand: (bandIndex, gain) => {
        set((state) => {
          const nextBands = state.eqBands.map((band, index) => {
            if (index !== bandIndex) return band;
            return {
              ...band,
              gain,
            };
          });

          return { eqBands: nextBands, eqPreset: 'custom' };
        });

        const { eqFilters, eqEnabled, eqBands } = get();
        applyEqBandsToFilters(eqFilters, eqBands, eqEnabled);
      },

      setEqEnabled: (enabled) => {
        const { eqFilters, eqBands } = get();
        set({ eqEnabled: enabled });
        applyEqBandsToFilters(eqFilters, eqBands, enabled);
      },

      resetEq: () => {
        const nextBands = getEqPreset(DEFAULT_EQ_PRESET);
        set({ eqBands: nextBands, eqPreset: DEFAULT_EQ_PRESET, eqEnabled: true });
        const { eqFilters } = get();
        applyEqBandsToFilters(eqFilters, nextBands, true);
      },
    }),
    {
      name: 'musie-pwa-storage',
      storage: customBinaryStorage,
      version: 6,
      migrate: (persistedState) => {
        const state = persistedState as Partial<PersistedPlayerState> & {
          libraryTracks?: Track[];
          playlistTracks?: Track[];
          songs?: Track[];
          lastTrack?: Track | null;
        };
        const libraryTracks = (state.libraryTracks ?? state.songs ?? []).map(normalizeTrack);
        const playlistTracks = (state.playlistTracks ?? state.songs ?? []).map(normalizeTrack);
        const audioFiles = { ...(state.audioFiles ?? {}) };
        collectAudioFiles(libraryTracks, audioFiles);
        collectAudioFiles(playlistTracks, audioFiles);
        if (state.lastTrack) collectAudioFiles([state.lastTrack], audioFiles);

        const nextEqBands = (state.eqBands?.length ? state.eqBands : DEFAULT_EQ_BANDS).map(
          (band, index) => ({
            ...DEFAULT_EQ_BANDS[index],
            ...band,
          })
        );

        return {
          libraryTracks: libraryTracks.map(stripTrackFile),
          playlistTracks: playlistTracks.map(stripTrackFile),
          audioFiles,
          favoriteTrackIds: state.favoriteTrackIds ?? [],
          volume: state.volume ?? 0.5,
          lastTrack: state.lastTrack ? stripTrackFile(normalizeTrack(state.lastTrack)) : null,
          eqBands: nextEqBands,
          eqPreset: state.eqPreset ?? DEFAULT_EQ_PRESET,
          eqEnabled: state.eqEnabled ?? true,
          shuffleEnabled: state.shuffleEnabled ?? false,
          repeatMode: normalizeRepeatMode(state.repeatMode),
          albums: state.albums ?? [],
        };
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedPlayerState & {
          libraryTracks?: Track[];
          playlistTracks?: Track[];
          lastTrack?: Track | null;
        };
        const audioFiles = { ...(persisted.audioFiles ?? {}) };
        const libraryTracks = persisted.libraryTracks ?? [];
        const playlistTracks = persisted.playlistTracks ?? [];
        collectAudioFiles(libraryTracks, audioFiles);
        collectAudioFiles(playlistTracks, audioFiles);
        if (persisted.lastTrack) collectAudioFiles([persisted.lastTrack], audioFiles);
        const { audioFiles: ignoredAudioFiles, ...persistedWithoutAudioFiles } = persisted;
        void ignoredAudioFiles;

        return {
          ...currentState,
          ...persistedWithoutAudioFiles,
          libraryTracks: restoreTrackFiles(libraryTracks, audioFiles),
          playlistTracks: restoreTrackFiles(playlistTracks, audioFiles),
          lastTrack: persisted.lastTrack
            ? restoreTrackFiles([persisted.lastTrack], audioFiles)[0]
            : null,
          shuffleEnabled: persisted.shuffleEnabled ?? false,
          repeatMode: normalizeRepeatMode(persisted.repeatMode),
          albums: persisted.albums ?? [],
        };
      },
      partialize: createPersistedState,
    }
  )
);
