import { useId, useState, type ChangeEvent, type DragEvent } from 'react'
import type { Track } from '../../types/player'

type LibraryPanelProps = {
  tracks: Track[]
  activeTrackId: string | null
  onSelectTrack: (trackId: string) => void
  onImportFiles: (files: File[]) => void
}

function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function LibraryPanel({
  tracks,
  activeTrackId,
  onSelectTrack,
  onImportFiles,
}: LibraryPanelProps) {
  const fileInputId = useId()
  const [isDragging, setIsDragging] = useState(false)

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) return
    onImportFiles(Array.from(files))
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
    <section>
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

      <ul className="track-list" aria-label="Track list">
        {tracks.map((track) => (
          <li
            key={track.id}
            className={`track-item ${activeTrackId === track.id ? 'is-active' : ''}`}
          >
            <p>{track.title}</p>
            <span>{track.artist}</span>
            <span>{formatDuration(track.duration)}</span>
            <button type="button" onClick={() => onSelectTrack(track.id)}>
              Play
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
