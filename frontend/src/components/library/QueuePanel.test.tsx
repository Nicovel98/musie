import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QueuePanel } from './QueuePanel'

describe('QueuePanel', () => {
  it('renders queue rows as buttons and selects track on click', () => {
    const onSelectTrack = vi.fn()

    render(
      <QueuePanel
        tracks={[
          {
            id: 'track-1',
            title: 'Song A',
            artist: 'Artist A',
            src: 'blob:song-a',
          },
        ]}
        activeTrackId={null}
        onSelectTrack={onSelectTrack}
        onClearQueue={vi.fn()}
      />,
    )

    const queueButton = screen.getByRole('button', { name: 'Reproducir Song A' })
    fireEvent.click(queueButton)

    expect(onSelectTrack).toHaveBeenCalledWith('track-1')
  })
})
