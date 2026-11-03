/** @vitest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const playerBarProbe = vi.hoisted(() => ({
  playPreviousTrack: vi.fn(),
  playNextTrack: vi.fn(),
  togglePlay: vi.fn(),
  setVolume: vi.fn(),
  toggleTrackFavorite: vi.fn(),
  playbackError: null as string | null,
}));

vi.mock('../store/usePlayerStore', () => ({
  usePlayerStore: (selector: (state: unknown) => unknown) =>
    selector({
      currentTrack: {
        id: 'track-1',
        title: 'Track 1',
        artist: 'Artist',
        coverUrl: '/cover.jpg',
      },
      playbackError: playerBarProbe.playbackError,
      favoriteTrackIds: [],
      isPlaying: true,
      togglePlay: playerBarProbe.togglePlay,
      seek: 10,
      duration: 180,
      fastSeek: vi.fn(),
      volume: 0.5,
      setVolume: playerBarProbe.setVolume,
      playPreviousTrack: playerBarProbe.playPreviousTrack,
      playNextTrack: playerBarProbe.playNextTrack,
      toggleTrackFavorite: playerBarProbe.toggleTrackFavorite,
    }),
}));

vi.mock('../hooks/useScrubSeeking', () => ({
  useScrubSeeking: () => ({
    handleSeekChange: vi.fn(),
    handleScrubStart: vi.fn(),
    handleScrubEnd: vi.fn(),
  }),
}));

import { PlayerBar } from './PlayerBar';

describe('PlayerBar track navigation', () => {
  it('connects desktop previous and next buttons to the store', () => {
    render(<PlayerBar />);

    const previousButtons = screen.getAllByRole('button', { name: 'Previous track' });
    const nextButtons = screen.getAllByRole('button', { name: 'Next track' });

    fireEvent.click(previousButtons[1]);
    fireEvent.click(nextButtons[1]);

    expect(playerBarProbe.playPreviousTrack).toHaveBeenCalledTimes(1);
    expect(playerBarProbe.playNextTrack).toHaveBeenCalledTimes(1);
  });

  it('exposes retry and skip actions when playback fails', () => {
    vi.mocked(playerBarProbe.togglePlay).mockClear();
    vi.mocked(playerBarProbe.playNextTrack).mockClear();
    playerBarProbe.playbackError = 'No se pudo reproducir esta canción.';
    render(<PlayerBar />);

    const retryButtons = screen.getAllByRole('button', { name: 'Reintentar reproducción' });
    const skipButtons = screen.getAllByRole('button', { name: 'Saltar pista dañada' });

    fireEvent.click(retryButtons[0]);
    fireEvent.click(skipButtons[0]);

    expect(playerBarProbe.togglePlay).toHaveBeenCalledTimes(1);
    expect(playerBarProbe.playNextTrack).toHaveBeenCalledTimes(1);
    playerBarProbe.playbackError = null;
  });
});
