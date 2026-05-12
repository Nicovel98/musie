import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
  Heart,
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';

export const PlayerBar = () => {
  const { currentTrack, isPlaying, togglePlay, seek, duration, setSeek, volume, setVolume } =
    usePlayerStore();

  if (!currentTrack) return null;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60) || 0;
    const secs = Math.floor(s % 60) || 0;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (seek / duration) * 100 || 0;

  return (
    /*
       Contenedor principal:
       - En móvil: bg-black/80 con blur para que destaque sobre el contenido.
       - En desktop: transparente porque App.tsx ya le da el fondo sólido.
    */
    <div className="glass-effect w-full h-[5rem] md:h-24 px-3 md:px-6 flex flex-col md:flex-row md:items-center md:justify-between transition-all duration-500 bg-[var(--glass-bg)] md:bg-transparent backdrop-blur-xl md:backdrop-blur-0">
      {/* MÓVIL: INFORMACIÓN + CONTROLES */}
      <div className="md:hidden w-full flex flex-col gap-0.6 pt-0">
        <div className="flex items-center gap-1 min-w-0">
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

        <div className="flex items-center justify-between gap-0.1 px-0">
          <button className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] active:text-[var(--text-main)] transition-colors">
            <Shuffle size={14} />
          </button>

          <button className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] active:text-[var(--text-main)] transition-colors">
            <SkipBack size={16} />
          </button>

          <button
            onClick={togglePlay}
            className="w-9 h-9 flex items-center justify-center bg-[var(--text-main)] text-[var(--bg-main)] rounded-full shadow-xl active:scale-95 transition-all"
          >
            {isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <button className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] active:text-[var(--text-main)] transition-colors">
            <SkipForward size={16} />
          </button>

          <button className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] active:text-[var(--text-main)] transition-colors">
            <Repeat size={14} />
          </button>
        </div>
      </div>

      {/* 1. INFO CANCIÓN */}
      <div className="hidden md:flex items-center gap-3 md:gap-3 w-[60%] md:w-[28%] min-w-0">
        <div className="relative shrink-0 group">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover shadow-lg border border-[var(--glass-border)]"
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
      <div className="hidden md:flex flex-col items-center flex-1 max-w-[44%] gap-1">
        <div className="flex items-center gap-3 md:gap-6">
          <button className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors hidden md:block">
            <Shuffle size={16} />
          </button>

          <button className="text-[var(--text-main)] opacity-70 hover:opacity-100 transition-all active:scale-90 hidden md:block">
            <SkipBack size={24} fill="currentColor" />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center bg-[var(--text-main)] text-[var(--bg-main)] rounded-full hover:scale-105 transition-all shadow-xl active:scale-95"
          >
            {isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <button className="text-[var(--text-main)] opacity-70 hover:opacity-100 transition-all active:scale-90 hidden md:block">
            <SkipForward size={24} fill="currentColor" />
          </button>

          <button className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors hidden md:block">
            <Repeat size={16} />
          </button>
        </div>

        {/* BARRA DE PROGRESO DESKTOP */}
        <div className="w-full hidden md:flex items-center gap-3 group/progress">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-10 text-right tabular-nums">
            {formatTime(seek)}
          </span>
          <div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full relative overflow-hidden group-hover/progress:h-2 transition-all">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={seek}
              onChange={(e) => setSeek(parseFloat(e.target.value))}
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
      <div className="hidden md:flex items-center justify-end gap-1.5 w-[28%] group/vol">
        <button
          onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-90 transition-all shrink-0"
        >
          {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <div className="relative w-16 h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
          />
          <div
            className={`h-full transition-colors ${volume > 1 ? 'bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-red-500' : 'bg-[var(--text-main)] group-hover/vol:bg-[var(--accent-primary)]'}`}
            style={{ width: `${(volume / 2) * 100}%` }}
          />
        </div>
        <button
          onClick={() => setVolume(1)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-90 transition-all shrink-0"
        >
          <Volume2 size={16} />
        </button>
        <span
          className={`text-[9px] font-mono w-10 text-right font-black tabular-nums transition-colors ${volume > 1 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}
        >
          {Math.round(volume * 100)}%
        </span>
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
