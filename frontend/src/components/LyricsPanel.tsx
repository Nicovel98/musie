import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, FileText, LoaderCircle, LocateFixed, Save, Search, X } from 'lucide-react';
import { useLyrics } from '../hooks/useLyrics';
import { lyricsToText, parseLyricsText } from '../types/lyrics';
import type { Track } from '../types/track';
import { buildLetrasSearchUrl } from '../utils/letrasUrl';

interface LyricsPanelProps {
  track: Track;
  seek: number;
  updateTrackLyrics: (trackId: string, lyrics: Track['lyrics']) => void;
  useThemeAudioColors: boolean;
}

export const LyricsPanel = ({
  track,
  seek,
  updateTrackLyrics,
  useThemeAudioColors,
}: LyricsPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [fontSizeIndex, setFontSizeIndex] = useState(() => {
    if (typeof window === 'undefined') return 1;
    const storedSize = Number(window.localStorage.getItem('musie:lyrics-font-size'));
    return Number.isInteger(storedSize) && storedSize >= 0 && storedSize < 5 ? storedSize : 1;
  });
  const [manualScrollTrackId, setManualScrollTrackId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const previousSeekRef = useRef(seek);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);
  const feedbackTimerRef = useRef<number | null>(null);
  const manualScrollResetTimerRef = useRef<number | null>(null);
  const fontSizes = [0.9, 1.1, 1.35, 1.65, 2] as const;
  const { lyrics, isLoading, error, saveLyrics, searchAutomatically, cancelSearch } = useLyrics(
    track,
    updateTrackLyrics
  );
  const activeLine = useMemo(() => {
    if (!lyrics || lyrics.format !== 'synced') return -1;
    return lyrics.lines.reduce(
      (activeIndex, line, index) =>
        line.startTimeMs !== undefined && line.startTimeMs <= seek * 1000 ? index : activeIndex,
      -1
    );
  }, [lyrics, seek]);

  const closePanel = useCallback(() => {
    cancelSearch();
    setIsOpen(false);
  }, [cancelSearch]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closePanel, isOpen]);

  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true });
  }, [isOpen]);

  useEffect(() => {
    try {
      window.localStorage.setItem('musie:lyrics-font-size', String(fontSizeIndex));
    } catch {
      // Storage may be unavailable in private browsing or restricted environments.
    }
  }, [fontSizeIndex]);

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
    if (!isOpen || activeLine < 0 || manualScrollTrackId === track.id) return;
    activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeLine, isOpen, manualScrollTrackId, track.id]);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
      if (manualScrollResetTimerRef.current !== null) {
        window.clearTimeout(manualScrollResetTimerRef.current);
      }
    },
    []
  );

  const handleSave = async () => {
    try {
      const nextLyrics = parseLyricsText(draft, 'manual');
      if (nextLyrics.lines.length === 0) {
        await saveLyrics(undefined);
        closePanel();
        return;
      }
      await saveLyrics(nextLyrics);
      closePanel();
    } catch {
      // The hook exposes the persistence error in the dialog.
    }
  };

  const openLyrics = () => {
    setDraft(lyrics ? lyricsToText(lyrics) : '');
    setManualScrollTrackId(null);
    setFeedback('');
    setIsOpen(true);
  };

  const scrollToActiveLine = () => {
    if (activeLine < 0) return;
    setManualScrollTrackId(null);
    activeLineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFeedback('Línea actual centrada');
    if (feedbackTimerRef.current !== null) window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback('');
      feedbackTimerRef.current = null;
    }, 1800);
  };

  const openExternalSearch = () => {
    window.open(buildLetrasSearchUrl(track.artist, track.title), '_blank', 'noopener,noreferrer');
  };
  const isLongTrack = track.durationSeconds !== undefined && track.durationSeconds > 15 * 60;

  return (
    <>
      <button
        type="button"
        onClick={openLyrics}
        aria-label="Open lyrics"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] shadow-[var(--glass-shadow)] transition hover:text-[var(--text-main)] ${
          lyrics ? 'text-[var(--accent-primary)]' : ''
        }`}
      >
        <FileText size={17} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/45 p-3 pb-[calc(5.5rem+env(safe-area-inset-bottom))] backdrop-blur-sm sm:bg-black/60 sm:p-6 sm:pb-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePanel();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lyrics-title"
            ref={dialogRef}
            tabIndex={-1}
            className="my-auto flex max-h-[calc(100dvh-7rem-env(safe-area-inset-bottom))] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-main)] shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--glass-border)] px-3 py-3 sm:gap-3 sm:px-5 sm:py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  {lyrics?.provider ?? 'Local'}
                </p>
                <h2
                  id="lyrics-title"
                  className="truncate text-lg font-black text-[var(--text-main)]"
                >
                  Lyrics · {track.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={closePanel}
                aria-label="Close lyrics"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)]"
              >
                <X size={18} />
              </button>
            </header>

            <div
              ref={lyricsScrollRef}
              className="min-h-0 overflow-y-auto p-3 custom-scrollbar sm:p-5"
              onWheel={() => setManualScrollTrackId(track.id)}
              onTouchMove={() => setManualScrollTrackId(track.id)}
            >
              {lyrics ? (
                <>
                  <div className="sticky top-0 z-10 -mx-3 mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--glass-border)] bg-[var(--bg-main)]/95 px-1 pb-3 pt-1 backdrop-blur-md sm:-mx-5 sm:px-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      {lyrics.format === 'synced' ? 'Lyrics sincronizadas' : 'Texto plano'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {lyrics.format === 'synced' && (
                        <button
                          type="button"
                          onClick={scrollToActiveLine}
                          disabled={activeLine < 0}
                          aria-label="Ir a la línea actual y reactivar seguimiento"
                          title="Ir a la línea actual"
                          className={`inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-full border px-2 text-[9px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                            manualScrollTrackId === track.id
                              ? 'border-[var(--glass-border)] text-[var(--text-main)]'
                              : 'border-[var(--accent-primary)]/60 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                          } disabled:cursor-not-allowed disabled:opacity-30`}
                        >
                          <LocateFixed size={14} />
                          <span className="hidden sm:inline">
                            {manualScrollTrackId === track.id ? 'Línea actual' : 'Siguiendo'}
                          </span>
                        </button>
                      )}
                      <div
                        className="flex items-center rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-0.5"
                        aria-label="Tamaño de las letras"
                      >
                        <button
                          type="button"
                          onClick={() => setFontSizeIndex((size) => Math.max(0, size - 1))}
                          disabled={fontSizeIndex === 0}
                          aria-label="Disminuir tamaño de letras"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-[var(--text-main)] disabled:opacity-30"
                        >
                          A−
                        </button>
                        <button
                          type="button"
                          onClick={() => setFontSizeIndex(1)}
                          aria-label="Restaurar tamaño normal de letras"
                          className="min-w-10 rounded-full px-2 py-1 text-[9px] font-black text-[var(--text-muted)]"
                        >
                          {fontSizeIndex === 1
                            ? '100%'
                            : `${Math.round((fontSizes[fontSizeIndex] / 1.1) * 100)}%`}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFontSizeIndex((size) => Math.min(fontSizes.length - 1, size + 1))
                          }
                          disabled={fontSizeIndex === fontSizes.length - 1}
                          aria-label="Aumentar tamaño de letras"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-[var(--text-main)] disabled:opacity-30"
                        >
                          A+
                        </button>
                      </div>
                    </div>
                    {feedback && (
                      <span
                        className="w-full text-[9px] font-bold normal-case tracking-normal text-[var(--accent-primary)] sm:absolute sm:right-0 sm:top-full sm:w-auto"
                        aria-live="polite"
                      >
                        {feedback}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 text-center">
                    {lyrics.lines.map((line, index) => (
                      <p
                        key={`${line.startTimeMs ?? 'plain'}-${index}`}
                        ref={index === activeLine ? activeLineRef : undefined}
                        className={`leading-7 transition ${
                          index === activeLine
                            ? 'scale-[1.02] font-black text-[var(--accent-primary)]'
                            : 'text-[var(--text-main)]/85'
                        }`}
                        style={{ fontSize: `${fontSizes[fontSizeIndex]}rem` }}
                      >
                        {line.text}
                      </p>
                    ))}
                  </div>
                </>
              ) : (
                <p className="rounded-2xl border border-dashed border-[var(--glass-border)] p-6 text-center text-sm text-[var(--text-muted)]">
                  No hay lyrics guardadas para esta canción.
                </p>
              )}

              <label className="mt-4 block text-xs font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Editar o pegar texto/LRC
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={'Pega texto plano o formato LRC:\n[00:12.50] Primera línea'}
                  className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-3 text-sm font-normal normal-case tracking-normal text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)] sm:min-h-40"
                />
              </label>

              {error && (
                <p role="alert" className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </p>
              )}
              {isLongTrack && (
                <p className="mt-3 rounded-xl border border-[var(--accent-secondary)]/30 bg-[var(--accent-secondary)]/10 p-3 text-sm leading-6 text-[var(--text-main)]/85">
                  Esta pista dura más de 15 minutos y puede contener un álbum completo, un
                  concierto, un mix o un podcast. La búsqueda automática funciona mejor con
                  canciones individuales; para obtener lyrics más precisas, importa cada canción por
                  separado.
                </p>
              )}
            </div>

            <footer className="flex shrink-0 flex-wrap gap-2 border-t border-[var(--glass-border)] px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:justify-end sm:p-4">
              <button
                type="button"
                onClick={openExternalSearch}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--glass-border)] px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] sm:flex-none"
              >
                <ExternalLink size={14} />
                Letras.com
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => void searchAutomatically()}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--glass-border)] px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-50 sm:flex-none"
              >
                {isLoading ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <Search size={14} />
                )}
                Buscar LRCLIB
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-black sm:flex-none ${
                  useThemeAudioColors
                    ? 'bg-[var(--accent-primary)] text-[var(--bg-main)]'
                    : 'bg-[var(--text-main)] text-[var(--bg-main)]'
                }`}
              >
                <Save size={14} />
                Guardar
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
};
