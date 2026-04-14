import type { RepeatMode, Track } from '../../types/player'

type NowPlayingCardProps = {
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  shuffleEnabled: boolean
  repeatMode: RepeatMode
  onPrev: () => void
  onTogglePlay: () => void
  onNext: () => void
  onSeek: (value: number) => void
  onVolumeChange: (value: number) => void
  onToggleShuffle: () => void
  onCycleRepeat: () => void
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function NowPlayingCard({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  shuffleEnabled,
  repeatMode,
  onPrev,
  onTogglePlay,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onCycleRepeat,
}: NowPlayingCardProps) {
  const repeatLabel =
    repeatMode === 'off'
      ? 'Repeat Off'
      : repeatMode === 'all'
        ? 'Repeat All'
        : 'Repeat One'

  return (
    <article className="now-playing-card">
      <header>
        <p className="eyebrow">Now Playing</p>
        <h1>Musie</h1>
      </header>

      <div className="cover" role="img" aria-label="Album cover placeholder" />

      <div className="track-meta">
        <h2>{currentTrack?.title ?? 'Sin pista cargada'}</h2>
        <p>
          {currentTrack?.artist ??
            'Importa canciones para empezar a reproducir.'}
        </p>
      </div>

      <div className="progress-block">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Track progress"
        />
        <div className="time-row" aria-label="Current time and duration">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="controls" aria-label="Playback controls">
        <button type="button" onClick={onPrev}>
          Prev
        </button>
        <button type="button" onClick={onTogglePlay}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={onNext}>
          Next
        </button>
      </div>

      <div
        className="secondary-controls"
        aria-label="Advanced playback controls"
      >
        <button
          type="button"
          className={shuffleEnabled ? 'is-active' : ''}
          onClick={onToggleShuffle}
        >
          Shuffle
        </button>

        <button type="button" onClick={onCycleRepeat}>
          {repeatLabel}
        </button>
      </div>

      <div className="volume-row" aria-label="Volume control">
        <label htmlFor="volume-slider">Volume</label>
        <input
          id="volume-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
        />
      </div>
    </article>
  )
}
