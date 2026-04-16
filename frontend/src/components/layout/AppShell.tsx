import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { DesktopWorkspace } from './DesktopWorkspace'
import { MobileWorkspace } from './MobileWorkspace'
import type { CoverLookupProvider, RepeatMode, Track } from '../../types/player'
import type { LibraryViewMode, ScreenKey, ThemeMode } from './layoutTypes'
import './AppShell.css'
import {
  createBundledTrack,
  createPersistedLocalTrack,
  createLocalTrack,
  extractFileMetadata,
} from '../../features/library/trackNormalization'
import { findOnlineCover } from '../../services/covers/onlineCoverLookup'
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

const THEME_STORAGE_KEY = 'musie.theme.v1'
const FAVORITES_STORAGE_KEY = 'musie.favorites.v1'
const DESKTOP_SPLIT_MEDIA_QUERY = '(min-width: 1360px)'

const savedSession = loadPlayerSession()

function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light'

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  return storedTheme === 'light' ? 'light' : 'dark'
}

function getInitialFavoriteTrackIds() {
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

function getInitialDesktopSplitMode() {
  if (typeof window === 'undefined') return false
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia(DESKTOP_SPLIT_MEDIA_QUERY).matches
}

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
  const [allowOnlineCoverLookup, setAllowOnlineCoverLookup] = useState(
    savedSession?.allowOnlineCoverLookup ?? false,
  )
  const [coverLookupProvider, setCoverLookupProvider] =
    useState<CoverLookupProvider>(savedSession?.coverLookupProvider ?? 'auto')
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode)
  const [libraryViewMode, setLibraryViewMode] = useState<LibraryViewMode>('all')
  const [favoriteTrackIds, setFavoriteTrackIds] = useState<Set<string>>(
    getInitialFavoriteTrackIds,
  )
  const [isDesktopSplitMode, setIsDesktopSplitMode] = useState(
    getInitialDesktopSplitMode,
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [artistFilter, setArtistFilter] = useState('all')
  const deferredSearchQuery = useDeferredValue(searchQuery)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sidebarFileInputRef = useRef<HTMLInputElement | null>(null)
  const localObjectUrlsRef = useRef<Set<string>>(new Set())
  const pendingResumeTimeRef = useRef(savedSession?.currentTime ?? 0)
  const pendingResumeTrackIdRef = useRef(savedSession?.currentTrackId ?? null)
  const pendingTrackRestoreRef = useRef(savedSession?.currentTrackId ?? null)

  const currentTrack = tracks[currentTrackIndex] ?? null

  const artistOptions = useMemo(() => {
    return Array.from(new Set(tracks.map((track) => track.artist))).sort(
      (a, b) => a.localeCompare(b),
    )
  }, [tracks])

  const filteredTracks = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase()

    return tracks.filter((track) => {
      const favoriteMatches =
        libraryViewMode === 'all' || favoriteTrackIds.has(track.id)

      if (!favoriteMatches) return false

      const artistMatches =
        artistFilter === 'all' ||
        track.artist.toLowerCase() === artistFilter.toLowerCase()

      if (!artistMatches) return false
      if (!query) return true

      const titleMatches = track.title.toLowerCase().includes(query)
      const artistTextMatches = track.artist.toLowerCase().includes(query)
      return titleMatches || artistTextMatches
    })
  }, [tracks, deferredSearchQuery, artistFilter, libraryViewMode, favoriteTrackIds])

  function toggleThemeMode() {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  function toggleTrackFavorite(trackId: string) {
    setFavoriteTrackIds((prev) => {
      const next = new Set(prev)

      if (next.has(trackId)) {
        next.delete(trackId)
      } else {
        next.add(trackId)
      }

      return next
    })
  }

  const screenTitle = useMemo(() => {
    if (activeScreen === 'library') return 'Library'
    if (activeScreen === 'queue') return 'Queue'
    return 'Now Playing'
  }, [activeScreen])

  const showDiscoveryDashboard = activeScreen === 'library' && !isPlaying

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
    document.documentElement.setAttribute('data-theme', themeMode)
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode)
  }, [themeMode])

  useEffect(() => {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(Array.from(favoriteTrackIds)),
    )
  }, [favoriteTrackIds])

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia(DESKTOP_SPLIT_MEDIA_QUERY)

    const updateDesktopMode = (event: MediaQueryListEvent) => {
      setIsDesktopSplitMode(event.matches)
    }

    mediaQuery.addEventListener('change', updateDesktopMode)

    return () => {
      mediaQuery.removeEventListener('change', updateDesktopMode)
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

  useEffect(() => {
    const pendingTrackId = pendingTrackRestoreRef.current
    if (!pendingTrackId || tracks.length === 0) return

    const resumedTrackIndex = tracks.findIndex((track) => track.id === pendingTrackId)
    if (resumedTrackIndex === -1) return

    setCurrentTrackIndex(resumedTrackIndex)
    pendingTrackRestoreRef.current = null
  }, [tracks])

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
          const metadata = await extractFileMetadata(file)
          const onlineCover =
            !metadata.coverDataUrl && allowOnlineCoverLookup
              ? await findOnlineCover({
                  title: metadata.title,
                  artist: metadata.artist,
                  provider: coverLookupProvider,
                })
              : undefined

          const mergedMetadata = {
            ...metadata,
            coverDataUrl: metadata.coverDataUrl ?? onlineCover?.coverUrl,
            coverSource: metadata.coverSource ?? onlineCover?.source,
          }

          return createLocalTrack({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            file,
            objectUrl,
            duration,
            metadata: mergedMetadata,
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
          coverDataUrl: track.coverUrl,
          coverSource: track.coverSource,
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
    [tracks.length, allowOnlineCoverLookup, coverLookupProvider],
  )

  function handleSidebarImportChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) return

    const audioFiles = Array.from(files).filter((file) =>
      file.type.startsWith('audio/'),
    )
    if (audioFiles.length === 0) {
      event.target.value = ''
      return
    }

    importLocalFiles(audioFiles)
    event.target.value = ''
  }

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
    const persistedTrackId = currentTrack?.id ?? null

    savePlayerSession({
      volume,
      shuffleEnabled,
      repeatMode,
      allowOnlineCoverLookup,
      coverLookupProvider,
      activeScreen: activeScreen as PlayerScreen,
      currentTrackId: persistedTrackId,
      currentTime: persistedTrackId ? roundedCurrentTime : 0,
    })
  }, [
    volume,
    shuffleEnabled,
    repeatMode,
    allowOnlineCoverLookup,
    coverLookupProvider,
    activeScreen,
    currentTrack,
    roundedCurrentTime,
  ])

  return (
    <main className="app-shell-wrap">
      <audio ref={audioRef} preload="metadata" />
      <input
        ref={sidebarFileInputRef}
        className="file-input"
        type="file"
        accept="audio/*"
        multiple
        onChange={handleSidebarImportChange}
      />

      <MobileWorkspace
        activeScreen={activeScreen}
        screenTitle={screenTitle}
        tracks={filteredTracks}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        shuffleEnabled={shuffleEnabled}
        repeatMode={repeatMode}
        allowOnlineCoverLookup={allowOnlineCoverLookup}
        coverLookupProvider={coverLookupProvider}
        searchQuery={searchQuery}
        artistFilter={artistFilter}
        artistOptions={artistOptions}
        isTrackFavorite={(trackId) => favoriteTrackIds.has(trackId)}
        onOpenScreen={setActiveScreen}
        onToggleTrackFavorite={toggleTrackFavorite}
        onToggleOnlineCoverLookup={setAllowOnlineCoverLookup}
        onCoverLookupProviderChange={setCoverLookupProvider}
        onSearchChange={setSearchQuery}
        onArtistFilterChange={setArtistFilter}
        onSelectTrack={selectTrackById}
        onImportFiles={importLocalFiles}
        onPrev={prevTrack}
        onTogglePlay={togglePlay}
        onNext={nextTrack}
        onSeek={seekTrack}
        onVolumeChange={handleVolumeChange}
        onToggleShuffle={toggleShuffle}
        onCycleRepeat={cycleRepeat}
        onClearQueue={clearQueue}
      />

      <DesktopWorkspace
        activeScreen={activeScreen}
        themeMode={themeMode}
        libraryViewMode={libraryViewMode}
        favoriteCount={favoriteTrackIds.size}
        isDesktopSplitMode={isDesktopSplitMode}
        showDiscoveryDashboard={showDiscoveryDashboard}
        tracks={tracks}
        filteredTracks={filteredTracks}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        shuffleEnabled={shuffleEnabled}
        repeatMode={repeatMode}
        allowOnlineCoverLookup={allowOnlineCoverLookup}
        coverLookupProvider={coverLookupProvider}
        artistFilter={artistFilter}
        artistOptions={artistOptions}
        isTrackFavorite={(trackId) => favoriteTrackIds.has(trackId)}
        onOpenScreen={setActiveScreen}
        onShowAllTracks={() => setLibraryViewMode('all')}
        onShowFavorites={() => setLibraryViewMode('favorites')}
        onToggleTheme={toggleThemeMode}
        onAddMusic={() => {
          sidebarFileInputRef.current?.click()
        }}
        onSelectTrack={selectTrackById}
        onPrev={prevTrack}
        onTogglePlay={togglePlay}
        onNext={nextTrack}
        onSeek={seekTrack}
        onVolumeChange={handleVolumeChange}
        onToggleShuffle={toggleShuffle}
        onCycleRepeat={cycleRepeat}
        onToggleTrackFavorite={toggleTrackFavorite}
        onToggleOnlineCoverLookup={setAllowOnlineCoverLookup}
        onCoverLookupProviderChange={setCoverLookupProvider}
        onSearchChange={setSearchQuery}
        onArtistFilterChange={setArtistFilter}
        onImportFiles={importLocalFiles}
        onClearQueue={clearQueue}
        searchQuery={searchQuery}
      />
    </main>
  )
}
