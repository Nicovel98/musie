import { useState, useCallback } from 'react'
import type { ThemeMode } from '../components/layout/layoutTypes'

const THEME_STORAGE_KEY = 'musie.theme.v1'

/**
 * Consolidated settings hook for application preferences.
 * Manages theme and other global settings with persistence.
 */
export interface UseSettingsReturn {
  // Settings state
  theme: ThemeMode

  // Settings methods
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void

  // Persistence methods
  restoreTheme: () => ThemeMode
  persistTheme: (theme: ThemeMode) => void
}

/**
 * Hook that manages application settings with localStorage persistence.
 * Currently manages theme, with extensibility for future settings.
 *
 * @returns Settings state and control methods
 */
export function useSettings(): UseSettingsReturn {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return restoreThemeInternal()
  })

  /**
   * Internal theme restoration function
   */
  function restoreThemeInternal(): ThemeMode {
    if (typeof window === 'undefined') return 'light'

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return storedTheme === 'light' ? 'light' : 'dark'
  }

  /**
   * Internal theme persistence function
   */
  function persistThemeInternal(themeValue: ThemeMode) {
    if (typeof window === 'undefined') return

    try {
      document.documentElement.setAttribute('data-theme', themeValue)
      window.localStorage.setItem(THEME_STORAGE_KEY, themeValue)
    } catch (error) {
      console.error('Failed to persist theme:', error)
    }
  }

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme)
    persistThemeInternal(newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev: ThemeMode) => {
      const newTheme = (prev === 'light' ? 'dark' : 'light') as ThemeMode
      persistThemeInternal(newTheme)
      return newTheme
    })
  }, [])

  return {
    theme,
    setTheme,
    toggleTheme,
    restoreTheme: restoreThemeInternal,
    persistTheme: persistThemeInternal,
  }
}
