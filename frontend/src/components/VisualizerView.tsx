import { useState } from 'react';
import { Activity } from 'lucide-react';
import { useVisualizer } from '../hooks/useVisualizer';
import { VisualizerPresetSelector } from './VisualizerPresetSelector';
import { usePlayerStore } from '../store/usePlayerStore';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const VisualizerView = () => {
  const [preset, setPreset] = useState<'soft' | 'mid' | 'vivid'>('mid');
  const audioData = useVisualizer(20, preset);
  const eqEnabled = usePlayerStore((state) => state.eqEnabled);
  const eqPreset = usePlayerStore((state) => state.eqPreset);
  const eqBands = usePlayerStore((state) => state.eqBands);
  const eqSignature = eqBands
    .map((band) => `${band.label} ${band.gain > 0 ? '+' : ''}${band.gain}dB`)
    .join(' · ');

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.32em] text-[var(--text-muted)]">
            <Activity size={14} />
            <span>Visualizer</span>
          </div>
          <h1 className="text-[clamp(1.5rem,4vw,2.4rem)] font-black tracking-tighter text-[var(--text-main)]">
            Respuesta visual del audio
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
            Ajusta la intensidad del analizador para ver cómo responde el sonido según el tipo de
            música y el momento.
          </p>
        </header>

        <section className="rounded-[30px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 shadow-[var(--glass-shadow)] backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--text-muted)]">
              Perfil
            </span>
            <VisualizerPresetSelector
              preset={preset}
              useThemeAudioColors
              onChange={setPreset}
              className="flex flex-wrap items-center justify-end gap-2"
            />
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-[18px] border border-[var(--glass-border)] bg-[var(--glass-bg)]/70 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Estado de EQ
              </p>
              <p className="mt-1 text-sm font-black uppercase tracking-[0.08em] text-[var(--text-main)]">
                {eqEnabled ? `Activo · ${eqPreset}` : 'Bypass · original'}
              </p>
            </div>
            <div className="rounded-[18px] border border-[var(--glass-border)] bg-[var(--glass-bg)]/70 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Curva aplicada
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-[var(--text-main)]/90">{eqSignature}</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--glass-border)] bg-black/5 p-4">
            <div className="flex h-44 items-end justify-center gap-[6px] rounded-[22px] border border-[var(--glass-border)] bg-[var(--bg-main)]/75 px-4 py-3">
              {(audioData.length > 0
                ? Array.from(audioData)
                : Array.from({ length: 20 }, () => 10)
              ).map((value, index) => {
                const normalized = clamp(value / 255, 0, 1);
                const height = 18 + Math.pow(normalized, 1.3) * 100;

                return (
                  <div
                    key={`${preset}-${index}`}
                    className="flex-1 rounded-full bg-gradient-to-t from-[var(--accent-secondary)] via-[var(--accent-primary)] to-[var(--text-main)] opacity-85"
                    style={{ height: `${height}%`, minHeight: '18%' }}
                  />
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              { title: 'Soft', text: 'Suave y elegante para escucha relajada.' },
              { title: 'Mid', text: 'Equilibrio ideal para reproducción general.' },
              { title: 'Vivid', text: 'Más energía, brillo y presencia en la mezcla.' },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[22px] border border-[var(--glass-border)] bg-[var(--glass-bg)]/70 p-4"
              >
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  {item.title}
                </p>
                <p className="text-sm leading-6 text-[var(--text-main)]/90">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
