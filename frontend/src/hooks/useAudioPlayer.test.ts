import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioPlayer } from './useAudioPlayer'
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

describe('useAudioPlayer', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'addEventListener').mockImplementation(() => {})
    vi.spyOn(HTMLMediaElement.prototype, 'removeEventListener').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ tracks: mockTracks }),
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

  it('should toggle play state', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ tracks: mockTracks }),
    )

    // Note: togglePlay requires an audio element ref, which is not available in tests
    // This tests the state management logic
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

  it('should not toggle play when no tracks', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ tracks: [] }),
    )

    act(() => {
      result.current.togglePlay()
    })

    expect(result.current.isPlaying).toBe(false)
  })

  it('should manage volume', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ tracks: mockTracks }),
    )

    act(() => {
      result.current.setVolume(0.5)
    })

    expect(result.current.volume).toBe(0.5)
  })

  it('should seek track (state management)', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ tracks: mockTracks }),
    )

    // Note: seekTrack requires an audio element ref
    // We test the state management via setCurrentTime directly
    act(() => {
      result.current.setCurrentTime(60)
    })

    expect(result.current.currentTime).toBe(60)
  })

  it('should toggle shuffle', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ tracks: mockTracks }),
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

  it('should cycle repeat mode', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ tracks: mockTracks }),
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

  it('should get next index with repeat all', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        tracks: mockTracks,
        initialRepeatMode: 'all',
      }),
    )

    act(() => {
      result.current.setCurrentTrackIndex(0)
    })

    expect(result.current.getNextIndex()).toBe(1)

    act(() => {
      result.current.setCurrentTrackIndex(2)
    })

    expect(result.current.getNextIndex()).toBe(0)
  })

  it('should get next index with repeat off', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        tracks: mockTracks,
        initialRepeatMode: 'off',
      }),
    )

    act(() => {
      result.current.setCurrentTrackIndex(2)
    })

    expect(result.current.getNextIndex()).toBe(-1)
  })

  it('should get next index with shuffle enabled', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        tracks: mockTracks,
        initialShuffleEnabled: true,
      }),
    )

    const nextIndex = result.current.getNextIndex()
    expect(nextIndex).toBeGreaterThanOrEqual(0)
    expect(nextIndex).toBeLessThan(mockTracks.length)
  })

  it('should get previous index', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        tracks: mockTracks,
        initialCurrentTrackIndex: 1,
      }),
    )

    expect(result.current.getPrevIndex()).toBe(0)

    act(() => {
      result.current.setCurrentTrackIndex(0)
    })

    expect(result.current.getPrevIndex()).toBe(2)
  })

  it('should advance to next track', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ tracks: mockTracks }),
    )

    expect(result.current.currentTrackIndex).toBe(0)

    act(() => {
      result.current.nextTrack()
    })

    expect(result.current.currentTrackIndex).toBe(1)
    expect(result.current.isPlaying).toBe(true)
  })

  it('should go to previous track', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        tracks: mockTracks,
        initialCurrentTrackIndex: 1,
      }),
    )

    act(() => {
      result.current.prevTrack()
    })

    expect(result.current.currentTrackIndex).toBe(0)
    expect(result.current.isPlaying).toBe(true)
  })

  it('should select track by index', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ tracks: mockTracks }),
    )

    act(() => {
      result.current.selectTrackByIndex(2)
    })

    expect(result.current.currentTrackIndex).toBe(2)
    expect(result.current.isPlaying).toBe(true)
  })

  it('should not select invalid track index', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        tracks: mockTracks,
        initialCurrentTrackIndex: 0,
      }),
    )

    act(() => {
      result.current.selectTrackByIndex(-1)
    })

    expect(result.current.currentTrackIndex).toBe(0)

    act(() => {
      result.current.selectTrackByIndex(999)
    })

    expect(result.current.currentTrackIndex).toBe(0)
  })

  it('should return correct current track', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        tracks: mockTracks,
        initialCurrentTrackIndex: 1,
      }),
    )

    expect(result.current.currentTrack).toBe(mockTracks[1])
  })

  it('should handle empty tracks', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ tracks: [] }),
    )

    expect(result.current.currentTrack).toBeNull()
    expect(result.current.getNextIndex()).toBe(-1)
    expect(result.current.getPrevIndex()).toBe(-1)
  })

  it('should support custom initial values', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        tracks: mockTracks,
        initialIsPlaying: true,
        initialVolume: 0.5,
        initialShuffleEnabled: true,
        initialRepeatMode: 'one',
        initialCurrentTrackIndex: 2,
      }),
    )

    expect(result.current.isPlaying).toBe(true)
    expect(result.current.volume).toBe(0.5)
    expect(result.current.shuffleEnabled).toBe(true)
    expect(result.current.repeatMode).toBe('one')
    expect(result.current.currentTrackIndex).toBe(2)
  })

  it('should handle single track in shuffle', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({
        tracks: [mockTracks[0]],
        initialShuffleEnabled: true,
      }),
    )

    expect(result.current.getNextIndex()).toBe(0)
    expect(result.current.getPrevIndex()).toBe(0)
  })
})
