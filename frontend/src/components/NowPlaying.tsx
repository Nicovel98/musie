import { useEffect, useState } from 'react';
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
  Moon,
  Sun,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import heroThumbnail from '../assets/hero.png';
import { usePlayerStore } from '../store/usePlayerStore';
import { useVisualizer } from '../hooks/useVisualizer';

interface NowPlayingProps {
  setView: (view: 'home' | 'library') => void;
}

export const NowPlaying = ({ setView }: NowPlayingProps) => {
  const [isLightMode, setIsLightMode] = useState(
    document.documentElement.classList.contains('light')
  );
  const {
    songs,
    currentTrack,
    lastTrack,
    isPlaying,
    togglePlay,
    seek,
    duration,
    setSeek,
    volume,
    setVolume,
    setTrack,
  } = usePlayerStore();

  const audioData = useVisualizer();

  const featuredTrack = currentTrack ?? lastTrack ?? songs[songs.length - 1] ?? songs[0] ?? null;

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${Math.floor(s % 60)
      .toString()
      .padStart(2, '0')}`;

  const progressPercent = (seek / duration) * 100 || 0;

  useEffect(() => {
    const syncTheme = () => {
      setIsLightMode(document.documentElement.classList.contains('light'));
    };

    window.addEventListener('themechange', syncTheme);
    return () => window.removeEventListener('themechange', syncTheme);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('light');
    window.dispatchEvent(new Event('themechange'));
  };

  if (!currentTrack) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-between p-4 pb-mobile-controls md:p-10 relative overflow-hidden transition-colors duration-500 bg-[var(--bg-main)]">
        <div className="absolute inset-0 -z-10 opacity-20 blur-[140px] scale-150 transition-all duration-1000">
          <img
            src={featuredTrack?.coverUrl || heroThumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="w-full max-w-4xl flex flex-col items-center justify-between gap-4 h-full">
          <div className="w-full flex justify-between items-center shrink-0 px-2 py-2">
            <button
              onClick={() => setView('library')}
              className="p-2 -ml-2 text-[var(--text-main)] opacity-40 hover:opacity-100 transition-all active:scale-90"
            >
              <ChevronDown size={32} strokeWidth={2.5} />
            </button>
            <span className="text-[10px] uppercase tracking-[0.5em] text-[var(--text-main)] opacity-30 font-black">
              Now Playing
            </span>
            <button className="text-[var(--text-main)] opacity-40 hover:opacity-100 transition-colors">
              <MoreHorizontal size={24} />
            </button>
          </div>

          <div className="flex-1 w-full flex flex-col items-center justify-center gap-6 min-h-0">
            <button
              onClick={() => featuredTrack && setTrack(featuredTrack)}
              className="group relative w-full max-w-[320px] aspect-square rounded-[40px] overflow-hidden border border-[var(--glass-border)] shadow-[0_40px_80px_rgba(0,0,0,0.35)] transition-transform duration-500 hover:scale-[1.02] active:scale-[0.98]"
            >
              <img
                src={featuredTrack?.coverUrl || heroThumbnail}
                alt={featuredTrack ? featuredTrack.title : 'Musie'}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-3 text-left">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.5em] text-white/60 font-black">
                    {featuredTrack ? 'Featured thumbnail' : 'Home'}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white tracking-tighter truncate">
                    {featuredTrack ? featuredTrack.title : 'Tu reproductor está listo'}
                  </h2>
                  <p className="text-sm text-white/70 font-semibold uppercase tracking-[0.25em] truncate">
                    {featuredTrack ? featuredTrack.artist : 'Entra a Library para cargar música'}
                  </p>
                </div>
                {featuredTrack ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-2xl transition-transform group-hover:scale-105">
                    <Play size={20} fill="currentColor" className="ml-0.5" />
                  </div>
                ) : null}
              </div>
            </button>

            <div className="max-w-md text-center space-y-3 px-6">
              <h3 className="text-[clamp(1.35rem,4vw,2rem)] font-black tracking-tighter text-[var(--text-main)]">
                Home
              </h3>
              <p className="text-sm md:text-base text-[var(--text-muted)] leading-relaxed">
                {featuredTrack
                  ? 'Toca el thumbnail para iniciar la reproducción y entrar al modo Now Playing.'
                  : 'Sube o selecciona una canción desde Library para que aparezca aquí el thumbnail inicial.'}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setView('library')}
                  className="px-5 py-3 rounded-full bg-[var(--text-main)] text-[var(--bg-main)] font-black text-sm uppercase tracking-[0.2em] hover:scale-105 transition-transform"
                >
                  Ir a Library
                </button>
                {featuredTrack ? (
                  <button
                    onClick={() => setTrack(featuredTrack)}
                    className="px-5 py-3 rounded-full border border-[var(--glass-border)] text-[var(--text-main)] font-black text-sm uppercase tracking-[0.2em] hover:bg-[var(--glass-bg)] transition-colors"
                  >
                    Play
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col items-center justify-between p-4 pb-mobile-controls md:p-10 relative overflow-hidden transition-colors duration-500 bg-[var(--bg-main)]">
      {/* 1. FONDO DINÁMICO (Blur Profundo) */}
      <div className="absolute inset-0 -z-10 opacity-20 blur-[140px] scale-150 transition-all duration-1000">
        <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="max-w-4xl w-full h-full flex flex-col justify-between items-center gap-2">
        {/* 2. CABECERA (Transparente) */}
        <div className="w-full flex justify-between items-center shrink-0 px-2 py-2">
          <button
            onClick={() => setView('library')}
            className="p-2 -ml-2 text-[var(--text-main)] opacity-40 hover:opacity-100 transition-all active:scale-90"
          >
            <ChevronDown size={32} strokeWidth={2.5} />
          </button>
          <span className="text-[10px] uppercase tracking-[0.5em] text-[var(--text-main)] opacity-30 font-black">
            Now Playing
          </span>
          <button className="text-[var(--text-main)] opacity-40 hover:opacity-100 transition-colors">
            <MoreHorizontal size={24} />
          </button>
        </div>

        {/* 3. PORTADA GIGANTE (Efecto Glass) */}
        <div className="relative group flex-1 flex items-center justify-center min-h-0 w-full px-4 my-2">
          <div className="absolute inset-0 bg-blue-600/5 rounded-full blur-[100px]" />
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="h-full max-h-[380px] md:max-h-[550px] aspect-square object-cover rounded-[48px] shadow-[0_40px_80px_rgba(0,0,0,0.4)] border border-[var(--glass-border)] transition-transform duration-700 hover:scale-[1.02]"
          />
        </div>

        {/* 4. INFO PISTA CENTRADA (Tipografía Fluida) */}
        <div className="w-full flex items-center justify-center px-8 shrink-0 relative py-2">
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] shadow-[var(--glass-shadow)] backdrop-blur-xl hover:text-[var(--text-main)] active:scale-95 transition-all shrink-0"
            onClick={toggleTheme}
          >
            {isLightMode ? (
              <Sun size={18} className="md:size-[20px] transition-colors" />
            ) : (
              <Moon size={18} className="md:size-[20px] transition-colors" />
            )}
          </button>
          <div className="flex flex-col items-center text-center max-w-[80%]">
            <h2 className="text-[clamp(1.25rem,4.5vw,1.9rem)] font-black text-[var(--text-main)] tracking-tighter leading-tight truncate w-full">
              {currentTrack.title}
            </h2>
            <p className="text-[clamp(0.75rem,1.5vw,0.9rem)] text-blue-500 font-bold tracking-[0.25em] uppercase mt-1 opacity-80">
              {currentTrack.artist}
            </p>
          </div>
          <button className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] shadow-[var(--glass-shadow)] backdrop-blur-xl hover:text-red-500 active:scale-95 transition-all shrink-0">
            <Heart size={18} className="md:size-[20px] hover:fill-red-500 transition-colors" />
          </button>
        </div>

        {/* 5. VISUALIZER CON GRADIENTE VERTICAL */}
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
                const isPlayed = (i / 50) * 100 < progressPercent;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-75 ${
                      isPlayed
                        ? 'bg-gradient-to-t from-blue-600 to-purple-500 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                        : 'bg-gray-500/20 opacity-30'
                    }`}
                    style={{ height: `${Math.max(20, (v / 255) * 100)}%` }}
                  />
                );
              })}
          </div>
          <div className="flex justify-between items-center px-1 font-mono text-xs md:text-sm text-gray-500 font-bold tracking-tighter">
            <span className="w-12">{formatTime(seek)}</span>
            <div className="h-[1px] flex-1 mx-6 bg-gray-500/10 relative">
              <div
                className="absolute inset-y-0 left-0 bg-blue-500/30"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="w-12 text-right">{formatTime(duration)}</span>
          </div>
        </div>

        {/* 6. CONTROLES Y VOLUMEN SOBREAMPLIFICADO (Glass Style) */}
        <div className="w-full max-w-sm flex flex-col gap-6 pb-6 shrink-0 mt-4">
          <div className="flex items-center justify-between px-4">
            <button className="text-gray-500 hover:text-blue-500">
              <Shuffle size={20} />
            </button>
            <div className="flex items-center gap-8">
              <button className="text-[var(--text-main)] opacity-60 hover:opacity-100 active:scale-90">
                <SkipBack size={32} fill="currentColor" />
              </button>
              <button
                onClick={togglePlay}
                className="w-16 h-16 flex items-center justify-center bg-[var(--text-main)] text-[var(--bg-main)] rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                {isPlaying ? (
                  <Pause size={30} fill="currentColor" />
                ) : (
                  <Play size={30} fill="currentColor" className="ml-1" />
                )}
              </button>
              <button className="text-[var(--text-main)] opacity-60 hover:opacity-100 active:scale-90">
                <SkipForward size={32} fill="currentColor" />
              </button>
            </div>
            <button className="text-gray-500 hover:text-blue-500">
              <Repeat size={20} />
            </button>
          </div>

          {/* VOLUMEN TÁCTIL (0-200%) CON BOTÓN DE RESET 100% */}
          <div className="flex items-center gap-4 px-4 group/vol">
            <button
              onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
              className="text-gray-500 hover:text-blue-500 shrink-0"
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
              <div className="flex-1 h-2 bg-gray-500/10 rounded-full overflow-hidden relative border border-[var(--glass-border)]">
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
                className={`absolute w-4 h-4 rounded-full shadow-xl pointer-events-none transition-transform ${volume > 1 ? 'bg-red-500' : 'bg-[var(--text-main)]'}`}
                style={{ left: `calc(${(volume / 2) * 100}% - 8px)` }}
              />
            </div>

            <button
              onClick={() => setVolume(1.0)}
              className="text-gray-500 hover:text-blue-500 shrink-0 transition-all active:scale-90"
            >
              <Volume2 size={22} />
            </button>

            <span
              className={`text-xs font-mono w-12 text-right font-black transition-colors ${volume > 1 ? 'text-red-500' : 'text-gray-500'}`}
            >
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
