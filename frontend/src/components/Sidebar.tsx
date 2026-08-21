import { useRef, useState } from 'react';
import {
  Home,
  Library,
  Disc,
  ListMusic,
  Heart,
  SlidersHorizontal,
  Activity,
  Settings,
  Pin,
  type LucideIcon,
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { SidebarSection as SidebarSectionView } from './SidebarSection';
import { SidebarFooter } from './SidebarFooter';

type View = 'home' | 'library' | 'equalizer' | 'visualizer' | 'preferences';
type LibraryTab = 'library' | 'favorites' | 'playlist';
type ThemeMode = 'dark' | 'light';

interface NavItem {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  isActive: boolean;
  badge?: number | string;
}

interface SidebarSectionData {
  title: string;
  items: NavItem[];
}

export const Sidebar = ({
  currentView,
  setView,
  libraryTab,
  setLibraryTab,
  themeMode,
  cycleThemeMode,
  isPinned,
  setIsPinned,
}: {
  currentView: View;
  setView: (v: View) => void;
  libraryTab: LibraryTab;
  setLibraryTab: (tab: LibraryTab) => void;
  themeMode: ThemeMode;
  cycleThemeMode: () => void;
  isPinned: boolean;
  setIsPinned: (value: boolean) => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const favoriteTrackCount = usePlayerStore((state) => state.favoriteTrackIds.length);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsHovered(false), 280);
  };

  const isExpanded = isPinned || isHovered;
  const isDarkMode = themeMode === 'dark';
  const themeLabel = isDarkMode ? 'Dark' : 'Light';

  const openLibraryTab = (tab: LibraryTab) => {
    setLibraryTab(tab);
    setView('library');
  };

  const mainItems: NavItem[] = [
    {
      icon: Home,
      label: 'Home',
      onClick: () => setView('home'),
      isActive: currentView === 'home',
    },
    {
      icon: Library,
      label: 'Library',
      onClick: () => openLibraryTab('library'),
      isActive: currentView === 'library' && libraryTab === 'library',
    },
    {
      icon: Heart,
      label: 'Favorites',
      onClick: () => openLibraryTab('favorites'),
      isActive: currentView === 'library' && libraryTab === 'favorites',
      badge: favoriteTrackCount > 0 ? favoriteTrackCount : undefined,
    },
  ];

  const sections: SidebarSectionData[] = [
    {
      title: 'Space',
      items: [
        {
          icon: Disc,
          label: 'Albums',
          onClick: () => openLibraryTab('library'),
          isActive: currentView === 'library' && libraryTab === 'library',
        },
        {
          icon: ListMusic,
          label: 'Playlists',
          onClick: () => openLibraryTab('playlist'),
          isActive: currentView === 'library' && libraryTab === 'playlist',
        },
      ],
    },
    {
      title: 'Config',
      items: [
        {
          icon: SlidersHorizontal,
          label: 'EQ',
          onClick: () => setView('equalizer'),
          isActive: currentView === 'equalizer',
        },
        {
          icon: Activity,
          label: 'Visualizer',
          onClick: () => setView('visualizer'),
          isActive: currentView === 'visualizer',
        },
        {
          icon: Settings,
          label: 'Preferences',
          onClick: () => setView('preferences'),
          isActive: currentView === 'preferences',
        },
      ],
    },
  ];

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ background: 'var(--sidebar-bg)' }}
      className={`h-full flex flex-col z-40 transition-[width,background-color] duration-300 ease-out shrink-0 border-r
        ${isExpanded ? 'w-[236px]' : 'w-[78px]'}
        ${isDarkMode ? 'border-[var(--sidebar-border)] shadow-[var(--sidebar-shadow)]' : 'border-[var(--sidebar-border)] shadow-[var(--sidebar-shadow)]'}
      `}
    >
      {/* 1. LOGO Y PIN */}
      <div className="h-16 flex items-center px-3 shrink-0 overflow-hidden">
        <div className="flex items-center justify-between min-w-[208px] w-full">
          <div className="flex items-center gap-3">
            <div
              className={`w-7 h-7 rounded-lg shrink-0 transition-all duration-500 shadow-lg
              ${
                isDarkMode
                  ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] shadow-[0_10px_24px_rgba(0,194,168,0.22)]'
                  : 'bg-gradient-to-br from-blue-500 to-cyan-400 shadow-blue-500/40'
              }`}
            />
            <h1
              className={`text-lg font-black tracking-tighter transition-all duration-500 text-[var(--text-main)]
              ${isExpanded ? 'opacity-100' : 'opacity-0'}`}
            >
              MUSIE
            </h1>
          </div>
          <button
            onClick={() => setIsPinned(!isPinned)}
            aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
            className={`transition-all duration-300 hover:scale-110
            ${isPinned ? 'text-[var(--accent-primary)] rotate-45' : 'text-[var(--text-muted)]'}
            ${isExpanded ? 'opacity-100' : 'opacity-100'}`}
          >
            <Pin size={14} fill={isPinned ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* 2. NAVEGACIÓN PRINCIPAL */}
      <nav className="flex-1 flex flex-col min-h-0 overflow-hidden pt-2 px-3">
        <ul className="space-y-1 shrink-0">
          {mainItems.map((item) => {
            return (
              <li
                key={item.label}
                onClick={item.onClick}
                title={!isExpanded ? item.label : undefined}
                className={`group/nav flex items-center h-11 rounded-xl cursor-pointer transition-all duration-300 overflow-hidden border
                  ${
                    item.isActive
                      ? isDarkMode
                        ? 'bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)] text-[var(--tab-active-text)] border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)]'
                        : 'bg-[color-mix(in_srgb,var(--accent-primary)_9%,transparent)] text-[var(--tab-active-text)] border border-[color-mix(in_srgb,var(--accent-primary)_16%,transparent)]'
                      : isDarkMode
                        ? 'text-[var(--text-muted)] border-transparent hover:bg-white/5 hover:text-[var(--text-main)]'
                        : 'text-[var(--text-muted)] border-transparent hover:bg-black/5 hover:text-[var(--text-main)]'
                  }`}
              >
                <div className="flex items-center justify-between gap-3 px-3.5 min-w-[200px]">
                  <div className="flex items-center gap-4 min-w-0">
                    <item.icon
                      size={22}
                      className={`shrink-0 transition-colors ${item.isActive ? 'text-[var(--accent-primary)]' : 'group-hover/nav:text-[var(--accent-secondary)]'}`}
                    />
                    <span
                      className={`font-black text-base tracking-tight whitespace-nowrap transition-all duration-700
                      ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
                    >
                      {item.label}
                    </span>
                  </div>

                  {item.badge && isExpanded && (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--accent-primary)] px-1.5 py-0.5 text-[10px] font-black text-[var(--bg-main)] shadow-md">
                      {item.badge}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="my-4 h-px bg-[var(--glass-border)]" />

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar overflow-x-hidden space-y-4 pb-3">
          {sections.map((section) => (
            <SidebarSectionView
              key={section.title}
              title={section.title}
              items={section.items}
              isExpanded={isExpanded}
              isDarkMode={isDarkMode}
            />
          ))}
        </div>
      </nav>

      {/* 3. TEMA Y USUARIO */}
      <SidebarFooter
        isExpanded={isExpanded}
        isDarkMode={isDarkMode}
        themeLabel={themeLabel}
        cycleThemeMode={cycleThemeMode}
      />
    </aside>
  );
};
