import { del, get, set } from 'idb-keyval';
import type { LyricsDocument } from '../types/lyrics';

const LYRICS_STORAGE_PREFIX = 'musie:lyrics:';

const getLyricsStorageKey = (trackId: string) => `${LYRICS_STORAGE_PREFIX}${trackId}`;

export const readCachedLyrics = (trackId: string) =>
  get<LyricsDocument>(getLyricsStorageKey(trackId));

export const writeCachedLyrics = (trackId: string, lyrics: LyricsDocument) =>
  set(getLyricsStorageKey(trackId), lyrics);

export const deleteCachedLyrics = (trackId: string) => del(getLyricsStorageKey(trackId));
