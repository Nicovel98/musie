import type { Track } from '../../types/player'

type QueuePanelProps = {
  tracks: Track[]
  activeTrackId: string | null
  onSelectTrack: (trackId: string) => void
  onClearQueue: () => void
}

export function QueuePanel({
  tracks,
  activeTrackId,
  onSelectTrack,
  onClearQueue,
}: QueuePanelProps) {
  return (
    <section>
      <header className="section-header">
        <h2>Queue</h2>
        <button type="button" onClick={onClearQueue}>
          Clear
        </button>
      </header>

      <ol className="queue-list" aria-label="Playback queue">
        {tracks.map((track) => (
          <li
            key={track.id}
            className={activeTrackId === track.id ? 'is-active' : ''}
            onClick={() => onSelectTrack(track.id)}
          >
            {track.title}
          </li>
        ))}
      </ol>
    </section>
  )
}
