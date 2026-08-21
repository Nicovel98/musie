import { Activity, SlidersHorizontal, Sparkles } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import type { EqPresetName } from '../store/eq';
import { useVisualizer } from '../hooks/useVisualizer';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const EqualizerView = () => {
  const eqBands = usePlayerStore((state) => state.eqBands);
  const eqPreset = usePlayerStore((state) => state.eqPreset);
  const eqEnabled = usePlayerStore((state) => state.eqEnabled);
  const setEqPreset = usePlayerStore((state) => state.setEqPreset);
  const setEqEnabled = usePlayerStore((state) => state.setEqEnabled);
  const updateEqBand = usePlayerStore((state) => state.updateEqBand);
  const resetEq = usePlayerStore((state) => state.resetEq);
  const audioData = useVisualizer(20, 'mid');

  const avgGain =
    eqBands.length > 0 ? eqBands.reduce((sum, band) => sum + band.gain, 0) / eqBands.length : 0;
  const maxDelta = eqBands.length > 0 ? Math.max(...eqBands.map((band) => Math.abs(band.gain))) : 0;

  const eqPresetOptions: { id: EqPresetName; label: string }[] = [
    { id: 'flat', label: 'Flat' },
    { id: 'bass', label: 'Bass' },
    { id: 'vocal', label: 'Vocal' },
    { id: 'rock', label: 'Rock' },
    { id: 'classical', label: 'Classical' },
    { id: 'treble', label: 'Treble' },
  ];

  const curvePoints = eqBands
    .map((band, index) => {
      const x = eqBands.length <= 1 ? 50 : (index / (eqBands.length - 1)) * 100;
      const normalized = (band.gain - band.minGain) / (band.maxGain - band.minGain);
      const y = 100 - normalized * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.32em] text-[var(--text-muted)]">
            <SlidersHorizontal size={14} />
            <span>Equalizer</span>
          </div>
          <h1 className="text-[clamp(1.5rem,4vw,2.4rem)] font-black tracking-tighter text-[var(--text-main)]">
            Ajuste de audio
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
            Ajusta las bandas para reforzar graves, voces o brillo sin salir de la reproducción.
          </p>
        </header>

        <section className="rounded-[30px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 shadow-[var(--glass-shadow)] backdrop-blur-xl">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-[var(--text-muted)]">
              <Sparkles size={14} />
              <span>Preset</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {eqEnabled ? 'Activo' : 'Desactivado'}
              </span>
              <button
                type="button"
                onClick={() => setEqEnabled(!eqEnabled)}
                className="rounded-full border border-[var(--glass-border)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-main)] transition-all hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
              >
                A/B: {eqEnabled ? 'EQ' : 'Original'}
              </button>
              <button
                type="button"
                role="switch"
                aria-checked={eqEnabled}
                onClick={() => setEqEnabled(!eqEnabled)}
                className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors duration-300 ${
                  eqEnabled
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/25'
                    : 'border-[var(--glass-border)] bg-black/10'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-[var(--text-main)] shadow transition-transform duration-300 ${
                    eqEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-[18px] border border-[var(--glass-border)] bg-[var(--glass-bg)]/70 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Estado
              </p>
              <p className="mt-1 text-sm font-black text-[var(--text-main)]">
                {eqEnabled ? 'Procesando EQ' : 'Bypass (sin EQ)'}
              </p>
            </div>
            <div className="rounded-[18px] border border-[var(--glass-border)] bg-[var(--glass-bg)]/70 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Preset actual
              </p>
              <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-[var(--text-main)]">
                {eqPreset}
              </p>
            </div>
            <div className="rounded-[18px] border border-[var(--glass-border)] bg-[var(--glass-bg)]/70 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Intensidad
              </p>
              <p className="mt-1 text-sm font-black text-[var(--text-main)]">
                Δ max {maxDelta.toFixed(0)} dB | media {avgGain.toFixed(1)} dB
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {eqPresetOptions.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setEqPreset(preset.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] transition-all ${
                  eqPreset === preset.id
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 text-[var(--text-main)]'
                    : 'border-[var(--glass-border)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[22px] border border-[var(--glass-border)] bg-[var(--glass-bg)]/70 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Curva EQ objetivo
                </p>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-main)]/75">
                  {eqPreset}
                </span>
              </div>

              <div className="rounded-[16px] border border-[var(--glass-border)] bg-black/5 p-3">
                <svg viewBox="0 0 100 100" className="h-36 w-full">
                  <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" opacity="0.15" />
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-[var(--accent-primary)]"
                    points={curvePoints}
                  />
                  {eqBands.map((band, index) => {
                    const x = eqBands.length <= 1 ? 50 : (index / (eqBands.length - 1)) * 100;
                    const normalized = (band.gain - band.minGain) / (band.maxGain - band.minGain);
                    const y = 100 - normalized * 100;

                    return (
                      <circle
                        key={`${band.frequency}-point`}
                        cx={x}
                        cy={y}
                        r="2.3"
                        className="fill-[var(--text-main)]"
                      />
                    );
                  })}
                </svg>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {eqBands.map((band) => (
                  <span
                    key={`${band.frequency}-legend`}
                    className="rounded-full border border-[var(--glass-border)] px-2 py-1 text-[10px] font-bold tracking-[0.06em] text-[var(--text-main)]/85"
                  >
                    {band.label}: {band.gain > 0 ? '+' : ''}
                    {band.gain}dB
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-[var(--glass-border)] bg-[var(--glass-bg)]/70 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  <Activity size={13} />
                  Respuesta en vivo
                </p>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-main)]/75">
                  {eqEnabled ? 'EQ on' : 'Bypass'}
                </span>
              </div>

              <div className="rounded-[16px] border border-[var(--glass-border)] bg-black/5 p-3">
                <div className="flex h-36 items-end justify-center gap-[5px] rounded-[12px] border border-[var(--glass-border)] bg-[var(--bg-main)]/75 px-3 py-2">
                  {(audioData.length > 0
                    ? Array.from(audioData)
                    : Array.from({ length: 20 }, () => 10)
                  ).map((value, index) => {
                    const normalized = clamp(value / 255, 0, 1);
                    const height = 14 + Math.pow(normalized, 1.3) * 84;

                    return (
                      <div
                        key={`eq-live-${index}`}
                        className="flex-1 rounded-full bg-gradient-to-t from-[var(--accent-secondary)] via-[var(--accent-primary)] to-[var(--text-main)] opacity-85 transition-all"
                        style={{ height: `${height}%`, minHeight: '14%' }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {eqBands.map((band, index) => {
              const isBoost = band.gain >= 0;
              const fillPercent =
                ((band.gain - band.minGain) / (band.maxGain - band.minGain)) * 100;

              return (
                <div
                  key={band.frequency}
                  className="rounded-[22px] border border-[var(--glass-border)] bg-[var(--glass-bg)]/75 p-3 text-center shadow-inner shadow-black/5"
                >
                  <div className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    {band.label}
                  </div>
                  <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-300"
                      style={{ width: `${(Math.abs(band.gain) / band.maxGain) * 100}%` }}
                    />
                  </div>
                  <div
                    className={`mb-3 text-lg font-black ${
                      isBoost ? 'text-[var(--accent-primary)]' : 'text-[var(--text-main)]'
                    }`}
                  >
                    {band.gain > 0 ? '+' : ''}
                    {band.gain}dB
                  </div>
                  <div className="flex h-40 items-end justify-center rounded-[16px] border border-[var(--glass-border)] bg-black/5 p-2">
                    <div className="relative flex h-full w-8 items-end justify-center overflow-hidden rounded-full bg-black/10">
                      <div
                        className="absolute inset-x-0 bottom-0 rounded-full bg-gradient-to-t from-[var(--accent-secondary)] via-[var(--accent-primary)] to-[var(--accent-primary)]/80 transition-all duration-300"
                        style={{ height: `${Math.max(8, fillPercent)}%` }}
                      />
                      <input
                        aria-label={`${band.label} equalizer band`}
                        type="range"
                        min={band.minGain}
                        max={band.maxGain}
                        step={1}
                        value={band.gain}
                        onChange={(event) => updateEqBand(index, Number(event.target.value))}
                        className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
                        style={{ writingMode: 'vertical-lr' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={resetEq}
              className="rounded-full border border-[var(--glass-border)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-main)] transition-all hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
            >
              Reset
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
