import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react'
import { Workspace } from './Workspace'
import { EqualizerPanel } from '../player/EqualizerPanel'
import type { CoverLookupProvider, Track } from '../../types/player'
import type { ScreenKey, ThemeMode } from './layoutTypes'
import type { PlayerScreen } from '../../services/storage/playerSession'
import { AudioEngine } from '../../features/audio/audioEngine'
import './AppShell.css'
import {
  createBundledTrack,
  createPersistedLocalTrack,
  createLocalTrack,
  extractFileMetadata,
} from '../../features/library/trackNormalization'
import { findOnlineCover } from '../../services/covers/onlineCoverLookup'
import { usePlayer } from '../../hooks/usePlayer'
import { useLibrary } from '../../hooks/useLibrary'
import { useSettings } from '../../hooks/useSettings'

const DESKTOP_SPLIT_MEDIA_QUERY = '(min-width: 1360px)'

const initialTracks = [
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
  // Audio Engine singleton instance
  const audioEngineRef = useRef<AudioEngine>(new AudioEngine())
  
  // Local state for all tracks (bundled + imported/restored local)
  const [allTracks, setAllTracks] = useState<Track[]>(initialTracks)
  
  // Initialize consolidated hooks
  const audioPlayer = usePlayer({
    tracks: allTracks,
    initialIsPlaying: false,
    initialVolume: 0.8,
    initialShuffleEnabled: false,
    initialRepeatMode: 'all',
    initialCurrentTrackIndex: 0,
  })

  const libraryState = useLibrary({
    initialTracks,
    initialSearchQuery: '',
    initialArtistFilter: 'all',
    initialLibraryViewMode: 'all',
  })

  const { theme: themeMode, setTheme: setThemeMode } = useSettings()

  // Local state
  const [activeScreen, setActiveScreen] = useState<ScreenKey>('player')
  const [allowOnlineCoverLookup, setAllowOnlineCoverLookup] = useState(false)
  const [coverLookupProvider, setCoverLookupProvider] =
    useState<CoverLookupProvider>('auto')
  
  // Restore saved session data on mount
  useEffect(() => {
    async function restoreSession() {
      const saved = await audioPlayer.restoreSession()
      if (saved) {
        audioPlayer.setVolume(saved.volume)
        audioPlayer.setShuffleEnabled(saved.shuffleEnabled)
        audioPlayer.setRepeatMode(saved.repeatMode)
        setActiveScreen((saved.activeScreen as ScreenKey) ?? 'player')
        setAllowOnlineCoverLookup(saved.allowOnlineCoverLookup)
        setCoverLookupProvider(saved.coverLookupProvider)
      }
      
      const savedFavorites = libraryState.restoreFavorites()
      if (savedFavorites.size > 0) {
        // Update favorites in library state
        savedFavorites.forEach(id => {
          if (!libraryState.favoriteTrackIds.has(id)) {
            libraryState.toggleTrackFavorite(id)
          }
        })
      }
    }
    
    restoreSession().catch(() => {
      // Silently fail
    })
  }, [])
  const [isDesktopSplitMode, setIsDesktopSplitMode] = useState(
    () => {
      if (typeof window === 'undefined') return false
      if (typeof window.matchMedia !== 'function') return false
      return window.matchMedia(DESKTOP_SPLIT_MEDIA_QUERY).matches
    }
  )

  const sidebarFileInputRef = useRef<HTMLInputElement | null>(null)
  const localObjectUrlsRef = useRef<Set<string>>(new Set())

  const screenTitle = activeScreen === 'library' ? 'Library' : activeScreen === 'queue' ? 'Queue' : 'Now Playing'
  const showDiscoveryDashboard = activeScreen === 'library' && !audioPlayer.isPlaying

  // Effect: handle theme changes
  useEffect(() => {
    setThemeMode(themeMode)
  }, [themeMode, setThemeMode])

  // Effect: handle favorites persistence
  useEffect(() => {
    libraryState.persistFavorites(libraryState.favoriteTrackIds)
  }, [libraryState.favoriteTrackIds, libraryState])

  // Effect: handle desktop split mode
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

  // Effect: restore local tracks from IndexedDB
  useEffect(() => {
    let isDisposed = false

    async function restoreLocalTracks() {
      const records = await libraryState.restoreLocalTracks()
      if (isDisposed || records.length === 0) return

      const restoredTracks = records.map((record) => {
        const objectUrl = URL.createObjectURL(record.fileBlob)
        localObjectUrlsRef.current.add(objectUrl)

        return createPersistedLocalTrack({
          record,
          objectUrl,
        })
      })

      setAllTracks((prev) => {
        const existingIds = new Set(prev.map((track) => track.id))
        const uniqueRestored = restoredTracks.filter(
          (track) => !existingIds.has(track.id),
        )

        if (uniqueRestored.length === 0) return prev
        return [...prev, ...uniqueRestored]
      })

      libraryState.setTracks((prev) => {
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
  }, [libraryState])

  // Effect: cleanup local object URLs on unmount
  useEffect(() => {
    return () => {
      localObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      localObjectUrlsRef.current.clear()
    }
  }, [])

  // Effect: persist player session state
  useEffect(() => {
    const roundedCurrentTime = Math.floor(audioPlayer.currentTime)
    audioPlayer.persistPlayerState({
      volume: audioPlayer.volume,
      shuffleEnabled: audioPlayer.shuffleEnabled,
      repeatMode: audioPlayer.repeatMode,
      allowOnlineCoverLookup,
      coverLookupProvider,
      activeScreen: activeScreen as PlayerScreen,
      currentTrackId: audioPlayer.currentTrack?.id ?? null,
      currentTime: audioPlayer.currentTrack?.id ? roundedCurrentTime : 0,
    })
  }, [
    audioPlayer.volume,
    audioPlayer.shuffleEnabled,
    audioPlayer.repeatMode,
    allowOnlineCoverLookup,
    coverLookupProvider,
    activeScreen,
    audioPlayer.currentTrack,
    audioPlayer.currentTime,
    audioPlayer,
  ])

  function toggleThemeMode() {
    const newTheme: ThemeMode = themeMode === 'dark' ? 'light' : 'dark'
    setThemeMode(newTheme)
  }

  async function importLocalFiles(files: File[]) {
    if (files.length === 0) return

    const audioFiles = files.filter((file) => file.type.startsWith('audio/'))
    if (audioFiles.length === 0) return

    try {
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

      await libraryState.persistLocalTracks(localRecords)
      libraryState.importTracks(importedTracks)
      setActiveScreen('library')
    } catch (error) {
      console.error('Failed to import files:', error)
    }
  }

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

  async function clearQueueAndReset() {
    localObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    localObjectUrlsRef.current.clear()

    await libraryState.clearPersistedLocalTracks()

    libraryState.setTracks(initialTracks)
    audioPlayer.setCurrentTrackIndex(0)
    audioPlayer.setCurrentTime(0)
    audioPlayer.setDuration(0)
    audioPlayer.setIsPlaying(false)
  }

  return (
    <main className="app-shell-wrap">
      <audio ref={audioPlayer.audioRef} preload="metadata" />
      <input
        ref={sidebarFileInputRef}
        className="file-input"
        type="file"
        accept="audio/*"
        multiple
        onChange={handleSidebarImportChange}
      />

      <Workspace
        activeScreen={activeScreen}
        themeMode={themeMode}
        libraryViewMode={libraryState.libraryViewMode}
        favoriteCount={libraryState.favoriteTrackIds.size}
        isDesktopSplitMode={isDesktopSplitMode}
        showDiscoveryDashboard={showDiscoveryDashboard}
        screenTitle={screenTitle}
        tracks={libraryState.tracks}
        filteredTracks={libraryState.filteredTracks}
        currentTrack={audioPlayer.currentTrack}
        isPlaying={audioPlayer.isPlaying}
        currentTime={audioPlayer.currentTime}
        duration={audioPlayer.duration}
        volume={audioPlayer.volume}
        shuffleEnabled={audioPlayer.shuffleEnabled}
        repeatMode={audioPlayer.repeatMode}
        allowOnlineCoverLookup={allowOnlineCoverLookup}
        coverLookupProvider={coverLookupProvider}
        artistFilter={libraryState.artistFilter}
        artistOptions={libraryState.artistOptions}
        searchQuery={libraryState.searchQuery}
        isTrackFavorite={(trackId) => libraryState.favoriteTrackIds.has(trackId)}
        onOpenScreen={setActiveScreen}
        onShowAllTracks={() => libraryState.setLibraryViewMode('all')}
        onShowFavorites={() => libraryState.setLibraryViewMode('favorites')}
        onToggleTheme={toggleThemeMode}
        onAddMusic={() => {
          sidebarFileInputRef.current?.click()
        }}
        onSelectTrack={(trackId) => {
          const index = libraryState.selectTrackById(trackId)
          if (index !== null) {
            audioPlayer.selectTrackByIndex(index)
            setActiveScreen('player')
          }
        }}
        onPrev={audioPlayer.prevTrack}
        onTogglePlay={audioPlayer.togglePlay}
        onNext={audioPlayer.nextTrack}
        onSeek={audioPlayer.seekTrack}
        onVolumeChange={audioPlayer.handleVolumeChange}
        onToggleShuffle={audioPlayer.toggleShuffle}
        onCycleRepeat={audioPlayer.cycleRepeat}
        onToggleTrackFavorite={libraryState.toggleTrackFavorite}
        onToggleOnlineCoverLookup={setAllowOnlineCoverLookup}
        onCoverLookupProviderChange={setCoverLookupProvider}
        onSearchChange={libraryState.setSearchQuery}
        onArtistFilterChange={libraryState.setArtistFilter}
        onImportFiles={importLocalFiles}
        onClearQueue={clearQueueAndReset}
      />

      {/* Equalizer Panel - Audio Control Section */}
      {activeScreen === 'player' && audioEngineRef.current && (
        <aside className="equalizer-sidebar">
          {/* eslint-disable-next-line react-hooks/rules-of-hooks */}
          <EqualizerPanel audioEngine={audioEngineRef.current} />
        </aside>
      )}
    </main>
  )
}
