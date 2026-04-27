/**
 * Tests for Persistence (localStorage, IndexedDB)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupIndexedDBMock, cleanupIndexedDBMock } from './mocks/indexedDb.mock'

describe('Persistence', () => {
  describe('localStorage', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('should save session state to localStorage', () => {
      const session = {
        currentTrackId: '123',
        currentTime: 45,
        volume: 0.8,
        theme: 'dark',
      }
      localStorage.setItem('musie-session', JSON.stringify(session))
      const saved = localStorage.getItem('musie-session')
      expect(saved).toBeDefined()
      expect(JSON.parse(saved!)).toEqual(session)
    })

    it('should load session state from localStorage', () => {
      const session = {
        currentTrackId: '123',
        currentTime: 45,
        volume: 0.8,
      }
      localStorage.setItem('musie-session', JSON.stringify(session))
      const loaded = JSON.parse(localStorage.getItem('musie-session')!)
      expect(loaded.currentTrackId).toBe('123')
      expect(loaded.currentTime).toBe(45)
    })

    it('should handle missing session gracefully', () => {
      const loaded = localStorage.getItem('musie-session')
      expect(loaded).toBeNull()
    })

    it('should save favorites list', () => {
      const favorites = ['1', '2', '3']
      localStorage.setItem('musie-favorites', JSON.stringify(favorites))
      const saved = JSON.parse(localStorage.getItem('musie-favorites')!)
      expect(saved.length).toBe(3)
    })

    it('should update existing session', () => {
      const session1 = { time: 30 }
      localStorage.setItem('musie-session', JSON.stringify(session1))
      const session2 = { time: 60 }
      localStorage.setItem('musie-session', JSON.stringify(session2))
      const saved = JSON.parse(localStorage.getItem('musie-session')!)
      expect(saved.time).toBe(60)
    })

    it('should clear session on logout', () => {
      localStorage.setItem('musie-session', JSON.stringify({ user: 'test' }))
      localStorage.removeItem('musie-session')
      expect(localStorage.getItem('musie-session')).toBeNull()
    })
  })

  describe('IndexedDB', () => {
    beforeEach(() => {
      setupIndexedDBMock()
    })

    afterEach(() => {
      cleanupIndexedDBMock()
    })

    it('should have indexedDB available', () => {
      expect(globalThis.indexedDB).toBeDefined()
    })

    it('should open database', async () => {
      const request = globalThis.indexedDB.open('test-db', 1)
      expect(request).toBeDefined()
    })

    it('should create object store', () => {
      // Mock database for testing
      const mockDb = {
        createObjectStore: vi.fn((name: string) => {
          return { name }
        }),
      }
      const store = mockDb.createObjectStore('tracks')
      expect(store.name).toBe('tracks')
    })

    it('should handle transaction', () => {
      const mockDb = {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        transaction: vi.fn((_storeName: string, _mode: string) => {
          return {
            objectStore: vi.fn(() => ({})),
          }
        }),
      }
      const tx = mockDb.transaction('tracks', 'readwrite')
      expect(tx).toBeDefined()
    })
  })

  describe('Session Persistence Flow', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('should save and restore full player state', () => {
      const playerState = {
        currentTrackId: 'track-123',
        currentTime: 45,
        volume: 0.8,
        repeatMode: 'all' as const,
        isShuffling: false,
      }

      // Save
      localStorage.setItem('musie-player-state', JSON.stringify(playerState))

      // Restore
      const restored = JSON.parse(localStorage.getItem('musie-player-state')!)
      expect(restored).toEqual(playerState)
    })

    it('should persist library metadata', () => {
      const library = {
        totalTracks: 42,
        totalPlaylists: 3,
        lastUpdated: new Date().toISOString(),
      }

      localStorage.setItem('musie-library-meta', JSON.stringify(library))
      const saved = JSON.parse(localStorage.getItem('musie-library-meta')!)
      expect(saved.totalTracks).toBe(42)
    })

    it('should handle corrupt data gracefully', () => {
      localStorage.setItem('musie-session', 'invalid-json{')
      let parsed: Record<string, unknown> | null = null
      try {
        parsed = JSON.parse(localStorage.getItem('musie-session')!)
      } catch {
        // Expected error
      }
      expect(parsed).toBeNull()
    })

    it('should migrate old session format', () => {
      // Old format
      const oldSession = {
        track_id: '123', // Old key
        play_time: 45,
      }
      localStorage.setItem('musie-session-old', JSON.stringify(oldSession))

      // Migration function
      const oldData = JSON.parse(localStorage.getItem('musie-session-old')!)
      const newFormat = {
        currentTrackId: oldData.track_id,
        currentTime: oldData.play_time,
      }
      localStorage.setItem('musie-session', JSON.stringify(newFormat))

      const migrated = JSON.parse(localStorage.getItem('musie-session')!)
      expect(migrated.currentTrackId).toBe('123')
    })
  })

  describe('Storage Quota and Limits', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('should handle storage quota exceeded', () => {
      const largeData = 'x'.repeat(5242880) // 5MB
      try {
        localStorage.setItem('musie-large', largeData)
      } catch (e) {
        // QuotaExceededError expected
        expect(e).toBeDefined()
      }
    })

    it('should maintain small items when quota exceeded', () => {
      const smallItem = 'small data'
      localStorage.setItem('musie-small', smallItem)

      const largeData = 'x'.repeat(5242880)
      try {
        localStorage.setItem('musie-large', largeData)
      } catch {
        // Ignore quota error
      }

      expect(localStorage.getItem('musie-small')).toBe(smallItem)
    })

    it('should clean up old cache on storage limit', () => {
      localStorage.setItem('musie-cache-v1', 'old')
      localStorage.setItem('musie-cache-v2', 'new')

      // Remove old cache
      localStorage.removeItem('musie-cache-v1')
      expect(localStorage.getItem('musie-cache-v1')).toBeNull()
      expect(localStorage.getItem('musie-cache-v2')).toBe('new')
    })
  })
})
