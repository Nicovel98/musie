import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePersistenceSession } from './usePersistenceSession'
import * as playerSessionService from '../services/storage/playerSession'
import * as libraryDbService from '../services/storage/libraryDb'

vi.mock('../services/storage/playerSession')
vi.mock('../services/storage/libraryDb')

describe('usePersistenceSession', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should initialize correctly', () => {
    const { result } = renderHook(() => usePersistenceSession())

    expect(result.current).toBeDefined()
    expect(result.current.restoreSession).toBeDefined()
    expect(result.current.persistPlayerState).toBeDefined()
    expect(result.current.persistTheme).toBeDefined()
    expect(result.current.persistFavorites).toBeDefined()
    expect(result.current.restoreTheme).toBeDefined()
    expect(result.current.restoreFavorites).toBeDefined()
  })

  it('should restore theme from localStorage', () => {
    localStorage.setItem('musie.theme.v1', 'light')

    const { result } = renderHook(() => usePersistenceSession())

    expect(result.current.restoreTheme()).toBe('light')
  })

  it('should default to dark theme if not stored', () => {
    const { result } = renderHook(() => usePersistenceSession())

    expect(result.current.restoreTheme()).toBe('dark')
  })

  it('should persist theme to localStorage', () => {
    const { result } = renderHook(() => usePersistenceSession())

    act(() => {
      result.current.persistTheme('light')
    })

    expect(localStorage.getItem('musie.theme.v1')).toBe('light')
  })

  it('should set theme attribute on document', () => {
    const { result } = renderHook(() => usePersistenceSession())

    act(() => {
      result.current.persistTheme('dark')
    })

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('should restore favorites from localStorage', () => {
    localStorage.setItem('musie.favorites.v1', JSON.stringify(['track-1', 'track-2']))

    const { result } = renderHook(() => usePersistenceSession())

    const favorites = result.current.restoreFavorites()
    expect(favorites.has('track-1')).toBe(true)
    expect(favorites.has('track-2')).toBe(true)
    expect(favorites.size).toBe(2)
  })

  it('should return empty set if no favorites stored', () => {
    const { result } = renderHook(() => usePersistenceSession())

    const favorites = result.current.restoreFavorites()
    expect(favorites.size).toBe(0)
  })

  it('should filter out invalid favorite entries', () => {
    localStorage.setItem('musie.favorites.v1', JSON.stringify(['track-1', '', 'track-2', null]))

    const { result } = renderHook(() => usePersistenceSession())

    const favorites = result.current.restoreFavorites()
    expect(favorites.size).toBe(2)
    expect(favorites.has('track-1')).toBe(true)
    expect(favorites.has('track-2')).toBe(true)
  })

  it('should persist favorites to localStorage', () => {
    const { result } = renderHook(() => usePersistenceSession())

    const favorites = new Set(['track-1', 'track-3', 'track-5'])

    act(() => {
      result.current.persistFavorites(favorites)
    })

    const stored = localStorage.getItem('musie.favorites.v1')
    const parsed = JSON.parse(stored!)
    expect(parsed).toContain('track-1')
    expect(parsed).toContain('track-3')
    expect(parsed).toContain('track-5')
    expect(parsed.length).toBe(3)
  })

  it('should restore player session', async () => {
    const mockSession = {
      volume: 0.7,
      shuffleEnabled: true,
      repeatMode: 'one' as const,
      allowOnlineCoverLookup: false,
      coverLookupProvider: 'auto' as const,
      activeScreen: 'library' as const,
      currentTrackId: 'track-123',
      currentTime: 42,
    }

    vi.mocked(playerSessionService.loadPlayerSession).mockReturnValue(mockSession)

    const { result } = renderHook(() => usePersistenceSession())

    const session = await result.current.restoreSession()
    expect(session).toEqual(mockSession)
  })

  it('should persist player state', () => {
    const { result } = renderHook(() => usePersistenceSession())

    const playerState = {
      volume: 0.5,
      shuffleEnabled: false,
      repeatMode: 'all' as const,
      allowOnlineCoverLookup: true,
      coverLookupProvider: 'spotify' as const,
      activeScreen: 'player' as const,
      currentTrackId: 'track-999',
      currentTime: 100,
    }

    act(() => {
      result.current.persistPlayerState(playerState)
    })

    expect(playerSessionService.savePlayerSession).toHaveBeenCalledWith(
      expect.objectContaining({
        volume: 0.5,
        shuffleEnabled: false,
        repeatMode: 'all',
        allowOnlineCoverLookup: true,
        coverLookupProvider: 'spotify',
        currentTrackId: 'track-999',
        currentTime: 100,
      }),
    )
  })

  it('should restore local tracks', async () => {
    const mockTracks = [
      {
        id: 'local-1',
        title: 'Track 1',
        artist: 'Artist 1',
        fileBlob: new Blob(),
        coverDataUrl: '',
        coverSource: 'local' as const,
        duration: 180,
        sizeBytes: 1000,
        createdAt: Date.now(),
      },
    ]

    vi.mocked(libraryDbService.getAllLocalTracks).mockResolvedValue(mockTracks)

    const { result } = renderHook(() => usePersistenceSession())

    const tracks = await result.current.restoreLocalTracks()
    expect(tracks).toEqual(mockTracks)
    expect(libraryDbService.getAllLocalTracks).toHaveBeenCalled()
  })

  it('should handle error when restoring local tracks', async () => {
    vi.mocked(libraryDbService.getAllLocalTracks).mockRejectedValue(
      new Error('IndexedDB error'),
    )

    const { result } = renderHook(() => usePersistenceSession())

    const tracks = await result.current.restoreLocalTracks()
    expect(tracks).toEqual([])
  })

  it('should persist local tracks', async () => {
    const mockTracks = [
      {
        id: 'local-1',
        title: 'Track 1',
        artist: 'Artist 1',
        fileBlob: new Blob(),
        coverDataUrl: '',
        coverSource: 'local' as const,
        duration: 180,
        sizeBytes: 1000,
        createdAt: Date.now(),
      },
    ]

    vi.mocked(libraryDbService.saveLocalTracks).mockResolvedValue(undefined)

    const { result } = renderHook(() => usePersistenceSession())

    await act(async () => {
      await result.current.persistLocalTracks(mockTracks)
    })

    expect(libraryDbService.saveLocalTracks).toHaveBeenCalledWith(mockTracks)
  })

  it('should clear persisted local tracks', async () => {
    vi.mocked(libraryDbService.clearLocalTracks).mockResolvedValue(undefined)

    const { result } = renderHook(() => usePersistenceSession())

    await act(async () => {
      await result.current.clearPersistedLocalTracks()
    })

    expect(libraryDbService.clearLocalTracks).toHaveBeenCalled()
  })

  it('should handle error when clearing local tracks', async () => {
    vi.mocked(libraryDbService.clearLocalTracks).mockRejectedValue(
      new Error('Clear failed'),
    )

    const { result } = renderHook(() => usePersistenceSession())

    await act(async () => {
      await result.current.clearPersistedLocalTracks()
    })

    expect(libraryDbService.clearLocalTracks).toHaveBeenCalled()
  })

  it('should handle invalid JSON in localStorage for favorites', () => {
    localStorage.setItem('musie.favorites.v1', 'invalid json')

    const { result } = renderHook(() => usePersistenceSession())

    const favorites = result.current.restoreFavorites()
    expect(favorites.size).toBe(0)
  })

  it('should handle non-array data in localStorage for favorites', () => {
    localStorage.setItem('musie.favorites.v1', JSON.stringify({ invalid: 'object' }))

    const { result } = renderHook(() => usePersistenceSession())

    const favorites = result.current.restoreFavorites()
    expect(favorites.size).toBe(0)
  })

  it('should handle error when persisting theme', () => {
    const { result } = renderHook(() => usePersistenceSession())

    const originalSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage full')
    })

    act(() => {
      result.current.persistTheme('light')
    })

    Storage.prototype.setItem = originalSetItem
  })

  it('should handle error when persisting favorites', () => {
    const { result } = renderHook(() => usePersistenceSession())

    const originalSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage full')
    })

    act(() => {
      result.current.persistFavorites(new Set(['track-1']))
    })

    Storage.prototype.setItem = originalSetItem
  })
})
