import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { Howl, Howler } from 'howler';
import type { Track } from '../types/track';

interface PersistedPlayerState {
  songs: Track[];
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
  songs: Track[];
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
  audioCleanup?: (() => void) | null;
  audioWatchdogId?: number | null;
  addSongs: (files: File[]) => void;
  clearSongs: () => void;
  setTrack: (track: Track) => void;
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

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      songs: [],
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
      audioCleanup: null,
      audioWatchdogId: null,

      addSongs: (files) => {
        const newTracks = files.map((file) => ({
          id: crypto.randomUUID(),
          title: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Archivo Local',
          coverUrl: 'https://unsplash.com',
          audioUrl: '',
          fileData: file,
        }));
        set((state) => ({ songs: [...state.songs, ...newTracks] }));
      },

      clearSongs: () => {
        const { howl } = get();
        if (howl) howl.unload();

        // Cleanup any audio nodes and object URL
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
        set({
          songs: [],
          currentTrack: null,
          lastTrack: null,
          isPlaying: false,
          analyzer: null,
          howl: null,
        });
      },

      setTrack: (track) => {
        // Cleanup existing Howl and audio graph before creating a new one
        const {
          howl: oldHowl,
          mediaSource,
          gainNode,
          compressor,
          analyzer,
          objectUrl,
          audioWatchdogId,
        } = get();
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
          if (mediaSource) mediaSource.disconnect();
        } catch (e) {
          void e;
        }
        try {
          if (gainNode) gainNode.disconnect();
        } catch (e) {
          void e;
        }
        try {
          if (compressor) compressor.disconnect();
        } catch (e) {
          void e;
        }
        try {
          if (analyzer) analyzer.disconnect();
        } catch (e) {
          void e;
        }
        try {
          if (objectUrl) URL.revokeObjectURL(objectUrl);
        } catch (e) {
          void e;
        }
        try {
          if (audioWatchdogId) clearInterval(audioWatchdogId);
        } catch (e) {
          void e;
        }

        // Clear references
        set({
          analyzer: null,
          mediaSource: null,
          gainNode: null,
          compressor: null,
          objectUrl: null,
          audioCleanup: null,
          audioWatchdogId: null,
        });

        if (!track.fileData) return;

        // Solución al error de TS: Forzamos a File para acceder a .name
        const file = track.fileData as File;
        const extension = file.name?.split('.').pop()?.toLowerCase() || 'mp3';
        const activeUrl = URL.createObjectURL(file);

        // Creamos Howl con volumen a 1. El control de ganancia real lo haremos
        // mediante un GainNode conectado al contexto de Howler.
        const newHowl = new Howl({
          src: [activeUrl],
          format: [extension],
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

                // Crear fuente desde el elemento de audio
                const source = ctx.createMediaElementSource(node);

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
                source.connect(gainNode);
                gainNode.connect(compressor);
                compressor.connect(analyzer);
                analyzer.connect(Howler.ctx.destination);

                // persist references so we can disconnect later
                set({
                  analyzer,
                  gainNode,
                  compressor,
                  mediaSource: source,
                  objectUrl: activeUrl,
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
                  window.__musie_debug.source = source;
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
          },
          onload: function () {
            set({ duration: newHowl.duration() });
          },
        });

        newHowl.play();
        set({ currentTrack: track, lastTrack: track, howl: newHowl, isPlaying: true });
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
      partialize: (state): PersistedPlayerState => ({
        songs: state.songs,
        volume: state.volume,
        lastTrack: state.lastTrack,
      }),
    }
  )
);
