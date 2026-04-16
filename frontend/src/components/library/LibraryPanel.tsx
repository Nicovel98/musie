import {
  useId,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import type { CoverLookupProvider, Track } from '../../types/player'
import './LibraryPanel.css'

type LibraryPanelProps = {
  tracks: Track[]
  activeTrackId: string | null
  allowOnlineCoverLookup: boolean
  coverLookupProvider: CoverLookupProvider
  searchQuery: string
  artistFilter: string
  artistOptions: string[]
  isTrackFavorite: (trackId: string) => boolean
  onToggleTrackFavorite: (trackId: string) => void
  onToggleOnlineCoverLookup: (enabled: boolean) => void
  onCoverLookupProviderChange: (provider: CoverLookupProvider) => void
  onSearchChange: (value: string) => void
  onArtistFilterChange: (value: string) => void
  onSelectTrack: (trackId: string) => void
  onImportFiles: (files: File[]) => void
}

function formatCoverSource(track: Track) {
  if (!track.coverUrl || !track.coverSource) return 'Portada: sin portada'
  if (track.coverSource === 'embedded') return 'Portada: embebida'
  return 'Portada: online'
}

function getCoverBadgeCode(track: Track) {
  if (!track.coverUrl || !track.coverSource) return 'NONE'
  return track.coverSource === 'embedded' ? 'EMB' : 'WEB'
}

function getCoverBadgeClass(track: Track) {
  if (!track.coverUrl || !track.coverSource) return 'is-none'
  return track.coverSource === 'embedded' ? 'is-embedded' : 'is-online'
}

function getCoverBadgeTitle(track: Track) {
  if (!track.coverUrl || !track.coverSource) {
    return 'Sin portada disponible'
  }

  return track.coverSource === 'embedded'
    ? 'Extraida del archivo de audio'
    : 'Obtenida por busqueda online'
}

function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const TRACK_BATCH_SIZE = 60

export function LibraryPanel({
  tracks,
  activeTrackId,
  allowOnlineCoverLookup,
  coverLookupProvider,
  searchQuery,
  artistFilter,
  artistOptions,
  isTrackFavorite,
  onToggleTrackFavorite,
  onToggleOnlineCoverLookup,
  onCoverLookupProviderChange,
  onSearchChange,
  onArtistFilterChange,
  onSelectTrack,
  onImportFiles,
}: LibraryPanelProps) {
  const fileInputId = useId()
  const [isDragging, setIsDragging] = useState(false)
  const [visibleCount, setVisibleCount] = useState(TRACK_BATCH_SIZE)

  const visibleTracks = useMemo(
    () => tracks.slice(0, visibleCount),
    [tracks, visibleCount],
  )

  const hiddenCount = Math.max(tracks.length - visibleTracks.length, 0)

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) return

    const audioFiles = Array.from(files).filter((file) =>
      file.type.startsWith('audio/'),
    )
    if (audioFiles.length === 0) {
      event.target.value = ''
      return
    }

    onImportFiles(audioFiles)
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith('audio/'),
    )
    if (droppedFiles.length === 0) return
    onImportFiles(droppedFiles)
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave() {
    setIsDragging(false)
  }

  return (
    <section className="library-panel">
      <header className="section-header">
        <h2>Library</h2>
        <label className="import-label" htmlFor={fileInputId}>
          Import
        </label>
        <input
          id={fileInputId}
          className="file-input"
          type="file"
          accept="audio/*"
          multiple
          onChange={handleInputChange}
        />
      </header>

      <div
        className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        Arrastra archivos de audio aqui o usa Import.
      </div>

      <div className="library-filters" aria-label="Library filters">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por titulo o artista"
        />

        <select
          value={artistFilter}
          onChange={(event) => onArtistFilterChange(event.target.value)}
        >
          <option value="all">Todos los artistas</option>
          {artistOptions.map((artist) => (
            <option key={artist} value={artist}>
              {artist}
            </option>
          ))}
        </select>

        <label className="consent-row">
          <input
            type="checkbox"
            checked={allowOnlineCoverLookup}
            onChange={(event) =>
              onToggleOnlineCoverLookup(event.target.checked)
            }
          />
          Buscar portada online si no existe en el archivo.
        </label>

        <p className="consent-note">
          Solo se consulta titulo y artista cuando este permiso esta activo.
        </p>

        <label className="provider-row">
          Proveedor de busqueda
          <select
            value={coverLookupProvider}
            onChange={(event) =>
              onCoverLookupProviderChange(
                event.target.value as CoverLookupProvider,
              )
            }
            disabled={!allowOnlineCoverLookup}
          >
            <option value="auto">Auto (iTunes + MusicBrainz)</option>
            <option value="itunes">Solo iTunes</option>
            <option value="musicbrainz">Solo MusicBrainz</option>
          </select>
        </label>
      </div>

      <ul className="track-list" aria-label="Track list">
        {tracks.length === 0 ? (
          <li className="track-item track-item-empty">
            <p>No hay canciones cargadas</p>
            <span>Usa Import o arrastra archivos de audio para empezar.</span>
          </li>
        ) : null}

        {visibleTracks.map((track) => (
          <li
            key={track.id}
            className={`track-item ${activeTrackId === track.id ? 'is-active' : ''}`}
          >
            <button
              type="button"
              className={`favorite-toggle ${isTrackFavorite(track.id) ? 'is-favorite' : ''}`}
              aria-label={
                isTrackFavorite(track.id)
                  ? 'Quitar de favoritos'
                  : 'Agregar a favoritos'
              }
              onClick={() => onToggleTrackFavorite(track.id)}
            >
              {isTrackFavorite(track.id) ? '★' : '☆'}
            </button>

            {track.coverUrl ? (
              <img
                className="track-cover"
                src={track.coverUrl}
                alt="Track cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div
                className="track-cover track-cover-placeholder"
                aria-hidden="true"
              />
            )}
            <p>{track.title}</p>
            <span>{track.artist}</span>
            <span>{formatDuration(track.duration)}</span>
            <div className="cover-source-row">
              <span className="cover-source">{formatCoverSource(track)}</span>
              <span
                className={`cover-badge ${getCoverBadgeClass(track)}`}
                title={getCoverBadgeTitle(track)}
                aria-label={getCoverBadgeTitle(track)}
              >
                {getCoverBadgeCode(track)}
              </span>
            </div>
            <button type="button" onClick={() => onSelectTrack(track.id)}>
              Play
            </button>
          </li>
        ))}

        {hiddenCount > 0 ? (
          <li className="track-list-actions">
            <button
              type="button"
              className="load-more-btn"
              onClick={() => setVisibleCount((prev) => prev + TRACK_BATCH_SIZE)}
            >
              Cargar mas ({hiddenCount} restantes)
            </button>
          </li>
        ) : null}
      </ul>
    </section>
  )
}
