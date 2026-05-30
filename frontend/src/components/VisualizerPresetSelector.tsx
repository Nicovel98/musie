type VizPreset = 'soft' | 'mid' | 'vivid';

interface Props {
  preset: VizPreset;
  onChange: (p: VizPreset) => void;
  className?: string;
  useThemeAudioColors?: boolean;
}

export const VisualizerPresetSelector = ({
  preset,
  onChange,
  className,
  useThemeAudioColors = true,
}: Props) => {
  const activeClass = useThemeAudioColors
    ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/14 ring-1 ring-[var(--accent-primary)]/35'
    : 'text-blue-400 bg-blue-500/14 ring-1 ring-blue-400/35';

  const inactiveClass = useThemeAudioColors
    ? 'text-[var(--text-muted)] opacity-75 hover:opacity-100 hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10'
    : 'text-[var(--text-muted)] opacity-75 hover:opacity-100 hover:text-blue-400 hover:bg-blue-500/10';

  const buttonBaseClass =
    'min-w-[64px] whitespace-nowrap px-2 py-1 sm:px-3 sm:py-1 rounded-full text-sm font-bold transition-all';

  return (
    <div className={className ?? 'flex flex-wrap items-center justify-center gap-2 mb-3 sm:mb-2'}>
      <button
        onClick={() => onChange('soft')}
        className={`${buttonBaseClass} ${preset === 'soft' ? activeClass : inactiveClass}`}
      >
        Soft
      </button>

      <button
        onClick={() => onChange('mid')}
        className={`${buttonBaseClass} ${preset === 'mid' ? activeClass : inactiveClass}`}
      >
        Mid
      </button>

      <button
        onClick={() => onChange('vivid')}
        className={`${buttonBaseClass} ${preset === 'vivid' ? activeClass : inactiveClass}`}
      >
        Vivid
      </button>
    </div>
  );
};

export default VisualizerPresetSelector;
