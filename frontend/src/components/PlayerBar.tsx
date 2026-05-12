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
    <div className="w-full h-16 md:h-24 px-4 md:px-6 flex items-center justify-between transition-all duration-500 bg-black/80 md:bg-transparent backdrop-blur-xl md:backdrop-blur-0">
      {/* 1. INFO CANCIÓN */}
      <div className="flex items-center gap-3 md:gap-4 w-[60%] md:w-[30%] min-w-0">
        <div className="relative shrink-0 group">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="w-10 h-10 md:w-14 md:h-14 rounded-lg object-cover shadow-lg border border-white/10"
          />
        </div>
        <div className="flex flex-col truncate">
          <h4 className="text-[var(--text-main)] text-sm md:text-base font-bold truncate">
            {currentTrack.title}
          </h4>
          <p className="text-[var(--text-muted)] text-[10px] md:text-xs font-medium uppercase tracking-wider truncate">
            {currentTrack.artist}
          </p>
        </div>
        <button className="text-[var(--text-muted)] hover:text-red-500 transition-colors ml-2 hidden lg:block">
          <Heart size={18} />
        </button>
      </div>

      {/* 2. CONTROLES (Móvil: Solo Play/Pause | Desktop: Full) */}
      <div className="flex flex-col items-center flex-1 max-w-[45%] gap-2">
        <div className="flex items-center gap-4 md:gap-8">
          <button className="text-[var(--text-muted)] hover:text-blue-500 transition-colors hidden md:block">
            <Shuffle size={16} />
          </button>

          <button className="text-[var(--text-main)] opacity-70 hover:opacity-100 transition-all active:scale-90 hidden md:block">
            <SkipBack size={24} fill="currentColor" />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-all shadow-xl active:scale-95"
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

          <button className="text-[var(--text-muted)] hover:text-blue-500 transition-colors hidden md:block">
            <Repeat size={16} />
          </button>
        </div>

        {/* BARRA DE PROGRESO DESKTOP */}
        <div className="w-full hidden md:flex items-center gap-4 group/progress">
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-10 text-right tabular-nums">
            {formatTime(seek)}
          </span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full relative overflow-hidden group-hover/progress:h-2 transition-all">
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
              className="absolute inset-y-0 left-0 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-10 tabular-nums">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 3. VOLUMEN (SOLO DESKTOP) */}
      <div className="hidden md:flex items-center justify-end gap-3 w-[25%] group/vol">
        <button
          onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
          className="text-[var(--text-muted)] hover:text-white"
        >
          {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <div className="relative w-24 h-1 bg-white/10 rounded-full overflow-hidden">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
          />
          <div
            className="h-full bg-white group-hover/vol:bg-blue-500 transition-colors"
            style={{ width: `${volume * 100}%` }}
          />
        </div>
      </div>

      {/* BARRA DE PROGRESO MINI (Móvil - Al borde inferior del bar) */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
