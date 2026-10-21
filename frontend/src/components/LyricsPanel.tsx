import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileText, LoaderCircle, Save, Search, X } from 'lucide-react';
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
  const { lyrics, isLoading, error, saveLyrics, searchAutomatically, cancelSearch } = useLyrics(
    track,
    updateTrackLyrics
  );

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

  const activeLine = useMemo(() => {
    if (!lyrics || lyrics.format !== 'synced') return -1;
    return lyrics.lines.reduce(
      (activeIndex, line, index) =>
        line.startTimeMs !== undefined && line.startTimeMs <= seek * 1000 ? index : activeIndex,
      -1
    );
  }, [lyrics, seek]);

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
    setIsOpen(true);
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
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePanel();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lyrics-title"
            className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-main)] shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--glass-border)] px-4 py-4 sm:px-5">
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

            <div className="min-h-0 overflow-y-auto p-4 custom-scrollbar sm:p-5">
              {lyrics ? (
                <div className="space-y-2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4 text-center">
                  {lyrics.lines.map((line, index) => (
                    <p
                      key={`${line.startTimeMs ?? 'plain'}-${index}`}
                      className={`text-sm leading-7 transition ${
                        index === activeLine
                          ? 'scale-[1.02] font-black text-[var(--accent-primary)]'
                          : 'text-[var(--text-main)]/85'
                      }`}
                    >
                      {line.text}
                    </p>
                  ))}
                </div>
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
                  className="mt-2 min-h-40 w-full resize-y rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-3 text-sm font-normal normal-case tracking-normal text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
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

            <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-[var(--glass-border)] p-4">
              <button
                type="button"
                onClick={openExternalSearch}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                <ExternalLink size={14} />
                Letras.com
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => void searchAutomatically()}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-50"
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
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black ${
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
