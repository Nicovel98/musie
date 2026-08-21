/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => {
  const storage = new Map<string, unknown>();

  return {
    __esModule: true,
    get: vi.fn(async (key: string) => (storage.has(key) ? storage.get(key) : null)),
    set: vi.fn(async (key: string, value: unknown) => {
      storage.set(key, value);
    }),
    del: vi.fn(async (key: string) => {
      storage.delete(key);
    }),
  };
});

import { Sidebar } from './Sidebar';
import { usePlayerStore } from '../store/usePlayerStore';

describe('Sidebar favorites badge', () => {
  beforeEach(() => {
    usePlayerStore.setState({ favoriteTrackIds: [] });
  });

  it('shows the favorites count when there are saved favorites', () => {
    usePlayerStore.setState({ favoriteTrackIds: ['a', 'b', 'c'] });

    render(
      <Sidebar
        currentView="library"
        setView={() => {}}
        libraryTab="favorites"
        setLibraryTab={() => {}}
        themeMode="dark"
        cycleThemeMode={() => {}}
        isPinned={true}
        setIsPinned={() => {}}
      />
    );

    expect(screen.getByText('Favorites')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('hides the badge when there are no favorites', () => {
    usePlayerStore.setState({ favoriteTrackIds: [] });

    render(
      <Sidebar
        currentView="library"
        setView={() => {}}
        libraryTab="library"
        setLibraryTab={() => {}}
        themeMode="dark"
        cycleThemeMode={() => {}}
        isPinned={true}
        setIsPinned={() => {}}
      />
    );

    expect(screen.queryByText('0')).toBeNull();
  });
});
