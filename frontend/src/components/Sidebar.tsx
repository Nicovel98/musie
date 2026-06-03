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
import { SidebarSection as SidebarSectionView } from './SidebarSection';
import { SidebarFooter } from './SidebarFooter';

type View = 'home' | 'library' | 'settings';
type ThemeMode = 'dark' | 'light';

interface NavItem {
  icon: LucideIcon;
  label: string;
}

interface SidebarSectionData {
  title: string;
  items: NavItem[];
}

export const Sidebar = ({
  currentView,
  setView,
  themeMode,
  cycleThemeMode,
}: {
  currentView: View;
  setView: (v: View) => void;
  themeMode: ThemeMode;
  cycleThemeMode: () => void;
}) => {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsHovered(false), 700);
  };

  const isExpanded = isPinned || isHovered;
  const isDarkMode = themeMode === 'dark';
  const themeLabel = isDarkMode ? 'Dark' : 'Light';

  const sections: SidebarSectionData[] = [
    {
      title: 'Space',
      items: [
        { icon: Disc, label: 'Albums' },
        { icon: ListMusic, label: 'Playlists' },
        { icon: Heart, label: 'Favorites' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { icon: SlidersHorizontal, label: 'Equalizer' },
        { icon: Activity, label: 'Visualizer' },
        { icon: Settings, label: 'Preferences' },
      ],
    },
  ];

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ background: 'var(--sidebar-bg)' }}
      className={`h-full flex flex-col z-40 transition-[width,background-color] duration-700 ease-in-out shrink-0 border-r
        ${isExpanded ? 'w-56' : 'w-20'}
        ${isDarkMode ? 'border-[var(--sidebar-border)] shadow-[var(--sidebar-shadow)]' : 'border-[var(--sidebar-border)] shadow-[var(--sidebar-shadow)]'}
      `}
    >
      {/* 1. LOGO Y PIN */}
      <div className="h-20 flex items-center px-[26px] shrink-0 overflow-hidden">
        <div className="flex items-center justify-between min-w-[172px] w-full">
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
            className={`transition-all duration-500 hover:scale-110
            ${isPinned ? 'text-[var(--accent-primary)] rotate-45' : 'text-[var(--text-muted)]'}
            ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <Pin size={14} fill={isPinned ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* 2. NAVEGACIÓN PRINCIPAL */}
      <nav className="flex-1 space-y-5 overflow-y-auto no-scrollbar overflow-x-hidden pt-2 px-4">
        <ul className="space-y-1">
          {(['home', 'library', 'settings'] as View[]).map((id) => {
            const Icon = id === 'home' ? Home : id === 'library' ? Library : Settings;
            const isActive = currentView === id;
            return (
              <li
                key={id}
                onClick={() => setView(id)}
                className={`group/nav flex items-center h-11 rounded-xl cursor-pointer transition-all duration-300 overflow-hidden
                  ${
                    isActive
                      ? isDarkMode
                        ? 'bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)] text-[var(--tab-active-text)] border border-[color-mix(in_srgb,var(--accent-primary)_20%,transparent)]'
                        : 'bg-[color-mix(in_srgb,var(--accent-primary)_9%,transparent)] text-[var(--tab-active-text)] border border-[color-mix(in_srgb,var(--accent-primary)_16%,transparent)]'
                      : isDarkMode
                        ? 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-main)]'
                        : 'text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text-main)]'
                  }`}
              >
                <div className="flex items-center gap-4 px-3.5 min-w-[200px]">
                  <Icon
                    size={22}
                    className={`shrink-0 transition-colors ${isActive ? 'text-[var(--accent-primary)]' : 'group-hover/nav:text-[var(--accent-secondary)]'}`}
                  />
                  <span
                    className={`font-black text-base tracking-tight whitespace-nowrap transition-all duration-700
                    ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
                  >
                    {id === 'home' ? 'Home' : id === 'library' ? 'Library' : 'Settings'}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        {/* SECCIONES DINÁMICAS */}
        {sections.map((section) => (
          <SidebarSectionView
            key={section.title}
            title={section.title}
            items={section.items}
            isExpanded={isExpanded}
            isDarkMode={isDarkMode}
          />
        ))}
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
