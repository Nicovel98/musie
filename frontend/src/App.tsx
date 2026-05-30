import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { NowPlaying } from './components/NowPlaying';
import { Library } from './components/Library';
import { SettingsView } from './components/SettingsView';
import { PlayerBar } from './components/PlayerBar';
import { MobileTabs } from './components/MobileTabs';
import { useProgress } from './hooks/useProgress';
import { useMediaQuery } from './hooks/useMediaQuery';
import { usePlayerStore } from './store/usePlayerStore';

type View = 'home' | 'library' | 'settings';
type ThemeMode = 'dark' | 'light';
type DarkTheme = 'quantum' | 'classic';
type LightTheme = 'light' | 'light-quantum';
type AppTheme = DarkTheme | LightTheme;

const THEME_MODE_STORAGE_KEY = 'musie-theme-mode';
const DARK_THEME_STORAGE_KEY = 'musie-dark-theme';
const LIGHT_THEME_STORAGE_KEY = 'musie-light-theme';
const THEME_AUDIO_EFFECT_STORAGE_KEY = 'musie-theme-audio-effect';

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
    } catch {
      /* ignore storage errors */
    }
  }, [themeMode, darkTheme, lightTheme, themeAffectsAudioUi]);

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
        const title = filename.replace(/\.[^/.]+$/, '');

        const file = new File([blob], filename, { type: blob.type || 'audio/mpeg' });
        setTrack({
          id: `external-${filename}-${Date.now()}`,
          title,
          artist: 'Audio externo',
          coverUrl: 'https://unsplash.com',
          audioUrl: decodedUrl,
          fileData: file,
        });
      } catch (error) {
        console.debug('[audio-event] external audio load failed', error);
      }
    };

    loadExternalTrack();
  }, [setTrack]);

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden font-sans transition-colors duration-500 relative">
      {/* 1. CUERPO SUPERIOR (Sidebar + Contenido) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR: Solo visible en escritorio; ocultar en alturas sm y abajo */}
        {showSidebar && (
          <div className="hidden lg:flex h-full shrink-0 border-r border-[var(--sidebar-border)] h-sm:hidden lg-h-sm:hidden">
            <Sidebar
              setView={setCurrentView}
              currentView={currentView}
              themeMode={themeMode}
              cycleThemeMode={cycleThemeMode}
            />
          </div>
        )}

        <main className="flex-1 relative overflow-hidden bg-[var(--bg-main)]">
          <AnimatePresence mode="sync">
            {currentView === 'home' ? (
              <motion.div
                key="now-playing"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute inset-0 z-50 bg-[var(--bg-main)] pb-[calc(var(--mobile-tabs-height)+env(safe-area-inset-bottom))] lg:pb-2"
              >
                <NowPlaying
                  setView={setCurrentView}
                  themeMode={themeMode}
                  cycleThemeMode={cycleThemeMode}
                  useThemeAudioColors={themeAffectsAudioUi}
                />
              </motion.div>
            ) : currentView === 'settings' ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ type: 'spring', damping: 24, stiffness: 180 }}
                className="h-full overflow-y-auto custom-scrollbar pb-[calc(var(--mobile-tabs-height)+var(--mobile-playerbar-height)+env(safe-area-inset-bottom)+1rem)] lg:pb-1"
              >
                <SettingsView
                  selectedDarkTheme={darkTheme}
                  selectedLightTheme={lightTheme}
                  setDarkTheme={selectDarkTheme}
                  setLightTheme={selectLightTheme}
                  themeAffectsAudioUi={themeAffectsAudioUi}
                  setThemeAffectsAudioUi={setThemeAffectsAudioUi}
                />
              </motion.div>
            ) : (
              <motion.div
                key="library"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto custom-scrollbar pb-[calc(var(--mobile-tabs-height)+var(--mobile-playerbar-height)+env(safe-area-inset-bottom)+1rem)] lg:pb-1"
              >
                <Library useThemeAudioColors={themeAffectsAudioUi} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* 2. ZONA DE CONTROLES INFERIOR (PlayerBar - Independiente) */}
      <div className="relative shrink-0 w-full pb-1">
        {/* PLAYERBAR: Desktop + Móvil */}
        <AnimatePresence>
          {currentView !== 'home' && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed lg:relative left-0 right-0 bottom-[calc(var(--mobile-tabs-height)+env(safe-area-inset-bottom))] lg:bottom-auto z-40 bg-[var(--playerbar-bg)] border-t border-[var(--playerbar-border)] lg:pb-0"
              style={
                shouldShowMobileTabs
                  ? {
                      position: 'fixed',
                      bottom: 'calc(var(--mobile-tabs-height) + env(safe-area-inset-bottom))',
                    }
                  : undefined
              }
            >
              <div className="w-full px-1">
                <PlayerBar useThemeAudioColors={themeAffectsAudioUi} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. MOBILETABS: Separada y fija en móvil */}
      <div
        className="block lg:hidden h-sm:!block lg-h-sm:!block fixed bottom-0 left-0 right-0 z-50 mobile-tabs-shell"
        style={{ display: shouldShowMobileTabs ? 'block' : 'none' }}
      >
        <MobileTabs currentView={currentView} setView={setCurrentView} />
      </div>
    </div>
  );
}

export default App;
