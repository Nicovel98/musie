import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LibraryPanel } from '../library/LibraryPanel'
import { QueuePanel } from '../library/QueuePanel'
import { NowPlayingCard } from '../player/NowPlayingCard'
import type { RepeatMode, Track } from '../../types/player'

type ScreenKey = 'library' | 'player' | 'queue'

const initialTracks: Track[] = [
  {
    id: 'in-circles',
    title: 'Transistor - In Circles',
    artist: 'Red',
    src: '/audio/in-circles.mp3',
  },
  {
    id: 'signals',
    title: 'Transistor - Signals',
    artist: 'Red',
    src: '/audio/signals.mp3',
  },
  {
    id: 'she-shines',
    title: 'Transistor - She Shines',
    artist: 'Red',
    src: '/audio/she-shines.mp3',
  },
]

export function AppShell() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>('player')
  const [tracks, setTracks] = useState<Track[]>(initialTracks)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [shuffleEnabled, setShuffleEnabled] = useState(false)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all')

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const currentTrack = tracks[currentTrackIndex] ?? null

  const screenTitle = useMemo(() => {
    if (activeScreen === 'library') return 'Library'
    if (activeScreen === 'queue') return 'Queue'
    return 'Now Playing'
  }, [activeScreen])

  function selectTrackById(trackId: string) {
    const trackIndex = tracks.findIndex((track) => track.id === trackId)
    if (trackIndex === -1) return

    setCurrentTrackIndex(trackIndex)
    setActiveScreen('player')
    setIsPlaying(true)
  }

  const getNextIndex = useCallback(() => {
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
  }, [tracks, shuffleEnabled, currentTrackIndex, repeatMode])

  const getPrevIndex = useCallback(() => {
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
  }, [tracks, shuffleEnabled, currentTrackIndex, repeatMode])

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

  function clearQueue() {
    setTracks([])
    setCurrentTrackIndex(0)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
  }

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    const audioElement = audioRef.current
    if (!audioElement || !currentTrack) return

    audioElement.src = currentTrack.src
    audioElement.currentTime = 0

    if (isPlaying) {
      audioElement.play().catch(() => {
        setIsPlaying(false)
      })
    }
  }, [currentTrack, isPlaying])

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

  useEffect(() => {
    const audioElement = audioRef.current
    if (!audioElement) return

    const onTimeUpdate = () => setCurrentTime(audioElement.currentTime)
    const onLoadedMetadata = () => setDuration(audioElement.duration || 0)
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

  return (
    <main className="app-shell-wrap">
      <audio ref={audioRef} preload="metadata" />

      <header className="mobile-header" aria-label="Current screen">
        <p className="mobile-header-eyebrow">Musie</p>
        <h1>{screenTitle}</h1>
      </header>

      <nav className="mobile-nav" aria-label="Primary navigation">
        <button
          type="button"
          className={activeScreen === 'library' ? 'is-active' : ''}
          onClick={() => setActiveScreen('library')}
        >
          Library
        </button>
        <button
          type="button"
          className={activeScreen === 'player' ? 'is-active' : ''}
          onClick={() => setActiveScreen('player')}
        >
          Player
        </button>
        <button
          type="button"
          className={activeScreen === 'queue' ? 'is-active' : ''}
          onClick={() => setActiveScreen('queue')}
        >
          Queue
        </button>
      </nav>

      <section
        className={`mobile-screen mobile-screen-library ${activeScreen === 'library' ? 'is-visible' : ''}`}
      >
        <aside className="panel panel-library" aria-label="Library">
          <LibraryPanel
            tracks={tracks}
            activeTrackId={currentTrack?.id ?? null}
            onSelectTrack={selectTrackById}
          />
        </aside>
      </section>

      <section
        className={`mobile-screen mobile-screen-player ${activeScreen === 'player' ? 'is-visible' : ''}`}
      >
        <section className="panel panel-player" aria-label="Now playing">
          <NowPlayingCard
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            shuffleEnabled={shuffleEnabled}
            repeatMode={repeatMode}
            onPrev={prevTrack}
            onTogglePlay={togglePlay}
            onNext={nextTrack}
            onSeek={seekTrack}
            onVolumeChange={handleVolumeChange}
            onToggleShuffle={toggleShuffle}
            onCycleRepeat={cycleRepeat}
          />
        </section>
      </section>

      <section
        className={`mobile-screen mobile-screen-queue ${activeScreen === 'queue' ? 'is-visible' : ''}`}
      >
        <aside className="panel panel-queue" aria-label="Queue">
          <QueuePanel
            tracks={tracks}
            activeTrackId={currentTrack?.id ?? null}
            onSelectTrack={selectTrackById}
            onClearQueue={clearQueue}
          />
        </aside>
      </section>

      <section className="app-shell" aria-label="Desktop layout">
        <aside className="panel panel-library" aria-label="Library">
          <LibraryPanel
            tracks={tracks}
            activeTrackId={currentTrack?.id ?? null}
            onSelectTrack={selectTrackById}
          />
        </aside>

        <section className="panel panel-player" aria-label="Now playing">
          <NowPlayingCard
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            shuffleEnabled={shuffleEnabled}
            repeatMode={repeatMode}
            onPrev={prevTrack}
            onTogglePlay={togglePlay}
            onNext={nextTrack}
            onSeek={seekTrack}
            onVolumeChange={handleVolumeChange}
            onToggleShuffle={toggleShuffle}
            onCycleRepeat={cycleRepeat}
          />
        </section>

        <aside className="panel panel-queue" aria-label="Queue">
          <QueuePanel
            tracks={tracks}
            activeTrackId={currentTrack?.id ?? null}
            onSelectTrack={selectTrackById}
            onClearQueue={clearQueue}
          />
        </aside>
      </section>
    </main>
  )
}
