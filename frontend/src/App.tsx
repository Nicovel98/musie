import { useEffect, useRef, useState } from 'react';
import heroThumbnail from './assets/hero.png';
import { AppShell } from './components/AppShell';
import { useProgress } from './hooks/useProgress';
import { useMediaQuery } from './hooks/useMediaQuery';
import { usePlayerStore } from './store/usePlayerStore';
import { readTrackMetadata } from './store/trackMetadata';
import type { Track } from './types/track';

import type { View } from './types/navigation';
type LibraryTab = 'library' | 'favorites' | 'playlist';
type LibrarySection = 'tracks' | 'albums' | 'lyrics';
type ThemeMode = 'dark' | 'light';
type DarkTheme = 'quantum' | 'classic';
type LightTheme = 'light' | 'light-quantum';
type AppTheme = DarkTheme | LightTheme;

const THEME_MODE_STORAGE_KEY = 'musie-theme-mode';
const DARK_THEME_STORAGE_KEY = 'musie-dark-theme';
const LIGHT_THEME_STORAGE_KEY = 'musie-light-theme';
const THEME_AUDIO_EFFECT_STORAGE_KEY = 'musie-theme-audio-effect';
const SIDEBAR_PIN_STORAGE_KEY = 'musie:sidebar-pinned';
const LIBRARY_SECTION_STORAGE_KEY = 'musie:library-section';
const EXTERNAL_AUDIO_TIMEOUT_MS = 15000;
const MAX_EXTERNAL_AUDIO_BYTES = 100 * 1024 * 1024;

