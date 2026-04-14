import type { Track } from '../../types/player'

const BASE_URL = import.meta.env.BASE_URL

function stripFileExtension(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, '')
}

function parseTrackName(rawName: string) {
  const cleanName = stripFileExtension(rawName)
  const separatorIndex = cleanName.indexOf(' - ')

  if (separatorIndex === -1) {
    return {
      title: cleanName,
      artist: 'Local file',
    }
  }

  return {
    artist: cleanName.slice(0, separatorIndex).trim() || 'Local file',
    title: cleanName.slice(separatorIndex + 3).trim() || cleanName,
  }
}

export function createBundledTrack(input: {
  id: string
  title: string
  artist: string
  fileName: string
}): Track {
  return {
    id: input.id,
    title: input.title,
    artist: input.artist,
    src: `${BASE_URL}audio/${input.fileName}`,
    sourceType: 'bundle',
  }
}

export function createLocalTrack(input: {
  id: string
  file: File
  objectUrl: string
  duration: number
}): Track {
  const parsed = parseTrackName(input.file.name)

  return {
    id: input.id,
    title: parsed.title,
    artist: parsed.artist,
    src: input.objectUrl,
    duration: input.duration,
    sizeBytes: input.file.size,
    sourceType: 'local',
  }
}
