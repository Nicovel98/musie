import { useRef, useCallback } from 'react'
import type { ThemeMode } from '../components/layout/layoutTypes'
import {
  loadPlayerSession,
  savePlayerSession,
  type PlayerSession,
  type PlayerScreen,
} from '../services/storage/playerSession'
import {
  clearLocalTracks,
  getAllLocalTracks,
  saveLocalTracks,
  type StoredTrack,
} from '../services/storage/libraryDb'

const THEME_STORAGE_KEY = 'musie.theme.v1'
const FAVORITES_STORAGE_KEY = 'musie.favorites.v1'

export interface UsePersistedStateReturn {
  restoreSession: () => Promise<PlayerSession | null>
  persistPlayerState: (state: PlayerSession) => void
  persistTheme: (theme: ThemeMode) => void
  persistFavorites: (favorites: Set<string>) => void
  restoreTheme: () => ThemeMode
  restoreFavorites: () => Set<string>
  restoreLocalTracks: () => Promise<StoredTrack[]>
  persistLocalTracks: (tracks: StoredTrack[]) => Promise<void>
  clearPersistedLocalTracks: () => Promise<void>
}

export function usePersistenceSession(): UsePersistedStateReturn {
  const isRestoringRef = useRef(false)

  function restoreTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'light'

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return storedTheme === 'light' ? 'light' : 'dark'
  }

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

  const restoreSession = useCallback(async (): Promise<PlayerSession | null> => {
    if (isRestoringRef.current) return null
    isRestoringRef.current = true

    try {
      const session = loadPlayerSession()
      return session
    } finally {
      isRestoringRef.current = false
    }
  }, [])

  function persistPlayerState(state: PlayerSession) {
    try {
      savePlayerSession({
        volume: state.volume,
        shuffleEnabled: state.shuffleEnabled,
        repeatMode: state.repeatMode,
        allowOnlineCoverLookup: state.allowOnlineCoverLookup,
        coverLookupProvider: state.coverLookupProvider,
        activeScreen: state.activeScreen as PlayerScreen,
        currentTrackId: state.currentTrackId,
        currentTime: state.currentTime,
      })
    } catch (error) {
      console.error('Failed to persist player state:', error)
    }
  }

  function persistTheme(theme: ThemeMode) {
    if (typeof window === 'undefined') return

    try {
      document.documentElement.setAttribute('data-theme', theme)
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch (error) {
      console.error('Failed to persist theme:', error)
    }
  }

  function persistFavorites(favorites: Set<string>) {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(Array.from(favorites)),
      )
    } catch (error) {
      console.error('Failed to persist favorites:', error)
    }
  }

  async function restoreLocalTracks(): Promise<StoredTrack[]> {
    try {
      const records = await getAllLocalTracks()
      return records
    } catch (error) {
      console.error('Failed to restore local tracks:', error)
      return []
    }
  }

  async function persistLocalTracks(tracks: StoredTrack[]): Promise<void> {
    try {
      await saveLocalTracks(tracks)
    } catch (error) {
      console.error('Failed to persist local tracks:', error)
    }
  }

  async function clearPersistedLocalTracks(): Promise<void> {
    try {
      await clearLocalTracks()
    } catch (error) {
      console.error('Failed to clear local tracks:', error)
    }
  }

  return {
    restoreSession,
    persistPlayerState,
    persistTheme,
    persistFavorites,
    restoreTheme,
    restoreFavorites,
    restoreLocalTracks,
    persistLocalTracks,
    clearPersistedLocalTracks,
  }
}
