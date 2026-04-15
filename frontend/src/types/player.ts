export type RepeatMode = 'off' | 'all' | 'one'
export type CoverSource = 'embedded' | 'online'
export type CoverLookupProvider = 'auto' | 'itunes' | 'musicbrainz'

export type Track = {
  id: string
  title: string
  artist: string
  src: string
  coverUrl?: string
  coverSource?: CoverSource
  duration?: number
  sizeBytes?: number
  sourceType?: 'bundle' | 'local'
}
