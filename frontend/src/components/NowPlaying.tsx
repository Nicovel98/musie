import {
  Heart,
  MoreHorizontal,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  ChevronDown,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { useVisualizer } from '../hooks/useVisualizer';

export const NowPlaying = ({ setView }: { setView: (v: 'home' | 'library') => void }) => {
  const { currentTrack, isPlaying, togglePlay, seek, duration, setSeek, volume, setVolume } =
    usePlayerStore();
  const audioData = useVisualizer();

  if (!currentTrack) return null;

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${Math.floor(s % 60)
      .toString()
      .padStart(2, '0')}`;

  const progressPercent = (seek / duration) * 100 || 0;

  return (
    <div className="flex-1 h-full flex flex-col items-center justify-between p-4 md:p-10 relative overflow-hidden bg-[#080808]">
      {/* 1. FONDO DINÁMICO (Blur) */}
      <div className="absolute inset-0 -z-10 opacity-20 blur-[140px] scale-150 transition-all duration-1000">
        <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="max-w-4xl w-full h-full flex flex-col justify-between items-center gap-2">
        {/* 2. CABECERA (Compacta) */}
        <div className="w-full flex justify-between items-center shrink-0 px-2 py-2">
          <button
            onClick={() => setView('library')}
            className="p-2 text-white/40 hover:text-white transition-all active:scale-90"
          >
            <ChevronDown size={32} strokeWidth={2.5} />
          </button>
          <span className="text-xs uppercase tracking-[0.5em] text-white/30 font-black">
            Now Playing
          </span>
          <button className="text-white/40 hover:text-white">
            <MoreHorizontal size={24} />
          </button>
        </div>

        {/* 3. PORTADA GIGANTE */}
        <div className="relative group flex-1 flex items-center justify-center min-h-0 w-full px-4">
          <div className="absolute inset-0 bg-blue-600/5 rounded-full blur-[100px]" />
          <img
            src={currentTrack.coverUrl}
            alt=""
            className="h-full max-h-[380px] md:max-h-[550px] aspect-square object-cover rounded-[48px] shadow-2xl border border-white/5 transition-transform duration-700 hover:scale-[1.02]"
          />
        </div>

        {/* 4. INFO PISTA CENTRADA (Discreta) */}
        <div className="w-full flex items-center justify-center px-8 shrink-0 relative py-2">
          <div className="flex flex-col items-center text-center max-w-[80%]">
            <h2 className="text-[clamp(1.25rem,4.5vw,1.9rem)] font-black text-white tracking-tighter leading-tight truncate w-full">
              {currentTrack.title}
            </h2>
            <p className="text-[clamp(0.75rem,1.5vw,.9rem)] text-blue-400/70 font-bold tracking-[0.25em] uppercase mt-1">
              {currentTrack.artist}
            </p>
          </div>
          <button className="absolute right-0 text-gray-500 hover:text-red-500 active:scale-125 hidden md:block">
            <Heart size={28} className="hover:fill-red-500 transition-colors" />
          </button>
        </div>

        {/* 5. VISUALIZER CON GRADIENTE & SCRUBBING */}
        <div className="w-full px-8 shrink-0">
          <div className="relative h-14 md:h-18 flex items-end justify-center gap-[3px] mb-3">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={seek}
              onChange={(e) => setSeek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
            />
            {Array.from(audioData)
              .slice(0, 50)
              .map((v, i) => {
                const barPos = (i / 50) * 100;
                const isPlayed = barPos < progressPercent;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-75 ${
                      isPlayed
                        ? 'bg-gradient-to-t from-blue-600 to-purple-500 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                        : 'bg-white/10 opacity-30'
                    }`}
                    style={{ height: `${Math.max(20, (v / 255) * 100)}%` }}
                  />
                );
              })}
          </div>
          <div className="flex justify-between items-center font-mono text-xs md:text-sm text-gray-500 font-bold tracking-tighter px-1">
            <span>{formatTime(seek)}</span>
            <div className="h-[1px] flex-1 mx-6 bg-white/5 relative">
              <div
                className="absolute inset-y-0 left-0 bg-blue-500/30"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* 6. CONTROLES & VOLUMEN GRADIENTE (0-200%) */}
        <div className="w-full max-w-sm flex flex-col gap-6 pb-6 shrink-0 mt-4">
          <div className="flex items-center justify-between px-4">
            <button className="text-white/30 hover:text-blue-500">
              <Shuffle size={20} />
            </button>
            <div className="flex items-center gap-8">
              <button className="text-white/60 hover:text-white transition-all active:scale-90">
                <SkipBack size={32} fill="currentColor" />
              </button>
              <button
                onClick={togglePlay}
                className="w-16 h-16 flex items-center justify-center bg-white text-black rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? (
                  <Pause size={30} fill="black" />
                ) : (
                  <Play size={30} fill="black" className="ml-1" />
                )}
              </button>
              <button className="text-white/60 hover:text-white transition-all active:scale-90">
                <SkipForward size={32} fill="currentColor" />
              </button>
            </div>
            <button className="text-white/30 hover:text-blue-500">
              <Repeat size={20} />
            </button>
          </div>

          {/* BARRA DE VOLUMEN TÁCTIL CON GRADIENTE */}
          <div className="flex items-center gap-4 px-4 group/vol">
            <button
              onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
              className="text-gray-500 hover:text-white shrink-0"
            >
              {volume === 0 ? <VolumeX size={22} /> : <Volume1 size={22} />}
            </button>

            <div className="flex-1 relative h-10 flex items-center">
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
              />
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden relative">
                {/* Marca del 100% */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 z-10" />
                <div
                  className={`h-full transition-all ${
                    volume > 1
                      ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-red-500'
                      : 'bg-gradient-to-r from-blue-700 to-blue-400'
                  }`}
                  style={{ width: `${(volume / 2) * 100}%` }}
                />
              </div>
              <div
                className={`absolute w-4 h-4 rounded-full shadow-xl pointer-events-none ${
                  volume > 1 ? 'bg-red-500' : 'bg-white'
                }`}
                style={{ left: `calc(${(volume / 2) * 100}% - 8px)` }}
              />
            </div>

            {/* BOTÓN PARA PONER AL 100% (Volume2) */}
            <button
              onClick={() => setVolume(1.0)}
              className="text-gray-500 hover:text-white shrink-0 transition-colors active:scale-90"
              title="Set to 100%"
            >
              <Volume2 size={22} />
            </button>

            <span
              className={`text-xs font-mono w-12 text-right font-black transition-colors ${
                volume > 1 ? 'text-red-500' : 'text-gray-400'
              }`}
            >
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
