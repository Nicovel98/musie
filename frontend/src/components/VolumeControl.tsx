import React from 'react';
import { Volume1, Volume2, VolumeX } from 'lucide-react';
import { useMute } from '../hooks/useMute';

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (v: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  useThemeAudioColors?: boolean;
}

const sizeMap = {
  sm: 16,
  md: 18,
  lg: 22,
} as const;

export const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  onVolumeChange,
  size = 'md',
  showLabel = true,
  className = '',
  useThemeAudioColors = true,
}) => {
  const { mute } = useMute(volume, onVolumeChange);
  const safeVolume = Math.max(0, Math.min(2, volume));
  const percentage = Math.round(safeVolume * 100);
  const normalizedFill = `${(safeVolume / 2) * 100}%`;
  const isMuted = safeVolume === 0;
  const iconSize = sizeMap[size];
  const volumeFillStyle = {
    backgroundImage: useThemeAudioColors
      ? 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))'
      : safeVolume > 1
        ? 'linear-gradient(90deg, #2563eb, #7c3aed, #ef4444)'
        : 'linear-gradient(90deg, #1d4ed8, #60a5fa)',
  };

  return (
    <div className={`flex items-center gap-1 group/vol w-full ${className}`.trim()}>
      <button
        type="button"
        aria-pressed={isMuted}
        onClick={mute}
        className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] shrink-0 transition-colors"
        title={isMuted ? 'Activar sonido' : 'Silenciar'}
      >
        {isMuted ? (
          <VolumeX size={iconSize} className="-translate-y-px" />
        ) : (
          <Volume1 size={iconSize} className="-translate-y-px" />
        )}
      </button>

      <div className="relative flex-1 min-w-0 h-10 flex items-center">
        <input
          aria-label="Volumen"
          aria-valuemin={0}
          aria-valuemax={200}
          aria-valuenow={percentage}
          aria-valuetext={`${percentage}%`}
          className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer touch-none select-none"
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={safeVolume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        />

        <div className="flex-1 -translate-y-px h-2 bg-gray-500/10 rounded-full overflow-hidden relative border border-[var(--glass-border)]">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20 z-10" />
          <div
            className="h-full transition-[width,background-color] duration-120 ease-out will-change-[width]"
            style={{ width: normalizedFill, ...volumeFillStyle }}
            data-testid="volume-fill"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onVolumeChange(1)}
        className="-translate-y-px text-[var(--text-muted)] hover:text-[var(--accent-primary)] shrink-0 transition-all active:scale-90"
        title="Set to 100%"
      >
        <Volume2 size={iconSize} />
      </button>

      {showLabel && (
        <span
          className={`translate-y-px text-xs font-mono w-[4ch] shrink-0 text-right font-black tabular-nums transition-colors duration-200 ease-in-out will-change-[color] ${
            safeVolume > 1
              ? useThemeAudioColors
                ? 'text-[var(--tab-active-text)]'
                : 'text-red-500'
              : 'text-[var(--text-muted)]'
          }`}
        >
          {percentage}%
        </span>
      )}
    </div>
  );
};

export default VolumeControl;
