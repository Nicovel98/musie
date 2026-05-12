import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { NowPlaying } from './components/NowPlaying';
import { Library } from './components/Library';
import { PlayerBar } from './components/PlayerBar';
import { MobileTabs } from './components/MobileTabs';
import { useProgress } from './hooks/useProgress';

type View = 'home' | 'library';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  useProgress();

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden font-sans transition-colors duration-500 relative">
      {/* 1. CUERPO SUPERIOR (Sidebar + Contenido) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR: Solo visible en escritorio */}
        <div className="hidden md:flex h-full shrink-0 border-r border-[var(--glass-border)]">
          <Sidebar setView={setCurrentView} currentView={currentView} />
        </div>

        <main className="flex-1 relative overflow-hidden bg-[var(--bg-main)]">
          <AnimatePresence mode="sync">
            {currentView === 'home' ? (
              <motion.div
                key="now-playing"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute inset-0 z-50 bg-[var(--bg-main)] pb-[calc(var(--mobile-tabs-height)+env(safe-area-inset-bottom))] md:pb-0"
              >
                <NowPlaying setView={setCurrentView} />
              </motion.div>
            ) : (
              <motion.div
                key="library"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full overflow-y-auto custom-scrollbar pb-[calc(var(--mobile-tabs-height)+var(--mobile-playerbar-height)+env(safe-area-inset-bottom)+1rem)] md:pb-0"
              >
                <Library />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* 2. ZONA DE CONTROLES INFERIOR (PlayerBar - Independiente) */}
      <div className="relative shrink-0 w-full">
        {/* PLAYERBAR: Desktop + Móvil */}
        <AnimatePresence>
          {currentView !== 'home' && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed md:relative left-0 right-0 bottom-[calc(var(--mobile-tabs-height)+env(safe-area-inset-bottom))] md:bottom-auto z-40 bg-[var(--glass-bg)] border-t border-[var(--glass-border)] md:pb-0"
            >
              <div className="max-w-7xl mx-auto px-0">
                <PlayerBar />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. MOBILETABS: Separada y fija en móvil */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-tabs-shell">
        <MobileTabs currentView={currentView} setView={setCurrentView} />
      </div>
    </div>
  );
}

export default App;
