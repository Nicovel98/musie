import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { Howl, Howler } from 'howler';
import type { Track } from '../types/track';
import heroThumbnail from '../assets/hero.png';

interface PersistedPlayerState {
  libraryTracks: Track[];
  playlistTracks: Track[];
  favoriteTrackIds: string[];
  volume: number;
  lastTrack: Track | null;
}

interface HowlInternal extends Howl {
  _sounds: { _node: HTMLAudioElement }[];
}

const customBinaryStorage: PersistStorage<PersistedPlayerState> = {
  getItem: async (name) => (await get<StorageValue<PersistedPlayerState>>(name)) || null,
  setItem: async (name, value) => await set(name, value),
  removeItem: async (name) => await del(name),
};

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
  objectUrl: string | null;
  connectedMediaNode: HTMLAudioElement | null;
  audioCleanup?: (() => void) | null;
  audioWatchdogId?: number | null;
  addSongs: (files: File[]) => void;
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
  togglePlay: () => void;
  setVolume: (val: number) => void;
  setSeek: (val: number) => void;
  fastSeek: (val: number) => void;
  updateProgress: () => void;
}

const clampSeekValue = (val: number, duration: number) => {
  if (!Number.isFinite(val)) return 0;
  if (!Number.isFinite(duration) || duration <= 0) return Math.max(0, val);
  return Math.min(Math.max(0, val), duration);
};

const getTrackIndex = (songs: Track[], currentTrack: Track | null) =>
  currentTrack ? songs.findIndex((song) => song.id === currentTrack.id) : -1;

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

