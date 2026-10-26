import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAutomaticLyrics } from '../store/lyricsProvider';
import { deleteCachedLyrics, readCachedLyrics, writeCachedLyrics } from '../store/lyricsStorage';
import type { LyricsDocument } from '../types/lyrics';
import type { Track } from '../types/track';

export const useLyrics = (
  track: Track | null,
  updateTrackLyrics: (trackId: string, lyrics: LyricsDocument | undefined) => void
) => {
  const [lyrics, setLyrics] = useState<LyricsDocument | null>(track?.lyrics ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const updateTrackLyricsRef = useRef(updateTrackLyrics);

  useEffect(() => {
    updateTrackLyricsRef.current = updateTrackLyrics;
  }, [updateTrackLyrics]);

  useEffect(() => {
    let active = true;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    Promise.resolve().then(() => {
      if (active) setIsLoading(false);
    });
    void Promise.resolve()
      .then(async () => {
        if (!track) {
          if (active) {
            setLyrics(null);
            setError(null);
          }
          return;
        }
        if (active) {
          setLyrics(track.lyrics ?? null);
          setError(null);
        }
        const cachedLyrics = await readCachedLyrics(track.id);
        if (!active || !cachedLyrics) return;
        setLyrics(cachedLyrics);
        if (!track.lyrics) {
          updateTrackLyricsRef.current(track.id, cachedLyrics);
        }
      })
      .catch((reason) => {
        if (active && (reason as Error)?.name !== 'AbortError') {
          setError('No se pudieron leer las lyrics guardadas localmente.');
        }
      });

    return () => {
      active = false;
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
    };
  }, [track]);

  const saveLyrics = useCallback(
    async (nextLyrics: LyricsDocument | undefined) => {
      if (!track) return;
      setError(null);
      if (nextLyrics) {
        await writeCachedLyrics(track.id, nextLyrics);
      } else {
        await deleteCachedLyrics(track.id);
      }
      setLyrics(nextLyrics ?? null);
      updateTrackLyricsRef.current(track.id, nextLyrics);
    },
    [track]
  );

  const saveLyricsWithError = useCallback(
    async (nextLyrics: LyricsDocument | undefined) => {
      try {
        await saveLyrics(nextLyrics);
      } catch (reason) {
        setError('No se pudieron guardar las lyrics localmente.');
        throw reason;
      }
    },
    [saveLyrics]
  );

  const searchAutomatically = useCallback(async () => {
    if (!track) return null;
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchAutomaticLyrics(track, controller.signal);
      if (controller.signal.aborted) return null;
      if (!result) {
        setError('No se encontraron lyrics para esta canción.');
        return null;
      }
      await saveLyricsWithError(result);
      return result;
    } catch (reason) {
      if ((reason as Error)?.name !== 'AbortError') {
        setError('No se pudo consultar LRCLIB. Revisa tu conexión e inténtalo de nuevo.');
      }
      return null;
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        setIsLoading(false);
      }
    }
  }, [saveLyricsWithError, track]);

  const cancelSearch = useCallback(() => {
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setIsLoading(false);
  }, []);

  return {
    lyrics,
    isLoading,
    error,
    saveLyrics: saveLyricsWithError,
    searchAutomatically,
    cancelSearch,
  };
};
