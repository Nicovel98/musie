import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LibraryPanel } from './LibraryPanel'
import type { Track } from '../../types/player'

const tracks: Track[] = []

function renderLibraryPanel(onImportFiles = vi.fn()) {
  return render(
    <LibraryPanel
      tracks={tracks}
      activeTrackId={null}
      allowOnlineCoverLookup={false}
      coverLookupProvider="auto"
      searchQuery=""
      artistFilter="all"
      artistOptions={[]}
      onToggleOnlineCoverLookup={vi.fn()}
      onCoverLookupProviderChange={vi.fn()}
      onSearchChange={vi.fn()}
      onArtistFilterChange={vi.fn()}
      onSelectTrack={vi.fn()}
      onImportFiles={onImportFiles}
    />,
  )
}

describe('LibraryPanel import flow', () => {
  it('imports only audio files from file input', () => {
    const onImportFiles = vi.fn()
    renderLibraryPanel(onImportFiles)

    const fileInput = screen.getByLabelText('Import') as HTMLInputElement
    const audioFile = new File(['audio'], 'track.mp3', { type: 'audio/mpeg' })
    const textFile = new File(['text'], 'notes.txt', { type: 'text/plain' })

    fireEvent.change(fileInput, {
      target: {
        files: [audioFile, textFile],
      },
    })

    expect(onImportFiles).toHaveBeenCalledTimes(1)
    expect(onImportFiles).toHaveBeenCalledWith([audioFile])
  })

  it('imports only audio files from drag and drop', () => {
    const onImportFiles = vi.fn()
    renderLibraryPanel(onImportFiles)

    const dropzone = screen.getByText('Arrastra archivos de audio aqui o usa Import.')
    const audioFile = new File(['audio'], 'track.ogg', { type: 'audio/ogg' })
    const imageFile = new File(['image'], 'cover.png', { type: 'image/png' })

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [audioFile, imageFile],
      },
    })

    expect(onImportFiles).toHaveBeenCalledTimes(1)
    expect(onImportFiles).toHaveBeenCalledWith([audioFile])
  })
})
