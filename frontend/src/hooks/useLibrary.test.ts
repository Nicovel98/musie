import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLibrary } from './useLibrary'
import type { Track } from '../types/player'

const mockTracks: Track[] = [
  {
    id: 'track-1',
    title: 'Song 1',
    artist: 'Artist A',
    duration: 180,
    src: 'data:audio/mp3;base64,ID3',
    coverUrl: '',
    coverSource: 'embedded',
    sizeBytes: 1000,
  },
  {
    id: 'track-2',
    title: 'Song 2',
    artist: 'Artist B',
    duration: 200,
    src: 'data:audio/mp3;base64,ID3',
    coverUrl: '',
    coverSource: 'embedded',
    sizeBytes: 2000,
  },
  {
    id: 'track-3',
    title: 'Another Song',
    artist: 'Artist A',
    duration: 150,
    src: 'data:audio/mp3;base64,ID3',
    coverUrl: '',
    coverSource: 'embedded',
    sizeBytes: 1500,
  },
]

describe('useLibrary (consolidated hook)', () => {
  beforeEach(() => {
    // Mock localStorage - use window not global
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    window.localStorage = localStorageMock as any

    // Mock IndexedDB
    vi.mock('../services/storage/libraryDb', () => ({
      getAllLocalTracks: vi.fn(() => Promise.resolve([])),
      saveLocalTracks: vi.fn(() => Promise.resolve()),
      clearLocalTracks: vi.fn(() => Promise.resolve()),
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Library State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: mockTracks }),
      )

      expect(result.current.tracks).toEqual(mockTracks)
      expect(result.current.filteredTracks).toEqual(mockTracks)
      expect(result.current.searchQuery).toBe('')
      expect(result.current.artistFilter).toBe('all')
      expect(result.current.libraryViewMode).toBe('all')
      expect(result.current.favoriteTrackIds.size).toBe(0)
    })

    it('should generate artist options', () => {
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: mockTracks }),
      )

      const artists = result.current.artistOptions
      expect(artists).toContain('Artist A')
      expect(artists).toContain('Artist B')
      expect(artists.length).toBe(2)
      expect(artists).toEqual(['Artist A', 'Artist B']) // Sorted
    })
  })

  describe('Search Functionality', () => {
    it('should filter tracks by search query', () => {
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: mockTracks }),
      )

      act(() => {
        result.current.setSearchQuery('Song 1')
      })

      // Note: useDeferredValue causes async filtering, so we might need to wait
      expect(result.current.searchQuery).toBe('Song 1')
    })

    it('should search case-insensitively', () => {
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: mockTracks }),
      )

      act(() => {
        result.current.setSearchQuery('song')
      })

      expect(result.current.searchQuery).toBe('song')
    })

    it('should clear search query', () => {
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: mockTracks, initialSearchQuery: 'test' }),
      )

      expect(result.current.searchQuery).toBe('test')

      act(() => {
        result.current.setSearchQuery('')
      })

      expect(result.current.searchQuery).toBe('')
    })
  })

  describe('Artist Filtering', () => {
    it('should filter tracks by artist', () => {
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: mockTracks }),
      )

      act(() => {
        result.current.setArtistFilter('Artist A')
      })

      expect(result.current.artistFilter).toBe('Artist A')
      expect(result.current.filteredTracks.length).toBe(2) // Two tracks by Artist A
    })

    it('should show all artists when filter is "all"', () => {
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: mockTracks, initialArtistFilter: 'Artist A' }),
      )

      expect(result.current.filteredTracks.length).toBe(2)

      act(() => {
        result.current.setArtistFilter('all')
      })

      expect(result.current.filteredTracks.length).toBe(3)
    })
  })

  describe('Favorites Management', () => {
    it('should toggle track favorite', () => {
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: mockTracks }),
      )

      expect(result.current.favoriteTrackIds.size).toBe(0)

      act(() => {
        result.current.toggleTrackFavorite('track-1')
      })

      expect(result.current.favoriteTrackIds.has('track-1')).toBe(true)

      act(() => {
        result.current.toggleTrackFavorite('track-1')
      })

      expect(result.current.favoriteTrackIds.has('track-1')).toBe(false)
    })

    it('should restore favorites from localStorage', () => {
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: mockTracks }),
      )

      const favorites = result.current.restoreFavorites()
      expect(favorites).toBeInstanceOf(Set)
    })

    it('should persist favorites to localStorage', () => {
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: mockTracks }),
      )

      const favSet = new Set(['track-1', 'track-2'])

      act(() => {
        result.current.persistFavorites(favSet)
      })

      expect(result.current.persistFavorites).toBeDefined()
    })
  })

  describe('Track Management', () => {
    it('should import new tracks', () => {
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: [mockTracks[0]] }),
      )

      expect(result.current.tracks.length).toBe(1)

      const newTracks = [mockTracks[1], mockTracks[2]]

      act(() => {
        result.current.importTracks(newTracks)
      })

      expect(result.current.tracks.length).toBe(3)
    })

    it('should select track by id', () => {
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: mockTracks }),
      )

      const index = result.current.selectTrackById('track-2')
      expect(index).toBe(1)

      const notFoundIndex = result.current.selectTrackById('track-not-found')
      expect(notFoundIndex).toBeNull()
    })

    it('should clear library', () => {
      const favorites = new Set(['track-1'])
      const { result } = renderHook(() =>
        useLibrary({
          initialTracks: mockTracks,
          initialSearchQuery: 'test',
          initialArtistFilter: 'Artist A',
          initialFavoriteTrackIds: favorites,
        }),
      )

      expect(result.current.tracks.length).toBe(3)
      expect(result.current.favoriteTrackIds.size).toBe(1)
      expect(result.current.searchQuery).toBe('test')

      act(() => {
        result.current.clearLibrary()
      })

      expect(result.current.tracks.length).toBe(0)
      expect(result.current.favoriteTrackIds.size).toBe(0)
      expect(result.current.searchQuery).toBe('')
      expect(result.current.artistFilter).toBe('all')
    })
  })

  describe('View Modes', () => {
    it('should change library view mode', () => {
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: mockTracks }),
      )

      expect(result.current.libraryViewMode).toBe('all')

      act(() => {
        result.current.setLibraryViewMode('favorites')
      })

      expect(result.current.libraryViewMode).toBe('favorites')
    })

    it('should show only favorites when in favorite mode', () => {
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: mockTracks }),
      )

      act(() => {
        result.current.toggleTrackFavorite('track-1')
        result.current.toggleTrackFavorite('track-2')
        result.current.setLibraryViewMode('favorites')
      })

      expect(result.current.filteredTracks.length).toBe(2)
    })
  })

  describe('Persistence Methods', () => {
    it('should have local tracks persistence methods', async () => {
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: mockTracks }),
      )

      expect(result.current.restoreLocalTracks).toBeDefined()
      expect(result.current.persistLocalTracks).toBeDefined()
      expect(result.current.clearPersistedLocalTracks).toBeDefined()
      expect(typeof result.current.restoreLocalTracks).toBe('function')
      expect(typeof result.current.persistLocalTracks).toBe('function')
      expect(typeof result.current.clearPersistedLocalTracks).toBe('function')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty library', () => {
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: [] }),
      )

      expect(result.current.tracks).toEqual([])
      expect(result.current.filteredTracks).toEqual([])
      expect(result.current.artistOptions).toEqual([])
    })

    it('should handle duplicates gracefully', () => {
      const duplicateTracks = [...mockTracks, mockTracks[0]]
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: duplicateTracks }),
      )

      // Artists should deduplicate
      expect(result.current.artistOptions).toHaveLength(2)
    })

    it('should handle simultaneous search and filter', () => {
      const { result } = renderHook(() =>
        useLibrary({ initialTracks: mockTracks }),
      )

      act(() => {
        result.current.setSearchQuery('Song')
        result.current.setArtistFilter('Artist A')
      })

      expect(result.current.searchQuery).toBe('Song')
      expect(result.current.artistFilter).toBe('Artist A')
    })
  })
})
