import type { LibraryViewMode, ScreenKey, ThemeMode } from './layoutTypes'
import './SidebarMenu.css'

type SidebarMenuProps = {
  activeScreen: ScreenKey
  themeMode: ThemeMode
  libraryViewMode: LibraryViewMode
  favoriteCount: number
  onOpenScreen: (screen: ScreenKey) => void
  onShowAllTracks: () => void
  onShowFavorites: () => void
  onToggleTheme: () => void
  onAddMusic: () => void
}

const screenLabels: Record<ScreenKey, string> = {
  library: 'Library',
  player: 'Now Playing',
  queue: 'Queue',
}

const screenIcons: Record<ScreenKey, string> = {
  library: '♫',
  player: '▶',
  queue: '≡',
}

export function SidebarMenu({
  activeScreen,
  themeMode,
  libraryViewMode,
  favoriteCount,
  onOpenScreen,
  onShowAllTracks,
  onShowFavorites,
  onToggleTheme,
  onAddMusic,
}: SidebarMenuProps) {
  const isFavoritesView = libraryViewMode === 'favorites'

  return (
    <aside className="desktop-nav" aria-label="Navegacion principal de escritorio">
      <div className="desktop-brand">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="Musie logo" />
        <div>
          <strong>Musie</strong>
          <span>Music Discovery</span>
        </div>
      </div>

      <div className="desktop-menu">
        <p className="desktop-menu-label">Browse</p>
        <div className="desktop-menu-grid" role="menu">
          <button
            type="button"
            className={activeScreen === 'library' ? 'is-active' : ''}
            onClick={() => {
              onOpenScreen('library')
            }}
          >
            <span aria-hidden="true">{screenIcons.library}</span> {screenLabels.library}
          </button>
          <button
            type="button"
            className={activeScreen === 'player' ? 'is-active' : ''}
            onClick={() => {
              onOpenScreen('player')
            }}
          >
            <span aria-hidden="true">{screenIcons.player}</span> {screenLabels.player}
          </button>
          <button
            type="button"
            className={activeScreen === 'queue' ? 'is-active' : ''}
            onClick={() => {
              onOpenScreen('queue')
            }}
          >
            <span aria-hidden="true">{screenIcons.queue}</span> {screenLabels.queue}
          </button>
        </div>

        <p className="desktop-menu-label">Library</p>
        <div className="desktop-menu-grid" role="menu">
          <button
            type="button"
            className={!isFavoritesView ? 'is-active' : ''}
            onClick={() => {
              onShowAllTracks()
              onOpenScreen('library')
            }}
          >
            <span aria-hidden="true">•</span> Music List
          </button>
          <button
            type="button"
            className={isFavoritesView ? 'is-active' : ''}
            onClick={() => {
              onShowFavorites()
              onOpenScreen('library')
            }}
          >
            <span aria-hidden="true">★</span> Favoritos ({favoriteCount})
          </button>
          <button
            type="button"
            onClick={() => {
              onAddMusic()
            }}
          >
            <span aria-hidden="true">+</span> Agregar musica
          </button>
        </div>

        <p className="desktop-menu-label">Settings</p>
        <div className="desktop-menu-footer">
          <span>Dark mode</span>
          <button
            type="button"
            className={`theme-toggle ${themeMode === 'dark' ? 'is-active' : ''}`}
            onClick={onToggleTheme}
            aria-label={
              themeMode === 'dark'
                ? 'Cambiar a modo claro'
                : 'Cambiar a modo oscuro'
            }
          >
            <span className="theme-toggle-knob" />
          </button>
        </div>
      </div>

      <div className="desktop-nav-footer">
        <button
          type="button"
          className="desktop-back-btn"
          onClick={() => {
            onOpenScreen('player')
          }}
        >
          <span aria-hidden="true">↺</span> Volver al Player
        </button>
      </div>
    </aside>
  )
}
