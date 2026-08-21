export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumArtist?: string;
  genre?: string;
  year?: number;
  coverUrl: string;
  audioUrl: string; // Se usará para música de internet
  fileData?: File | Blob; // Se usará para música local (IndexedDB)
  durationSeconds?: number;
  addedAt?: number;
  lastPlayedAt?: number;
  playCount?: number;
  source?: 'local' | 'remote' | 'external';
}
