import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, X } from 'lucide-react';
import {
  downloadAutomaticCover,
  findAutomaticCoverOptions,
  getYouTubeThumbnail,
  type AutomaticCoverOption,
} from '../store/trackMetadata';
import { buildYouTubeSearchUrl } from '../utils/letrasUrl';
import type { Track } from '../types/track';

interface CoverSearchModalProps {
  track: Track;
  onClose: () => void;
  updateTrackMetadata: (trackId: string, metadata: Pick<Track, 'coverUrl'>) => void;
}

export const CoverSearchModal = ({
  track,
  onClose,
  updateTrackMetadata,
}: CoverSearchModalProps) => {
  const [coverOptions, setCoverOptions] = useState<AutomaticCoverOption[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const [choiceLoading, setChoiceLoading] = useState(false);
  const [choiceError, setChoiceError] = useState<string | null>(null);
  const [youtubeCover, setYoutubeCover] = useState('');
  const [isYouTubeMode, setIsYouTubeMode] = useState(false);
  const [youtubeCoverError, setYoutubeCoverError] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const coverDownloadControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    void findAutomaticCoverOptions(track, controller.signal)
      .then((options) => {
        if (!cancelled) setCoverOptions(options);
      })
      .catch(() => {
        if (!cancelled && !controller.signal.aborted) setCoverOptions([]);
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
      coverDownloadControllerRef.current?.abort();
    };
  }, [track]);

  useEffect(() => {
    const focusDialog = () => {
      dialogRef.current?.scrollIntoView({ block: 'center', inline: 'nearest' });
      dialogRef.current?.focus({ preventScroll: true });
    };
    const animationFrame = window.requestAnimationFrame(focusDialog);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !choiceLoading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [choiceLoading, onClose]);

  const chooseCover = async (option: AutomaticCoverOption) => {
    setChoiceLoading(true);
    setChoiceError(null);
    const controller = new AbortController();
    coverDownloadControllerRef.current = controller;
    try {
      const coverUrl = await downloadAutomaticCover(option.imageUrl, controller.signal);
      if (!coverUrl) throw new Error('Cover download failed');
      updateTrackMetadata(track.id, { coverUrl });
      onClose();
    } catch (reason) {
      if ((reason as Error)?.name !== 'AbortError') {
        setChoiceError('No se pudo descargar esta portada. Prueba otra opción.');
      }
    } finally {
      if (coverDownloadControllerRef.current === controller) {
        coverDownloadControllerRef.current = null;
      }
      setChoiceLoading(false);
    }
  };

  const applyYouTubeCover = () => {
    const coverUrl = getYouTubeThumbnail(youtubeCover);
    if (!coverUrl) {
      setYoutubeCoverError(true);
      return;
    }
    updateTrackMetadata(track.id, { coverUrl });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !choiceLoading) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cover-search-dialog-title"
        tabIndex={-1}
        className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-main)] shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--glass-border)] px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">
              Portada
            </p>
            <h3
              id="cover-search-dialog-title"
              className="truncate text-lg font-black text-[var(--text-main)] sm:text-xl"
            >
              {track.title}
            </h3>
            <p className="truncate text-xs text-[var(--text-muted)]">{track.artist}</p>
          </div>
          <button
            type="button"
            aria-label="Close cover choices"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-main)]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto p-4 custom-scrollbar sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-[var(--text-main)]">Resultados automáticos</p>
            <button
              type="button"
              onClick={() => {
                window.open(
                  buildYouTubeSearchUrl(track.artist, track.title),
                  '_blank',
                  'noopener,noreferrer'
                );
                setIsYouTubeMode(true);
              }}
              className="rounded-full border border-[var(--glass-border)] px-3 py-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              Buscar en YouTube
            </button>
          </div>
          {isYouTubeMode ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-muted)]">
                Pega el enlace del vídeo seleccionado para usar su miniatura.
              </p>
              <input
                autoFocus
                value={youtubeCover}
                onChange={(event) => {
                  setYoutubeCover(event.target.value);
                  setYoutubeCoverError(false);
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                aria-label="YouTube URL"
                className="w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 py-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
              />
              {youtubeCoverError && (
                <p className="text-sm text-red-400">Pega un enlace válido de YouTube.</p>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsYouTubeMode(false);
                  setYoutubeCover('');
                  setYoutubeCoverError(false);
                }}
                className="mr-2 rounded-full border border-[var(--glass-border)] px-4 py-2 text-xs font-bold text-[var(--text-muted)]"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={applyYouTubeCover}
                className="rounded-full bg-[var(--accent-primary)] px-4 py-2 text-xs font-black text-[var(--bg-main)]"
              >
                Usar portada
              </button>
            </div>
          ) : isSearching ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-[var(--text-muted)]">
              <LoaderCircle size={18} className="animate-spin" />
              Buscando portadas automáticamente...
            </div>
          ) : coverOptions.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {coverOptions.map((option) => (
                <button
                  key={option.imageUrl}
                  type="button"
                  disabled={choiceLoading}
                  onClick={() => void chooseCover(option)}
                  className="min-w-0 overflow-hidden rounded-2xl border border-[var(--glass-border)] text-left transition hover:border-[var(--accent-primary)] disabled:opacity-50"
                >
                  <img
                    src={option.imageUrl}
                    alt={`${option.title} - ${option.album}`}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                  <span className="block p-2.5 sm:p-3">
                    <span className="block truncate text-sm font-bold text-[var(--text-main)]">
                      {option.album}
                    </span>
                    <span className="block truncate text-xs text-[var(--text-muted)]">
                      {option.source} · {option.artist}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-[var(--text-muted)]">
              No se encontraron portadas automáticas. Prueba la opción de YouTube.
            </p>
          )}
          {choiceError && <p className="mt-4 text-sm text-red-400">{choiceError}</p>}
        </div>
      </div>
    </div>
  );
};
