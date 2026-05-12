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
  addSongs: (files: File[]) => void;
  clearSongs: () => void;
  setTrack: (track: Track) => void;
  togglePlay: () => void;
  setVolume: (val: number) => void;
  setSeek: (val: number) => void;
  updateProgress: () => void;
}

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
        const { howl: oldHowl } = get();
        if (oldHowl) oldHowl.unload();
        if (!track.fileData) return;

        // Solución al error de TS: Forzamos a File para acceder a .name
        const file = track.fileData as File;
        const extension = file.name?.split('.').pop()?.toLowerCase() || 'mp3';
        const activeUrl = URL.createObjectURL(file);
        const playbackVolume = Math.min(get().volume, 1);

        const newHowl = new Howl({
          src: [activeUrl],
          format: [extension],
          html5: true,
          volume: playbackVolume,
          onplay: () => {
            set({ isPlaying: true, duration: newHowl.duration() });

            // Conexión del Analizador
            const node = (newHowl as unknown as HowlInternal)._sounds?.[0]?._node;
            if (node) {
              try {
                let analyzer = get().analyzer;
                if (!analyzer) {
                  const source = Howler.ctx.createMediaElementSource(node);
                  analyzer = Howler.ctx.createAnalyser();
                  analyzer.fftSize = 256;
                  source.connect(analyzer);
                  analyzer.connect(Howler.ctx.destination);
                  set({ analyzer });
                }
              } catch {
                console.debug('Audio node already connected');
              }
            }
          },
          onpause: () => set({ isPlaying: false }),
          onend: () => set({ isPlaying: false, seek: 0 }),
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
        const { howl } = get();
        if (howl) howl.volume(Math.min(val, 1));
        set({ volume: val });
      },

      setSeek: (val) => {
        const { howl } = get();
        if (howl) {
          howl.seek(val);
          set({ seek: val });
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
