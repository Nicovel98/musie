import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLibraryState } from './useLibraryState'
import type { Track } from '../types/player'

const mockTracks: Track[] = [
  {
    id: 'track-1',
    title: 'Acoustic Song',
    artist: 'Artist 1',
    duration: 180,
    src: 'data:audio/mp3;base64,ID3',
    coverUrl: '',
    coverSource: 'local',
    sizeBytes: 1000,
    createdAt: Date.now(),
  },
  {
    id: 'track-2',
    title: 'Electronic Beats',
    artist: 'Artist 2',
    duration: 200,
    src: 'data:audio/mp3;base64,ID3',
    coverUrl: '',
    coverSource: 'local',
    sizeBytes: 2000,
    createdAt: Date.now(),
  },
  {
    id: 'track-3',
    title: 'Acoustic Session',
    artist: 'Artist 1',
    duration: 150,
    src: 'data:audio/mp3;base64,ID3',
    coverUrl: '',
    coverSource: 'local',
    sizeBytes: 1500,
    createdAt: Date.now(),
  },
]

describe('useLibraryState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useLibraryState({ initialTracks: mockTracks }),
    )

    expect(result.current.tracks).toEqual(mockTracks)
    expect(result.current.filteredTracks).toEqual(mockTracks)
    expect(result.current.searchQuery).toBe('')
    expect(result.current.artistFilter).toBe('all')
    expect(result.current.libraryViewMode).toBe('all')
    expect(result.current.favoriteTrackIds.size).toBe(0)
  })

  it('should filter tracks by search query', () => {
    const { result } = renderHook(() =>
      useLibraryState({ initialTracks: mockTracks }),
    )

    act(() => {
      result.current.setSearchQuery('acoustic')
    })

    expect(result.current.filteredTracks.length).toBe(2)
    expect(result.current.filteredTracks[0].title).toContain('Acoustic')
    expect(result.current.filteredTracks[1].title).toContain('Acoustic')
  })

  it('should filter tracks by artist', () => {
    const { result } = renderHook(() =>
      useLibraryState({ initialTracks: mockTracks }),
    )

    act(() => {
      result.current.setArtistFilter('Artist 1')
    })

    expect(result.current.filteredTracks.length).toBe(2)
    expect(result.current.filteredTracks.every((t) => t.artist === 'Artist 1')).toBe(
      true,
    )
  })

  it('should combine search and artist filters', () => {
    const { result } = renderHook(() =>
      useLibraryState({ initialTracks: mockTracks }),
    )

    act(() => {
      result.current.setSearchQuery('acoustic')
      result.current.setArtistFilter('Artist 1')
    })

    expect(result.current.filteredTracks.length).toBe(2)
  })

  it('should toggle track favorite', () => {
    const { result } = renderHook(() =>
      useLibraryState({ initialTracks: mockTracks }),
    )

    expect(result.current.favoriteTrackIds.size).toBe(0)

    act(() => {
      result.current.toggleTrackFavorite('track-1')
    })

    expect(result.current.favoriteTrackIds.has('track-1')).toBe(true)
    expect(result.current.favoriteTrackIds.size).toBe(1)

    act(() => {
      result.current.toggleTrackFavorite('track-1')
    })

    expect(result.current.favoriteTrackIds.has('track-1')).toBe(false)
    expect(result.current.favoriteTrackIds.size).toBe(0)
  })

  it('should filter by favorites when library view mode is favorites', () => {
    const { result } = renderHook(() =>
      useLibraryState({ initialTracks: mockTracks }),
    )

    act(() => {
      result.current.toggleTrackFavorite('track-1')
      result.current.toggleTrackFavorite('track-2')
      result.current.setLibraryViewMode('favorites')
    })

    expect(result.current.filteredTracks.length).toBe(2)
    expect(result.current.filteredTracks.map((t) => t.id)).toEqual([
      'track-1',
      'track-2',
    ])
  })

  it('should get artist options', () => {
    const { result } = renderHook(() =>
      useLibraryState({ initialTracks: mockTracks }),
    )

    expect(result.current.artistOptions).toEqual(['Artist 1', 'Artist 2'])
  })

  it('should select track by id', () => {
    const { result } = renderHook(() =>
      useLibraryState({ initialTracks: mockTracks }),
    )

    const index = result.current.selectTrackById('track-2')
    expect(index).toBe(1)

    const notFoundIndex = result.current.selectTrackById('non-existent')
    expect(notFoundIndex).toBeNull()
  })

  it('should import new tracks', () => {
    const { result } = renderHook(() =>
      useLibraryState({ initialTracks: [mockTracks[0]] }),
    )

    expect(result.current.tracks.length).toBe(1)

    act(() => {
      result.current.importTracks([mockTracks[1], mockTracks[2]])
    })

    expect(result.current.tracks.length).toBe(3)
  })

  it('should clear library', () => {
    const initialFavorites = new Set(['track-1', 'track-2'])

    const { result } = renderHook(() =>
      useLibraryState({
        initialTracks: mockTracks,
        initialSearchQuery: 'test',
        initialArtistFilter: 'Artist 1',
        initialLibraryViewMode: 'favorites',
        initialFavoriteTrackIds: initialFavorites,
      }),
    )

    expect(result.current.tracks.length).toBe(3)
    expect(result.current.favoriteTrackIds.size).toBe(2)

    act(() => {
      result.current.clearLibrary()
    })

    expect(result.current.tracks.length).toBe(0)
    expect(result.current.favoriteTrackIds.size).toBe(0)
    expect(result.current.searchQuery).toBe('')
    expect(result.current.artistFilter).toBe('all')
    expect(result.current.libraryViewMode).toBe('all')
  })

  it('should update setTracks directly', () => {
    const { result } = renderHook(() =>
      useLibraryState({ initialTracks: mockTracks }),
    )

    act(() => {
      result.current.setTracks([mockTracks[0]])
    })

    expect(result.current.tracks.length).toBe(1)
    expect(result.current.tracks[0].id).toBe('track-1')
  })

  it('should case-insensitive search', () => {
    const { result } = renderHook(() =>
      useLibraryState({ initialTracks: mockTracks }),
    )

    act(() => {
      result.current.setSearchQuery('ACOUSTIC')
    })

    expect(result.current.filteredTracks.length).toBe(2)
  })

  it('should handle empty tracks', () => {
    const { result } = renderHook(() =>
      useLibraryState({ initialTracks: [] }),
    )

    expect(result.current.tracks.length).toBe(0)
    expect(result.current.filteredTracks.length).toBe(0)
    expect(result.current.artistOptions.length).toBe(0)
  })

  it('should maintain sorted artist options', () => {
    const unsortedTracks: Track[] = [
      { ...mockTracks[0], artist: 'Zebra' },
      { ...mockTracks[1], artist: 'Apple' },
      { ...mockTracks[2], artist: 'Monkey' },
    ]

    const { result } = renderHook(() =>
      useLibraryState({ initialTracks: unsortedTracks }),
    )

    expect(result.current.artistOptions).toEqual(['Apple', 'Monkey', 'Zebra'])
  })

  it('should search by artist name', () => {
    const { result } = renderHook(() =>
      useLibraryState({ initialTracks: mockTracks }),
    )

    act(() => {
      result.current.setSearchQuery('Artist 2')
    })

    expect(result.current.filteredTracks.length).toBe(1)
    expect(result.current.filteredTracks[0].id).toBe('track-2')
  })

  it('should handle multiple favorites', () => {
    const { result } = renderHook(() =>
      useLibraryState({ initialTracks: mockTracks }),
    )

    act(() => {
      result.current.toggleTrackFavorite('track-1')
      result.current.toggleTrackFavorite('track-2')
      result.current.toggleTrackFavorite('track-3')
    })

    expect(result.current.favoriteTrackIds.size).toBe(3)

    act(() => {
      result.current.toggleTrackFavorite('track-2')
    })

    expect(result.current.favoriteTrackIds.size).toBe(2)
  })

  it('should support custom initial values', () => {
    const initialFavorites = new Set(['track-1'])

    const { result } = renderHook(() =>
      useLibraryState({
        initialTracks: mockTracks,
        initialSearchQuery: 'acoustic',
        initialArtistFilter: 'Artist 1',
        initialLibraryViewMode: 'favorites',
        initialFavoriteTrackIds: initialFavorites,
      }),
    )

    expect(result.current.searchQuery).toBe('acoustic')
    expect(result.current.artistFilter).toBe('Artist 1')
    expect(result.current.libraryViewMode).toBe('favorites')
    expect(result.current.favoriteTrackIds.has('track-1')).toBe(true)
  })
})
