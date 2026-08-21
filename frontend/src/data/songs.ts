import type { Track } from '../types/track';
import heroThumbnail from '../assets/hero.png';

export const MOCK_SONGS: Track[] = [
  {
    id: '1',
    title: 'Focus Flow',
    artist: 'Lo-Fi Girl',
    coverUrl: heroThumbnail,
    audioUrl: 'https://soundhelix.com',
  },
  {
    id: '2',
    title: 'Midnight City',
    artist: 'Musie Digital',
    coverUrl: heroThumbnail,
    audioUrl: 'https://soundhelix.com',
  },
  {
    id: '3',
    title: 'Urban Echo',
    artist: 'Night Drive',
    coverUrl: heroThumbnail,
    audioUrl: 'https://soundhelix.com',
  },
];
