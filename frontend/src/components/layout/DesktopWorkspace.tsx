import { DiscoveryDashboard } from '../library/DiscoveryDashboard'
import { LibraryPanel } from '../library/LibraryPanel'
import { QueuePanel } from '../library/QueuePanel'
import { NowPlayingCard } from '../player/NowPlayingCard'
import { SidebarMenu } from './SidebarMenu'
import type { CoverLookupProvider, RepeatMode, Track } from '../../types/player'
import type { LibraryViewMode, ScreenKey, ThemeMode } from './layoutTypes'

type DesktopWorkspaceProps = {
  activeScreen: ScreenKey
  themeMode: ThemeMode
  libraryViewMode: LibraryViewMode
  favoriteCount: number
  isDesktopSplitMode: boolean
  showDiscoveryDashboard: boolean
  tracks: Track[]
  filteredTracks: Track[]
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  shuffleEnabled: boolean
  repeatMode: RepeatMode
  allowOnlineCoverLookup: boolean
  coverLookupProvider: CoverLookupProvider
  artistFilter: string
  artistOptions: string[]
  isTrackFavorite: (trackId: string) => boolean
  onOpenScreen: (screen: ScreenKey) => void
  onShowAllTracks: () => void
  onShowFavorites: () => void
  onToggleTheme: () => void
  onAddMusic: () => void
  onSelectTrack: (trackId: string) => void
  onPrev: () => void
  onTogglePlay: () => void
  onNext: () => void
  onSeek: (value: number) => void
  onVolumeChange: (value: number) => void
  onToggleShuffle: () => void
  onCycleRepeat: () => void
  onToggleTrackFavorite: (trackId: string) => void
  onToggleOnlineCoverLookup: (enabled: boolean) => void
  onCoverLookupProviderChange: (provider: CoverLookupProvider) => void
  onSearchChange: (value: string) => void
  onArtistFilterChange: (value: string) => void
  onImportFiles: (files: File[]) => void
  onClearQueue: () => void
  searchQuery: string
}

export function DesktopWorkspace({
  activeScreen,
  themeMode,
  libraryViewMode,
  favoriteCount,
  isDesktopSplitMode,
  showDiscoveryDashboard,
  tracks,
  filteredTracks,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  shuffleEnabled,
  repeatMode,
  allowOnlineCoverLookup,
  coverLookupProvider,
  artistFilter,
  artistOptions,
  isTrackFavorite,
  onOpenScreen,
  onShowAllTracks,
  onShowFavorites,
  onToggleTheme,
  onAddMusic,
  onSelectTrack,
  onPrev,
  onTogglePlay,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onCycleRepeat,
  onToggleTrackFavorite,
  onToggleOnlineCoverLookup,
  onCoverLookupProviderChange,
  onSearchChange,
  onArtistFilterChange,
  onImportFiles,
  onClearQueue,
  searchQuery,
}: DesktopWorkspaceProps) {
  const desktopContextScreen: ScreenKey =
    activeScreen === 'player' ? 'queue' : activeScreen

  return (
    <section className="app-shell" aria-label="Desktop layout">
      <SidebarMenu
        activeScreen={activeScreen}
        themeMode={themeMode}
        libraryViewMode={libraryViewMode}
        favoriteCount={favoriteCount}
        onOpenScreen={onOpenScreen}
        onShowAllTracks={onShowAllTracks}
        onShowFavorites={onShowFavorites}
        onToggleTheme={onToggleTheme}
        onAddMusic={onAddMusic}
      />

      {showDiscoveryDashboard ? (
        <div className="desktop-discovery-stage" aria-live="polite">
          <DiscoveryDashboard
            tracks={filteredTracks}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onSelectTrack={onSelectTrack}
          />
        </div>
      ) : (
        <div
          className={`desktop-stage ${isDesktopSplitMode ? 'is-split-mode' : ''}`}
          aria-live="polite"
        >
          <div className="desktop-stage-spacer" aria-hidden="true" />

          <section className="desktop-stage-player">
            <section className="desktop-player-panel" aria-label="Now playing">
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

          <section className="desktop-stage-context">
            {desktopContextScreen === 'queue' ? (
              <aside className="panel panel-queue desktop-context-panel" aria-label="Queue">
                <QueuePanel
                  tracks={tracks}
                  activeTrackId={currentTrack?.id ?? null}
                  onSelectTrack={onSelectTrack}
                  onClearQueue={onClearQueue}
                />
              </aside>
            ) : (
              <aside className="panel panel-library desktop-context-panel" aria-label="Library">
                <LibraryPanel
                  tracks={filteredTracks}
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
            )}
          </section>
        </div>
      )}
    </section>
  )
}