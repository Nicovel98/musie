export type EqPresetName = 'flat' | 'bass' | 'vocal' | 'rock' | 'classical' | 'treble' | 'custom';

export interface EqBand {
  frequency: number;
  label: string;
  gain: number;
  minGain: number;
  maxGain: number;
}

export const DEFAULT_EQ_BANDS: EqBand[] = [
  { frequency: 60, label: '60Hz', gain: 0, minGain: -12, maxGain: 12 },
  { frequency: 230, label: '230Hz', gain: 0, minGain: -12, maxGain: 12 },
  { frequency: 910, label: '910Hz', gain: 0, minGain: -12, maxGain: 12 },
  { frequency: 3600, label: '3.6kHz', gain: 0, minGain: -12, maxGain: 12 },
  { frequency: 14000, label: '14kHz', gain: 0, minGain: -12, maxGain: 12 },
];

export const DEFAULT_EQ_PRESET: EqPresetName = 'flat';

const EQ_PRESETS: Record<Exclude<EqPresetName, 'custom'>, number[]> = {
  flat: [0, 0, 0, 0, 0],
  bass: [5, 3, 0, 0, 0],
  vocal: [0, -1, 3, 2, 0],
  rock: [2, 3, 0, 4, 1],
  classical: [0, 1, 1, 1, 2],
  treble: [-1, -1, 0, 3, 5],
};

export const clampEqGain = (value: number, min: number = -12, max: number = 12): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(min, value));
};

export const getEqPreset = (preset: EqPresetName): EqBand[] => {
  const usingPreset = preset === 'custom' ? 'flat' : preset;
  const gains = EQ_PRESETS[usingPreset as Exclude<EqPresetName, 'custom'>] ?? EQ_PRESETS.flat;

  return DEFAULT_EQ_BANDS.map((band, index) => ({
    ...band,
    gain: clampEqGain(gains[index] ?? 0, band.minGain, band.maxGain),
  }));
};

export const buildEqFilters = (
  ctx: AudioContext,
  initialBands: EqBand[] = DEFAULT_EQ_BANDS
): { input: GainNode; output: GainNode; nodes: BiquadFilterNode[] } => {
  const nodes = initialBands.map((band) => {
    const filter = ctx.createBiquadFilter();
    filter.type = 'peaking';
    filter.frequency.value = band.frequency;
    filter.Q.value = 1.2;
    filter.gain.value = clampEqGain(band.gain, band.minGain, band.maxGain);
    return filter;
  });

  const input = ctx.createGain();
  const output = ctx.createGain();

  nodes.forEach((filter, index) => {
    if (index === 0) {
      input.connect(filter);
    } else {
      nodes[index - 1].connect(filter);
    }

    if (index === nodes.length - 1) {
      filter.connect(output);
    }
  });

  return { input, output, nodes };
};

export const applyEqBandsToFilters = (
  filters: BiquadFilterNode[],
  bands: EqBand[],
  enabled: boolean = true
) => {
  filters.forEach((filter, index) => {
    const band = bands[index];
    if (!band) return;

    const nextGain = enabled ? clampEqGain(band.gain, band.minGain, band.maxGain) : 0;
    filter.gain.setTargetAtTime(nextGain, filter.context.currentTime, 0.02);
  });
};
