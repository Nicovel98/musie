import { useMemo, useState } from 'react'
import type { Track } from '../../types/player'
import './QueuePanel.css'

const QUEUE_BATCH_SIZE = 80

type QueuePanelProps = {
  tracks: Track[]
  activeTrackId: string | null
  onSelectTrack: (trackId: string) => void
  onClearQueue: () => void
}

function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
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
    <section className="queue-panel">
      <header className="section-header queue-panel-header">
        <h2>Queue</h2>
        <div className="queue-panel-actions">
          <span className="queue-count-chip">{tracks.length} en cola</span>
          <button
            type="button"
            className="queue-clear-btn"
            onClick={onClearQueue}
            disabled={tracks.length === 0}
          >
            Clear queue
          </button>
        </div>
      </header>

      <ol className="queue-list queue-panel-list" aria-label="Playback queue">
        {tracks.length === 0 ? (
          <li className="is-empty">La cola esta vacia.</li>
        ) : null}

        {visibleTracks.map((track) => (
          <li
            key={track.id}
            className={activeTrackId === track.id ? 'is-active' : ''}
          >
            <button
              type="button"
              className="queue-track-btn"
              onClick={() => onSelectTrack(track.id)}
              aria-label={`Reproducir ${track.title}`}
            >
              <span className="queue-track-title">{track.title}</span>
              <span className="queue-track-meta">
                {track.artist} · {formatDuration(track.duration)}
              </span>
            </button>
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
