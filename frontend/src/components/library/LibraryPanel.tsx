import type { Track } from '../../types/player'

type LibraryPanelProps = {
  tracks: Track[]
  activeTrackId: string | null
  onSelectTrack: (trackId: string) => void
}

export function LibraryPanel({
  tracks,
  activeTrackId,
  onSelectTrack,
}: LibraryPanelProps) {
  return (
    <section>
      <header className="section-header">
        <h2>Library</h2>
        <button type="button">Import</button>
      </header>

      <ul className="track-list" aria-label="Track list">
        {tracks.map((track) => (
          <li
            key={track.id}
            className={`track-item ${activeTrackId === track.id ? 'is-active' : ''}`}
          >
            <p>{track.title}</p>
            <span>{track.artist}</span>
            <button type="button" onClick={() => onSelectTrack(track.id)}>
              Play
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
