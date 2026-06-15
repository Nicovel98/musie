import { Heart } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { VolumeControl } from './VolumeControl';
import { PlaybackControls } from './PlaybackControls';
import { useScrubSeeking } from '../hooks/useScrubSeeking';

interface PlayerBarProps {
  useThemeAudioColors?: boolean;
}

export const PlayerBar = ({ useThemeAudioColors = true }: PlayerBarProps) => {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    seek,
    duration,
    fastSeek,
    volume,
    setVolume,
    playPreviousTrack,
    playNextTrack,
  } = usePlayerStore();

  const { handleSeekChange, handleScrubStart, handleScrubEnd } = useScrubSeeking({
    isPlaying,
    togglePlay,
    fastSeek,
  });

  const goPrev = () => {
    playPreviousTrack();
  };

  const goNext = () => {
    playNextTrack();
  };

  if (!currentTrack) return null;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60) || 0;
    const secs = Math.floor(s % 60) || 0;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (seek / duration) * 100 || 0;
  const progressFillClassName = useThemeAudioColors
    ? 'absolute inset-y-0 left-0 bg-[var(--accent-primary)] shadow-[0_0_10px_rgba(0,143,214,0.30)]'
    : 'absolute inset-y-0 left-0 bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.30)]';
  const miniProgressFillClassName = useThemeAudioColors
    ? 'h-full bg-[var(--accent-primary)] transition-all duration-300'
    : 'h-full bg-blue-500 transition-all duration-300';
  const controlAccentClass = useThemeAudioColors ? 'text-[var(--accent-primary)]' : 'text-blue-500';
  const controlAccentSecondaryClass = useThemeAudioColors
    ? 'text-[var(--accent-secondary)]'
    : 'text-blue-400';

  return (
    /*
       Contenedor principal:
       - En móvil: bg-black/80 con blur para que destaque sobre el contenido.
       - En desktop: transparente porque App.tsx ya le da el fondo sólido.
    */
    <div className="glass-effect w-full h-[5.5rem] md:h-20 px-3 md:px-5 pb-3 md:pb-0 flex flex-col md:flex-row md:items-center md:justify-between transition-all duration-500 bg-[var(--playerbar-bg)] border-t border-[var(--playerbar-border)] shadow-[var(--playerbar-shadow)] md:bg-transparent md:border-0 md:shadow-none backdrop-blur-xl md:backdrop-blur-0">
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
          <button className="mr-2 text-[var(--text-muted)] opacity-80 hover:text-red-500 hover:opacity-100 transition-colors shrink-0">
            <Heart size={14} />
          </button>
        </div>

        <PlaybackControls
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onPrev={goPrev}
          onNext={goNext}
          useThemeAudioColors={useThemeAudioColors}
          buttonSizeClass="h-8 w-8"
          playButtonSizeClass="w-9 h-9"
          iconSize={14}
          playIconSize={18}
          iconClassName={`text-[var(--text-muted)] opacity-80 active:opacity-100 active:${controlAccentClass}`}
          secondaryIconClassName={`text-[var(--text-muted)] opacity-80 active:opacity-100 active:${controlAccentSecondaryClass}`}
          playButtonClassName="flex items-center justify-center bg-[var(--text-main)] text-[var(--bg-main)] rounded-full shadow-xl active:scale-95 transition-all"
          className="justify-between gap-1 px-0"
        />
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
        <PlaybackControls
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          useThemeAudioColors={useThemeAudioColors}
          buttonSizeClass="h-10 w-10 md:h-11 md:w-11"
          playButtonSizeClass="w-10 h-10 md:w-11 md:h-11"
          iconSize={16}
          playIconSize={20}
          iconClassName={`text-[var(--text-muted)] opacity-80 hover:opacity-100 transition-colors hidden md:flex hover:${controlAccentClass}`}
          secondaryIconClassName={`text-[var(--text-main)] opacity-70 hover:opacity-100 transition-all active:scale-90 hidden md:flex hover:${controlAccentSecondaryClass}`}
          playButtonClassName="flex items-center justify-center bg-[var(--text-main)] text-[var(--bg-main)] rounded-full hover:scale-105 transition-all shadow-xl active:scale-95"
          className="gap-2 md:gap-4"
        />

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
            <div className={progressFillClassName} style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] w-10 tabular-nums">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 3. VOLUMEN (SOLO DESKTOP) */}
      <div className="hidden md:flex items-center justify-end w-[28%]">
        <div className="w-full max-w-[280px] lg:max-w-[320px] xl:max-w-[340px]">
          <VolumeControl
            volume={volume}
            onVolumeChange={setVolume}
            showLabel={true}
            useThemeAudioColors={useThemeAudioColors}
          />
        </div>
      </div>

      {/* BARRA DE PROGRESO MINI (Móvil - Al borde inferior del bar) */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--bg-elevated)]">
        <div className={miniProgressFillClassName} style={{ width: `${progressPercent}%` }} />
      </div>
    </div>
  );
};
