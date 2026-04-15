import { describe, expect, it } from 'vitest'
import { loadPlayerSession, savePlayerSession } from './playerSession'

describe('playerSession storage', () => {
  it('saves and loads a valid session', () => {
    const session = {
      volume: 0.75,
      shuffleEnabled: true,
      repeatMode: 'all' as const,
      allowOnlineCoverLookup: true,
      coverLookupProvider: 'itunes' as const,
      activeScreen: 'player' as const,
      currentTrackId: 'in-circles',
      currentTime: 95,
    }

    savePlayerSession(session)

    expect(loadPlayerSession()).toEqual(session)
  })

  it('returns null for invalid stored payload', () => {
    window.localStorage.setItem(
      'musie.player-session.v1',
      JSON.stringify({
        volume: 'high',
        shuffleEnabled: true,
      }),
    )

    expect(loadPlayerSession()).toBeNull()
  })

  it('sanitizes out-of-range numeric values', () => {
    window.localStorage.setItem(
      'musie.player-session.v1',
      JSON.stringify({
        volume: 4,
        shuffleEnabled: false,
        repeatMode: 'off',
        allowOnlineCoverLookup: false,
        coverLookupProvider: 'musicbrainz',
        activeScreen: 'library',
        currentTrackId: null,
        currentTime: -100,
      }),
    )

    expect(loadPlayerSession()).toEqual({
      volume: 1,
      shuffleEnabled: false,
      repeatMode: 'off',
      allowOnlineCoverLookup: false,
      coverLookupProvider: 'musicbrainz',
      activeScreen: 'library',
      currentTrackId: null,
      currentTime: 0,
    })
  })

  it('defaults consent to false when field is absent', () => {
    window.localStorage.setItem(
      'musie.player-session.v1',
      JSON.stringify({
        volume: 0.5,
        shuffleEnabled: false,
        repeatMode: 'off',
        activeScreen: 'queue',
        currentTrackId: null,
        currentTime: 0,
      }),
    )

    expect(loadPlayerSession()).toEqual({
      volume: 0.5,
      shuffleEnabled: false,
      repeatMode: 'off',
      allowOnlineCoverLookup: false,
      coverLookupProvider: 'auto',
      activeScreen: 'queue',
      currentTrackId: null,
      currentTime: 0,
    })
  })
})