const applyThemeToDocument = (
  themeMode: ThemeMode,
  darkTheme: DarkTheme,
  lightTheme: LightTheme
) => {
  const root = document.documentElement;
  const activeTheme: AppTheme = themeMode === 'light' ? lightTheme : darkTheme;
  root.classList.toggle('light', themeMode === 'light');

  if (themeMode === 'light' && activeTheme === 'light') {
    delete root.dataset.theme;
    return;
  }

  root.dataset.theme = activeTheme;
};

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('library');
  const [librarySection, setLibrarySection] = useState<LibrarySection>(() => {
    if (typeof window === 'undefined') return 'tracks';
    const storedSection = window.localStorage.getItem(LIBRARY_SECTION_STORAGE_KEY);
    return storedSection === 'albums' || storedSection === 'lyrics' ? storedSection : 'tracks';
  });
  const [selectedLyricsTrack, setSelectedLyricsTrack] = useState<Track | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';

    const storedThemeMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
    if (storedThemeMode === 'dark' || storedThemeMode === 'light') {
      return storedThemeMode;
    }

    return 'dark';
  });
  const [darkTheme, setDarkTheme] = useState<DarkTheme>(() => {
    if (typeof window === 'undefined') return 'quantum';

    const storedDarkTheme = window.localStorage.getItem(DARK_THEME_STORAGE_KEY);
    if (storedDarkTheme === 'quantum' || storedDarkTheme === 'classic') {
      return storedDarkTheme;
    }

    return 'quantum';
  });
  const [lightTheme, setLightTheme] = useState<LightTheme>(() => {
    if (typeof window === 'undefined') return 'light';

    const storedLightTheme = window.localStorage.getItem(LIGHT_THEME_STORAGE_KEY);
    if (
      storedLightTheme === 'light' ||
      storedLightTheme === 'light-classic' ||
      storedLightTheme === 'light-quantum'
    ) {
      if (storedLightTheme === 'light-classic') return 'light';

      return storedLightTheme;
    }

    if (storedLightTheme === 'quantum-light') {
      return 'light-quantum';
    }

    if (storedLightTheme === 'paper-light') {
      return 'light';
    }

    return 'light';
  });
  const [themeAffectsAudioUi, setThemeAffectsAudioUi] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;

    const storedThemeAudioEffect = window.localStorage.getItem(THEME_AUDIO_EFFECT_STORAGE_KEY);
    if (storedThemeAudioEffect === 'false') return false;
    if (storedThemeAudioEffect === 'true') return true;

    return true;
  });
  const [sidebarPinned, setSidebarPinned] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;

    try {
      return window.localStorage.getItem(SIDEBAR_PIN_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const coverMigrationStartedRef = useRef(false);
  const setTrack = usePlayerStore((state) => state.setTrack);
  const optimizeStoredCovers = usePlayerStore((state) => state.optimizeStoredCovers);
  const storedTrackCount = usePlayerStore(
    (state) => state.libraryTracks.length + state.playlistTracks.length
  );
  useProgress();
  const isSmallHeight = useMediaQuery('(max-height: 639px)');
  const isCompactLandscape = useMediaQuery(
    '(orientation: landscape) and (max-height: 640px) and (max-width: 1024px)'
  );
  const isLargeWidth = useMediaQuery('(min-width: 1024px)');
  const shouldShowMobileTabs = isSmallHeight || !isLargeWidth || isCompactLandscape;
  const showSidebar = !isSmallHeight && !isCompactLandscape;

  useEffect(() => {
    if (storedTrackCount === 0 || coverMigrationStartedRef.current) return;

    let cancelled = false;
    let idleCallbackId: number | undefined;
    let timeoutId: number | undefined;

    const runMigration = () => {
      if (cancelled) return;
      coverMigrationStartedRef.current = true;
      void optimizeStoredCovers().catch((error) => {
        console.error('[storage] failed to optimize stored covers', error);
      });
    };

    if ('requestIdleCallback' in window) {
      idleCallbackId = window.requestIdleCallback(runMigration, { timeout: 2000 });
    } else {
      timeoutId = globalThis.setTimeout(runMigration, 1000);
    }

    return () => {
      cancelled = true;
      if (idleCallbackId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleCallbackId);
      }
      if (timeoutId !== undefined) globalThis.clearTimeout(timeoutId);
    };
  }, [optimizeStoredCovers, storedTrackCount]);

  useEffect(() => {
    applyThemeToDocument(themeMode, darkTheme, lightTheme);
  }, [themeMode, darkTheme, lightTheme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
    } catch {
      /* ignore storage errors */
    }
  }, [themeMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(DARK_THEME_STORAGE_KEY, darkTheme);
    } catch {
      /* ignore storage errors */
    }
  }, [darkTheme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LIGHT_THEME_STORAGE_KEY, lightTheme);
    } catch {
      /* ignore storage errors */
    }
  }, [lightTheme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_AUDIO_EFFECT_STORAGE_KEY, String(themeAffectsAudioUi));
    } catch {
      /* ignore storage errors */
    }
  }, [themeAffectsAudioUi]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_PIN_STORAGE_KEY, String(sidebarPinned));
    } catch {
      /* ignore storage errors */
    }
  }, [sidebarPinned]);

  const cycleThemeMode = () => {
    setThemeMode((currentMode) => (currentMode === 'dark' ? 'light' : 'dark'));
  };

  const selectDarkTheme = (nextTheme: DarkTheme) => {
    setDarkTheme(nextTheme);
    setThemeMode('dark');
  };

  const selectLightTheme = (nextTheme: LightTheme) => {
    setLightTheme(nextTheme);
    setThemeMode('light');
  };

  const navigateToView = (view: View) => {
    if (view !== 'lyrics') setSelectedLyricsTrack(null);
    setCurrentView(view);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const audioUrl = params.get('audioUrl');
    if (!audioUrl) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), EXTERNAL_AUDIO_TIMEOUT_MS);
    let active = true;

    const loadExternalTrack = async () => {
      try {
        const decodedUrl = decodeURIComponent(audioUrl);
        const externalUrl = new URL(decodedUrl, window.location.href);
        if (!['http:', 'https:'].includes(externalUrl.protocol)) {
          throw new Error('Unsupported external audio protocol');
        }

        const response = await fetch(externalUrl.href, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const contentLength = Number(response.headers.get('content-length'));
        if (Number.isFinite(contentLength) && contentLength > MAX_EXTERNAL_AUDIO_BYTES) {
          throw new Error('External audio file is too large');
        }

        const blob = await response.blob();
        if (blob.size > MAX_EXTERNAL_AUDIO_BYTES) {
          throw new Error('External audio file is too large');
        }
        if (
          blob.type &&
          !blob.type.startsWith('audio/') &&
          blob.type !== 'application/octet-stream'
        ) {
          throw new Error('External resource is not an audio file');
        }

        const pathname = externalUrl.pathname;
        const filename = pathname.split('/').filter(Boolean).pop() || 'audio.mp3';
        const fallbackTitle = filename.replace(/\.[^/.]+$/, '');

        const file = new File([blob], filename, { type: blob.type || 'audio/mpeg' });
        const metadata = await readTrackMetadata(file);
        if (!active || controller.signal.aborted) return;

        setTrack({
          id: `external-${filename}-${Date.now()}`,
          title: metadata.title || fallbackTitle,
          artist: metadata.artist || 'Audio externo',
          album: metadata.album,
          albumArtist: metadata.albumArtist,
          genre: metadata.genre,
          year: metadata.year,
          coverUrl: metadata.coverUrl || heroThumbnail,
          audioUrl: decodedUrl,
          fileData: file,
          durationSeconds: metadata.durationSeconds,
          addedAt: Date.now(),
          source: 'external',
        });
      } catch (error) {
        if (active && !controller.signal.aborted) {
          console.debug('[audio-event] external audio load failed', error);
        }
      }
    };

    void loadExternalTrack();

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [setTrack]);

  return (
    <AppShell
      currentView={currentView}
      setCurrentView={navigateToView}
      libraryTab={libraryTab}
      setLibraryTab={setLibraryTab}
      librarySection={librarySection}
      setLibrarySection={setLibrarySection}
      selectedLyricsTrack={selectedLyricsTrack}
      setSelectedLyricsTrack={setSelectedLyricsTrack}
      themeMode={themeMode}
      darkTheme={darkTheme}
      lightTheme={lightTheme}
      themeAffectsAudioUi={themeAffectsAudioUi}
      setThemeAffectsAudioUi={setThemeAffectsAudioUi}
      cycleThemeMode={cycleThemeMode}
      selectDarkTheme={selectDarkTheme}
      selectLightTheme={selectLightTheme}
      shouldShowMobileTabs={shouldShowMobileTabs}
      showSidebar={showSidebar}
      sidebarPinned={sidebarPinned}
      setSidebarPinned={setSidebarPinned}
    />
  );
}

export default App;
