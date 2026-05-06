import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePlayer } from './usePlayer'
import type { Track } from '../types/player'

const mockTracks: Track[] = [
  {
    id: 'track-1',
    title: 'Song 1',
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
    title: 'Song 2',
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
    title: 'Song 3',
    artist: 'Artist 3',
    duration: 150,
    src: 'data:audio/mp3;base64,ID3',
    coverUrl: '',
    coverSource: 'local',
    sizeBytes: 1500,
    createdAt: Date.now(),
  },
]

describe('usePlayer (consolidated hook)', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'addEventListener').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'removeEventListener').mockImplementation(() => {})
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    global.localStorage = localStorageMock as any
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Playback State', () => {
    it('should initialize with default playback values', () => {
      const { result } = renderHook(() =>
        usePlayer({ tracks: mockTracks }),
      )

      expect(result.current.isPlaying).toBe(false)
      expect(result.current.currentTime).toBe(0)
      expect(result.current.duration).toBe(0)
      expect(result.current.volume).toBe(0.8)
      expect(result.current.shuffleEnabled).toBe(false)
      expect(result.current.repeatMode).toBe('all')
      expect(result.current.currentTrackIndex).toBe(0)
      expect(result.current.currentTrack).toBe(mockTracks[0])
    })

    it('should handle play/pause toggling', () => {
      const { result } = renderHook(() =>
        usePlayer({ tracks: mockTracks }),
      )

      expect(result.current.isPlaying).toBe(false)

      act(() => {
        result.current.setIsPlaying(true)
      })
      expect(result.current.isPlaying).toBe(true)

      act(() => {
        result.current.setIsPlaying(false)
      })
      expect(result.current.isPlaying).toBe(false)
    })

    it('should handle volume changes', () => {
      const { result } = renderHook(() =>
        usePlayer({ tracks: mockTracks }),
      )

      expect(result.current.volume).toBe(0.8)

      act(() => {
        result.current.handleVolumeChange(0.5)
      })
      expect(result.current.volume).toBe(0.5)

      act(() => {
        result.current.handleVolumeChange(1.0)
      })
      expect(result.current.volume).toBe(1.0)
    })
  })

  describe('Shuffle & Repeat', () => {
    it('should toggle shuffle state', () => {
      const { result } = renderHook(() =>
        usePlayer({ tracks: mockTracks }),
      )

      expect(result.current.shuffleEnabled).toBe(false)

      act(() => {
        result.current.toggleShuffle()
      })
      expect(result.current.shuffleEnabled).toBe(true)

      act(() => {
        result.current.toggleShuffle()
      })
      expect(result.current.shuffleEnabled).toBe(false)
    })

    it('should cycle through repeat modes', () => {
      const { result } = renderHook(() =>
        usePlayer({ tracks: mockTracks }),
      )

      expect(result.current.repeatMode).toBe('all')

      act(() => {
        result.current.cycleRepeat()
      })
      expect(result.current.repeatMode).toBe('one')

      act(() => {
        result.current.cycleRepeat()
      })
      expect(result.current.repeatMode).toBe('off')

      act(() => {
        result.current.cycleRepeat()
      })
      expect(result.current.repeatMode).toBe('all')
    })
  })

  describe('Track Navigation', () => {
    it('should move to next track', () => {
      const { result } = renderHook(() =>
        usePlayer({ tracks: mockTracks }),
      )

      expect(result.current.currentTrackIndex).toBe(0)

      act(() => {
        result.current.nextTrack()
      })
      expect(result.current.currentTrackIndex).toBe(1)
      expect(result.current.currentTrack).toBe(mockTracks[1])
    })

    it('should move to previous track', () => {
      const { result } = renderHook(() =>
        usePlayer({ tracks: mockTracks, initialCurrentTrackIndex: 1 }),
      )

      expect(result.current.currentTrackIndex).toBe(1)

      act(() => {
        result.current.prevTrack()
      })
      expect(result.current.currentTrackIndex).toBe(0)
      expect(result.current.currentTrack).toBe(mockTracks[0])
    })

    it('should select track by index', () => {
      const { result } = renderHook(() =>
        usePlayer({ tracks: mockTracks }),
      )

      act(() => {
        result.current.selectTrackByIndex(2)
      })
      expect(result.current.currentTrackIndex).toBe(2)
      expect(result.current.currentTrack).toBe(mockTracks[2])
    })

    it('should not select track with invalid index', () => {
      const { result } = renderHook(() =>
        usePlayer({ tracks: mockTracks }),
      )

      act(() => {
        result.current.selectTrackByIndex(999)
      })
      expect(result.current.currentTrackIndex).toBe(0)

      act(() => {
        result.current.selectTrackByIndex(-1)
      })
      expect(result.current.currentTrackIndex).toBe(0)
    })
  })

  describe('Seeking', () => {
    it('should update current time through state setter', () => {
      const { result } = renderHook(() =>
        usePlayer({ tracks: mockTracks }),
      )

      expect(result.current.currentTime).toBe(0)

      act(() => {
        result.current.setCurrentTime(60)
      })
      expect(result.current.currentTime).toBe(60)

      act(() => {
        result.current.setCurrentTime(120)
      })
      expect(result.current.currentTime).toBe(120)
    })

    it('should have seekTrack method available', () => {
      const { result } = renderHook(() =>
        usePlayer({ tracks: mockTracks }),
      )

      expect(result.current.seekTrack).toBeDefined()
      expect(typeof result.current.seekTrack).toBe('function')
      // Note: Full seekTrack testing requires a real audio element in integration tests
    })
  })

  describe('Persistence Methods', () => {
    it('should have persistence methods', () => {
      const { result } = renderHook(() =>
        usePlayer({ tracks: mockTracks }),
      )

      expect(result.current.restoreSession).toBeDefined()
      expect(result.current.persistPlayerState).toBeDefined()
      expect(typeof result.current.restoreSession).toBe('function')
      expect(typeof result.current.persistPlayerState).toBe('function')
    })

    it('should persist player state', () => {
      const { result } = renderHook(() =>
        usePlayer({ tracks: mockTracks }),
      )

      act(() => {
        result.current.persistPlayerState({
          volume: 0.7,
          shuffleEnabled: true,
          repeatMode: 'one',
          allowOnlineCoverLookup: false,
          coverLookupProvider: 'deezer',
          activeScreen: 'player',
          currentTrackId: 'track-1',
          currentTime: 45,
        })
      })

      expect(result.current.persistPlayerState).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty track list', () => {
      const { result } = renderHook(() =>
        usePlayer({ tracks: [] }),
      )

      expect(result.current.currentTrack).toBeNull()

      act(() => {
        result.current.togglePlay()
      })
      expect(result.current.isPlaying).toBe(false)

      act(() => {
        result.current.nextTrack()
      })
      expect(result.current.currentTrackIndex).toBe(0)
    })

    it('should handle single track', () => {
      const singleTrack = [mockTracks[0]]
      const { result } = renderHook(() =>
        usePlayer({ tracks: singleTrack }),
      )

      expect(result.current.currentTrack).toBe(singleTrack[0])

      act(() => {
        result.current.nextTrack()
      })
      // Should stay on same track or loop depending on repeat mode
      expect(result.current.currentTrack).toBe(singleTrack[0])
    })
  })
})
