import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Heart,
  LoaderCircle,
  LocateFixed,
  Pause,
  Pencil,
  Play,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePlayerStore } from '../store/usePlayerStore';
import { useLyrics } from '../hooks/useLyrics';
import { lyricsToText, parseLyricsText } from '../types/lyrics';
import { buildLetrasSearchUrl } from '../utils/letrasUrl';
import type { Track } from '../types/track';

interface LyricsViewProps {
  selectedTrack?: Track | null;
  setSelectedTrack?: (track: Track | null) => void;
}

export const LyricsView = ({ selectedTrack = null, setSelectedTrack }: LyricsViewProps) => {
  const {
    currentTrack,
    libraryTracks,
    favoriteTrackIds,
    isPlaying,
    seek,
    togglePlay,
    setTrack,
    toggleTrackFavorite,
    updateTrackMetadata,
  } = usePlayerStore(
    useShallow((state) => ({
      currentTrack: state.currentTrack,
      libraryTracks: state.libraryTracks,
      favoriteTrackIds: state.favoriteTrackIds,
      isPlaying: state.isPlaying,
      seek: state.seek,
      togglePlay: state.togglePlay,
      setTrack: state.setTrack,
      toggleTrackFavorite: state.toggleTrackFavorite,
      updateTrackMetadata: state.updateTrackMetadata,
    }))
  );
  const displayTrack = selectedTrack;
  const [lyricsSearchQuery, setLyricsSearchQuery] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');
  const lyricsTracks = useMemo(
    () => libraryTracks.filter((track) => track.lyrics),
    [libraryTracks]
  );
  const filteredLyricsTracks = useMemo(() => {
    const query = lyricsSearchQuery.trim().toLowerCase();
    if (!query) return lyricsTracks;
    return lyricsTracks.filter(
      (track) =>
        track.title.toLowerCase().includes(query) || track.artist.toLowerCase().includes(query)
    );
  }, [lyricsSearchQuery, lyricsTracks]);
  const displayTrackIndex = displayTrack
    ? lyricsTracks.findIndex((track) => track.id === displayTrack.id)
    : -1;
  const LYRICS_FONT_SIZE_STORAGE_KEY = 'musie:lyrics-font-size';
  const lyricsFontSizes = [0.9, 1.1, 1.35, 1.65, 2] as const;
  const [lyricsFontSizeIndex, setLyricsFontSizeIndex] = useState(() => {
    if (typeof window === 'undefined') return 1;

    try {
      const storedSize = Number(window.localStorage.getItem(LYRICS_FONT_SIZE_STORAGE_KEY));
      return Number.isInteger(storedSize) && storedSize >= 0 && storedSize < lyricsFontSizes.length
        ? storedSize
        : 1;
    } catch {
      return 1;
    }
  });
  const [draft, setDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [manualScrollTrackId, setManualScrollTrackId] = useState<string | null>(null);
  const [lineNavigationFeedback, setLineNavigationFeedback] = useState('');
  const previousSeekRef = useRef(seek);
  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const saveFeedbackTimerRef = useRef<number | null>(null);
  const manualScrollResetTimerRef = useRef<number | null>(null);
  const centerLineAnimationFrameRef = useRef<number | null>(null);
  const { lyrics, isLoading, error, saveLyrics, searchAutomatically, cancelSearch } = useLyrics(
    displayTrack,
    (trackId, nextLyrics) => updateTrackMetadata(trackId, { lyrics: nextLyrics })
  );

  const activeLine = useMemo(() => {
    if (!lyrics || lyrics.format !== 'synced' || currentTrack?.id !== displayTrack?.id) return -1;
    return lyrics.lines.reduce(
      (activeIndex, line, index) =>
        line.startTimeMs !== undefined && line.startTimeMs <= seek * 1000 ? index : activeIndex,
      -1
    );
  }, [currentTrack?.id, displayTrack?.id, lyrics, seek]);

  const isFavorite = displayTrack ? favoriteTrackIds.includes(displayTrack.id) : false;
  const currentText = lyrics ? lyricsToText(lyrics) : '';
  const parsedDraft = useMemo(() => parseLyricsText(draft, 'manual'), [draft]);
  const draftHasChanges = draft !== currentText;
  const isLongTrack =
    displayTrack?.durationSeconds !== undefined && displayTrack.durationSeconds > 15 * 60;
  const lyricsFontSize = lyricsFontSizes[lyricsFontSizeIndex];
  const isFollowingCurrentLine =
    lyrics?.format === 'synced' && displayTrack !== null && manualScrollTrackId !== displayTrack.id;

  useEffect(() => {
    try {
      window.localStorage.setItem(LYRICS_FONT_SIZE_STORAGE_KEY, String(lyricsFontSizeIndex));
    } catch {
      // Storage may be unavailable in private browsing or restricted environments.
    }
  }, [lyricsFontSizeIndex]);

  useEffect(() => {
    previousSeekRef.current = 0;
  }, [displayTrack?.id]);

  useEffect(() => {
    const restarted = seek + 1 < previousSeekRef.current;
    previousSeekRef.current = seek;

    if (restarted) {
      if (manualScrollResetTimerRef.current !== null) {
        window.clearTimeout(manualScrollResetTimerRef.current);
      }
      manualScrollResetTimerRef.current = window.setTimeout(() => {
        setManualScrollTrackId(null);
        manualScrollResetTimerRef.current = null;
      }, 0);
    }
  }, [seek]);

  useEffect(() => {
    if (activeLine < 0 || !isFollowingCurrentLine) return;
    activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLine, isFollowingCurrentLine]);

  const scrollToActiveLine = () => {
    if (activeLine < 0) return;

    setManualScrollTrackId(null);
    setLineNavigationFeedback('');

    const centerLine = () => {
      if (!activeLineRef.current) {
        setLineNavigationFeedback('La línea actual todavía se está preparando');
        return;
      }

      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setLineNavigationFeedback('Línea actual centrada');
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
      feedbackTimerRef.current = window.setTimeout(() => {
        setLineNavigationFeedback('');
        feedbackTimerRef.current = null;
      }, 1800);
    };

    centerLine();
    if (!activeLineRef.current) {
      centerLineAnimationFrameRef.current = window.requestAnimationFrame(() => {
        centerLineAnimationFrameRef.current = null;
        centerLine();
      });
    }
  };

  useEffect(
    () => () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current);
      }
      if (saveFeedbackTimerRef.current !== null) {
        window.clearTimeout(saveFeedbackTimerRef.current);
      }
      if (manualScrollResetTimerRef.current !== null) {
        window.clearTimeout(manualScrollResetTimerRef.current);
      }
      if (centerLineAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(centerLineAnimationFrameRef.current);
      }
    },
    []
  );

  const selectLyricsTrack = (track: Track) => setSelectedTrack?.(track);
  const moveLyricsTrack = (direction: -1 | 1) => {
    const nextTrack = lyricsTracks[displayTrackIndex + direction];
    if (nextTrack) selectLyricsTrack(nextTrack);
  };
  const playDisplayTrack = () => {
    if (!displayTrack) return;
    if (currentTrack?.id === displayTrack.id) togglePlay();
    else setTrack(displayTrack);
  };

  if (!displayTrack) {
    return (
      <section className="mx-auto flex h-full w-full max-w-4xl items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl rounded-3xl border border-dashed border-[var(--glass-border)] p-5 text-center sm:p-8">
          <FileText className="mx-auto mb-4 text-[var(--accent-primary)]" size={32} />
          <h1 className="text-xl font-black text-[var(--text-main)]">Lyrics</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Selecciona una canción con lyrics guardadas para consultarlas sin iniciar la
            reproducción.
          </p>
          <label className="mt-5 flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 text-left">
            <Search size={16} className="shrink-0 text-[var(--text-muted)]" />
            <input
              type="search"
              value={lyricsSearchQuery}
              onChange={(event) => setLyricsSearchQuery(event.target.value)}
              placeholder="Buscar canción o artista"
              aria-label="Buscar canciones con lyrics"
              className="w-full bg-transparent text-sm text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]"
            />
          </label>
          <div className="mt-4 grid max-h-[45vh] gap-2 overflow-y-auto text-left sm:grid-cols-2">
            {filteredLyricsTracks.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() => selectLyricsTrack(track)}
                className="flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] p-2 text-left"
              >
                <img src={track.coverUrl} alt="" className="h-11 w-11 rounded-xl object-cover" />
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--text-main)]">
                  {track.title}
                </span>
              </button>
            ))}
          </div>
          {filteredLyricsTracks.length === 0 && (
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              No hay canciones con lyrics que coincidan con la búsqueda.
            </p>
          )}
        </div>
      </section>
    );
  }

  const openExternalSearch = () => {
    window.open(
      buildLetrasSearchUrl(displayTrack.artist, displayTrack.title),
      '_blank',
      'noopener,noreferrer'
    );
  };

  const beginEditing = () => {
    setDraft(currentText);
    setIsEditing(true);
  };

  const saveDraft = async () => {
    try {
      await saveLyrics(parsedDraft.lines.length > 0 ? parsedDraft : undefined);
      setIsEditing(false);
      setSaveFeedback('Lyrics guardadas');
      if (saveFeedbackTimerRef.current !== null) {
        window.clearTimeout(saveFeedbackTimerRef.current);
      }
      saveFeedbackTimerRef.current = window.setTimeout(() => {
        setSaveFeedback('');
        saveFeedbackTimerRef.current = null;
      }, 1800);
    } catch {
      // The hook exposes the persistence error in the view.
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl p-4 pb-8 sm:p-6 lg:p-8">
      <header className="mb-5 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 shadow-[var(--glass-shadow)] sm:p-5">
        <div className="flex items-start gap-3">
          <img
            src={displayTrack.coverUrl}
            alt=""
            className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-lg sm:h-20 sm:w-20"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--accent-primary)]">
              Lyrics
            </p>
            <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-[var(--text-main)] sm:text-3xl">
              {displayTrack.title}
            </h1>
            <p className="truncate text-sm font-semibold text-[var(--text-muted)]">
              {displayTrack.artist}
              {displayTrack.album ? ` · ${displayTrack.album}` : ''}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="hidden text-[10px] font-black tabular-nums text-[var(--text-muted)] sm:inline">
              {displayTrackIndex + 1} / {lyricsTracks.length}
            </span>
            <button
              type="button"
              onClick={() => moveLyricsTrack(-1)}
              disabled={displayTrackIndex <= 0}
              aria-label="Canción con lyrics anterior"
              className="rounded-full p-2 text-[var(--text-muted)] disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={playDisplayTrack}
              aria-label={
                currentTrack?.id === displayTrack.id && isPlaying ? 'Pausar' : 'Reproducir'
              }
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[var(--bg-main)]"
            >
              {currentTrack?.id === displayTrack.id && isPlaying ? (
                <Pause size={17} />
              ) : (
                <Play size={17} fill="currentColor" />
              )}
            </button>
            <button
              type="button"
              onClick={() => moveLyricsTrack(1)}
              disabled={displayTrackIndex < 0 || displayTrackIndex >= lyricsTracks.length - 1}
              aria-label="Siguiente canción con lyrics"
              className="rounded-full p-2 text-[var(--text-muted)] disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => toggleTrackFavorite(displayTrack.id)}
            aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            aria-pressed={isFavorite}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--glass-border)] ${
              isFavorite ? 'text-red-500' : 'text-[var(--text-muted)]'
            }`}
          >
            <Heart size={19} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => (isLoading ? cancelSearch() : void searchAutomatically())}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--accent-primary)] px-4 py-3 text-xs font-black text-[var(--bg-main)] sm:flex-none"
        >
          {isLoading ? <LoaderCircle size={16} className="animate-spin" /> : <Search size={16} />}
          {isLoading ? 'Cancelar búsqueda' : 'Buscar LRCLIB'}
        </button>
        <button
          type="button"
          onClick={openExternalSearch}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--glass-border)] px-4 py-3 text-xs font-bold text-[var(--text-muted)] sm:flex-none"
        >
          <ExternalLink size={16} />
          Letras.com
        </button>
        <button
          type="button"
          onClick={beginEditing}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--glass-border)] px-4 py-3 text-xs font-bold text-[var(--text-main)] sm:flex-none"
        >
          <Pencil size={16} />
          Editar
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-5 rounded-2xl bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}
      {saveFeedback && (
        <p
          role="status"
          className="mb-5 rounded-2xl bg-[var(--accent-primary)]/10 p-3 text-sm font-bold text-[var(--accent-primary)]"
        >
          {saveFeedback}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.3fr)]">
        <article
          ref={lyricsScrollRef}
          onWheel={() => {
            setManualScrollTrackId(displayTrack.id);
          }}
          onTouchMove={() => {
            setManualScrollTrackId(displayTrack.id);
          }}
          className="max-h-[min(65vh,680px)] min-h-[360px] overflow-y-auto rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 shadow-[var(--glass-shadow)] sm:p-8"
        >
          {lyrics ? (
            <>
              <div className="sticky top-0 z-10 -mx-5 mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--glass-border)] bg-[var(--glass-bg)]/95 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] backdrop-blur-md sm:-mx-8 sm:px-8">
                <span>{lyrics.format === 'synced' ? 'Lyrics sincronizadas' : 'Texto plano'}</span>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline">
                    {lyrics.source === 'automatic' ? (lyrics.provider ?? 'Automáticas') : 'Manual'}
                  </span>
                  {lyrics.format === 'synced' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={scrollToActiveLine}
                        disabled={activeLine < 0}
                        aria-label={
                          isFollowingCurrentLine
                            ? 'Centrar y seguir la línea actual'
                            : 'Ir a la línea actual y reactivar seguimiento'
                        }
                        title={
                          isFollowingCurrentLine
                            ? 'Siguiendo la línea actual'
                            : 'Ir a la línea actual'
                        }
                        className={`inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-full border px-2.5 text-[9px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                          isFollowingCurrentLine
                            ? 'border-[var(--accent-primary)]/60 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                            : 'border-[var(--glass-border)] text-[var(--text-main)] hover:bg-[var(--glass-bg)]'
                        } disabled:cursor-not-allowed disabled:opacity-30`}
                      >
                        <LocateFixed size={14} />
                        <span className="hidden sm:inline">
                          {isFollowingCurrentLine ? 'Siguiendo' : 'Línea actual'}
                        </span>
                      </button>
                      {lineNavigationFeedback && (
                        <span
                          className="hidden max-w-36 truncate text-[9px] font-bold normal-case tracking-normal text-[var(--accent-primary)] sm:inline"
                          aria-live="polite"
                        >
                          {lineNavigationFeedback}
                        </span>
                      )}
                      <span className="sr-only" aria-live="polite">
                        {lineNavigationFeedback}
                      </span>
                    </div>
                  )}
                  <div
                    className="flex items-center rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-0.5"
                    aria-label="Tamaño de las letras"
                  >
                    <button
                      type="button"
                      onClick={() => setLyricsFontSizeIndex((size) => Math.max(0, size - 1))}
                      disabled={lyricsFontSizeIndex === 0}
                      aria-label="Disminuir tamaño de letras"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-[var(--text-main)] transition hover:bg-[var(--glass-bg)] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      A−
                    </button>
                    <button
                      type="button"
                      onClick={() => setLyricsFontSizeIndex(1)}
                      aria-label="Restaurar tamaño normal de letras"
                      className="min-w-10 rounded-full px-2 py-1 text-[9px] font-black text-[var(--text-muted)] transition hover:bg-[var(--glass-bg)] hover:text-[var(--text-main)]"
                    >
                      {lyricsFontSizeIndex === 1
                        ? '100%'
                        : `${Math.round((lyricsFontSize / 1.1) * 100)}%`}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setLyricsFontSizeIndex((size) =>
                          Math.min(lyricsFontSizes.length - 1, size + 1)
                        )
                      }
                      disabled={lyricsFontSizeIndex === lyricsFontSizes.length - 1}
                      aria-label="Aumentar tamaño de letras"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-[var(--text-main)] transition hover:bg-[var(--glass-bg)] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      A+
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-center sm:space-y-4">
                {lyrics.lines.map((line, index) => (
                  <p
                    key={`${line.startTimeMs ?? 'plain'}-${index}`}
                    ref={index === activeLine ? activeLineRef : undefined}
                    className={`leading-8 transition-all ${
                      index === activeLine
                        ? 'scale-[1.02] font-black text-[var(--accent-primary)]'
                        : 'text-[var(--text-main)]/85'
                    }`}
                    style={{ fontSize: `${lyricsFontSize}rem` }}
                  >
                    {line.text}
                  </p>
                ))}
              </div>
            </>
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
              <FileText size={32} className="mb-3 text-[var(--text-muted)]" />
              <p className="text-lg font-black text-[var(--text-main)]">No hay lyrics guardadas</p>
              <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">
                Busca una versión sincronizada o agrega el texto manualmente.
              </p>
              <button
                type="button"
                onClick={beginEditing}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--glass-border)] px-4 py-2 text-xs font-black text-[var(--text-main)]"
              >
                <Pencil size={15} />
                Escribir lyrics
              </button>
            </div>
          )}
        </article>

        <aside className="rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Información
          </h2>
          <div className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
            <p>{lyrics ? `${lyrics.lines.length} líneas` : 'Sin contenido guardado'}</p>
            <p>
              {lyrics?.format === 'synced'
                ? 'Se seguirá la línea activa.'
                : 'Texto sin timestamps.'}
            </p>
          </div>
          {isLongTrack && (
            <p className="mt-4 rounded-2xl border border-[var(--accent-secondary)]/30 bg-[var(--accent-secondary)]/10 p-3 text-sm leading-6 text-[var(--text-main)]/85">
              Esta pista dura más de 15 minutos. La búsqueda funciona mejor con canciones
              individuales.
            </p>
          )}
        </aside>
      </div>

      {isEditing && (
        <section className="mt-5 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Editor manual
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {parsedDraft.format === 'synced'
                  ? 'Formato LRC detectado'
                  : 'Texto plano detectado'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void saveLyrics(undefined).then(() => setIsEditing(false))}
              className="inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-xs font-bold text-red-300 hover:text-red-200"
            >
              <Trash2 size={14} />
              Eliminar
            </button>
          </div>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={'Pega texto plano o formato LRC:\n[00:12.50] Primera línea'}
            className="mt-4 min-h-56 w-full resize-y rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
          />
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--glass-border)] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Vista previa · {parsedDraft.lines.length} líneas
            </p>
            <div className="mt-3 max-h-36 overflow-y-auto space-y-1 text-sm text-[var(--text-main)]/80">
              {parsedDraft.lines.length > 0 ? (
                parsedDraft.lines
                  .slice(0, 8)
                  .map((line, index) => (
                    <p key={`${line.startTimeMs ?? 'plain'}-${index}`}>{line.text}</p>
                  ))
              ) : (
                <p className="text-[var(--text-muted)]">
                  Escribe contenido para ver la vista previa.
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="min-h-11 rounded-full px-4 py-2 text-xs font-bold text-[var(--text-muted)]"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!draftHasChanges}
              onClick={() => void saveDraft()}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--accent-primary)] px-4 py-2 text-xs font-black text-[var(--bg-main)] disabled:opacity-40"
            >
              <Save size={15} />
              Guardar lyrics
            </button>
          </div>
        </section>
      )}
    </section>
  );
};
