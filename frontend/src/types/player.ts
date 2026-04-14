export type RepeatMode = 'off' | 'all' | 'one'

export type Track = {
  id: string
  title: string
  artist: string
  src: string
  duration?: number
  sizeBytes?: number
  sourceType?: 'bundle' | 'local'
}
