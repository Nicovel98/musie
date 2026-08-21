import { useEffect, useRef, useState } from 'react';
import heroThumbnail from './assets/hero.png';
import { AppShell } from './components/AppShell';
import { useProgress } from './hooks/useProgress';
import { useMediaQuery } from './hooks/useMediaQuery';
import { usePlayerStore } from './store/usePlayerStore';
import { readTrackMetadata } from './store/trackMetadata';

type View = 'home' | 'library' | 'settings';
type LibraryTab = 'library' | 'favorites' | 'playlist';
type ThemeMode = 'dark' | 'light';
type DarkTheme = 'quantum' | 'classic';
type LightTheme = 'light' | 'light-quantum';
type AppTheme = DarkTheme | LightTheme;

const THEME_MODE_STORAGE_KEY = 'musie-theme-mode';
const DARK_THEME_STORAGE_KEY = 'musie-dark-theme';
const LIGHT_THEME_STORAGE_KEY = 'musie-light-theme';
const THEME_AUDIO_EFFECT_STORAGE_KEY = 'musie-theme-audio-effect';
const SIDEBAR_PIN_STORAGE_KEY = 'musie:sidebar-pinned';

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
  const autoLoadedRef = useRef(false);
  const setTrack = usePlayerStore((state) => state.setTrack);
  useProgress();
  const isSmallHeight = useMediaQuery('(max-height: 639px)');
  const isCompactLandscape = useMediaQuery(
    '(orientation: landscape) and (max-height: 640px) and (max-width: 1024px)'
  );
  const isLargeWidth = useMediaQuery('(min-width: 1024px)');
  const shouldShowMobileTabs = isSmallHeight || !isLargeWidth || isCompactLandscape;
  const showSidebar = !isSmallHeight && !isCompactLandscape;

  useEffect(() => {
    applyThemeToDocument(themeMode, darkTheme, lightTheme);

    try {
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
      window.localStorage.setItem(DARK_THEME_STORAGE_KEY, darkTheme);
      window.localStorage.setItem(LIGHT_THEME_STORAGE_KEY, lightTheme);
      window.localStorage.setItem(THEME_AUDIO_EFFECT_STORAGE_KEY, String(themeAffectsAudioUi));
      window.localStorage.setItem(SIDEBAR_PIN_STORAGE_KEY, String(sidebarPinned));
    } catch {
      /* ignore storage errors */
    }
  }, [themeMode, darkTheme, lightTheme, themeAffectsAudioUi, sidebarPinned]);

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

  useEffect(() => {
    if (autoLoadedRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const audioUrl = params.get('audioUrl');
    if (!audioUrl) return;

    autoLoadedRef.current = true;

    const loadExternalTrack = async () => {
      try {
        const decodedUrl = decodeURIComponent(audioUrl);
        const response = await fetch(decodedUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        const pathname = new URL(decodedUrl).pathname;
        const filename = pathname.split('/').filter(Boolean).pop() || 'audio.mp3';
        const fallbackTitle = filename.replace(/\.[^/.]+$/, '');

        const file = new File([blob], filename, { type: blob.type || 'audio/mpeg' });
        const metadata = await readTrackMetadata(file);
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
        console.debug('[audio-event] external audio load failed', error);
      }
    };

    loadExternalTrack();
  }, [setTrack]);

  return (
    <AppShell
      currentView={currentView}
      setCurrentView={setCurrentView}
      libraryTab={libraryTab}
      setLibraryTab={setLibraryTab}
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
