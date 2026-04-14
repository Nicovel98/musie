import Dexie, { type Table } from 'dexie'

export type LocalTrackRecord = {
  id: string
  title: string
  artist: string
  fileBlob: Blob
  duration: number
  sizeBytes: number
  createdAt: number
}

class MusieDb extends Dexie {
  localTracks!: Table<LocalTrackRecord, string>

  constructor() {
    super('musie-db')

    this.version(1).stores({
      localTracks: '&id, createdAt',
    })
  }
}

const db = new MusieDb()

export async function getAllLocalTracks() {
  return db.localTracks.orderBy('createdAt').toArray()
}

export async function saveLocalTracks(records: LocalTrackRecord[]) {
  if (records.length === 0) return
  await db.localTracks.bulkPut(records)
}

export async function clearLocalTracks() {
  await db.localTracks.clear()
}
