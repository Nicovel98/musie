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
    <nav
      className="glass-effect w-full bg-[var(--glass-bg)] px-6 flex items-center justify-between pb-safe"
      style={{
        height: 'var(--mobile-tabs-height)',
        minHeight: 'var(--mobile-tabs-height)',
        maxHeight: 'var(--mobile-tabs-height)',
        boxSizing: 'border-box',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = currentView === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => (tab.id === 'home' || tab.id === 'library') && setView(tab.id)}
            className={`flex flex-col items-center justify-center gap-0.5 transition-all duration-300 relative ${
              isActive
                ? 'text-[var(--accent-primary)]'
                : 'text-[var(--text-muted)] active:text-[var(--text-main)]'
            }`}
          >
            {/* Indicador de brillo sutil para la pestaña activa */}
            {isActive && (
              <div className="absolute -top-1 w-1 h-1 bg-[var(--accent-primary)] rounded-full shadow-[0_0_8px_rgba(125,211,252,0.6)]" />
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
