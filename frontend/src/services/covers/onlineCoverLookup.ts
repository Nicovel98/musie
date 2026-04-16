import type { CoverLookupProvider } from '../../types/player'

type CoverCacheEntry = {
  coverUrl?: string
  source?: 'online'
  expiresAt: number
}

const POSITIVE_CACHE_TTL_MS = 1000 * 60 * 60 * 6
const NEGATIVE_CACHE_TTL_MS = 1000 * 60 * 5

const coverCache = new Map<string, CoverCacheEntry>()

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
}

type LookupInput = {
  title: string
  artist: string
  provider: CoverLookupProvider
}

type LookupResult = {
  coverUrl?: string
  source?: 'online'
}

function buildCacheEntry(result: LookupResult, ttlMs: number): CoverCacheEntry {
  return {
    ...result,
    expiresAt: Date.now() + ttlMs,
  }
}

async function lookupInItunes(title: string, artist: string) {
  const term = encodeURIComponent(`${artist} ${title}`)
  const endpoint = `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=8`

  const response = await fetch(endpoint)
  if (!response.ok) return undefined

  const payload = (await response.json()) as {
    results?: Array<{
      trackName?: string
      artistName?: string
      artworkUrl100?: string
    }>
  }

  const normalizedTitle = normalizeText(title)
  const normalizedArtist = normalizeText(artist)
  const results = payload.results ?? []

  const bestMatch =
    results.find((item) => {
      const itemTitle = normalizeText(item.trackName ?? '')
      const itemArtist = normalizeText(item.artistName ?? '')
      return itemTitle === normalizedTitle && itemArtist === normalizedArtist
    }) ?? results[0]

  if (!bestMatch?.artworkUrl100) return undefined

  return bestMatch.artworkUrl100.replace(/\d+x\d+bb\.jpg$/, '600x600bb.jpg')
}

async function lookupInMusicBrainz(title: string, artist: string) {
  const query = encodeURIComponent(
    `recording:"${title}" AND artist:"${artist}"`,
  )
  const endpoint = `https://musicbrainz.org/ws/2/recording?query=${query}&fmt=json&limit=5`

  const response = await fetch(endpoint)
  if (!response.ok) return undefined

  const payload = (await response.json()) as {
    recordings?: Array<{
      releases?: Array<{ id?: string }>
    }>
  }

  const releaseId = payload.recordings
    ?.flatMap((recording) => recording.releases ?? [])
    .find((release) => typeof release.id === 'string')?.id

  if (!releaseId) return undefined

  return `https://coverartarchive.org/release/${releaseId}/front-500`
}

export async function findOnlineCover({
  title,
  artist,
  provider,
}: LookupInput): Promise<LookupResult> {
  const normalizedTitle = normalizeText(title)
  const normalizedArtist = normalizeText(artist)

  if (!normalizedTitle || !normalizedArtist) {
    return {
      coverUrl: undefined,
      source: undefined,
    }
  }

  const cacheKey = `${provider}::${normalizedArtist}::${normalizedTitle}`
  const cached = coverCache.get(cacheKey)
  if (cached) {
    if (cached.expiresAt > Date.now()) {
      return {
        coverUrl: cached.coverUrl,
        source: cached.source,
      }
    }

    coverCache.delete(cacheKey)
  }

  try {
    const orderedProviders =
      provider === 'auto' ? ['itunes', 'musicbrainz'] : [provider]

    for (const currentProvider of orderedProviders) {
      const coverUrl =
        currentProvider === 'itunes'
          ? await lookupInItunes(title, artist)
          : await lookupInMusicBrainz(title, artist)

      if (coverUrl) {
        const result = {
          coverUrl,
          source: 'online' as const,
        }
        coverCache.set(cacheKey, buildCacheEntry(result, POSITIVE_CACHE_TTL_MS))
        return result
      }
    }

    const emptyResult = { source: undefined, coverUrl: undefined }
    coverCache.set(
      cacheKey,
      buildCacheEntry(emptyResult, NEGATIVE_CACHE_TTL_MS),
    )
    return emptyResult
  } catch {
    const emptyResult = { source: undefined, coverUrl: undefined }
    coverCache.set(
      cacheKey,
      buildCacheEntry(emptyResult, NEGATIVE_CACHE_TTL_MS),
    )
    return emptyResult
  }
}
