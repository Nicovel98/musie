import { DiscoveryDashboard } from '../library/DiscoveryDashboard'
import { LibraryPanel } from '../library/LibraryPanel'
import { QueuePanel } from '../library/QueuePanel'
import { NowPlayingCard } from '../player/NowPlayingCard'
import type { CoverLookupProvider, RepeatMode, Track } from '../../types/player'
import type { LibraryViewMode, ScreenKey, ThemeMode } from './layoutTypes'
import './Workspace.css'

/**
 * Responsive workspace component that consolidates Desktop and Mobile layouts
 */
type WorkspaceProps = {
  // State
  activeScreen: ScreenKey
  themeMode: ThemeMode
  libraryViewMode: LibraryViewMode
  favoriteCount: number
  isDesktopSplitMode: boolean
  showDiscoveryDashboard: boolean
  screenTitle: string

  // Data
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
  searchQuery: string

  // Predicates
  isTrackFavorite: (trackId: string) => boolean

  // Callbacks
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
}

export function Workspace({
  activeScreen,
  themeMode,
  favoriteCount,
  isDesktopSplitMode,
  showDiscoveryDashboard,
  screenTitle,
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
  searchQuery,
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
}: WorkspaceProps) {
  const desktopContextScreen: ScreenKey =
    activeScreen === 'player' ? 'queue' : activeScreen

  return (
    <>
      {/* Desktop Layout: Sidebar + Main Content */}
      <section className="desktop-layout">
        {/* Sidebar Navigation - Desktop Only */}
        <aside className="sidebar-menu" aria-label="Navigation sidebar">
          <div className="sidebar-branding">
            <p className="sidebar-branding-label">Musie</p>
          </div>

          <nav className="sidebar-browse">
            <button
              type="button"
              className={`sidebar-btn ${activeScreen === 'player' ? 'is-active' : ''}`}
              onClick={() => onOpenScreen('player')}
            >
              Now Playing
            </button>
            <button
              type="button"
              className={`sidebar-btn ${activeScreen === 'library' ? 'is-active' : ''}`}
              onClick={() => onOpenScreen('library')}
            >
              Library
            </button>
            <button
              type="button"
              className={`sidebar-btn ${activeScreen === 'queue' ? 'is-active' : ''}`}
              onClick={() => onOpenScreen('queue')}
            >
              Queue
            </button>
          </nav>

          <nav className="sidebar-library">
            <button
              type="button"
              className="sidebar-btn"
              onClick={onShowAllTracks}
            >
              All Tracks
            </button>
            <button
              type="button"
              className="sidebar-btn"
              onClick={onShowFavorites}
            >
              Favorites <span className="favorites-count">{favoriteCount}</span>
            </button>
            <button
              type="button"
              className="sidebar-btn sidebar-btn-add"
              onClick={onAddMusic}
            >
              + Add Music
            </button>
          </nav>

          <nav className="sidebar-settings">
            <button
              type="button"
              className="sidebar-btn"
              onClick={onToggleTheme}
              title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}
            >
              {themeMode === 'dark' ? '☀️' : '🌙'} {themeMode === 'dark' ? 'Light' : 'Dark'}
            </button>
          </nav>

          <footer className="sidebar-footer">
            <button
              type="button"
              className="sidebar-btn"
              onClick={() => onOpenScreen('player')}
            >
              ← Back to Player
            </button>
          </footer>
        </aside>

        {/* Main Content Area - Desktop */}
        <main className="desktop-main">
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
        </main>
      </section>

      {/* Mobile Layout: Tabbed Navigation */}
      <section className="mobile-layout">
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
      </section>
    </>
  )
}
