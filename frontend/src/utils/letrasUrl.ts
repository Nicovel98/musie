const normalizeArtistSlug = (artist: string) =>
  artist
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const resolveArtistAndTitle = (artist: string, title: string) => {
  const match = title.match(/^\s*(.+?)\s+[-–—]\s+(.+?)\s*$/);
  if (!match) return { artist, title: title.trim() };

  return {
    artist: match[1].trim(),
    title: match[2].trim(),
  };
};

export const buildLetrasSearchUrl = (artist: string, title: string): string => {
  const resolved = resolveArtistAndTitle(artist, title);
  const artistSlug = normalizeArtistSlug(resolved.artist);
  const titleQuery = encodeURIComponent(resolved.title);

  if (!artistSlug || !titleQuery) {
    return `https://www.letras.com/search/?q=${encodeURIComponent(`${resolved.artist} ${resolved.title}`.trim())}`;
  }

  return `https://www.letras.com/${artistSlug}/?q=${titleQuery}`;
};

export const buildYouTubeSearchUrl = (artist: string, title: string): string => {
  const resolved = resolveArtistAndTitle(artist, title);
  const query = encodeURIComponent(`${resolved.title} ${resolved.artist}`.trim());
  return `https://www.youtube.com/results?search_query=${query}`;
};
