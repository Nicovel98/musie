import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Heart } from 'lucide-react';
import { useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { VolumeControl } from './VolumeControl';

export const PlayerBar = () => {
  const { currentTrack, isPlaying, togglePlay, seek, duration, fastSeek, volume, setVolume } =
    usePlayerStore();
  const scrubResumeRef = useRef(false);
  const scrubActiveRef = useRef(false);
  const seekRafRef = useRef<number | null>(null);
  const pendingSeekRef = useRef<number | null>(null);

  if (!currentTrack) return null;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60) || 0;
    const secs = Math.floor(s % 60) || 0;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (seek / duration) * 100 || 0;

  const handleSeekChange = (value: string) => {
    const nextSeek = Number(value);
    if (!Number.isFinite(nextSeek)) return;

    pendingSeekRef.current = nextSeek;

    if (seekRafRef.current !== null) return;

    seekRafRef.current = requestAnimationFrame(() => {
      seekRafRef.current = null;
      const seekValue = pendingSeekRef.current;
      if (seekValue !== null) fastSeek(seekValue);
    });
  };

  const handleScrubStart = () => {
    if (scrubActiveRef.current) return;

    scrubActiveRef.current = true;
    scrubResumeRef.current = isPlaying;

    if (isPlaying) {
      togglePlay();
    }
  };

  const handleScrubEnd = () => {
    if (!scrubActiveRef.current) return;

    scrubActiveRef.current = false;

    if (seekRafRef.current !== null) {
      cancelAnimationFrame(seekRafRef.current);
      seekRafRef.current = null;
    }

    const seekValue = pendingSeekRef.current;
    pendingSeekRef.current = null;

    if (seekValue !== null) {
      fastSeek(seekValue);
    }

    if (scrubResumeRef.current) {
      togglePlay();
    }

    scrubResumeRef.current = false;
  };

  return (
    /*
       Contenedor principal:
       - En móvil: bg-black/80 con blur para que destaque sobre el contenido.
       - En desktop: transparente porque App.tsx ya le da el fondo sólido.
    */
    <div className="glass-effect w-full h-[5.5rem] md:h-20 px-3 md:px-5 pb-3 md:pb-0 flex flex-col md:flex-row md:items-center md:justify-between transition-all duration-500 bg-[var(--glass-bg)] md:bg-transparent backdrop-blur-xl md:backdrop-blur-0">
      {/* MÓVIL: INFORMACIÓN + CONTROLES */}
      <div className="md:hidden w-full flex flex-col gap-1 pt-0">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-9 h-9 rounded-lg object-cover shrink-0 border border-[var(--glass-border)]"
          />
          <div className="min-w-0 flex-1 truncate">
            <h4 className="text-[13px] font-bold text-[var(--text-main)] truncate leading-none">
              {currentTrack.title}
            </h4>
            <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] truncate mt-0">
              {currentTrack.artist}
            </p>
          </div>
          <button className="mr-2 text-[var(--text-muted)] hover:text-red-500 transition-colors shrink-0">
            <Heart size={14} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-1 px-0">
          <button className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] active:text-[var(--text-main)] transition-colors">
            <Shuffle size={14} />
          </button>

          <button
            aria-label="Previous track"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] active:text-[var(--text-main)] transition-colors"
          >
            <SkipBack size={16} />
          </button>

          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-9 h-9 flex items-center justify-center bg-[var(--text-main)] text-[var(--bg-main)] rounded-full shadow-xl active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <button
            aria-label="Next track"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] active:text-[var(--text-main)] transition-colors"
          >
            <SkipForward size={16} />
          </button>

          <button className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] active:text-[var(--text-main)] transition-colors">
            <Repeat size={14} />
          </button>
        </div>
      </div>

      {/* 1. INFO CANCIÓN */}
      <div className="hidden md:flex items-center gap-2 md:gap-2 w-[60%] md:w-[28%] min-w-0">
        <div className="relative shrink-0 group">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-9 h-9 md:w-14 md:h-14 rounded-lg object-cover shadow-lg border border-[var(--glass-border)]"
          />
        </div>
        <div className="flex flex-col truncate">
          <h4 className="text-[var(--text-main)] text-sm md:text-[15px] font-bold truncate">
            {currentTrack.title}
          </h4>
          <p className="text-[var(--text-muted)] text-[10px] md:text-[11px] font-medium uppercase tracking-wider truncate">
            {currentTrack.artist}
          </p>
        </div>
        <button className="text-[var(--text-muted)] hover:text-red-500 transition-colors ml-2 hidden lg:block">
          <Heart size={18} />
        </button>
      </div>

      {/* 2. CONTROLES (Móvil: Solo Play/Pause | Desktop: Full) */}
      <div className="hidden md:flex flex-col items-center flex-1 max-w-[44%] gap-0.5">
        <div className="flex items-center gap-2 md:gap-4">
          <button className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors hidden md:block">
            <Shuffle size={16} />
          </button>

          <button
            aria-label="Previous track"
            className="text-[var(--text-main)] opacity-70 hover:opacity-100 transition-all active:scale-90 hidden md:block"
          >
            <SkipBack size={24} fill="currentColor" />
          </button>

          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center bg-[var(--text-main)] text-[var(--bg-main)] rounded-full hover:scale-105 transition-all shadow-xl active:scale-95"
          >
            {isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <button
            aria-label="Next track"
            className="text-[var(--text-main)] opacity-70 hover:opacity-100 transition-all active:scale-90 hidden md:block"
          >
            <SkipForward size={24} fill="currentColor" />
          </button>

          <button className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors hidden md:block">
            <Repeat size={16} />
          </button>
        </div>

        {/* BARRA DE PROGRESO DESKTOP */}
        <div className="w-full hidden md:flex items-center gap-2 group/progress mb-1">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-10 text-right tabular-nums">
            {formatTime(seek)}
          </span>
          <div className="flex-1 h-1 bg-[var(--bg-elevated)] rounded-full relative overflow-hidden group-hover/progress:h-1.5 transition-all">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={seek}
              onPointerDown={handleScrubStart}
              onPointerUp={handleScrubEnd}
              onPointerCancel={handleScrubEnd}
              onChange={(e) => handleSeekChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
            />
            <div
              className="absolute inset-y-0 left-0 bg-[var(--accent-primary)] shadow-[0_0_10px_rgba(59,130,246,0.35)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-10 tabular-nums">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 3. VOLUMEN (SOLO DESKTOP) */}
      <div className="hidden md:flex items-center justify-end w-[28%]">
        <div className="w-full max-w-[280px] lg:max-w-[320px] xl:max-w-[340px]">
          <VolumeControl volume={volume} onVolumeChange={setVolume} showLabel={true} />
        </div>
      </div>

      {/* BARRA DE PROGRESO MINI (Móvil - Al borde inferior del bar) */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--bg-elevated)]">
        <div
          className="h-full bg-[var(--accent-primary)] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
