/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  afterEach(() => {
    cleanup();
  });

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
        setLibrarySection={() => {}}
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
        setLibrarySection={() => {}}
        themeMode="dark"
        cycleThemeMode={() => {}}
        isPinned={true}
        setIsPinned={() => {}}
      />
    );

    expect(screen.queryByText('0')).toBeNull();
  });

  it('renders the theme-aware inline logo', () => {
    render(
      <Sidebar
        currentView="home"
        setView={() => {}}
        libraryTab="library"
        setLibraryTab={() => {}}
        setLibrarySection={() => {}}
        themeMode="dark"
        cycleThemeMode={() => {}}
        isPinned={true}
        setIsPinned={() => {}}
      />
    );

    const logo = screen.getAllByRole('img', { name: 'Musie logo' })[0];
    expect(logo.querySelector('[fill="var(--accent-primary)"]')).not.toBeNull();
    expect(logo.querySelector('[stroke="var(--accent-secondary)"]')).not.toBeNull();
  });

  it('opens the Albums section directly from the sidebar', () => {
    const setView = vi.fn();
    const setLibraryTab = vi.fn();
    const setLibrarySection = vi.fn();

    render(
      <Sidebar
        currentView="home"
        setView={setView}
        libraryTab="library"
        setLibraryTab={setLibraryTab}
        setLibrarySection={setLibrarySection}
        themeMode="dark"
        cycleThemeMode={() => {}}
        isPinned={true}
        setIsPinned={() => {}}
      />
    );

    const albumLabels = screen.getAllByText('Albums');
    fireEvent.click(albumLabels[albumLabels.length - 1]);

    expect(setLibraryTab).toHaveBeenCalledWith('library');
    expect(setLibrarySection).toHaveBeenCalledWith('albums');
    expect(setView).toHaveBeenCalledWith('library');
  });
});
