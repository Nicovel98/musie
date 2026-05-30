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
  User,
  Pin,
  Moon,
  Sun,
  type LucideIcon,
} from 'lucide-react';

type View = 'home' | 'library' | 'settings';
type ThemeMode = 'dark' | 'light';

interface NavItem {
  icon: LucideIcon;
  label: string;
}

interface SidebarSection {
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

  const sections: SidebarSection[] = [
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
          <section key={section.title} className="space-y-2">
            <p
              className={`px-3.5 text-[8px] uppercase tracking-[0.3em] font-black transition-opacity duration-500
              ${isDarkMode ? 'text-[color-mix(in_srgb,var(--text-muted)_72%,transparent)]' : 'text-[color-mix(in_srgb,var(--text-muted)_80%,transparent)]'}
              ${isExpanded ? 'opacity-100' : 'opacity-0'}`}
            >
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li
                  key={item.label}
                  className={`flex items-center h-9 rounded-lg cursor-pointer group/item transition-all overflow-hidden
                  ${isDarkMode ? 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:bg-black/5 hover:text-[var(--text-main)]'}`}
                >
                  <div className="flex items-center gap-4 px-3.5 min-w-[200px]">
                    <item.icon
                      size={18}
                      className="shrink-0 group-hover/item:text-[var(--accent-secondary)] transition-colors"
                    />
                    <span
                      className={`text-[13px] font-bold whitespace-nowrap transition-all duration-700
                      ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
                    >
                      {item.label}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>

      {/* 3. TEMA Y USUARIO */}
      <div className="shrink-0 pt-2 border-t transition-colors border-[var(--glass-border)]">
        <div className="px-4 mb-1">
          <button
            onClick={cycleThemeMode}
            className={`flex items-center w-full h-10 rounded-xl transition-all overflow-hidden group/theme
            ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
          >
            <div className="flex items-center gap-4 px-3.5 min-w-[200px]">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors
                ${isDarkMode ? 'bg-white/5' : 'bg-black/5'}`}
              >
                {isDarkMode ? (
                  <Moon size={16} className="text-[var(--accent-secondary)]" />
                ) : (
                  <Sun size={16} className="text-[var(--accent-primary)]" />
                )}
              </div>
              <span
                className={`text-[13px] font-bold transition-all duration-700
                ${isDarkMode ? 'text-[var(--text-muted)] group-hover/theme:text-[var(--text-main)]' : 'text-[var(--text-muted)] group-hover/theme:text-[var(--text-main)]'}
                ${isExpanded ? 'opacity-100' : 'opacity-0'}`}
              >
                {themeLabel}
              </span>
            </div>
          </button>
        </div>

        <div className="p-3">
          <div
            className={`flex items-center h-12 rounded-xl transition-all duration-700 overflow-hidden cursor-pointer border
            ${isDarkMode ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-black/5 border-black/5 hover:bg-black/10'}`}
          >
            <div className="flex items-center gap-4 px-[11px] min-w-[200px]">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                <User size={16} className="text-white" />
              </div>
              <div
                className={`flex flex-col transition-all duration-700 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
              >
                <p className="text-xs font-black text-[var(--text-main)]">Usuario</p>
                <p className="text-[8px] text-blue-400 font-black uppercase tracking-tighter">
                  Pro Plan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
