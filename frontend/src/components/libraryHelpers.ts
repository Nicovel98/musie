import type { Track } from '../types/track';

export const filterLibraryTracksByMode = (
  tracks: readonly Track[],
  favoriteTrackIds: string[],
  showFavoritesOnly: boolean,
  activeTab: 'library' | 'favorites' | 'playlist'
) => {
  if (activeTab === 'favorites' || showFavoritesOnly) {
    return tracks.filter((track) => favoriteTrackIds.includes(track.id));
  }

  return tracks;
};

export const sortLibraryTracks = <T extends Track>(
  tracks: readonly T[],
  sortMode: 'recent' | 'title' | 'artist',
  favoriteTrackIds: string[],
  activeTab: 'library' | 'favorites' | 'playlist'
) => {
  const sortedTracks = [...tracks];

  if (sortMode === 'title') {
    return sortedTracks.sort((left, right) => left.title.localeCompare(right.title));
  }

  if (sortMode === 'artist') {
    return sortedTracks.sort((left, right) => left.artist.localeCompare(right.artist));
  }

  if (sortMode === 'recent') {
    if (activeTab === 'favorites') {
      const favoriteIndexMap = new Map(
        favoriteTrackIds.map((favoriteTrackId, index) => [favoriteTrackId, index])
      );

      return sortedTracks.sort((left, right) => {
        const leftIndex = favoriteIndexMap.get(left.id) ?? -1;
        const rightIndex = favoriteIndexMap.get(right.id) ?? -1;

        if (leftIndex === rightIndex) return 0;
        if (leftIndex === -1) return 1;
        if (rightIndex === -1) return -1;
        return rightIndex - leftIndex;
      });
    }

    return sortedTracks.sort((left, right) => {
      const leftAddedAt = left.addedAt ?? 0;
      const rightAddedAt = right.addedAt ?? 0;

      if (leftAddedAt !== rightAddedAt) return rightAddedAt - leftAddedAt;

      const leftIndex = tracks.findIndex((track) => track.id === left.id);
      const rightIndex = tracks.findIndex((track) => track.id === right.id);
      return rightIndex - leftIndex;
    });
  }

  return sortedTracks;
};
