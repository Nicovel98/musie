/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const coverSearchProbe = vi.hoisted(() => ({
  findAutomaticCoverOptions: vi.fn(),
  updateTrackMetadata: vi.fn(),
  onClose: vi.fn(),
}));

vi.mock('../store/trackMetadata', () => ({
  findAutomaticCoverOptions: coverSearchProbe.findAutomaticCoverOptions,
  downloadAutomaticCover: vi.fn(),
  getYouTubeThumbnail: vi.fn(),
}));

import { CoverSearchModal } from './CoverSearchModal';

const track = {
  id: 'track-1',
  title: 'Canción móvil',
  artist: 'Artista',
  coverUrl: '/cover.jpg',
  audioUrl: '/audio.mp3',
};

describe('CoverSearchModal mobile interactions', () => {
  beforeAll(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('keeps focus inside the modal and closes from Escape', async () => {
    coverSearchProbe.findAutomaticCoverOptions.mockResolvedValue([]);
    render(
      <CoverSearchModal
        track={track}
        onClose={coverSearchProbe.onClose}
        updateTrackMetadata={coverSearchProbe.updateTrackMetadata}
      />
    );

    const closeButton = await screen.findByRole('button', { name: 'Close cover choices' });
    expect(document.activeElement).toBe(closeButton);

    fireEvent.keyDown(closeButton, { key: 'Escape' });
    expect(coverSearchProbe.onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the mobile backdrop is pressed, but not when the dialog is pressed', async () => {
    coverSearchProbe.findAutomaticCoverOptions.mockResolvedValue([]);
    const { container } = render(
      <CoverSearchModal
        track={track}
        onClose={coverSearchProbe.onClose}
        updateTrackMetadata={coverSearchProbe.updateTrackMetadata}
      />
    );

    await waitFor(() =>
      expect(screen.queryByText('Buscando portadas automáticamente...')).toBeNull()
    );

    const backdrop = container.firstElementChild;
    const dialog = screen.getByRole('dialog');
    expect(backdrop).not.toBeNull();

    fireEvent.mouseDown(dialog);
    expect(coverSearchProbe.onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(backdrop as HTMLElement);
    expect(coverSearchProbe.onClose).toHaveBeenCalledTimes(1);
  });
});
