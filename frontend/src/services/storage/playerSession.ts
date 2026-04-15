import type { CoverLookupProvider, RepeatMode } from '../../types/player'

export type PlayerScreen = 'library' | 'player' | 'queue'

export type PlayerSession = {
  volume: number
  shuffleEnabled: boolean
  repeatMode: RepeatMode
  allowOnlineCoverLookup: boolean
  coverLookupProvider: CoverLookupProvider
  activeScreen: PlayerScreen
  currentTrackId: string | null
  currentTime: number
}

const SESSION_KEY = 'musie.player-session.v1'

function isPlayerScreen(value: unknown): value is PlayerScreen {
  return value === 'library' || value === 'player' || value === 'queue'
}

function isRepeatMode(value: unknown): value is RepeatMode {
  return value === 'off' || value === 'all' || value === 'one'
}

function isCoverLookupProvider(value: unknown): value is CoverLookupProvider {
  return value === 'auto' || value === 'itunes' || value === 'musicbrainz'
}

export function loadPlayerSession(): PlayerSession | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<PlayerSession>

    if (
      typeof parsed.volume !== 'number' ||
      typeof parsed.shuffleEnabled !== 'boolean' ||
      (parsed.allowOnlineCoverLookup !== undefined &&
        typeof parsed.allowOnlineCoverLookup !== 'boolean') ||
      (parsed.coverLookupProvider !== undefined &&
        !isCoverLookupProvider(parsed.coverLookupProvider)) ||
      !isRepeatMode(parsed.repeatMode) ||
      !isPlayerScreen(parsed.activeScreen) ||
      (parsed.currentTrackId !== null &&
        typeof parsed.currentTrackId !== 'string') ||
      typeof parsed.currentTime !== 'number'
    ) {
      return null
    }

    return {
      volume: Math.min(Math.max(parsed.volume, 0), 1),
      shuffleEnabled: parsed.shuffleEnabled,
      repeatMode: parsed.repeatMode,
      allowOnlineCoverLookup: parsed.allowOnlineCoverLookup ?? false,
      coverLookupProvider: parsed.coverLookupProvider ?? 'auto',
      activeScreen: parsed.activeScreen,
      currentTrackId: parsed.currentTrackId,
      currentTime: Math.max(parsed.currentTime, 0),
    }
  } catch {
    return null
  }
}

export function savePlayerSession(session: PlayerSession) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}
