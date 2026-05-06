import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import type { Track } from '../types/player'
import type { LibraryViewMode } from '../components/layout/layoutTypes'
import {
  clearLocalTracks,
  getAllLocalTracks,
  saveLocalTracks,
  type StoredTrack,
} from '../services/storage/libraryDb'

const FAVORITES_STORAGE_KEY = 'musie.favorites.v1'

/**
 * Consolidated library hook combining library state management and persistence.
 * Manages tracks, search, filtering, favorites, and automatic persistence to IndexedDB.
 */
export interface UseLibraryReturn {
  // State
  tracks: Track[]
  filteredTracks: Track[]
  searchQuery: string
  artistFilter: string
  libraryViewMode: LibraryViewMode
  favoriteTrackIds: Set<string>
  artistOptions: string[]

  // State setters
  setTracks: Dispatch<SetStateAction<Track[]>>
  setSearchQuery: (query: string) => void
  setArtistFilter: (artist: string) => void
  setLibraryViewMode: (mode: LibraryViewMode) => void
  toggleTrackFavorite: (trackId: string) => void
  selectTrackById: (trackId: string) => number | null
  importTracks: (newTracks: Track[]) => void
  clearLibrary: () => void

  // Persistence methods
  restoreLocalTracks: () => Promise<StoredTrack[]>
  persistLocalTracks: (tracks: StoredTrack[]) => Promise<void>
  clearPersistedLocalTracks: () => Promise<void>
  restoreFavorites: () => Set<string>
  persistFavorites: (favorites: Set<string>) => void
}

/**
 * Props for useLibrary hook
 */
export interface UseLibraryProps {
  initialTracks?: Track[]
  initialSearchQuery?: string
  initialArtistFilter?: string
  initialLibraryViewMode?: LibraryViewMode
  initialFavoriteTrackIds?: Set<string>
}

/**
 * Hook that manages music library state and persistence.
 * Handles track management, search, filtering, favorites, and IndexedDB persistence.
 *
 * @param initialTracks - Initial tracks array (default: [])
 * @param initialSearchQuery - Initial search query (default: '')
 * @param initialArtistFilter - Initial artist filter (default: 'all')
 * @param initialLibraryViewMode - Initial view mode (default: 'all')
 * @param initialFavoriteTrackIds - Initial favorites set (default: new Set())
 * @returns Library state and control methods
 */
export function useLibrary({
  initialTracks = [],
  initialSearchQuery = '',
  initialArtistFilter = 'all',
  initialLibraryViewMode = 'all',
  initialFavoriteTrackIds = new Set<string>(),
}: UseLibraryProps): UseLibraryReturn {
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

  // Auto-persist favorites on changes
  const persistFavoritesCallback = useCallback((favorites: Set<string>) => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favorites)))
    } catch (error) {
      console.error('Failed to persist favorites:', error)
    }
  }, [])

  // Track favorite changes
  useEffect(() => {
    persistFavoritesCallback(favoriteTrackIds)
  }, [favoriteTrackIds, persistFavoritesCallback])

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

  // Persistence: restore favorites from localStorage
  function restoreFavorites(): Set<string> {
    if (typeof window === 'undefined') return new Set<string>()

    try {
      const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (!stored) return new Set<string>()

      const parsed = JSON.parse(stored) as unknown
      if (!Array.isArray(parsed)) return new Set<string>()

      const favoriteIds = parsed.filter(
        (entry): entry is string => typeof entry === 'string' && entry.length > 0,
      )

      return new Set(favoriteIds)
    } catch {
      return new Set<string>()
    }
  }

  // Persistence: restore local tracks from IndexedDB
  async function restoreLocalTracks(): Promise<StoredTrack[]> {
    try {
      const records = await getAllLocalTracks()
      return records
    } catch (error) {
      console.error('Failed to restore local tracks:', error)
      return []
    }
  }

  // Persistence: save local tracks to IndexedDB
  async function persistLocalTracks(tracksToSave: StoredTrack[]): Promise<void> {
    try {
      await saveLocalTracks(tracksToSave)
    } catch (error) {
      console.error('Failed to persist local tracks:', error)
    }
  }

  // Persistence: clear all local tracks from IndexedDB
  async function clearPersistedLocalTracks(): Promise<void> {
    try {
      await clearLocalTracks()
    } catch (error) {
      console.error('Failed to clear local tracks:', error)
    }
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
    restoreLocalTracks,
    persistLocalTracks,
    clearPersistedLocalTracks,
    restoreFavorites,
    persistFavorites: persistFavoritesCallback,
  }
}
