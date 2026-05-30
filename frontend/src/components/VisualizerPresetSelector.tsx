type VizPreset = 'soft' | 'mid' | 'vivid';

interface Props {
  preset: VizPreset;
  onChange: (p: VizPreset) => void;
  className?: string;
}

export const VisualizerPresetSelector = ({ preset, onChange, className }: Props) => {
  return (
    <div className={className ?? 'flex flex-wrap items-center justify-center gap-2 mb-3 sm:mb-2'}>
      <button
        onClick={() => onChange('soft')}
        className={`min-w-[64px] whitespace-nowrap px-2 py-1 sm:px-3 sm:py-1 rounded-full text-sm font-bold transition-all ${
          preset === 'soft' ? 'bg-white/6 ring-1 ring-white/10' : 'opacity-60'
        }`}
      >
        Soft
      </button>

      <button
        onClick={() => onChange('mid')}
        className={`min-w-[64px] whitespace-nowrap px-2 py-1 sm:px-3 sm:py-1 rounded-full text-sm font-bold transition-all ${
          preset === 'mid' ? 'bg-white/6 ring-1 ring-white/10' : 'opacity-60'
        }`}
      >
        Mid
      </button>

      <button
        onClick={() => onChange('vivid')}
        className={`min-w-[64px] whitespace-nowrap px-2 py-1 sm:px-3 sm:py-1 rounded-full text-sm font-bold transition-all ${
          preset === 'vivid' ? 'bg-white/6 ring-1 ring-white/10' : 'opacity-60'
        }`}
      >
        Vivid
      </button>
    </div>
  );
};

export default VisualizerPresetSelector;
