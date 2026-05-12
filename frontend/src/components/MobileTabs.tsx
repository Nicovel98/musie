import { Home, Library, SlidersHorizontal, Settings } from 'lucide-react';

interface MobileTabsProps {
  currentView: 'home' | 'library';
  setView: (view: 'home' | 'library') => void;
}

export const MobileTabs = ({ currentView, setView }: MobileTabsProps) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'library', icon: Library, label: 'Library' },
    { id: 'equalizer', icon: SlidersHorizontal, label: 'EQ' }, // <--- Nuevo Tab
    { id: 'settings', icon: Settings, label: 'Settings' },
  ] as const;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-black/80 backdrop-blur-2xl border-t border-white/5 px-6 flex items-center justify-between z-50 pb-safe">
      {tabs.map((tab) => {
        const isActive = currentView === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => (tab.id === 'home' || tab.id === 'library') && setView(tab.id)}
            className={`flex flex-col items-center justify-center gap-0.5 transition-all duration-300 relative ${
              isActive ? 'text-blue-500' : 'text-gray-500 active:text-gray-300'
            }`}
          >
            {/* Indicador de brillo sutil para la pestaña activa */}
            {isActive && (
              <div className="absolute -top-1 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            )}

            <tab.icon
              size={20}
              strokeWidth={isActive ? 2.5 : 2}
              className="transition-transform active:scale-90"
            />

            <span className="text-[9px] font-black uppercase tracking-tighter">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
