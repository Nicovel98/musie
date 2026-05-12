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
    <footer
      className="
  w-full h-20 bg-white/[0.03] backdrop-blur-2xl border border-white/10
  md:rounded-2xl flex items-center justify-between px-4 md:px-6
  shadow-[0_-10px_40px_rgba(0,0,0,0.5)]
  mb-2 md:mb-6 md:mx-auto md:max-w-[95%]
"
    >
      {/* 1. INFO CANCIÓN (IZQUIERDA) */}
      <div className="flex items-center gap-4 w-[30%] min-w-0">
        <img
          src={currentTrack.coverUrl}
          alt={currentTrack.title}
          className="w-12 h-12 rounded-lg object-cover shadow-lg shrink-0"
        />
        <div className="flex flex-col truncate">
          <h4 className="text-white text-sm font-black truncate">{currentTrack.title}</h4>
          <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider truncate">
            {currentTrack.artist}
          </p>
        </div>
        <button className="text-gray-600 hover:text-red-500 transition-colors hidden sm:block ml-2">
          <Heart size={18} />
        </button>
      </div>

      {/* 2. CONTROLES Y PROGRESO (CENTRO) */}
      <div className="flex flex-col items-center flex-1 max-w-[45%] gap-2">
        <div className="flex items-center gap-5 md:gap-8">
          <button className="text-gray-500 hover:text-blue-500 transition-colors hidden sm:block">
            <Shuffle size={16} />
          </button>

          <button className="text-white/70 hover:text-white transition-all active:scale-90">
            <SkipBack size={24} fill="currentColor" />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 transition-all shadow-lg active:scale-95"
          >
            {isPlaying ? (
              <Pause size={20} fill="black" />
            ) : (
              <Play size={20} fill="black" className="ml-0.5" />
            )}
          </button>

          <button className="text-white/70 hover:text-white transition-all active:scale-90">
            <SkipForward size={24} fill="currentColor" />
          </button>

          <button className="text-gray-500 hover:text-blue-500 transition-colors hidden sm:block">
            <Repeat size={16} />
          </button>
        </div>

        {/* BARRA DE PROGRESO */}
        <div className="w-full flex items-center gap-3 group/progress">
          <span className="text-[10px] font-mono text-gray-500 w-8 text-right">
            {formatTime(seek)}
          </span>

          <div className="flex-1 h-1 bg-white/10 rounded-full relative">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={seek}
              onChange={(e) => setSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
            />
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full group-hover/progress:from-blue-500 group-hover/progress:to-purple-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <span className="text-[10px] font-mono text-gray-500 w-8">{formatTime(duration)}</span>
        </div>
      </div>

      {/* 3. VOLUMEN (DERECHA) */}
      <div className="flex items-center justify-end gap-3 w-[25%] group/vol">
        <button
          onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
          className="text-gray-500 hover:text-white transition-colors"
        >
          {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        <div className="relative w-24 h-1 hidden md:block">
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
          />
          <div className="w-full h-full bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-colors ${volume > 1 ? 'bg-red-500' : 'bg-gray-400 group-hover/vol:bg-blue-500'}`}
              style={{ width: `${(volume / 1.5) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
};
