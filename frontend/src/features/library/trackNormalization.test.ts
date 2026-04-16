import { describe, expect, it } from 'vitest'
import { createLocalTrack, extractFileMetadata } from './trackNormalization'

describe('trackNormalization', () => {
  it('falls back to filename parsing when tags are unavailable', async () => {
    const file = new File(['dummy'], 'Daft Punk - Harder Better.mp3', {
      type: 'audio/mpeg',
    })

    const metadata = await extractFileMetadata(file)

    expect(metadata.title).toBe('Harder Better')
    expect(metadata.artist).toBe('Daft Punk')
    expect(metadata.coverDataUrl).toBeUndefined()
    expect(metadata.coverSource).toBeUndefined()
  })

  it('maps parsed metadata into local track shape', () => {
    const file = new File(['dummy'], 'song.mp3', { type: 'audio/mpeg' })

    const track = createLocalTrack({
      id: 'local-1',
      file,
      objectUrl: 'blob:local-track',
      duration: 188,
      metadata: {
        title: 'Track Title',
        artist: 'Track Artist',
        coverDataUrl: 'data:image/jpeg;base64,abc123',
        coverSource: 'embedded',
      },
    })

    expect(track).toEqual({
      id: 'local-1',
      title: 'Track Title',
      artist: 'Track Artist',
      src: 'blob:local-track',
      coverUrl: 'data:image/jpeg;base64,abc123',
      coverSource: 'embedded',
      duration: 188,
      sizeBytes: file.size,
      sourceType: 'local',
    })
  })
})
