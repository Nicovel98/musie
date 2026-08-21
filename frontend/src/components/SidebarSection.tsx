import type { LucideIcon } from 'lucide-react';

interface SidebarSectionItem {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface SidebarSectionProps {
  title: string;
  items: SidebarSectionItem[];
  isExpanded: boolean;
  isDarkMode: boolean;
}

export const SidebarSection = ({ title, items, isExpanded, isDarkMode }: SidebarSectionProps) => {
  return (
    <section className="space-y-2">
      <p
        className={`px-3.5 text-[8px] uppercase tracking-[0.3em] font-black transition-opacity duration-500
        ${isDarkMode ? 'text-[color-mix(in_srgb,var(--text-muted)_72%,transparent)]' : 'text-[color-mix(in_srgb,var(--text-muted)_80%,transparent)]'}
        ${isExpanded ? 'opacity-100' : 'opacity-0'}`}
      >
        {title}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => (
          <li
            key={item.label}
            onClick={item.onClick}
            title={!isExpanded ? item.label : undefined}
            className={`flex items-center h-9 rounded-lg cursor-pointer group/item transition-all overflow-hidden border
            ${
              item.isActive
                ? isDarkMode
                  ? 'text-[var(--tab-active-text)] bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] border-[color-mix(in_srgb,var(--accent-primary)_18%,transparent)]'
                  : 'text-[var(--tab-active-text)] bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)] border-[color-mix(in_srgb,var(--accent-primary)_14%,transparent)]'
                : isDarkMode
                  ? 'text-[var(--text-muted)] border-transparent hover:bg-white/5 hover:text-[var(--text-main)]'
                  : 'text-[var(--text-muted)] border-transparent hover:bg-black/5 hover:text-[var(--text-main)]'
            }`}
          >
            <div className="flex items-center gap-4 px-3.5 min-w-[200px]">
              <item.icon
                size={18}
                className={`shrink-0 transition-colors ${
                  item.isActive
                    ? 'text-[var(--accent-primary)]'
                    : 'group-hover/item:text-[var(--accent-secondary)]'
                }`}
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
  );
};
