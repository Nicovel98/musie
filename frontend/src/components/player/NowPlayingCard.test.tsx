import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NowPlayingCard } from './NowPlayingCard'
import type { Track } from '../../types/player'

const baseTrack: Track = {
  id: 'track-1',
  title: 'Test Song',
  artist: 'Test Artist',
  src: 'blob:test',
  sourceType: 'local',
  duration: 120,
}

describe('NowPlayingCard', () => {
  it('renders fallback text when no track is loaded', () => {
    render(
      <NowPlayingCard
        currentTrack={null}
        isPlaying={false}
        currentTime={0}
        duration={0}
        volume={0.8}
        shuffleEnabled={false}
        repeatMode="off"
        onPrev={vi.fn()}
        onTogglePlay={vi.fn()}
        onNext={vi.fn()}
        onSeek={vi.fn()}
        onVolumeChange={vi.fn()}
        onToggleShuffle={vi.fn()}
        onCycleRepeat={vi.fn()}
      />,
    )

    expect(screen.getByText('Sin pista cargada')).toBeInTheDocument()
    expect(
      screen.getByText('Importa canciones para empezar a reproducir.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reproducir' })).toBeInTheDocument()
  })

  it('calls playback callbacks and updates sliders', () => {
    const onPrev = vi.fn()
    const onTogglePlay = vi.fn()
    const onNext = vi.fn()
    const onSeek = vi.fn()
    const onVolumeChange = vi.fn()

    render(
      <NowPlayingCard
        currentTrack={baseTrack}
        isPlaying={true}
        currentTime={20}
        duration={120}
        volume={0.5}
        shuffleEnabled={false}
        repeatMode="all"
        onPrev={onPrev}
        onTogglePlay={onTogglePlay}
        onNext={onNext}
        onSeek={onSeek}
        onVolumeChange={onVolumeChange}
        onToggleShuffle={vi.fn()}
        onCycleRepeat={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    fireEvent.change(screen.getByLabelText('Track progress'), {
      target: { value: '45' },
    })

    fireEvent.change(screen.getByLabelText('Volume'), {
      target: { value: '0.2' },
    })

    expect(onPrev).toHaveBeenCalledTimes(1)
    expect(onTogglePlay).toHaveBeenCalledTimes(1)
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onSeek).toHaveBeenCalledWith(45)
    expect(onVolumeChange).toHaveBeenCalledWith(0.2)
  })
})
