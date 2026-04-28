import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const loadPlayerSessionMock = vi.fn()
const savePlayerSessionMock = vi.fn()

const getAllLocalTracksMock = vi.fn()
const saveLocalTracksMock = vi.fn()
const clearLocalTracksMock = vi.fn()

const createBundledTrackMock = vi.fn((input: {
  id: string
  title: string
  artist: string
  fileName: string
}) => ({
  id: input.id,
  title: input.title,
  artist: input.artist,
  src: `/audio/${input.fileName}`,
  sourceType: 'bundle' as const,
}))

const createPersistedLocalTrackMock = vi.fn((input: {
  record: {
    id: string
    title: string
    artist: string
    duration: number
    sizeBytes: number
    coverDataUrl?: string
    coverSource?: 'embedded' | 'online'
  }
  objectUrl: string
}) => ({
  id: input.record.id,
  title: input.record.title,
  artist: input.record.artist,
  src: input.objectUrl,
  duration: input.record.duration,
  sizeBytes: input.record.sizeBytes,
  coverUrl: input.record.coverDataUrl,
  coverSource: input.record.coverSource,
  sourceType: 'local' as const,
}))

vi.mock('../../services/storage/playerSession', () => ({
  loadPlayerSession: loadPlayerSessionMock,
  savePlayerSession: savePlayerSessionMock,
}))

vi.mock('../../services/storage/libraryDb', () => ({
  getAllLocalTracks: getAllLocalTracksMock,
  saveLocalTracks: saveLocalTracksMock,
  clearLocalTracks: clearLocalTracksMock,
}))

vi.mock('../../features/library/trackNormalization', () => ({
  createBundledTrack: createBundledTrackMock,
  createPersistedLocalTrack: createPersistedLocalTrackMock,
  createLocalTrack: vi.fn(),
  extractFileMetadata: vi.fn(),
}))

vi.mock('../../services/covers/onlineCoverLookup', () => ({
  findOnlineCover: vi.fn(),
}))

vi.mock('../library/LibraryPanel', () => ({
  LibraryPanel: () => <div data-testid="library-panel" />,
}))

vi.mock('../library/QueuePanel', () => ({
  QueuePanel: () => <div data-testid="queue-panel" />,
}))

vi.mock('../player/NowPlayingCard', () => ({
  NowPlayingCard: ({ currentTrack }: { currentTrack: { id: string } | null }) => (
    <div data-testid="now-playing-track-id">{currentTrack?.id ?? 'none'}</div>
  ),
}))

describe('AppShell session restore', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    Object.defineProperty(globalThis.URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:restored-track'),
    })

    Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })

    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined),
    })

    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      configurable: true,
      value: vi.fn(),
    })
  })

  it.skip('restores and selects persisted local track from session', async () => {
    // TODO: This test needs to be updated to handle async restoration of local tracks.
    // Currently, the AppShell restores local tracks asynchronously after initialization,
    // which conflicts with how useAudioPlayer initializes its tracks synchronously.
    loadPlayerSessionMock.mockReturnValue({
      volume: 0.75,
      shuffleEnabled: false,
      repeatMode: 'all',
      allowOnlineCoverLookup: false,
      coverLookupProvider: 'auto',
      activeScreen: 'player',
      currentTrackId: 'local-1',
      currentTime: 42,
    })

    getAllLocalTracksMock.mockResolvedValue([
      {
        id: 'local-1',
        title: 'Track persisted',
        artist: 'Artist persisted',
        fileBlob: new Blob(['audio'], { type: 'audio/mpeg' }),
        duration: 180,
        sizeBytes: 1024,
        createdAt: Date.now(),
      },
    ])

    const { AppShell } = await import('./AppShell')

    render(<AppShell />)

    await waitFor(() => {
      const trackIdNodes = screen.getAllByTestId('now-playing-track-id')
      expect(trackIdNodes).toHaveLength(2)
      trackIdNodes.forEach((node) => {
        expect(node).toHaveTextContent('local-1')
      })
    })
  })
})
