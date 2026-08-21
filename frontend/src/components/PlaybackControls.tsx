import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  buttonSizeClass: string;
  playButtonSizeClass: string;
  iconSize: number;
  playIconSize: number;
  iconClassName?: string;
  secondaryIconClassName?: string;
  playButtonClassName?: string;
  useThemeAudioColors?: boolean;
  className?: string;
}

export const PlaybackControls = ({
  isPlaying,
  onTogglePlay,
  onPrev,
  onNext,
  buttonSizeClass,
  playButtonSizeClass,
  iconSize,
  playIconSize,
  iconClassName,
  secondaryIconClassName,
  playButtonClassName,
  useThemeAudioColors,
  className = '',
}: PlaybackControlsProps) => {
  const mutedControlClassName = useThemeAudioColors
    ? 'text-[var(--text-muted)] opacity-80 hover:opacity-100 hover:text-[var(--accent-primary)] hover:bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)] transition-all duration-200 ease-out hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100'
    : iconClassName || 'text-[var(--text-muted)] transition-colors';

  const skipControlClassName = useThemeAudioColors
    ? 'text-[var(--text-main)] opacity-90 hover:text-[var(--accent-primary)] hover:bg-[color-mix(in_srgb,var(--accent-primary)_8%,transparent)] transition-all duration-200 ease-out hover:scale-105 active:scale-95'
    : secondaryIconClassName || 'text-[var(--text-main)] opacity-70 transition-all';

  const playButtonThemeClassName = useThemeAudioColors
    ? 'flex items-center justify-center bg-[var(--accent-primary)] text-[var(--bg-main)] rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 ease-out'
    : playButtonClassName ||
      'flex items-center justify-center bg-[var(--text-main)] text-[var(--bg-main)] rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all';
  return (
    <div className={`flex items-center gap-1 ${className}`.trim()}>
      <button
        type="button"
        disabled
        aria-label="Shuffle unavailable"
        className={`flex items-center justify-center ${buttonSizeClass} rounded-full ${mutedControlClassName}`}
      >
        <Shuffle size={iconSize} />
      </button>

      <button
        type="button"
        aria-label="Previous track"
        onClick={onPrev}
        className={`flex items-center justify-center ${buttonSizeClass} rounded-full ${skipControlClassName}`}
      >
        <SkipBack size={iconSize} fill="currentColor" />
      </button>

      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className={`${playButtonSizeClass} ${playButtonThemeClassName}`.trim()}
      >
        {isPlaying ? (
          <Pause size={playIconSize} fill="currentColor" />
        ) : (
          <Play size={playIconSize} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      <button
        type="button"
        aria-label="Next track"
        onClick={onNext}
        className={`flex items-center justify-center ${buttonSizeClass} rounded-full ${skipControlClassName}`}
      >
        <SkipForward size={iconSize} fill="currentColor" />
      </button>

      <button
        type="button"
        disabled
        aria-label="Repeat unavailable"
        className={`flex items-center justify-center ${buttonSizeClass} rounded-full ${mutedControlClassName}`}
      >
        <Repeat size={iconSize} />
      </button>
    </div>
  );
};
