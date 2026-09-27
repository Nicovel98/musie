/** @vitest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlaybackControls } from './PlaybackControls';

describe('PlaybackControls track navigation', () => {
  it('calls previous and next handlers from the shared controls', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();

    render(
      <PlaybackControls
        isPlaying
        onTogglePlay={vi.fn()}
        onPrev={onPrev}
        onNext={onNext}
        buttonSizeClass="h-8 w-8"
        playButtonSizeClass="h-9 w-9"
        iconSize={16}
        playIconSize={18}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Previous track' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next track' }));

    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