const getTrackSource = (track: Track) => {
  if (track.fileData) {
    const file = track.fileData as File;
    return {
      src: URL.createObjectURL(file),
      format: file.name?.split('.').pop()?.toLowerCase() || 'mp3',
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
      objectUrl: null,
      connectedMediaNode: null,
      audioCleanup: null,
      audioWatchdogId: null,

      addSongs: (files) => {
        const newTracks = files.map((file) => ({
          id: crypto.randomUUID(),
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Archivo Local',
          coverUrl: heroThumbnail,
          audioUrl: '',
          fileData: file,
        }));
        set((state) => ({ libraryTracks: [...state.libraryTracks, ...newTracks] }));
      },

      clearLibrary: () => {
        const { libraryTracks, playlistTracks, currentTrack, howl } = get();
        const currentTrackInLibrary = currentTrack
          ? libraryTracks.some((track) => track.id === currentTrack.id)
          : false;
        const currentTrackInPlaylist = currentTrack
          ? playlistTracks.some((track) => track.id === currentTrack.id)
          : false;
        const shouldStopPlayback = currentTrackInLibrary && !currentTrackInPlaylist;

        if (shouldStopPlayback && howl) howl.unload();
        if (shouldStopPlayback) {
          try {
            const {
              mediaSource,
              gainNode,
              compressor,
              analyzer,
              objectUrl,
              audioCleanup,
              audioWatchdogId,
            } = get();
            if (audioCleanup)
              try {
                audioCleanup();
              } catch (e) {
                void e;
              }
            if (mediaSource)
              try {
                mediaSource.disconnect();
              } catch (e) {
                void e;
              }
            if (gainNode)
              try {
                gainNode.disconnect();
              } catch (e) {
                void e;
              }
            if (compressor)
              try {
                compressor.disconnect();
              } catch (e) {
                void e;
              }
            if (analyzer)
              try {
                analyzer.disconnect();
              } catch (e) {
                void e;
              }
            if (objectUrl)
              try {
                URL.revokeObjectURL(objectUrl);
              } catch (e) {
                void e;
              }
            if (audioWatchdogId)
              try {
                clearInterval(audioWatchdogId);
              } catch (e) {
                void e;
              }
          } catch (e) {
            void e;
          }
        }

        set((state) => ({
          libraryTracks: [],
          favoriteTrackIds: state.favoriteTrackIds.filter((favoriteTrackId) =>
            state.playlistTracks.some((track) => track.id === favoriteTrackId)
          ),
          currentTrack: shouldStopPlayback ? null : state.currentTrack,
          lastTrack: shouldStopPlayback ? null : state.lastTrack,
          isPlaying: shouldStopPlayback ? false : state.isPlaying,
          analyzer: shouldStopPlayback ? null : state.analyzer,
          howl: shouldStopPlayback ? null : state.howl,
          mediaSource: shouldStopPlayback ? null : state.mediaSource,
          gainNode: shouldStopPlayback ? null : state.gainNode,
          compressor: shouldStopPlayback ? null : state.compressor,
          objectUrl: shouldStopPlayback ? null : state.objectUrl,
          connectedMediaNode: shouldStopPlayback ? null : state.connectedMediaNode,
        }));
      },

      clearPlaylist: () => {
        set((state) => ({
          playlistTracks: [],
          currentTrack: state.playlistTracks.some((track) => track.id === state.currentTrack?.id)
            ? null
            : state.currentTrack,
          lastTrack: state.playlistTracks.some((track) => track.id === state.lastTrack?.id)
            ? null
            : state.lastTrack,
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
        const { howl: oldHowl, objectUrl } = get();
        if (oldHowl) oldHowl.unload();

        try {
          const { audioCleanup } = get();
          if (audioCleanup)
            try {
              audioCleanup();
            } catch (e) {
              void e;
            }
        } catch (e) {
          void e;
        }
        try {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        } catch (e) {
          void e;
        }

        // Clear references
        set({
          objectUrl: null,
          audioCleanup: null,
          audioWatchdogId: null,
        });

        const trackSource = getTrackSource(track);
        if (!trackSource) return;

        const activeUrl = trackSource.src;

        // Creamos Howl con volumen a 1. El control de ganancia real lo haremos
        // mediante un GainNode conectado al contexto de Howler.
        const newHowl = new Howl({
          src: [activeUrl],
          format: trackSource.format ? [trackSource.format] : undefined,
          html5: true,
          volume: 1,
          onplay: () => {
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
                }

                // Crear fuente desde el elemento de audio
                const mediaSourceNode = ctx.createMediaElementSource(node);

                // Attach lightweight listeners to help diagnose unexpected pauses
                const onPause = () =>
                  console.debug('[audio-event] pause', { currentTime: node.currentTime });
                const onEnded = () =>
                  console.debug('[audio-event] ended', { currentTime: node.currentTime });
                const onStalled = () =>
                  console.debug('[audio-event] stalled', { currentTime: node.currentTime });
                const onSuspend = () =>
                  console.debug('[audio-event] suspend', { currentTime: node.currentTime });
                const onError = (ev: Event) => console.debug('[audio-event] error', ev);

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

                // Cadena: source -> gain -> compressor -> analyzer -> destination
                mediaSourceNode.connect(gainNode);
                gainNode.connect(compressor);
                compressor.connect(analyzer);
                analyzer.connect(Howler.ctx.destination);

                // persist references so we can disconnect later
                set({
                  analyzer,
                  gainNode,
                  compressor,
                  mediaSource: mediaSourceNode,
                  connectedMediaNode: node,
                  objectUrl: trackSource.isObjectUrl ? activeUrl : null,
                  audioCleanup: cleanupListeners,
                });

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
                    console.debug('[audio-event] onplay - debug refs exposed', {
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
                        console.debug('[audio-watchdog] attempted resume');
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
                console.debug('Audio node already connected or connection failed', err);
              }
            }
          },
          onpause: () => {
            try {
              const { audioWatchdogId: existingWatchdogId } = get();
              if (existingWatchdogId) clearInterval(existingWatchdogId);
            } catch (e) {
              void e;
            }
            set({ isPlaying: false, audioWatchdogId: null });
          },
          onend: () => {
            try {
              const { audioWatchdogId: existingWatchdogId } = get();
              if (existingWatchdogId) clearInterval(existingWatchdogId);
            } catch (e) {
              void e;
            }
            set({ isPlaying: false, seek: 0, audioWatchdogId: null });
            get().playNextTrack();
          },
          onload: function () {
            set({ duration: newHowl.duration() });
          },
        });

        newHowl.play();
        set({ currentTrack: track, lastTrack: track, howl: newHowl, isPlaying: true });
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
        const { libraryTracks, playlistTracks, currentTrack } = get();
        const activeTracks = getTrackListByPlaybackContext({
          libraryTracks,
          playlistTracks,
          currentTrack,
        });
        if (activeTracks.length === 0) return;

        const currentIndex = getTrackIndex(activeTracks, currentTrack);
        if (currentIndex === -1) return;

        const nextIndex = (currentIndex + 1) % activeTracks.length;
        get().setTrack(activeTracks[nextIndex]);
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
              console.debug('fastSeek failed, falling back to howl.seek()', err);
            }
          }
        } catch (err) {
          console.debug('error accessing audio node for fastSeek', err);
        }

        // Fallback
        try {
          howl.seek(nextSeek);
          set({ seek: nextSeek });
        } catch (err) {
          console.debug('howl.seek failed in fastSeek', err);
        }
      },

      updateProgress: () => {
        const { howl, isPlaying } = get();
        if (howl && isPlaying) {
          const s = howl.seek();
          if (typeof s === 'number') set({ seek: s });
        }
      },
    }),
    {
      name: 'musie-pwa-storage',
      storage: customBinaryStorage,
      version: 3,
      migrate: (persistedState) => {
        const state = persistedState as Partial<
          PersistedPlayerState & { songs?: Track[]; favoriteTrackIds?: string[] }
        >;
        const libraryTracks = state.libraryTracks ?? state.songs ?? [];
        const playlistTracks = state.playlistTracks ?? state.songs ?? [];

        return {
          libraryTracks,
          playlistTracks,
          favoriteTrackIds: state.favoriteTrackIds ?? [],
          volume: state.volume ?? 0.5,
          lastTrack: state.lastTrack ?? null,
        };
      },
      partialize: (state): PersistedPlayerState => ({
        libraryTracks: state.libraryTracks,
        playlistTracks: state.playlistTracks,
        favoriteTrackIds: state.favoriteTrackIds,
        volume: state.volume,
        lastTrack: state.lastTrack,
      }),
    }
  )
);
