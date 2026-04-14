import type { RepeatMode } from '../../types/player'

export type PlayerScreen = 'library' | 'player' | 'queue'

export type PlayerSession = {
  volume: number
  shuffleEnabled: boolean
  repeatMode: RepeatMode
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

export function loadPlayerSession(): PlayerSession | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<PlayerSession>

    if (
      typeof parsed.volume !== 'number' ||
      typeof parsed.shuffleEnabled !== 'boolean' ||
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
