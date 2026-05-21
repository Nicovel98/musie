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
} from 'lucide-react';
import heroThumbnail from '../assets/hero.png';
import { usePlayerStore } from '../store/usePlayerStore';
import { useVisualizer } from '../hooks/useVisualizer';
import { VolumeControl } from './VolumeControl';

interface NowPlayingProps {
  setView: (view: 'home' | 'library') => void;
}

export const NowPlaying = ({ setView }: NowPlayingProps) => {
  const [isLightMode, setIsLightMode] = useState(
    document.documentElement.classList.contains('light')
  );
  const [barCount, setBarCount] = useState<number>(
    typeof window !== 'undefined' && window.innerWidth < 640 ? 36 : 50
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
    const handleResize = () => {
      if (window.innerWidth < 640) setBarCount(36);
      else if (window.innerWidth < 1024) setBarCount(44);
      else setBarCount(50);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('themechange', syncTheme);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('light');
    window.dispatchEvent(new Event('themechange'));
  };

  if (!currentTrack) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-between p-4 md:p-10 pb-10 md:pb-8 relative overflow-hidden transition-colors duration-500 bg-[var(--bg-main)]">
        <div className="absolute inset-0 -z-10 opacity-20 blur-[140px] scale-150 transition-all duration-1000">
          <img
            src={featuredTrack?.coverUrl || heroThumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="w-full max-w-4xl flex flex-col items-center justify-between gap-3 h-full">
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

          <div className="flex-1 w-full flex flex-col items-center justify-center gap-4 min-h-0">
            <button
              onClick={() => featuredTrack && setTrack(featuredTrack)}
              aria-label="Play featured track"
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
    <div className="flex-1 h-full flex flex-col items-center justify-between p-4 md:p-10 pb-8 md:pb-6 relative overflow-hidden transition-colors duration-500 bg-[var(--bg-main)]">
      {/* 1. FONDO DINÁMICO (Blur Profundo) */}
      <div className="absolute inset-0 -z-10 opacity-20 blur-[140px] scale-150 transition-all duration-1000">
        <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="max-w-4xl xl:max-w-6xl w-full h-full flex flex-col justify-between items-center gap-2 md:gap-3 pb-10">
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

        {/* 3. PORTADA GIGANTE (Efecto Glass - Responsivo) */}
        <div className="relative group flex-1 flex items-center justify-center min-h-0 w-full px-[clamp(1rem,5vw,2rem)] my-[clamp(0.25rem,1vw,0.5rem)]">
          <div className="absolute inset-0 bg-blue-600/5 rounded-full blur-[100px]" />
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="h-full max-h-[64vh] md:max-h-[72vh] aspect-square object-cover rounded-[clamp(24px,8vw,48px)] shadow-[0_40px_80px_rgba(0,0,0,0.4)] border border-[var(--glass-border)] transition-transform duration-700 hover:scale-[1.02]"
          />
        </div>

        {/* 4. INFO PISTA CENTRADA (Tipografía Fluida) */}
        <div className="w-full flex items-center justify-center px-[clamp(1rem,4vw,2rem)] shrink-0 relative py-[clamp(0.25rem,0.8vw,0.5rem)] gap-2">
          <button
            className="flex h-[clamp(2.5rem,8vw,2.5rem)] w-[clamp(2.5rem,8vw,2.5rem)] items-center justify-center rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] shadow-[var(--glass-shadow)] backdrop-blur-xl hover:text-[var(--text-main)] active:scale-95 transition-all shrink-0"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isLightMode ? (
              <Sun className="h-[clamp(1rem,3vw,1.25rem)] w-[clamp(1rem,3vw,1.25rem)] transition-colors" />
            ) : (
              <Moon className="h-[clamp(1rem,3vw,1.25rem)] w-[clamp(1rem,3vw,1.25rem)] transition-colors" />
            )}
          </button>
          <div className="flex flex-col items-center text-center flex-1 min-w-0">
            <h2 className="text-[clamp(1.125rem,5vw,1.875rem)] font-black text-[var(--text-main)] tracking-tighter leading-tight truncate w-full">
              {currentTrack.title}
            </h2>
            <p className="text-[clamp(0.65rem,1.75vw,0.875rem)] text-blue-500 font-bold tracking-[0.2em] uppercase mt-[clamp(0.12rem,0.2vw,0.25rem)] opacity-80 line-clamp-1">
              {currentTrack.artist}
            </p>
          </div>
          <button
            className="flex h-[clamp(2.5rem,8vw,2.5rem)] w-[clamp(2.5rem,8vw,2.5rem)] items-center justify-center rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] shadow-[var(--glass-shadow)] backdrop-blur-xl hover:text-red-500 active:scale-95 transition-all shrink-0"
            aria-label="Like track"
          >
            <Heart className="h-[clamp(1rem,3vw,1.25rem)] w-[clamp(1rem,3vw,1.25rem)] hover:fill-red-500 transition-colors" />
          </button>
        </div>

        {/* 5. VISUALIZER CON GRADIENTE VERTICAL */}
        <div className="w-full px-[clamp(1rem,5vw,2rem)] shrink-0">
          <div className="relative h-[clamp(1.6rem,8vw,3.6rem)] flex items-end justify-center gap-[clamp(2px,1vw,3px)] mb-[clamp(0.4rem,1vw,0.6rem)]">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={seek}
              onChange={(e) => setSeek(parseFloat(e.target.value))}
              aria-label="Seek"
              className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
            />
            {Array.from(audioData)
              .slice(0, barCount)
              .map((v, i) => {
                const isPlayed = (i / barCount) * 100 < progressPercent;
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
          <div className="flex justify-between items-center px-1 font-mono text-[clamp(0.65rem,1.5vw,0.875rem)] text-gray-500 font-bold tracking-tighter gap-2">
            <span className="w-[clamp(2rem,8vw,3rem)] shrink-0">{formatTime(seek)}</span>
            <div className="h-[1px] flex-1 mx-[clamp(0.75rem,2vw,1.5rem)] bg-gray-500/10 relative">
              <div
                className="absolute inset-y-0 left-0 bg-blue-500/30"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="w-12 text-right">{formatTime(duration)}</span>
          </div>
        </div>

        {/* 6. CONTROLES Y VOLUMEN SOBREAMPLIFICADO (Glass Style - Responsivo) */}
        <div className="w-full md:max-w-sm lg:max-w-md flex flex-col gap-[clamp(0.6rem,1.6vw,0.9rem)] pb-[clamp(0.6rem,1.2vw,0.9rem)] shrink-0 mt-[clamp(0.2rem,0.8vw,0.4rem)] px-[clamp(0.5rem,3vw,1rem)]">
          <div className="flex items-center justify-between gap-[clamp(0.5rem,2vw,1rem)]">
            <button className="text-gray-500 hover:text-blue-500 transition-colors">
              <Shuffle className="h-[clamp(1.25rem,4vw,1.5rem)] w-[clamp(1.25rem,4vw,1.5rem)]" />
            </button>
            <div className="flex items-center gap-[clamp(1rem,4vw,2rem)] flex-1 justify-center">
              <button
                aria-label="Previous track"
                className="text-[var(--text-main)] opacity-60 hover:opacity-100 active:scale-90 transition-colors"
              >
                <SkipBack
                  className="h-[clamp(1.75rem,6vw,2rem)] w-[clamp(1.75rem,6vw,2rem)]"
                  fill="currentColor"
                />
              </button>
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="flex items-center justify-center bg-[var(--text-main)] text-[var(--bg-main)] rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all h-[clamp(3rem,10vw,4rem)] w-[clamp(3rem,10vw,4rem)] shrink-0"
              >
                {isPlaying ? (
                  <Pause
                    className="h-[clamp(1.25rem,4vw,1.875rem)] w-[clamp(1.25rem,4vw,1.875rem)]"
                    fill="currentColor"
                  />
                ) : (
                  <Play
                    className="h-[clamp(1.25rem,4vw,1.875rem)] w-[clamp(1.25rem,4vw,1.875rem)] ml-0.5"
                    fill="currentColor"
                  />
                )}
              </button>
              <button
                aria-label="Next track"
                className="text-[var(--text-main)] opacity-60 hover:opacity-100 active:scale-90 transition-colors"
              >
                <SkipForward
                  className="h-[clamp(1.75rem,6vw,2rem)] w-[clamp(1.75rem,6vw,2rem)]"
                  fill="currentColor"
                />
              </button>
            </div>
            <button className="text-gray-500 hover:text-blue-500 transition-colors">
              <Repeat className="h-[clamp(1.25rem,4vw,1.5rem)] w-[clamp(1.25rem,4vw,1.5rem)]" />
            </button>
          </div>

          {/* VOLUMEN TÁCTIL (0-200%) CON BOTÓN DE RESET 100% */}
          <div className="w-full">
            <VolumeControl volume={volume} onVolumeChange={setVolume} showLabel={true} />
          </div>
        </div>
      </div>
    </div>
  );
};
