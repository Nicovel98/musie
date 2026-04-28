import { useCallback, useDeferredValue, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import type { Track } from '../types/player'
import type { LibraryViewMode } from '../components/layout/layoutTypes'

export interface UseLibraryStateReturn {
  tracks: Track[]
  filteredTracks: Track[]
  searchQuery: string
  artistFilter: string
  libraryViewMode: LibraryViewMode
  favoriteTrackIds: Set<string>
  artistOptions: string[]
  setTracks: Dispatch<SetStateAction<Track[]>>
  setSearchQuery: (query: string) => void
  setArtistFilter: (artist: string) => void
  setLibraryViewMode: (mode: LibraryViewMode) => void
  toggleTrackFavorite: (trackId: string) => void
  selectTrackById: (trackId: string) => number | null
  importTracks: (newTracks: Track[]) => void
  clearLibrary: () => void
}

export interface UseLibraryStateProps {
  initialTracks?: Track[]
  initialSearchQuery?: string
  initialArtistFilter?: string
  initialLibraryViewMode?: LibraryViewMode
  initialFavoriteTrackIds?: Set<string>
}

export function useLibraryState({
  initialTracks = [],
  initialSearchQuery = '',
  initialArtistFilter = 'all',
  initialLibraryViewMode = 'all',
  initialFavoriteTrackIds = new Set<string>(),
}: UseLibraryStateProps): UseLibraryStateReturn {
  const [tracks, setTracks] = useState<Track[]>(initialTracks)
  const [searchQuery, setSearchQueryState] = useState(initialSearchQuery)
  const [artistFilter, setArtistFilter] = useState(initialArtistFilter)
  const [libraryViewMode, setLibraryViewMode] = useState<LibraryViewMode>(initialLibraryViewMode)
  const [favoriteTrackIds, setFavoriteTrackIds] = useState<Set<string>>(initialFavoriteTrackIds)

  const deferredSearchQuery = useDeferredValue(searchQuery)

  // Memoized artist options
  const artistOptions = useMemo(() => {
    return Array.from(new Set(tracks.map((track) => track.artist))).sort(
      (a, b) => a.localeCompare(b),
    )
  }, [tracks])

  // Memoized filtered tracks
  const filteredTracks = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase()

    return tracks.filter((track) => {
      const favoriteMatches =
        libraryViewMode === 'all' || favoriteTrackIds.has(track.id)

      if (!favoriteMatches) return false

      const artistMatches =
        artistFilter === 'all' ||
        track.artist.toLowerCase() === artistFilter.toLowerCase()

      if (!artistMatches) return false
      if (!query) return true

      const titleMatches = track.title.toLowerCase().includes(query)
      const artistTextMatches = track.artist.toLowerCase().includes(query)
      return titleMatches || artistTextMatches
    })
  }, [tracks, deferredSearchQuery, artistFilter, libraryViewMode, favoriteTrackIds])

  function setSearchQuery(query: string) {
    setSearchQueryState(query)
  }

  function toggleTrackFavorite(trackId: string) {
    setFavoriteTrackIds((prev) => {
      const next = new Set(prev)

      if (next.has(trackId)) {
        next.delete(trackId)
      } else {
        next.add(trackId)
      }

      return next
    })
  }

  const selectTrackById = useCallback(
    (trackId: string): number | null => {
      const trackIndex = tracks.findIndex((track) => track.id === trackId)
      return trackIndex === -1 ? null : trackIndex
    },
    [tracks],
  )

  function importTracks(newTracks: Track[]) {
    setTracks((prev) => [...prev, ...newTracks])
  }

  function clearLibrary() {
    setTracks([])
    setFavoriteTrackIds(new Set())
    setSearchQuery('')
    setArtistFilter('all')
    setLibraryViewMode('all')
  }

  return {
    tracks,
    filteredTracks,
    searchQuery,
    artistFilter,
    libraryViewMode,
    favoriteTrackIds,
    artistOptions,
    setTracks,
    setSearchQuery,
    setArtistFilter,
    setLibraryViewMode,
    toggleTrackFavorite,
    selectTrackById,
    importTracks,
    clearLibrary,
  }
}
