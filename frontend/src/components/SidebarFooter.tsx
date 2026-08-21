import { User, Moon, Sun } from 'lucide-react';

interface SidebarFooterProps {
  isExpanded: boolean;
  isDarkMode: boolean;
  themeLabel: string;
  cycleThemeMode: () => void;
}

export const SidebarFooter = ({
  isExpanded,
  isDarkMode,
  themeLabel,
  cycleThemeMode,
}: SidebarFooterProps) => {
  return (
    <div className="shrink-0 pt-2 pb-2 border-t transition-colors border-[var(--glass-border)]">
      <div className="px-3 mb-1">
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

      <div className="px-3 pt-2">
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
  );
};
