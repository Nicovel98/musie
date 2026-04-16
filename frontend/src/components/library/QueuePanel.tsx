import { useMemo, useState } from 'react'
import type { Track } from '../../types/player'

const QUEUE_BATCH_SIZE = 80

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
  const [visibleCount, setVisibleCount] = useState(QUEUE_BATCH_SIZE)

  const visibleTracks = useMemo(
    () => tracks.slice(0, visibleCount),
    [tracks, visibleCount],
  )

  const hiddenCount = Math.max(tracks.length - visibleTracks.length, 0)

  return (
    <section>
      <header className="section-header">
        <h2>Queue</h2>
        <button type="button" onClick={onClearQueue}>
          Clear
        </button>
      </header>

      <ol className="queue-list" aria-label="Playback queue">
        {tracks.length === 0 ? (
          <li className="is-empty">La cola esta vacia.</li>
        ) : null}

        {visibleTracks.map((track) => (
          <li
            key={track.id}
            className={activeTrackId === track.id ? 'is-active' : ''}
            onClick={() => onSelectTrack(track.id)}
          >
            {track.title}
          </li>
        ))}

        {hiddenCount > 0 ? (
          <li className="queue-list-actions">
            <button
              type="button"
              className="load-more-btn"
              onClick={() => setVisibleCount((prev) => prev + QUEUE_BATCH_SIZE)}
            >
              Ver mas en cola ({hiddenCount} restantes)
            </button>
          </li>
        ) : null}
      </ol>
    </section>
  )
}
