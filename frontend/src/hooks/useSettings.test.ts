import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSettings } from './useSettings'

describe('useSettings (consolidated hook)', () => {
  beforeEach(() => {
    // Mock localStorage to return light theme by default - use window not global
    const localStorageMock = {
      getItem: vi.fn((key) => {
        if (key === 'musie.theme.v1') return 'light'
        return null
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    window.localStorage = localStorageMock as any

    // Mock document.documentElement
    const mockElement = {
      setAttribute: vi.fn(),
    }
    Object.defineProperty(document, 'documentElement', {
      value: mockElement,
      writable: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Theme Management', () => {
    it('should initialize with light theme by default', () => {
      const { result } = renderHook(() => useSettings())

      expect(result.current.theme).toBe('light')
    })

    it('should set theme', () => {
      const { result } = renderHook(() => useSettings())

      expect(result.current.theme).toBe('light')

      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.theme).toBe('dark')
    })

    it('should toggle theme between light and dark', () => {
      const { result } = renderHook(() => useSettings())

      expect(result.current.theme).toBe('light')

      act(() => {
        result.current.toggleTheme()
      })

      expect(result.current.theme).toBe('dark')

      act(() => {
        result.current.toggleTheme()
      })

      expect(result.current.theme).toBe('light')
    })
  })

  describe('Theme Persistence', () => {
    it('should restore theme from localStorage', () => {
      ;(window.localStorage.getItem as any).mockReturnValue('dark')

      const { result } = renderHook(() => useSettings())

      expect(result.current.restoreTheme()).toBe('dark')
    })

    it('should default to dark theme if localStorage is empty', () => {
      ;(window.localStorage.getItem as any).mockReturnValue(null)

      const { result } = renderHook(() => useSettings())

      const restored = result.current.restoreTheme()
      // When localStorage returns null (empty), defaults to 'dark'  
      // (anything other than explicit 'light' is treated as dark)
      expect(restored).toBe('dark')
    })

    it('should persist theme to localStorage', () => {
      const { result } = renderHook(() => useSettings())

      act(() => {
        result.current.setTheme('dark')
      })

      expect((window.localStorage.setItem as any)).toHaveBeenCalledWith(
        'musie.theme.v1',
        'dark'
      )
    })

    it('should set data-theme attribute on document element', () => {
      const { result } = renderHook(() => useSettings())

      act(() => {
        result.current.setTheme('dark')
      })

      expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
        'data-theme',
        'dark'
      )
    })
  })

  describe('Settings Methods', () => {
    it('should have all settings methods', () => {
      const { result } = renderHook(() => useSettings())

      expect(result.current.theme).toBeDefined()
      expect(result.current.setTheme).toBeDefined()
      expect(result.current.toggleTheme).toBeDefined()
      expect(result.current.restoreTheme).toBeDefined()
      expect(result.current.persistTheme).toBeDefined()

      expect(typeof result.current.setTheme).toBe('function')
      expect(typeof result.current.toggleTheme).toBe('function')
      expect(typeof result.current.restoreTheme).toBe('function')
      expect(typeof result.current.persistTheme).toBe('function')
    })
  })

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      ;(window.localStorage.setItem as any).mockImplementation(() => {
        throw new Error('Storage full')
      })

      const { result } = renderHook(() => useSettings())

      // Should not throw, just log error
      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.theme).toBe('dark')
    })
  })

  describe('Theme Consistency', () => {
    it('should maintain theme after multiple sets', () => {
      const { result } = renderHook(() => useSettings())

      act(() => {
        result.current.setTheme('dark')
      })

      expect(result.current.theme).toBe('dark')

      act(() => {
        result.current.setTheme('light')
      })

      expect(result.current.theme).toBe('light')
    })
  })
})
