import type { LucideIcon } from 'lucide-react';

export type View = 'home' | 'library' | 'lyrics' | 'equalizer' | 'visualizer' | 'preferences';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  category?: 'main' | 'library' | 'settings';
}
