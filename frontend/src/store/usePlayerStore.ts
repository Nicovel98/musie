import { create } from 'zustand';
import { persist, type PersistStorage, type StorageValue } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { Howl, Howler } from 'howler';
import type { Track } from '../types/track';

interface PersistedPlayerState {
  songs: Track[];
  volume: number;
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
          artist: 'Local Archive',
          coverUrl: 'https://unsplash.com',
          audioUrl: '',
          fileData: file,
        }));
        set((state) => ({ songs: [...state.songs, ...newTracks] }));
      },

      clearSongs: () => {
        const { howl } = get();
        if (howl) howl.unload();
        set({ songs: [], currentTrack: null, isPlaying: false, analyzer: null });
      },

      setTrack: (track) => {
        const { howl } = get();
        if (howl) howl.unload();
        if (!track.fileData) return;

        const activeUrl = URL.createObjectURL(track.fileData);
        const newHowl = new Howl({
          src: [activeUrl],
          format: ['mp3', 'wav', 'm4a', 'aac', 'ogg'],
          html5: true,
          volume: get().volume,
          onplay: () => {
            set({ isPlaying: true, duration: newHowl.duration() });
            const node = (newHowl as unknown as HowlInternal)._sounds?.[0]?._node;
            if (node && !get().analyzer) {
              try {
                const source = Howler.ctx.createMediaElementSource(node);
                const analyzer = Howler.ctx.createAnalyser();
                analyzer.fftSize = 256;
                source.connect(analyzer);
                analyzer.connect(Howler.ctx.destination);
                set({ analyzer });
              } catch (e) {
                console.warn(e);
              }
            }
          },
          onpause: () => set({ isPlaying: false }),
          onend: () => set({ isPlaying: false, seek: 0 }),
          onload: () => set({ duration: newHowl.duration() }),
        });
        newHowl.play();
        set({ currentTrack: track, howl: newHowl, isPlaying: true });
      },

      togglePlay: () => {
        const { howl, isPlaying } = get();
        if (!howl) return;
        if (isPlaying) howl.pause();
        else howl.play();
      },

      setVolume: (val) => {
        const { howl } = get();
        if (howl) howl.volume(val);
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
        const { howl } = get();
        if (howl?.playing()) {
          const s = howl.seek();
          if (typeof s === 'number') set({ seek: s });
        }
      },
    }),
    {
      name: 'musie-pwa-storage',
      storage: customBinaryStorage,
      partialize: (state): PersistedPlayerState => ({ songs: state.songs, volume: state.volume }),
    }
  )
);
