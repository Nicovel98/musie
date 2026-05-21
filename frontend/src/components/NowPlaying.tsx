import { useEffect, useRef, useState } from 'react';
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
import { useMediaQuery } from '../hooks/useMediaQuery';
import { VisualizerBars } from './VisualizerBars';
import { VolumeControl } from './VolumeControl';

interface NowPlayingProps {
  setView: (view: 'home' | 'library') => void;
}

export const NowPlaying = ({ setView }: NowPlayingProps) => {
  const [isLightMode, setIsLightMode] = useState(
    document.documentElement.classList.contains('light')
  );
  const isCompactLandscape = useMediaQuery(
    '(orientation: landscape) and (max-height: 640px) and (max-width: 1024px)'
  );
  const isShortHeight = useMediaQuery('(max-height: 500px)');
  const [barCount, setBarCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 40;

    const width = window.innerWidth;
    if (width < 480) return 18;
    if (width < 640) return 24;
    if (width < 1024) return 32;
    if (width < 1440) return 44;
    return 56;
  });
  const {
    songs,
    currentTrack,
    lastTrack,
    isPlaying,
    togglePlay,
    seek,
    duration,
    fastSeek,
    volume,
    setVolume,
    setTrack,
  } = usePlayerStore();

  const audioData = useVisualizer(barCount);
  const scrubResumeRef = useRef(false);
  const scrubActiveRef = useRef(false);
  const seekRafRef = useRef<number | null>(null);
  const pendingSeekRef = useRef<number | null>(null);

  const featuredTrack = currentTrack ?? lastTrack ?? songs[songs.length - 1] ?? songs[0] ?? null;

  const progressPercent = (seek / duration) * 100 || 0;
  const controlBtnSizeClass = isShortHeight ? 'w-9 h-9' : 'w-11 h-11';
  const controlIconSmall = isShortHeight ? 16 : 18;
  const controlIconMedium = isShortHeight ? 18 : 24;
  const sectionPadding = isShortHeight ? 'p-0.5' : 'p-1';
  const visualizerWrapperClassName = isCompactLandscape
    ? 'flex min-h-0 flex-1 flex-col gap-2 rounded-[18px] border border-dashed border-[var(--glass-border)] bg-black/5 px-3 py-3'
    : 'flex min-h-0 flex-[0.32] flex-col gap-2 rounded-[18px] border border-dashed border-[var(--glass-border)] bg-black/5 px-3 py-2';
  const visualizerBarsRowClassName = isCompactLandscape
    ? 'relative flex-1 min-h-[clamp(5.5rem,24vh,10rem)] w-full flex items-end justify-center gap-[clamp(2px,0.9vw,4px)]'
    : 'relative flex-1 min-h-[clamp(2.5rem,6.5vh,4.4rem)] w-full flex items-end justify-center gap-[clamp(2px,1vw,3px)]';

  useEffect(() => {
    const syncTheme = () => {
      setIsLightMode(document.documentElement.classList.contains('light'));
    };
    window.addEventListener('themechange', syncTheme);
    const handleResize = () => {
      const width = window.innerWidth;

      if (isCompactLandscape) {
        if (width < 720) setBarCount(16);
        else setBarCount(22);
        return;
      }

      if (width < 480) setBarCount(18);
      else if (width < 640) setBarCount(24);
      else if (width < 1024) setBarCount(32);
      else if (width < 1440) setBarCount(44);
      else setBarCount(56);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('themechange', syncTheme);
      window.removeEventListener('resize', handleResize);
    };
  }, [isCompactLandscape]);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('light');
    window.dispatchEvent(new Event('themechange'));
  };

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

  if (currentTrack && isCompactLandscape) {
    return (
      <div className="flex-1 h-full relative overflow-hidden transition-colors duration-500 bg-[var(--bg-main)] px-3 pt-1 pb-[calc(var(--mobile-tabs-height)+env(safe-area-inset-bottom)+0.5rem)] md:px-4">
        <div className="absolute inset-0 -z-10 opacity-18 blur-[120px] scale-150 transition-all duration-1000">
          <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="flex h-full w-full min-h-0 flex-col rounded-[30px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2 shadow-[var(--glass-shadow)] backdrop-blur-xl">
          <div className="flex items-center justify-between shrink-0 px-1 py-1">
            <button
              onClick={() => setView('library')}
              className="p-2 -ml-2 text-[var(--text-main)] opacity-40 hover:opacity-100 transition-all active:scale-90"
            >
              <ChevronDown size={28} strokeWidth={2.5} />
            </button>
            <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--text-main)] opacity-30 font-black">
              Now Playing
            </span>
            <button className="text-[var(--text-main)] opacity-40 hover:opacity-100 transition-colors">
              <MoreHorizontal size={22} />
            </button>
          </div>

          <div className="grid flex-1 min-h-0 grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] gap-2">
            <section className={`flex min-h-0 flex-col gap-2 ${sectionPadding}`}>
              <div className="relative flex-1 min-h-0 overflow-hidden rounded-[20px] border border-[var(--glass-border)]">
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
              </div>

              <div className="flex items-center justify-between gap-2 shrink-0 px-1 pt-1">
                <button className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors">
                  <Shuffle size={controlIconSmall} />
                </button>
                <button
                  aria-label="Previous track"
                  className="text-[var(--text-main)] opacity-70 hover:opacity-100 transition-all active:scale-90"
                >
                  <SkipBack size={controlIconMedium} fill="currentColor" />
                </button>
                <button
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className={`${controlBtnSizeClass} flex items-center justify-center bg-[var(--text-main)] text-[var(--bg-main)] rounded-full hover:scale-105 transition-all shadow-xl active:scale-95`}
                >
                  {isPlaying ? (
                    <Pause size={isShortHeight ? 18 : 20} fill="currentColor" />
                  ) : (
                    <Play size={isShortHeight ? 18 : 20} fill="currentColor" className="ml-0.5" />
                  )}
                </button>
                <button
                  aria-label="Next track"
                  className="text-[var(--text-main)] opacity-70 hover:opacity-100 transition-all active:scale-90"
                >
                  <SkipForward size={controlIconMedium} fill="currentColor" />
                </button>
                <button className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors">
                  <Repeat size={controlIconSmall} />
                </button>
              </div>
            </section>

            <section className="flex min-h-0 flex-col gap-3 p-1">
              <div className="flex items-start justify-between gap-4 shrink-0">
                <div className="min-w-0 flex-1 space-y-1 pr-1">
                  <div className="flex items-start gap-2 min-w-0">
                    <h2 className="min-w-0 text-[clamp(1.15rem,3.8vw,1.85rem)] font-black text-[var(--text-main)] tracking-tighter leading-tight break-words">
                      {currentTrack.title}
                    </h2>
                    <button
                      onClick={toggleTheme}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] shadow-[var(--glass-shadow)] backdrop-blur-xl hover:text-[var(--text-main)] active:scale-95 transition-all shrink-0"
                      aria-label="Toggle theme"
                    >
                      {isLightMode ? (
                        <Sun className="h-4 w-4 transition-colors" />
                      ) : (
                        <Moon className="h-4 w-4 transition-colors" />
                      )}
                    </button>
                  </div>
                  <p className="max-w-full text-[11px] uppercase tracking-[0.28em] text-blue-400 font-bold break-words">
                    {currentTrack.artist}
                  </p>
                </div>

                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] shadow-[var(--glass-shadow)] backdrop-blur-xl hover:text-red-500 active:scale-95 transition-all shrink-0"
                  aria-label="Like track"
                >
                  <Heart className="h-4 w-4 hover:fill-red-500 transition-colors" />
                </button>
              </div>

              {!isShortHeight ? (
                <VisualizerBars
                  audioData={audioData}
                  barCount={barCount}
                  seek={seek}
                  duration={duration}
                  progressPercent={progressPercent}
                  minBarHeight={18}
                  onSeekChange={handleSeekChange}
                  onScrubStart={handleScrubStart}
                  onScrubEnd={handleScrubEnd}
                  wrapperClassName={visualizerWrapperClassName}
                  barsRowClassName={visualizerBarsRowClassName}
                  barTransitionClassName="transition-[height,opacity,transform] duration-90 ease-out"
                  playedBarClassName="bg-gradient-to-t from-blue-600 to-purple-500 shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                  inactiveBarClassName={
                    isLightMode
                      ? 'bg-slate-400/75 shadow-[0_0_10px_rgba(15,23,42,0.05)]'
                      : 'bg-[var(--text-main)] opacity-35 shadow-[0_0_10px_rgba(255,255,255,0.06)]'
                  }
                  inputClassName="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                  progressRowClassName="flex items-center justify-between gap-2 mt-0.5 font-mono text-[10px] text-[var(--text-muted)] tabular-nums"
                  progressTrackClassName="h-px flex-1 bg-[var(--glass-border)] mx-2 relative overflow-hidden rounded-full"
                  progressFillClassName="absolute inset-y-0 left-0 bg-[var(--accent-primary)]"
                  timeClassName="shrink-0"
                />
              ) : null}

              <div className="shrink-0 space-y-2">
                <VolumeControl
                  volume={volume}
                  onVolumeChange={setVolume}
                  size={isShortHeight ? 'sm' : 'md'}
                  showLabel={!isShortHeight}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (!currentTrack) {
    if (isCompactLandscape) {
      return (
        <div className="flex-1 h-full relative overflow-hidden transition-colors duration-500 bg-[var(--bg-main)] px-3 pt-1 pb-[calc(var(--mobile-tabs-height)+env(safe-area-inset-bottom)+0.5rem)] md:px-4">
          <div className="absolute inset-0 -z-10 opacity-18 blur-[120px] scale-150 transition-all duration-1000">
            <img
              src={featuredTrack?.coverUrl || heroThumbnail}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex h-full w-full min-h-0 flex-col rounded-[30px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2 shadow-[var(--glass-shadow)] backdrop-blur-xl">
            <div className="flex items-center justify-between shrink-0 px-1 py-1">
              <button
                onClick={() => setView('library')}
                className="p-2 -ml-2 text-[var(--text-main)] opacity-40 hover:opacity-100 transition-all active:scale-90"
              >
                <ChevronDown size={28} strokeWidth={2.5} />
              </button>
              <span className="text-[9px] uppercase tracking-[0.5em] text-[var(--text-main)] opacity-30 font-black">
                Now Playing
              </span>
              <button className="text-[var(--text-main)] opacity-40 hover:opacity-100 transition-colors">
                <MoreHorizontal size={22} />
              </button>
            </div>

            <div className="grid flex-1 min-h-0 grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] gap-2">
              <section className="flex min-h-0 flex-col gap-2 p-1">
                <button
                  onClick={() => featuredTrack && setTrack(featuredTrack)}
                  aria-label="Play featured track"
                  className="group relative flex-1 min-h-0 overflow-hidden rounded-[24px] border border-[var(--glass-border)] bg-[var(--bg-elevated)] shadow-[0_30px_70px_rgba(0,0,0,0.32)] transition-transform duration-500 hover:scale-[1.01] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-transparent to-purple-500/15 mix-blend-screen" />
                  <div className="absolute inset-0 ring-1 ring-white/5 rounded-[24px]" />
                  <img
                    src={featuredTrack?.coverUrl || heroThumbnail}
                    alt={featuredTrack ? featuredTrack.title : 'Musie'}
                    className="h-full w-full object-cover scale-[1.03] transition-transform duration-700 group-hover:scale-[1.08]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-white/85 backdrop-blur-md">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.9)]" />
                    Preview
                  </div>
                  {featuredTrack ? (
                    <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/18 bg-white/92 text-black shadow-[0_18px_40px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-transform group-hover:scale-105">
                      <Play size={18} fill="currentColor" className="ml-0.5" />
                    </div>
                  ) : null}
                </button>
              </section>

              <section className="flex min-h-0 flex-col justify-center gap-4 p-1 text-center">
                <div className="min-w-0 space-y-2 px-1">
                  <p className="text-[10px] uppercase tracking-[0.42em] text-[var(--text-main)] opacity-35 font-black">
                    {featuredTrack ? 'Featured thumbnail' : 'Home'}
                  </p>
                  <h2 className="min-w-0 text-[clamp(1.05rem,3.2vw,1.6rem)] font-black text-[var(--text-main)] tracking-tighter leading-tight break-words">
                    {featuredTrack ? featuredTrack.title : 'Tu reproductor está listo'}
                  </h2>
                  <p className="mx-auto max-w-[16rem] text-[11px] uppercase tracking-[0.22em] text-blue-400 font-bold break-words">
                    {featuredTrack ? featuredTrack.artist : 'Entra a Library para cargar música'}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="mx-auto max-w-[18rem] text-[clamp(0.95rem,2.1vw,1.08rem)] font-semibold text-[var(--text-main)] leading-relaxed tracking-tight">
                    {featuredTrack
                      ? 'Toca el thumbnail para iniciar la reproducción y entrar al modo Now Playing.'
                      : 'Sube o selecciona una canción desde Library para que aparezca aquí el thumbnail inicial.'}
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setView('library')}
                      className="px-4 py-3 rounded-full bg-[var(--text-main)] text-[var(--bg-main)] font-black text-[11px] uppercase tracking-[0.18em] hover:scale-105 transition-transform"
                    >
                      Ir a Library
                    </button>
                    {featuredTrack ? (
                      <button
                        onClick={() => setTrack(featuredTrack)}
                        className="px-4 py-3 rounded-full border border-[var(--glass-border)] text-[var(--text-main)] font-black text-[11px] uppercase tracking-[0.18em] hover:bg-[var(--glass-bg)] transition-colors"
                      >
                        Play
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      );
    }

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
              className="group relative w-full max-w-[320px] aspect-square rounded-[42px] overflow-hidden border border-[var(--glass-border)] bg-[var(--bg-elevated)] shadow-[0_45px_90px_rgba(0,0,0,0.38)] transition-transform duration-500 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_38%),linear-gradient(135deg,rgba(59,130,246,0.16),transparent_45%,rgba(168,85,247,0.14))]" />
              <div className="absolute inset-0 ring-1 ring-white/8 rounded-[42px]" />
              <img
                src={featuredTrack?.coverUrl || heroThumbnail}
                alt={featuredTrack ? featuredTrack.title : 'Musie'}
                className="h-full w-full object-cover scale-[1.025] transition-transform duration-700 group-hover:scale-[1.07]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/22 to-transparent" />
              <div className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/85 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.9)]" />
                Preview
              </div>
              <div className="absolute inset-x-4 bottom-4 flex flex-col items-center gap-3 text-center">
                <div className="min-w-0 max-w-[88%]">
                  <p className="text-[10px] uppercase tracking-[0.42em] text-white/55 font-black">
                    {featuredTrack ? 'Featured thumbnail' : 'Home'}
                  </p>
                  <h2 className="mt-2 text-[clamp(1.6rem,4vw,2.15rem)] font-black text-white tracking-tighter leading-[0.95] line-clamp-2">
                    {featuredTrack ? featuredTrack.title : 'Tu reproductor está listo'}
                  </h2>
                  <p className="mt-2 text-[11px] sm:text-[12px] text-white/72 font-semibold uppercase tracking-[0.24em] truncate">
                    {featuredTrack ? featuredTrack.artist : 'Entra a Library para cargar música'}
                  </p>
                </div>
                <p className="mx-auto max-w-[22rem] text-[clamp(0.95rem,1.7vw,1.02rem)] font-semibold text-white/88 leading-relaxed tracking-tight">
                  {featuredTrack
                    ? 'Toca el thumbnail para empezar a reproducir y entrar al modo Now Playing.'
                    : 'Carga una canción desde Library y convierte este thumbnail en tu acceso directo al reproductor.'}
                </p>
                {featuredTrack ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/95 text-black shadow-2xl shadow-black/30 transition-transform group-hover:scale-105">
                    <Play size={20} fill="currentColor" className="ml-0.5" />
                  </div>
                ) : null}
              </div>
            </button>

            <div className="max-w-md text-center space-y-3 px-6">
              <h3 className="text-[clamp(1.35rem,4vw,2rem)] font-black tracking-tighter text-[var(--text-main)]">
                Home
              </h3>
              <p className="mx-auto max-w-2xl text-[clamp(1rem,2.35vw,1.15rem)] font-semibold text-[var(--text-main)] leading-relaxed tracking-tight">
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
    <div className="flex-1 h-full flex flex-col items-center justify-between px-4 pt-2 pb-8 md:px-10 md:pt-4 md:pb-6 relative overflow-hidden transition-colors duration-500 bg-[var(--bg-main)]">
      {/* 1. FONDO DINÁMICO (Blur Profundo) */}
      <div className="absolute inset-0 -z-10 opacity-20 blur-[140px] scale-150 transition-all duration-1000">
        <img src={currentTrack.coverUrl} alt="" className="w-full h-full object-cover" />
      </div>

      <div className="max-w-4xl xl:max-w-6xl w-full h-full flex flex-col justify-between items-center gap-2 md:gap-3 pb-8 md:pb-8">
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
        <div className="relative group flex-[1.62] flex items-center justify-center min-h-0 w-full px-[clamp(1rem,5vw,2rem)] my-[clamp(0.06rem,0.3vw,0.18rem)]">
          <div className="absolute inset-0 bg-blue-600/5 rounded-full blur-[100px]" />
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            className="h-full max-h-[82vh] md:max-h-[90vh] aspect-square object-cover rounded-[clamp(24px,8vw,48px)] shadow-[0_40px_80px_rgba(0,0,0,0.4)] border border-[var(--glass-border)] transition-transform duration-700 hover:scale-[1.02]"
          />
        </div>

        {/* 4. INFO PISTA CENTRADA (Tipografía Fluida) */}
        <div className="w-full flex items-center justify-center px-[clamp(0.75rem,3vw,1.5rem)] shrink-0 relative py-[clamp(0.15rem,0.45vw,0.3rem)] gap-2">
          <button
            className="flex h-[clamp(2.15rem,6vw,2.5rem)] w-[clamp(2.15rem,6vw,2.5rem)] items-center justify-center rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] shadow-[var(--glass-shadow)] backdrop-blur-xl hover:text-[var(--text-main)] active:scale-95 transition-all shrink-0"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {isLightMode ? (
              <Sun className="h-[clamp(0.9rem,2.6vw,1.15rem)] w-[clamp(0.9rem,2.6vw,1.15rem)] transition-colors" />
            ) : (
              <Moon className="h-[clamp(0.9rem,2.6vw,1.15rem)] w-[clamp(0.9rem,2.6vw,1.15rem)] transition-colors" />
            )}
          </button>
          <div className="flex flex-col items-center text-center flex-1 min-w-0">
            <h2 className="text-[clamp(1rem,4.25vw,1.6rem)] font-black text-[var(--text-main)] tracking-tighter leading-tight truncate w-full">
              {currentTrack.title}
            </h2>
            <p className="text-[clamp(0.6rem,1.45vw,0.8rem)] text-blue-500 font-bold tracking-[0.18em] uppercase mt-[clamp(0.08rem,0.16vw,0.2rem)] opacity-80 line-clamp-1">
              {currentTrack.artist}
            </p>
          </div>
          <button
            className="flex h-[clamp(2.15rem,6vw,2.5rem)] w-[clamp(2.15rem,6vw,2.5rem)] items-center justify-center rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-muted)] shadow-[var(--glass-shadow)] backdrop-blur-xl hover:text-red-500 active:scale-95 transition-all shrink-0"
            aria-label="Like track"
          >
            <Heart className="h-[clamp(0.9rem,2.6vw,1.15rem)] w-[clamp(0.9rem,2.6vw,1.15rem)] hover:fill-red-500 transition-colors" />
          </button>
        </div>

        {/* 5. VISUALIZER CON GRADIENTE VERTICAL */}
        {!isShortHeight ? (
          <VisualizerBars
            audioData={audioData}
            barCount={barCount}
            seek={seek}
            duration={duration}
            progressPercent={progressPercent}
            minBarHeight={20}
            onSeekChange={handleSeekChange}
            onScrubStart={handleScrubStart}
            onScrubEnd={handleScrubEnd}
            wrapperClassName="flex w-full flex-[1.1] min-h-0 flex-col px-[clamp(1rem,5vw,2rem)]"
            barsRowClassName="relative flex-1 min-h-[clamp(4rem,11vw,6rem)] flex items-end justify-center gap-[clamp(2px,1vw,3px)]"
            barTransitionClassName="transition-all duration-75"
            playedBarClassName="bg-gradient-to-t from-blue-600 to-purple-500 shadow-[0_0_15px_rgba(37,99,235,0.2)]"
            inactiveBarClassName="bg-gray-500/20 opacity-30"
            inputClassName="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer"
            progressRowClassName="flex justify-between items-center px-1 font-mono text-[clamp(0.65rem,1.5vw,0.875rem)] text-gray-500 font-bold tracking-tighter gap-2"
            progressTrackClassName="h-[1px] flex-1 mx-[clamp(0.75rem,2vw,1.5rem)] bg-gray-500/10 relative"
            progressFillClassName="absolute inset-y-0 left-0 bg-blue-500/30"
            timeClassName="shrink-0"
          />
        ) : null}

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
            <VolumeControl
              volume={volume}
              onVolumeChange={setVolume}
              size={isShortHeight ? 'sm' : 'md'}
              showLabel={!isShortHeight}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
