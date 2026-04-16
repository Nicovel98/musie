import type { Track } from '../../types/player'
import './DiscoveryDashboard.css'

type DiscoveryDashboardProps = {
  tracks: Track[]
  searchQuery: string
  onSearchChange: (value: string) => void
  onSelectTrack: (trackId: string) => void
}

function getTrackSubtitle(track: Track) {
  return track.artist
}

export function DiscoveryDashboard({
  tracks,
  searchQuery,
  onSearchChange,
  onSelectTrack,
}: DiscoveryDashboardProps) {
  const trendingTracks = tracks.slice(0, 4)
  const cardTracks = tracks.slice(0, 12)
  const hasTracks = tracks.length > 0

  return (
    <section className="discovery-shell" aria-label="Music discovery dashboard">
      <header className="discovery-topbar">
        <div className="discovery-search-wrap">
          <span className="discovery-search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M10.5 4a6.5 6.5 0 1 0 4.07 11.57l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" />
            </svg>
          </span>
          <input
            type="search"
            className="discovery-search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search artists, albums, or tracks..."
            aria-label="Search artists, albums, or tracks"
          />
        </div>

        <div className="discovery-profile" aria-label="Profile and notifications">
          <button type="button" className="discovery-icon-button" aria-label="Notifications">
            <span aria-hidden="true">🔔</span>
          </button>
          <div className="discovery-profile-chip">
            <div className="discovery-avatar" aria-hidden="true">
              A
            </div>
            <span>Alex</span>
          </div>
        </div>
      </header>

      <section className="discovery-section">
        <div className="discovery-section-header">
          <h2>Trending Now</h2>
          <span>{tracks.length} tracks</span>
        </div>

        {hasTracks ? (
          <div className="discovery-trending-scroller" aria-label="Trending albums">
            {trendingTracks.map((track) => (
              <article key={track.id} className="trending-card">
                <div className="trending-artwork">
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt={`Cover de ${track.title}`} loading="lazy" />
                  ) : (
                    <div className="trending-artwork-placeholder" aria-hidden="true">
                      <span>{track.title.slice(0, 1)}</span>
                    </div>
                  )}
                  <button type="button" onClick={() => onSelectTrack(track.id)}>
                    Play
                  </button>
                </div>
                <div className="trending-copy">
                  <h3>{track.title}</h3>
                  <p>{getTrackSubtitle(track)}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="discovery-empty-state">
            <h3>No tracks found</h3>
            <p>Import music or clear the search field to populate this discovery view.</p>
          </div>
        )}
      </section>

      <section className="discovery-section">
        <div className="discovery-section-header">
          <h2>Library</h2>
          <span>Quick play cards</span>
        </div>

        {hasTracks ? (
          <div className="discovery-grid">
            {cardTracks.map((track) => (
              <article key={track.id} className="discovery-card">
                <div className="discovery-card-artwork">
                  {track.coverUrl ? (
                    <img src={track.coverUrl} alt={`Cover de ${track.title}`} loading="lazy" />
                  ) : (
                    <div className="discovery-card-placeholder" aria-hidden="true">
                      <span>{track.title.slice(0, 1)}</span>
                    </div>
                  )}
                  <button type="button" onClick={() => onSelectTrack(track.id)}>
                    Quick Play
                  </button>
                </div>
                <div className="discovery-card-meta">
                  <h3>{track.title}</h3>
                  <p>{track.artist}</p>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  )
}
