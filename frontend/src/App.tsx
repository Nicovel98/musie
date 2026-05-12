import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { NowPlaying } from './components/NowPlaying';
import { Library } from './components/Library';
import { PlayerBar } from './components/PlayerBar';
import { MobileTabs } from './components/MobileTabs';
import { useProgress } from './hooks/useProgress';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'library'>('home');
  useProgress();

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden font-sans selection:bg-blue-500/30">
      {/* 1. SIDEBAR (Desktop) - w-56 y colapsable */}
      <div className="hidden md:flex">
        <Sidebar setView={setCurrentView} currentView={currentView} />
      </div>

      {/* 2. CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#080808]">
        {/* Atmósfera de fondo sutil */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-transparent to-purple-900/10 pointer-events-none" />

        <AnimatePresence mode="sync">
          {currentView === 'home' ? (
            <motion.div
              key="now-playing"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-30 bg-[#080808]"
            >
              <NowPlaying setView={setCurrentView} />
            </motion.div>
          ) : (
            <motion.div
              key="library"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              /* PB-60 para que la lista no choque con los controles flotantes */
              className="flex-1 overflow-y-auto relative z-10 pb-60 md:pb-40 custom-scrollbar"
            >
              <Library />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. ZONA DE CONTROLES (Arquitectura de Islas) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col pointer-events-none">
        {/* DEGRADADO DINÁMICO: Solo existe fuera del Home para no tapar el volumen */}
        <AnimatePresence>
          {currentView !== 'home' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black via-black/90 to-transparent -z-10"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {currentView !== 'home' && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="px-3 md:px-8 mb-2 md:mb-8 pointer-events-auto"
            >
              <div className="max-w-7xl mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <PlayerBar />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* NAVEGACIÓN MÓVIL (Cápsula flotante) */}
        <div className="md:hidden px-4 pb-6 pt-2 pointer-events-auto">
          <div className="bg-white/[0.03] backdrop-blur-3xl rounded-full border border-white/10 shadow-2xl overflow-hidden">
            <MobileTabs currentView={currentView} setView={setCurrentView} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
