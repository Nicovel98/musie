/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useFocusTrap } from './useFocusTrap';
import { useRef } from 'react';

const FocusTrapFixture = ({ isOpen = true }: { isOpen?: boolean }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, isOpen);

  return (
    <div>
      <button type="button">Open modal</button>
      <div ref={dialogRef} role="dialog" tabIndex={-1}>
        <button type="button">First action</button>
        <button type="button">Last action</button>
      </div>
    </div>
  );
};

describe('useFocusTrap', () => {
  afterEach(() => {
    cleanup();
  });

  it('focuses the first action and wraps Tab in both directions', () => {
    render(<FocusTrapFixture />);

    const firstAction = screen.getByRole('button', { name: 'First action' });
    const lastAction = screen.getByRole('button', { name: 'Last action' });

    expect(document.activeElement).toBe(firstAction);

    fireEvent.keyDown(lastAction, { key: 'Tab' });
    expect(document.activeElement).toBe(firstAction);

    fireEvent.keyDown(firstAction, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastAction);
  });

  it('restores focus to the previously active element when it closes', () => {
    const { rerender } = render(<FocusTrapFixture isOpen={false} />);
    const trigger = screen.getByRole('button', { name: 'Open modal' });
    trigger.focus();

    rerender(<FocusTrapFixture />);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'First action' }));

    rerender(<FocusTrapFixture isOpen={false} />);
    expect(document.activeElement).toBe(trigger);
  });
});
