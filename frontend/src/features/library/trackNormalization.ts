import type { Track } from '../../types/player'
import type { LocalTrackRecord } from '../../services/storage/libraryDb'

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

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Unable to encode blob as data URL'))
    }

    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export type ParsedFileMetadata = {
  title: string
  artist: string
  coverDataUrl?: string
  coverSource?: 'embedded' | 'online'
}

export async function extractFileMetadata(
  file: File,
): Promise<ParsedFileMetadata> {
  const fallback = parseTrackName(file.name)

  try {
    const { default: MP3Tag } = await import('mp3tag.js')
    const tags = await MP3Tag.readBlob(file)
    const title = tags.title?.trim() || fallback.title
    const artist = tags.artist?.trim() || fallback.artist

    let coverDataUrl: string | undefined
    const v2 = tags.v2
    const picture = v2?.APIC?.[0] ?? v2?.PIC?.[0]

    if (picture?.data && picture.format) {
      const pictureBytes = new Uint8Array(picture.data)
      const blob = new Blob([pictureBytes], { type: picture.format })
      coverDataUrl = await blobToDataUrl(blob)
    }

    return {
      title,
      artist,
      coverDataUrl,
      coverSource: coverDataUrl ? 'embedded' : undefined,
    }
  } catch {
    return {
      title: fallback.title,
      artist: fallback.artist,
    }
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
  metadata: ParsedFileMetadata
}): Track {
  return {
    id: input.id,
    title: input.metadata.title,
    artist: input.metadata.artist,
    src: input.objectUrl,
    coverUrl: input.metadata.coverDataUrl,
    coverSource: input.metadata.coverSource,
    duration: input.duration,
    sizeBytes: input.file.size,
    sourceType: 'local',
  }
}

export function createPersistedLocalTrack(input: {
  record: LocalTrackRecord
  objectUrl: string
}): Track {
  return {
    id: input.record.id,
    title: input.record.title,
    artist: input.record.artist,
    src: input.objectUrl,
    coverUrl: input.record.coverDataUrl,
    coverSource: input.record.coverSource,
    duration: input.record.duration,
    sizeBytes: input.record.sizeBytes,
    sourceType: 'local',
  }
}
