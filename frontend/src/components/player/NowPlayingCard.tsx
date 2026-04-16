import type { ReactNode } from 'react'
import type { RepeatMode, Track } from '../../types/player'
import './nowPlayingCard.css'

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

function formatCoverSourceLabel(track: Track | null) {
  if (!track?.coverUrl || !track.coverSource) return 'Portada: sin portada'
  if (track.coverSource === 'embedded') return 'Portada embebida en archivo'
  return 'Portada encontrada online'
}

function getCoverBadgeCode(track: Track | null) {
  if (!track?.coverUrl || !track.coverSource) return 'NONE'
  return track.coverSource === 'embedded' ? 'EMB' : 'WEB'
}

function getCoverBadgeClass(track: Track | null) {
  if (!track?.coverUrl || !track.coverSource) return 'is-none'
  return track.coverSource === 'embedded' ? 'is-embedded' : 'is-online'
}

function getCoverBadgeTitle(track: Track | null) {
  if (!track?.coverUrl || !track.coverSource) {
    return 'Sin portada disponible'
  }

  return track.coverSource === 'embedded'
    ? 'Extraida del archivo de audio'
    : 'Obtenida por busqueda online'
}

function IconButton({
  label,
  children,
  onClick,
  active,
  size = 'md',
}: {
  label: string
  children: ReactNode
  onClick: () => void
  active?: boolean
  size?: 'md' | 'lg'
}) {
  return (
    <button
      type="button"
      className={`player-icon-button ${size === 'lg' ? 'is-large' : ''} ${active ? 'is-active' : ''}`}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  )
}

function PlayIcon({ paused }: { paused: boolean }) {
  if (paused) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 5v14l11-7z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h4v14H7zm6 0h4v14h-4z" />
    </svg>
  )
}

function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6h2v12H6zm3.5 6L18 6v12z" />
    </svg>
  )
}

function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 6h2v12h-2zm-9 0 8.5 6L7 18z" />
    </svg>
  )
}

function ShuffleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 3h5v5h-2V6.4l-4.3 4.3-1.4-1.4L17.6 5H16zm1.9 12.6 1.4 1.4L21 14.3v4.7h-4.7l2.6-2.6-1.4-1.4-4 4a1 1 0 0 1-.7.3H5v-2h7.8c.2 0 .4-.1.6-.3zM5 5h4.2c.3 0 .5.1.7.3l2.9 2.9-1.4 1.4-2.6-2.6H5zm0 14h4.8c.3 0 .5-.1.7-.3l8.7-8.7 1.4 1.4-8.7 8.7c-.5.5-1.2.9-2 .9H5z" />
    </svg>
  )
}

function RepeatIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7h11l-2-2 1.4-1.4L22.8 7l-5.4 5.4L16 11l2-2H7a4 4 0 0 0-4 4v1H1v-1a6 6 0 0 1 6-6zm10 10H6l2 2-1.4 1.4L1.2 17l5.4-5.4L8 13l-2 2h11a4 4 0 0 0 4-4v-1h2v1a6 6 0 0 1-6 6z" />
    </svg>
  )
}

function VolumeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 5 6.4 9H3v6h3.4L11 19zM16 8.2a5 5 0 0 1 0 7.6l-1.4-1.4a3 3 0 0 0 0-4.8zM18.8 5.4a9 9 0 0 1 0 13.2l-1.4-1.4a7 7 0 0 0 0-10.4z" />
    </svg>
  )
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
    <article className="now-playing-dock">
      <header className="player-header">
        <p className="eyebrow">Now Playing</p>
        <h1>Musie</h1>
      </header>

      <div className="player-visual">
        <div className="cover" role="img" aria-label="Album cover">
          {currentTrack?.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt={`Cover de ${currentTrack.title}`}
            />
          ) : null}
        </div>

        <div className="track-meta">
          <h2>{currentTrack?.title ?? 'Sin pista cargada'}</h2>
          <p>
            {currentTrack?.artist ??
              'Importa canciones para empezar a reproducir.'}
          </p>
          <div className="cover-origin-row">
            <span className="cover-origin">
              {formatCoverSourceLabel(currentTrack)}
            </span>
            <span
              className={`cover-badge ${getCoverBadgeClass(currentTrack)}`}
              title={getCoverBadgeTitle(currentTrack)}
              aria-label={getCoverBadgeTitle(currentTrack)}
            >
              {getCoverBadgeCode(currentTrack)}
            </span>
          </div>
        </div>
      </div>

      <div className="player-progress-block">
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

      <div className="player-controls" aria-label="Playback controls">
        <IconButton label="Anterior" onClick={onPrev}>
          <PrevIcon />
        </IconButton>
        <IconButton
          label={isPlaying ? 'Pausar' : 'Reproducir'}
          onClick={onTogglePlay}
          size="lg"
          active={isPlaying}
        >
          <PlayIcon paused={!isPlaying} />
        </IconButton>
        <IconButton label="Siguiente" onClick={onNext}>
          <NextIcon />
        </IconButton>
        <IconButton
          label="Aleatorio"
          onClick={onToggleShuffle}
          active={shuffleEnabled}
        >
          <ShuffleIcon />
        </IconButton>
        <IconButton label={repeatLabel} onClick={onCycleRepeat}>
          <RepeatIcon />
        </IconButton>
      </div>

      <div className="player-volume-row" aria-label="Volume control">
        <label htmlFor="volume-slider">
          <VolumeIcon />
          <span>Volume</span>
        </label>
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
