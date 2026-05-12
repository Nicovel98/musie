import { useState, useRef } from 'react';
import {
  Home,
  Library,
  Disc,
  ListMusic,
  Heart,
  Mic2,
  SlidersHorizontal,
  Activity,
  Settings,
  User,
  Pin,
  Moon,
  Sun,
} from 'lucide-react';

interface SidebarProps {
  currentView: 'home' | 'library';
  setView: (view: 'home' | 'library') => void;
}

export const Sidebar = ({ currentView, setView }: SidebarProps) => {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsHovered(false), 700);
  };

  const isExpanded = isPinned || isHovered;

  const libraryItems = [
    { icon: Disc, label: 'Albums' },
    { icon: ListMusic, label: 'Playlists' },
    { icon: Heart, label: 'Favorites' },
    { icon: Mic2, label: 'Lyrics' },
  ];

  const settingItems = [
    { icon: SlidersHorizontal, label: 'Equalizer' },
    { icon: Activity, label: 'Visualizer' },
    { icon: Settings, label: 'Preferences' },
  ];

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`h-screen flex flex-col bg-black border-r border-white/5 z-40 transition-[width] duration-700 ease-in-out shadow-2xl shrink-0
        ${isExpanded ? 'w-56' : 'w-20'}
      `}
    >
      {/* 1. CABECERA: LOGO + PIN */}
      <div className="h-24 flex items-center px-[26px] shrink-0 overflow-hidden">
        <div className="flex items-center justify-between min-w-[172px]">
          <div className="flex items-center gap-4">
            <div className="w-7 h-7 bg-blue-600 rounded-lg shrink-0 shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
            <h1
              className={`text-xl font-black tracking-tighter bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent transition-opacity duration-500 whitespace-nowrap
              ${isExpanded ? 'opacity-100' : 'opacity-0'}
            `}
            >
              MUSIE
            </h1>
          </div>
          <button
            onClick={() => setIsPinned(!isPinned)}
            className={`transition-all duration-500 hover:text-white shrink-0
              ${isPinned ? 'text-blue-500 rotate-45' : 'text-gray-600'}
              ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}
          >
            <Pin size={16} fill={isPinned ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* 2. NAVEGACIÓN PRINCIPAL */}
      <nav className="flex-1 space-y-8 overflow-y-auto no-scrollbar overflow-x-hidden pt-4">
        <section className="px-4">
          <ul className="space-y-2">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'library', label: 'Library', icon: Library },
            ].map((item) => (
              <li
                key={item.id}
                onClick={() => setView(item.id as 'home' | 'library')}
                className={`group/nav flex items-center h-12 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${
                  currentView === item.id
                    ? 'bg-blue-600/20 text-white border border-white/10'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4 px-3.5 min-w-[200px]">
                  <item.icon
                    size={24}
                    className={`shrink-0 transition-colors duration-300 ${
                      currentView === item.id ? 'text-blue-500' : 'group-hover/nav:text-blue-400'
                    }`}
                  />
                  <span
                    className={`font-black text-lg tracking-tight whitespace-nowrap transition-all duration-500
                    ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}
                  `}
                  >
                    {item.label}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* SECCIONES SECUNDARIAS */}
        {[
          { title: 'Your Space', items: libraryItems },
          { title: 'Adjustments', items: settingItems },
        ].map((section) => (
          <section key={section.title} className="px-4 space-y-4">
            <p
              className={`px-3.5 text-[9px] uppercase tracking-[0.3em] font-black text-gray-600 transition-opacity duration-500 whitespace-nowrap
              ${isExpanded ? 'opacity-100' : 'opacity-0'}
            `}
            >
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center h-10 rounded-xl cursor-pointer group/item transition-colors overflow-hidden"
                >
                  <div className="flex items-center gap-4 px-3.5 min-w-[200px]">
                    <item.icon
                      size={20}
                      className="shrink-0 group-hover/item:text-blue-400 transition-colors text-gray-500"
                    />
                    <span
                      className={`text-[14px] font-bold whitespace-nowrap transition-all duration-500 text-gray-500 group-hover/item:text-white
                      ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}
                    `}
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

      {/* 3. BOTÓN MODO OSCURO */}
      <div className="px-4 mb-2">
        <div
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex items-center h-12 rounded-2xl cursor-pointer hover:bg-white/5 transition-all overflow-hidden"
        >
          <div className="flex items-center gap-4 px-3.5 min-w-[200px]">
            {isDarkMode ? (
              <Moon size={22} className="text-blue-400 shrink-0" />
            ) : (
              <Sun size={22} className="text-yellow-500 shrink-0" />
            )}
            <span
              className={`text-[14px] font-bold whitespace-nowrap transition-all duration-700 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
            >
              {isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. PERFIL DE USUARIO (SIN CORTES) */}
      <div className="p-4 border-t border-white/5 shrink-0">
        <div className="flex items-center h-14 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-700 overflow-hidden cursor-pointer">
          {/* El px-[11px] asegura que el avatar de 40px esté perfectamente centrado en los 80px del colapso */}
          <div className="flex items-center gap-4 px-[11px] min-w-[200px]">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shrink-0 shadow-lg border border-white/10">
              <User size={20} className="text-white" />
            </div>
            <div
              className={`flex flex-col transition-all duration-700 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
            >
              <p className="text-sm font-black text-white whitespace-nowrap">Usuario</p>
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-tighter whitespace-nowrap">
                Pro Plan
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
