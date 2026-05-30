import { Check, Layers3, Sparkles } from 'lucide-react';

type DarkTheme = 'quantum' | 'classic';
type LightTheme = 'light' | 'light-quantum';

interface SettingsViewProps {
  selectedDarkTheme: DarkTheme;
  selectedLightTheme: LightTheme;
  setDarkTheme: (theme: DarkTheme) => void;
  setLightTheme: (theme: LightTheme) => void;
  themeAffectsAudioUi: boolean;
  setThemeAffectsAudioUi: (value: boolean) => void;
}

type ThemeOption<T extends string> = {
  id: T;
  name: string;
  description: string;
  hex: string;
  gradient: string;
  isDefault?: boolean;
};

const orderThemes = <T extends string>(themes: ThemeOption<T>[], activeId: T) => {
  const getPriority = (option: ThemeOption<T>) => {
    if (option.isDefault) return 0;
    if (option.id === activeId) return 1;
    return 2;
  };

  return [...themes].sort((a, b) => getPriority(a) - getPriority(b));
};

const darkThemes: ThemeOption<DarkTheme>[] = [
  {
    id: 'quantum',
    name: 'Verde Azulado Cuántico',
    description: 'Fresco, técnico y acuático.',
    hex: '#041f2a #00c2a8 #00e5ff #3a506b #e6fffb',
    gradient:
      'linear-gradient(135deg, rgba(0,194,168,0.95) 0%, rgba(0,229,255,0.88) 38%, rgba(58,80,107,0.96) 100%)',
  },
  {
    id: 'classic',
    name: 'Azul Clásico',
    description: 'El azul original con contraste sereno.',
    hex: '#15173D #7dd3fc #a78bfa #06b6d4 #f5f7fb',
    gradient:
      'linear-gradient(135deg, rgba(125,211,252,0.96) 0%, rgba(167,139,250,0.9) 52%, rgba(6,182,212,0.9) 100%)',
    isDefault: true,
  },
];

const lightThemes: ThemeOption<LightTheme>[] = [
  {
    id: 'light',
    name: 'Light Clásico Paper',
    description: 'Basado en Azul Clásico, con acabado papel y contraste suave.',
    hex: '#f4f6fb #11152b #59647a #7dd3fc #a78bfa',
    gradient:
      'linear-gradient(135deg, rgba(250,251,255,0.98) 0%, rgba(236,239,250,0.96) 44%, rgba(167,139,250,0.22) 100%)',
    isDefault: true,
  },
  {
    id: 'light-quantum',
    name: 'Light Cuántico Paper',
    description: 'Inspirado en Verde Azulado Cuántico, ahora con un tono más oscuro.',
    hex: '#dceeed #051b22 #204a51 #00c2a8 #00e5ff',
    gradient:
      'linear-gradient(135deg, rgba(228,244,241,0.98) 0%, rgba(210,235,231,0.96) 46%, rgba(0,229,255,0.24) 100%)',
  },
];

const ThemeCard = ({
  option,
  selected,
  onSelect,
}: {
  option: {
    id: DarkTheme | LightTheme;
    name: string;
    description: string;
    hex: string;
    gradient: string;
    isDefault?: boolean;
  };
  selected: boolean;
  onSelect: () => void;
}) => (
  <button
    onClick={onSelect}
    className={`group relative overflow-hidden rounded-[28px] border p-4 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.24)] ${
      selected
        ? 'border-[var(--accent-primary)] bg-[var(--glass-bg)] shadow-[var(--glass-shadow)]'
        : 'border-[var(--glass-border)] bg-[var(--glass-bg)]'
    }`}
  >
    <div
      className="h-28 rounded-[22px] border border-white/10 shadow-inner"
      style={{ backgroundImage: option.gradient }}
    >
      <div className="flex h-full items-start justify-between p-3">
        <span className="rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.28em] text-white/90 backdrop-blur-sm">
          {selected ? 'Activo' : 'Tema'}
        </span>
        {selected ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/90 text-black shadow-lg backdrop-blur-sm">
            <Check size={16} />
          </span>
        ) : null}
      </div>
    </div>

    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2">
        <Layers3 size={16} className="text-[var(--accent-primary)]" />
        <h2 className="text-lg font-black tracking-tight text-[var(--text-main)]">{option.name}</h2>
        {option.isDefault ? (
          <span className="rounded-full border border-[var(--accent-secondary)]/45 bg-[var(--accent-secondary)]/12 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-[var(--tab-active-text)]">
            Predeterminado
          </span>
        ) : null}
      </div>
      <p className="text-sm text-[var(--text-muted)]">{option.description}</p>
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)]">
        {option.hex}
      </p>
    </div>
  </button>
);

export const SettingsView = ({
  selectedDarkTheme,
  selectedLightTheme,
  setDarkTheme,
  setLightTheme,
  themeAffectsAudioUi,
  setThemeAffectsAudioUi,
}: SettingsViewProps) => {
  const orderedDarkThemes = orderThemes(darkThemes, selectedDarkTheme);
  const orderedLightThemes = orderThemes(lightThemes, selectedLightTheme);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.32em] text-[var(--text-muted)]">
            <Sparkles size={14} />
            <span>Settings</span>
          </div>
          <h1 className="text-[clamp(1.5rem,4vw,2.4rem)] font-black tracking-tighter text-[var(--text-main)]">
            Tema visual
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
            Elige una base y deja listo el sistema para sumar más temas después sin tocar
            componentes sueltos.
          </p>
        </header>

        <section className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.32em] text-[var(--text-muted)]">
              <Sparkles size={14} />
              <span>Temas oscuros</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {orderedDarkThemes.map((option) => (
                <ThemeCard
                  key={option.id}
                  option={option}
                  selected={selectedDarkTheme === option.id}
                  onSelect={() => setDarkTheme(option.id)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.32em] text-[var(--text-muted)]">
              <Sparkles size={14} />
              <span>Temas claros</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {orderedLightThemes.map((option) => (
                <ThemeCard
                  key={option.id}
                  option={option}
                  selected={selectedLightTheme === option.id}
                  onSelect={() => setLightTheme(option.id)}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-4 shadow-[var(--glass-shadow)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--text-muted)]">
                  Color dinámico en audio
                </p>
                <p className="text-sm text-[var(--text-main)]/90">
                  Si está activo, el tema colorea visualizer, barra de progreso y volumen.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={themeAffectsAudioUi}
                onClick={() => setThemeAffectsAudioUi(!themeAffectsAudioUi)}
                className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors duration-300 ${
                  themeAffectsAudioUi
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/25'
                    : 'border-[var(--glass-border)] bg-black/10'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-[var(--text-main)] shadow transition-transform duration-300 ${
                    themeAffectsAudioUi ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 shadow-[var(--glass-shadow)] backdrop-blur-xl">
          <h3 className="text-sm font-black uppercase tracking-[0.28em] text-[var(--text-muted)]">
            Siguiente paso
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-main)]/90">
            El selector ya queda listo para conectar más presets, guardar preferencias por usuario o
            agregar una vista de edición avanzada después.
          </p>
        </section>
      </div>
    </div>
  );
};
