import { ExternalLink, FileText, LoaderCircle, Save, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useLyrics } from '../hooks/useLyrics';
import { lyricsToText, parseLyricsText } from '../types/lyrics';
import { buildLetrasSearchUrl } from '../utils/letrasUrl';

export const LyricsView = () => {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const updateTrackMetadata = usePlayerStore((state) => state.updateTrackMetadata);
  const [draft, setDraft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { lyrics, isLoading, error, saveLyrics, searchAutomatically, cancelSearch } = useLyrics(
    currentTrack,
    (trackId, nextLyrics) => updateTrackMetadata(trackId, { lyrics: nextLyrics })
  );

  if (!currentTrack) {
    return (
      <section className="mx-auto flex h-full w-full max-w-4xl items-center justify-center p-6">
        <div className="max-w-md rounded-3xl border border-dashed border-[var(--glass-border)] p-8 text-center">
          <FileText className="mx-auto mb-4 text-[var(--accent-primary)]" size={32} />
          <h1 className="text-xl font-black text-[var(--text-main)]">Lyrics</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Reproduce una canción para consultar o editar sus lyrics.
          </p>
        </div>
      </section>
    );
  }

  const openExternalSearch = () => {
    window.open(
      buildLetrasSearchUrl(currentTrack.artist, currentTrack.title),
      '_blank',
      'noopener,noreferrer'
    );
  };

  const beginEditing = () => {
    setDraft(lyrics ? lyricsToText(lyrics) : '');
    setIsEditing(true);
  };
  const isLongTrack =
    currentTrack.durationSeconds !== undefined && currentTrack.durationSeconds > 15 * 60;

  const saveDraft = async () => {
    const nextLyrics = parseLyricsText(draft, 'manual');
    await saveLyrics(nextLyrics.lines.length > 0 ? nextLyrics : undefined);
    setIsEditing(false);
  };

  return (
    <section className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--accent-primary)]">
            Lyrics
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--text-main)]">
            {currentTrack.title}
          </h1>
          <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">
            {currentTrack.artist}
            {currentTrack.album ? ` · ${currentTrack.album}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openExternalSearch}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] px-4 py-2 text-xs font-bold text-[var(--text-muted)] transition hover:text-[var(--text-main)]"
          >
            <ExternalLink size={15} />
            Abrir Letras.com
          </button>
          <button
            type="button"
            onClick={() => (isLoading ? cancelSearch() : void searchAutomatically())}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-primary)] px-4 py-2 text-xs font-black text-[var(--bg-main)] transition hover:brightness-110"
          >
            {isLoading ? (
              <>
                <LoaderCircle size={15} className="animate-spin" />
                Cancelar búsqueda
              </>
            ) : (
              <>
                <Search size={15} />
                Buscar LRCLIB
              </>
            )}
          </button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.34fr)]">
        <article className="min-h-[420px] rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 shadow-[var(--glass-shadow)] sm:p-8">
          {lyrics ? (
            <div className="space-y-3 text-center sm:space-y-4">
              {lyrics.lines.map((line, index) => (
                <p
                  key={`${line.startTimeMs ?? 'plain'}-${index}`}
                  className="text-base leading-8 text-[var(--text-main)]/90 sm:text-lg"
                >
                  {line.text}
                </p>
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
              <FileText size={30} className="mb-3 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">
                No hay lyrics guardadas para esta canción.
              </p>
            </div>
          )}
        </article>

        <aside className="rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Herramientas
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Puedes buscar una versión automática o copiar lyrics desde Letras.com y pegarlas aquí.
          </p>
          <button
            type="button"
            onClick={beginEditing}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--glass-border)] px-4 py-3 text-sm font-black text-[var(--text-main)] transition hover:bg-[var(--bg-elevated)]"
          >
            <Save size={16} />
            Editar lyrics
          </button>
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}
          {isLongTrack && (
            <p className="mt-4 rounded-xl border border-[var(--accent-secondary)]/30 bg-[var(--accent-secondary)]/10 p-3 text-sm leading-6 text-[var(--text-main)]/85">
              Esta pista dura más de 15 minutos y puede contener un álbum completo, un concierto, un
              mix o un podcast. La búsqueda automática funciona mejor con canciones individuales;
              para obtener lyrics más precisas, importa cada canción por separado.
            </p>
          )}
        </aside>
      </div>

      {isEditing && (
        <div className="mt-5 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Editor manual
            </h2>
            <button
              type="button"
              onClick={() => void saveLyrics(undefined).then(() => setIsEditing(false))}
              className="inline-flex items-center gap-2 text-xs font-bold text-red-300 hover:text-red-200"
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
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-full px-4 py-2 text-xs font-bold text-[var(--text-muted)]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void saveDraft()}
              className="rounded-full bg-[var(--accent-primary)] px-4 py-2 text-xs font-black text-[var(--bg-main)]"
            >
              Guardar lyrics
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
