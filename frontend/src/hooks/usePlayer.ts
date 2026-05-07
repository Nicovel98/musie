import { useCallback, useRef, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import type { RepeatMode, Track } from '../types/player'
import {
  loadPlayerSession,
  savePlayerSession,
  type PlayerSession,
  type PlayerScreen,
} from '../services/storage/playerSession'

/**
 * Consolidated player hook combining audio playback and persistence.
 * Manages playback state, controls, and automatic persistence to localStorage.
 */
export interface UsePlayerReturn {
  // Audio element reference
  audioRef: React.RefObject<HTMLAudioElement | null>

  // Playback state
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  shuffleEnabled: boolean
  repeatMode: RepeatMode
  currentTrackIndex: number
  currentTrack: Track | null

  // Playback control methods
  togglePlay: () => void
  seekTrack: (value: number) => void
  handleVolumeChange: (value: number) => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  nextTrack: () => void
  prevTrack: () => void
  selectTrackByIndex: (index: number) => void

  // Navigation helpers
  getNextIndex: () => number
  getPrevIndex: () => number

  // State setters (for direct manipulation if needed)
  setIsPlaying: Dispatch<SetStateAction<boolean>>
  setCurrentTrackIndex: Dispatch<SetStateAction<number>>
  setCurrentTime: Dispatch<SetStateAction<number>>
  setDuration: Dispatch<SetStateAction<number>>
  setVolume: Dispatch<SetStateAction<number>>
  setShuffleEnabled: Dispatch<SetStateAction<boolean>>
  setRepeatMode: Dispatch<SetStateAction<RepeatMode>>

  // Persistence methods
  restoreSession: () => Promise<PlayerSession | null>
  persistPlayerState: (state: PlayerSession) => void
}

/**
 * Props for usePlayer hook
 */
export interface UsePlayerProps {
  tracks: Track[]
  initialIsPlaying?: boolean
  initialVolume?: number
  initialShuffleEnabled?: boolean
  initialRepeatMode?: RepeatMode
  initialCurrentTrackIndex?: number
}

/**
 * Hook that manages audio playback and player persistence.
 * Automatically saves state to localStorage on changes.
 *
 * @param tracks - Array of playable tracks
 * @param initialIsPlaying - Initial playback state (default: false)
 * @param initialVolume - Initial volume (0-1, default: 0.8)
 * @param initialShuffleEnabled - Initial shuffle state (default: false)
 * @param initialRepeatMode - Initial repeat mode (default: 'all')
 * @param initialCurrentTrackIndex - Initial track index (default: 0)
 * @returns Player state and control methods
 */
export function usePlayer({
  tracks,
  initialIsPlaying = false,
  initialVolume = 0.8,
  initialShuffleEnabled = false,
  initialRepeatMode = 'all',
  initialCurrentTrackIndex = 0,
}: UsePlayerProps): UsePlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isRestoringRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(initialIsPlaying)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(initialVolume)
  const [shuffleEnabled, setShuffleEnabled] = useState(initialShuffleEnabled)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(initialRepeatMode)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(initialCurrentTrackIndex)

  const currentTrack = tracks[currentTrackIndex] ?? null

  // Sync audio element volume
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
  }, [volume])

  // Handle audio source changes
  useEffect(() => {
    const audioElement = audioRef.current
    if (!audioElement) return

    if (!currentTrack) {
      audioElement.removeAttribute('src')
      audioElement.load()
      return
    }

    audioElement.src = currentTrack.src
    audioElement.currentTime = 0

    if (isPlaying) {
      audioElement.play().catch(() => {
        setIsPlaying(false)
      })
    }
  }, [currentTrack, isPlaying])

  // Handle play/pause state
  useEffect(() => {
    const audioElement = audioRef.current
    if (!audioElement) return

    if (isPlaying) {
      audioElement.play().catch(() => {
        setIsPlaying(false)
      })
    } else {
      audioElement.pause()
    }
  }, [isPlaying])

  const getNextIndex = useCallback((): number => {
    if (tracks.length === 0) return -1

    if (shuffleEnabled) {
      if (tracks.length === 1) return 0

      let randomIndex = Math.floor(Math.random() * tracks.length)
      while (randomIndex === currentTrackIndex) {
        randomIndex = Math.floor(Math.random() * tracks.length)
      }
      return randomIndex
    }

    const isLastTrack = currentTrackIndex >= tracks.length - 1
    if (isLastTrack) {
      if (repeatMode === 'all') return 0
      if (repeatMode === 'off') return -1
    }

    return Math.min(currentTrackIndex + 1, tracks.length - 1)
  }, [shuffleEnabled, currentTrackIndex, repeatMode, tracks.length])

  // Audio events
  useEffect(() => {
    const audioElement = audioRef.current
    if (!audioElement) return

    const onTimeUpdate = () => setCurrentTime(audioElement.currentTime)
    const onLoadedMetadata = () => {
      const loadedDuration = audioElement.duration || 0
      setDuration(loadedDuration)
    }
    const onEnded = () => {
      if (repeatMode === 'one') {
        audioElement.currentTime = 0
        audioElement.play().catch(() => {
          setIsPlaying(false)
        })
        return
      }

      const nextIndex = getNextIndex()
      if (nextIndex === -1 || tracks.length === 0) {
        setIsPlaying(false)
        return
      }

      setCurrentTrackIndex(nextIndex)
      setIsPlaying(true)
    }

    audioElement.addEventListener('timeupdate', onTimeUpdate)
    audioElement.addEventListener('loadedmetadata', onLoadedMetadata)
    audioElement.addEventListener('ended', onEnded)

    return () => {
      audioElement.removeEventListener('timeupdate', onTimeUpdate)
      audioElement.removeEventListener('loadedmetadata', onLoadedMetadata)
      audioElement.removeEventListener('ended', onEnded)
    }
  }, [repeatMode, tracks.length, getNextIndex])

  const getPrevIndex = useCallback((): number => {
    if (tracks.length === 0) return -1

    if (shuffleEnabled) {
      if (tracks.length === 1) return 0

      let randomIndex = Math.floor(Math.random() * tracks.length)
      while (randomIndex === currentTrackIndex) {
        randomIndex = Math.floor(Math.random() * tracks.length)
      }
      return randomIndex
    }

    const isFirstTrack = currentTrackIndex <= 0
    if (isFirstTrack) {
      if (repeatMode === 'all') return tracks.length - 1
      if (repeatMode === 'off') return -1
    }

    return Math.max(currentTrackIndex - 1, 0)
  }, [currentTrackIndex, shuffleEnabled, repeatMode, tracks.length])

  // Auto-persist player state on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentTrack) {
        persistPlayerState({
          volume,
          shuffleEnabled,
          repeatMode,
          allowOnlineCoverLookup: true,
          coverLookupProvider: 'auto',
          activeScreen: 'player' as PlayerScreen,
          currentTrackId: currentTrack.id,
          currentTime,
        })
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [volume, shuffleEnabled, repeatMode, currentTrack, currentTime])

  function togglePlay() {
    if (!audioRef.current || tracks.length === 0) return
    setIsPlaying((prev) => !prev)
  }

  function seekTrack(value: number) {
    if (!audioRef.current) return
    audioRef.current.currentTime = value
    setCurrentTime(value)
  }

  function handleVolumeChange(value: number) {
    setVolume(value)
  }

  function toggleShuffle() {
    setShuffleEnabled((prev) => !prev)
  }

  function cycleRepeat() {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all'
      if (prev === 'all') return 'one'
      return 'off'
    })
  }

  function nextTrack() {
    const nextIndex = getNextIndex()
    if (nextIndex === -1) {
      setIsPlaying(false)
      return
    }

    setCurrentTrackIndex(nextIndex)
    setIsPlaying(true)
  }

  function prevTrack() {
    const prevIndex = getPrevIndex()
    if (prevIndex === -1) return

    setCurrentTrackIndex(prevIndex)
    setIsPlaying(true)
  }

  function selectTrackByIndex(index: number) {
    if (index < 0 || index >= tracks.length) return
    setCurrentTrackIndex(index)
    setIsPlaying(true)
  }

  // Persistence: restore session
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

  // Persistence: save player state
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

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    shuffleEnabled,
    repeatMode,
    currentTrackIndex,
    currentTrack,
    togglePlay,
    seekTrack,
    handleVolumeChange,
    toggleShuffle,
    cycleRepeat,
    nextTrack,
    prevTrack,
    selectTrackByIndex,
    getNextIndex,
    getPrevIndex,
    setIsPlaying,
    setCurrentTrackIndex,
    setCurrentTime,
    setDuration,
    setVolume,
    setShuffleEnabled,
    setRepeatMode,
    restoreSession,
    persistPlayerState,
  }
}
