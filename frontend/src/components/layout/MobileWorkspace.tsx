import { LibraryPanel } from '../library/LibraryPanel'
import { QueuePanel } from '../library/QueuePanel'
import { NowPlayingCard } from '../player/NowPlayingCard'
import type { CoverLookupProvider, RepeatMode, Track } from '../../types/player'
import type { ScreenKey } from './layoutTypes'

type MobileWorkspaceProps = {
  activeScreen: ScreenKey
  screenTitle: string
  tracks: Track[]
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  shuffleEnabled: boolean
  repeatMode: RepeatMode
  allowOnlineCoverLookup: boolean
  coverLookupProvider: CoverLookupProvider
  searchQuery: string
  artistFilter: string
  artistOptions: string[]
  isTrackFavorite: (trackId: string) => boolean
  onOpenScreen: (screen: ScreenKey) => void
  onToggleTrackFavorite: (trackId: string) => void
  onToggleOnlineCoverLookup: (enabled: boolean) => void
  onCoverLookupProviderChange: (provider: CoverLookupProvider) => void
  onSearchChange: (value: string) => void
  onArtistFilterChange: (value: string) => void
  onSelectTrack: (trackId: string) => void
  onImportFiles: (files: File[]) => void
  onPrev: () => void
  onTogglePlay: () => void
  onNext: () => void
  onSeek: (value: number) => void
  onVolumeChange: (value: number) => void
  onToggleShuffle: () => void
  onCycleRepeat: () => void
  onClearQueue: () => void
}

export function MobileWorkspace({
  activeScreen,
  screenTitle,
  tracks,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  shuffleEnabled,
  repeatMode,
  allowOnlineCoverLookup,
  coverLookupProvider,
  searchQuery,
  artistFilter,
  artistOptions,
  isTrackFavorite,
  onOpenScreen,
  onToggleTrackFavorite,
  onToggleOnlineCoverLookup,
  onCoverLookupProviderChange,
  onSearchChange,
  onArtistFilterChange,
  onSelectTrack,
  onImportFiles,
  onPrev,
  onTogglePlay,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onCycleRepeat,
  onClearQueue,
}: MobileWorkspaceProps) {
  return (
    <>
      <header className="mobile-header" aria-label="Current screen">
        <p className="mobile-header-eyebrow">Musie</p>
        <h1>{screenTitle}</h1>
      </header>

      <nav className="mobile-nav" aria-label="Primary navigation">
        <button
          type="button"
          className={activeScreen === 'library' ? 'is-active' : ''}
          onClick={() => onOpenScreen('library')}
        >
          Library
        </button>
        <button
          type="button"
          className={activeScreen === 'player' ? 'is-active' : ''}
          onClick={() => onOpenScreen('player')}
        >
          Player
        </button>
        <button
          type="button"
          className={activeScreen === 'queue' ? 'is-active' : ''}
          onClick={() => onOpenScreen('queue')}
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
            allowOnlineCoverLookup={allowOnlineCoverLookup}
            coverLookupProvider={coverLookupProvider}
            searchQuery={searchQuery}
            artistFilter={artistFilter}
            artistOptions={artistOptions}
            isTrackFavorite={isTrackFavorite}
            onToggleTrackFavorite={onToggleTrackFavorite}
            onToggleOnlineCoverLookup={onToggleOnlineCoverLookup}
            onCoverLookupProviderChange={onCoverLookupProviderChange}
            onSearchChange={onSearchChange}
            onArtistFilterChange={onArtistFilterChange}
            onSelectTrack={onSelectTrack}
            onImportFiles={onImportFiles}
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
            onPrev={onPrev}
            onTogglePlay={onTogglePlay}
            onNext={onNext}
            onSeek={onSeek}
            onVolumeChange={onVolumeChange}
            onToggleShuffle={onToggleShuffle}
            onCycleRepeat={onCycleRepeat}
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
            onSelectTrack={onSelectTrack}
            onClearQueue={onClearQueue}
          />
        </aside>
      </section>
    </>
  )
}