export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string; // Se usará para música de internet
  fileData?: File | Blob; // Se usará para música local (IndexedDB)
}
