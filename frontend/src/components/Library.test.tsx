/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest';
import { filterLibraryTracksByMode, mergeTracksById, sortLibraryTracks } from './libraryHelpers';

describe('Library favorites helpers', () => {
  const tracks = [
    {
      id: 'a',
      title: 'Alpha',
      artist: 'Artist A',
      coverUrl: '/cover-a.jpg',
      audioUrl: '/audio-a.mp3',
    },
    {
      id: 'b',
      title: 'Bravo',
      artist: 'Artist B',
      coverUrl: '/cover-b.jpg',
      audioUrl: '/audio-b.mp3',
    },
    {
      id: 'c',
      title: 'Charlie',
      artist: 'Artist C',
      coverUrl: '/cover-c.jpg',
      audioUrl: '/audio-c.mp3',
    },
  ] as const;

  it('filters to favorites when favorites-only mode is active', () => {
    const filtered = filterLibraryTracksByMode(tracks, ['b', 'c'], true, 'library');

    expect(filtered.map((track) => track.id)).toEqual(['b', 'c']);
  });

  it('sorts favorites by recency when recent mode is used', () => {
    const sorted = sortLibraryTracks(tracks, 'recent', ['a', 'b', 'c'], 'favorites');

    expect(sorted.map((track) => track.id)).toEqual(['c', 'b', 'a']);
  });

  it('keeps favorites from playlist sources visible in the favorites view', () => {
    const playlistOnlyTrack = {
      id: 'playlist-only',
      title: 'Playlist Only',
      artist: 'Artist P',
      coverUrl: '/cover-p.jpg',
      audioUrl: '/audio-p.mp3',
    };
    const availableTracks = mergeTracksById(tracks, [playlistOnlyTrack]);
    const filtered = filterLibraryTracksByMode(
      availableTracks,
      ['playlist-only'],
      false,
      'favorites'
    );

    expect(filtered.map((track) => track.id)).toEqual(['playlist-only']);
  });
});
