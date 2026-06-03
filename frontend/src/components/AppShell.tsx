import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { NowPlaying } from './NowPlaying';
import { Library } from './Library';
import { SettingsView } from './SettingsView';
import { PlayerBar } from './PlayerBar';
import { MobileTabs } from './MobileTabs';

type View = 'home' | 'library' | 'settings';
type ThemeMode = 'dark' | 'light';
type DarkTheme = 'quantum' | 'classic';
type LightTheme = 'light' | 'light-quantum';

interface AppShellProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  themeMode: ThemeMode;
  darkTheme: DarkTheme;
  lightTheme: LightTheme;
  themeAffectsAudioUi: boolean;
  setThemeAffectsAudioUi: (value: boolean) => void;
  cycleThemeMode: () => void;
  selectDarkTheme: (theme: DarkTheme) => void;
  selectLightTheme: (theme: LightTheme) => void;
  shouldShowMobileTabs: boolean;
  showSidebar: boolean;
}

export const AppShell = ({
  currentView,
  setCurrentView,
  themeMode,
  darkTheme,
  lightTheme,
  themeAffectsAudioUi,
  setThemeAffectsAudioUi,
  cycleThemeMode,
  selectDarkTheme,
  selectLightTheme,
  shouldShowMobileTabs,
  showSidebar,
}: AppShellProps) => {
  return (
    <div className="flex flex-col h-screen w-full bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden font-sans transition-colors duration-500 relative">
      <div className="flex flex-1 overflow-hidden relative">
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

      <div className="relative shrink-0 w-full pb-1">
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

      <div
        className="block lg:hidden h-sm:!block lg-h-sm:!block fixed bottom-0 left-0 right-0 z-50 mobile-tabs-shell"
        style={{ display: shouldShowMobileTabs ? 'block' : 'none' }}
      >
        <MobileTabs currentView={currentView} setView={setCurrentView} />
      </div>
    </div>
  );
};
