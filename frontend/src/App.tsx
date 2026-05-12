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
                className="absolute inset-0 z-50 bg-[var(--bg-main)]"
              >
                <NowPlaying setView={setCurrentView} />
              </motion.div>
            ) : (
              <motion.div
                key="library"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                /* pb-60 asegura que el scroll no quede tapado por los controles en móvil */
                className="h-full overflow-y-auto custom-scrollbar pb-60 md:pb-0"
              >
                <Library />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* 2. ZONA DE CONTROLES INFERIOR */}
      <div className="relative shrink-0 w-full">
        {/* PLAYERBAR: Flotante sobre tabs en móvil, fija al fondo en desktop */}
        <AnimatePresence>
          {currentView !== 'home' && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className={`
                fixed left-0 right-0 px-3 z-40 pointer-events-auto
                /* Móvil: Flota arriba de las tabs (h-16 = 4rem) + safe area + margen */
                bottom-[calc(4rem+env(safe-area-inset-bottom)+12px)]
                /* Desktop: Se integra al flujo normal al final de la pantalla */
                md:relative md:bottom-0 md:px-0 md:bg-[var(--glass-bg)] md:border-t md:border-[var(--glass-border)]
              `}
            >
              <div className="max-w-7xl mx-auto glass-effect md:shadow-none rounded-2xl md:rounded-none overflow-hidden border border-[var(--glass-border)] md:border-none">
                <PlayerBar />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MOBILETABS: Siempre anclada al fondo en móvil */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 z-50 pb-[env(safe-area-inset-bottom)]">
          <MobileTabs currentView={currentView} setView={setCurrentView} />
        </div>
      </div>
    </div>
  );
}

export default App;
