import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LibraryPanel } from '../library/LibraryPanel'
import { QueuePanel } from '../library/QueuePanel'
import { NowPlayingCard } from '../player/NowPlayingCard'
import type { RepeatMode, Track } from '../../types/player'
import {
  createBundledTrack,
  createPersistedLocalTrack,
  createLocalTrack,
} from '../../features/library/trackNormalization'
import {
  loadPlayerSession,
  savePlayerSession,
  type PlayerScreen,
} from '../../services/storage/playerSession'
import {
  clearLocalTracks,
  getAllLocalTracks,
  saveLocalTracks,
} from '../../services/storage/libraryDb'

type ScreenKey = 'library' | 'player' | 'queue'

const savedSession = loadPlayerSession()

function getInitialTrackIndex() {
  if (!savedSession?.currentTrackId) return 0

  const trackIndex = initialTracks.findIndex(
    (track) => track.id === savedSession.currentTrackId,
  )

  return trackIndex === -1 ? 0 : trackIndex
}

const initialTracks: Track[] = [
  createBundledTrack({
    id: 'in-circles',
    title: 'Transistor - In Circles',
    artist: 'Red',
    fileName: 'in-circles.mp3',
  }),
  createBundledTrack({
    id: 'signals',
    title: 'Transistor - Signals',
    artist: 'Red',
    fileName: 'signals.mp3',
  }),
  createBundledTrack({
    id: 'she-shines',
    title: 'Transistor - She Shines',
    artist: 'Red',
    fileName: 'she-shines.mp3',
  }),
]

function readAudioDuration(src: string) {
  return new Promise<number>((resolve) => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.src = src

    const onReady = () => {
      resolve(Number.isFinite(audio.duration) ? audio.duration : 0)
      cleanup()
    }

    const onError = () => {
      resolve(0)
      cleanup()
    }

    function cleanup() {
      audio.removeEventListener('loadedmetadata', onReady)
      audio.removeEventListener('error', onError)
      audio.src = ''
    }

    audio.addEventListener('loadedmetadata', onReady)
    audio.addEventListener('error', onError)
  })
}

export function AppShell() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>(
    (savedSession?.activeScreen as ScreenKey) ?? 'player',
  )
  const [tracks, setTracks] = useState<Track[]>(initialTracks)
  const [currentTrackIndex, setCurrentTrackIndex] =
    useState(getInitialTrackIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(savedSession?.currentTime ?? 0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(savedSession?.volume ?? 0.8)
  const [shuffleEnabled, setShuffleEnabled] = useState(
    savedSession?.shuffleEnabled ?? false,
  )
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(
    savedSession?.repeatMode ?? 'all',
  )

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const localObjectUrlsRef = useRef<Set<string>>(new Set())
  const pendingResumeTimeRef = useRef(savedSession?.currentTime ?? 0)
  const pendingResumeTrackIdRef = useRef(savedSession?.currentTrackId ?? null)

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
    localObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    localObjectUrlsRef.current.clear()

    clearLocalTracks().catch(() => {
      // Best effort cleanup for local cache.
    })

    setTracks(initialTracks)
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

  useEffect(() => {
    const localObjectUrls = localObjectUrlsRef.current

    return () => {
      localObjectUrls.forEach((url) => URL.revokeObjectURL(url))
      localObjectUrls.clear()
    }
  }, [])

  useEffect(() => {
    let isDisposed = false

    async function restoreLocalTracks() {
      const records = await getAllLocalTracks()
      if (isDisposed || records.length === 0) return

      const restoredTracks = records.map((record) => {
        const objectUrl = URL.createObjectURL(record.fileBlob)
        localObjectUrlsRef.current.add(objectUrl)

        return createPersistedLocalTrack({
          record,
          objectUrl,
        })
      })

      setTracks((prev) => {
        const existingIds = new Set(prev.map((track) => track.id))
        const uniqueRestored = restoredTracks.filter(
          (track) => !existingIds.has(track.id),
        )

        if (uniqueRestored.length === 0) return prev
        return [...prev, ...uniqueRestored]
      })
    }

    restoreLocalTracks().catch(() => {
      // If IndexedDB fails, app continues with in-memory library.
    })

    return () => {
      isDisposed = true
    }
  }, [])

  const importLocalFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return

      const audioFiles = files.filter((file) => file.type.startsWith('audio/'))
      if (audioFiles.length === 0) return

      const importedTracks = await Promise.all(
        audioFiles.map(async (file) => {
          const objectUrl = URL.createObjectURL(file)
          localObjectUrlsRef.current.add(objectUrl)
          const duration = await readAudioDuration(objectUrl)

          return createLocalTrack({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            file,
            objectUrl,
            duration,
          })
        }),
      )

      const localRecords = importedTracks.map((track, index) => {
        const file = audioFiles[index]

        return {
          id: track.id,
          title: track.title,
          artist: track.artist,
          fileBlob: file,
          duration: track.duration ?? 0,
          sizeBytes: track.sizeBytes ?? file.size,
          createdAt: Date.now() + index,
        }
      })

      await saveLocalTracks(localRecords)

      if (tracks.length === 0) {
        setCurrentTrackIndex(0)
      }

      setTracks((prev) => [...prev, ...importedTracks])

      setActiveScreen('library')
    },
    [tracks.length],
  )

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
    const onLoadedMetadata = () => {
      const loadedDuration = audioElement.duration || 0
      setDuration(loadedDuration)

      if (
        pendingResumeTimeRef.current > 0 &&
        currentTrack?.id &&
        currentTrack.id === pendingResumeTrackIdRef.current
      ) {
        const safeResumeTime = Math.min(
          pendingResumeTimeRef.current,
          Math.max(loadedDuration - 0.5, 0),
        )
        audioElement.currentTime = safeResumeTime
        setCurrentTime(safeResumeTime)
        pendingResumeTimeRef.current = 0
      }
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
  }, [repeatMode, tracks.length, getNextIndex, currentTrack?.id])

  const roundedCurrentTime = Math.floor(currentTime)

  useEffect(() => {
    const persistedTrackId =
      currentTrack?.sourceType === 'bundle' ? currentTrack.id : null

    savePlayerSession({
      volume,
      shuffleEnabled,
      repeatMode,
      activeScreen: activeScreen as PlayerScreen,
      currentTrackId: persistedTrackId,
      currentTime: persistedTrackId ? roundedCurrentTime : 0,
    })
  }, [
    volume,
    shuffleEnabled,
    repeatMode,
    activeScreen,
    currentTrack,
    roundedCurrentTime,
  ])

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
            onImportFiles={importLocalFiles}
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
            onImportFiles={importLocalFiles}
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
