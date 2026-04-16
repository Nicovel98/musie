# Checklist Inmediato - Semana 3

## 🚀 Tareas de Configuración (30 minutos)

- [ ] Habilitar TypeScript `strict: true` en `frontend/tsconfig.app.json`
- [ ] Agregar base path a `frontend/vite.config.ts`:
  ```typescript
  base: process.env.NODE_ENV === 'production' ? '/musie/' : '/',
  ```
- [ ] Actualizar ESLint a type-aware rules en `frontend/eslint.config.js`
- [ ] Verificar y corregir errores de TypeScript: `npm run typecheck`

---

## 📁 Estructura Base para AudioEngine (1 hora)

Crear archivos vacíos para estructura:

```bash
# Desde frontend/
mkdir -p src/features/audio
mkdir -p src/features/equalizer
mkdir -p src/utils
mkdir -p src/workers

touch src/features/audio/audioEngine.ts
touch src/features/audio/audioEngine.test.ts
touch src/features/equalizer/presets.ts
touch src/types/audio.ts
touch src/utils/errorBoundary.ts
touch src/ARCHITECTURE.md
touch CONTRIBUTING.md
```

---

## 🎵 AudioEngine Interface (Referencia)

Crear `src/features/audio/audioEngine.ts`:

```typescript
export type EQBand = {
  frequency: number // Hz
  gain: number      // dB
  Q: number         // Quality factor
}

export type AudioPreset = {
  name: string
  bands: EQBand[]
  preamp: number // dB
}

export class AudioEngine {
  private audioContext: AudioContext | null = null
  private audioSource: MediaElementAudioSourceNode | null = null
  private gainNode: GainNode | null = null
  private eqBands: BiquadFilterNode[] = []
  
  // Métodos principales
  init(): void { /* TODO */ }
  attachAudioElement(element: HTMLAudioElement): void { /* TODO */ }
  setFrequency(bandIndex: number, gain: number): void { /* TODO */ }
  setPreset(presetName: string): void { /* TODO */ }
  disconnect(): void { /* TODO */ }
}

export const audioEngine = new AudioEngine()
```

---

## 🧪 Testing Setup (30 minutos)

1. Crear `src/test/mocks/` con:
   - `audioContext.mock.ts`: Mock de Web Audio API
   - `indexedDb.mock.ts`: Mock de Dexie

2. Actualizar `src/test/setup.ts`:
   ```typescript
   import '@testing-library/jest-dom/vitest'
   import { cleanup } from '@testing-library/react'
   import { afterEach, beforeAll, vi } from 'vitest'
   
   // Mock setup
   beforeAll(() => {
     // Mock AudioContext
     global.AudioContext = vi.fn()
   })
   
   afterEach(() => {
     cleanup()
   })
   ```

3. Crear `src/components/player/__tests__/NowPlayingCard.test.tsx` (ya existe)

---

## 🪝 Custom Hooks Structure (1.5 horas)

Crear `src/hooks/index.ts`:

```typescript
// hooks/useAudioPlayer.ts
export function useAudioPlayer(audioRef: React.RefObject<HTMLAudioElement>) {
  // TODO: Extract from AppShell
  // Return: {play, pause, seek, setVolume, ...}
}

// hooks/useLibraryState.ts
export function useLibraryState(tracks: Track[]) {
  // TODO: Search, filter, sort logic
}

// hooks/usePersistenceSession.ts
export function usePersistenceSession() {
  // TODO: Save/load session
}

// hooks/index.ts
export { useAudioPlayer } from './useAudioPlayer'
export { useLibraryState } from './useLibraryState'
export { usePersistenceSession } from './usePersistenceSession'
```

---

## 📚 Documentation Start (1 hora)

### CONTRIBUTING.md

```markdown
# Contribuyendo a Musie

## Setup

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## Testing

\`\`\`bash
npm run test          # Run once
npm run test:watch   # Watch mode
\`\`\`

## Code Style

- Use Prettier: \`npm run format\`
- ESLint: \`npm run lint:fix\`
- TypeScript: \`npm run typecheck\`

## Conventional Commits

\`feat:\`, \`fix:\`, \`docs:\`, \`refactor:\`, \`test:\`, \`chore:\`

## Pull Request Process

1. Create feature branch: \`git checkout -b feat/audio-engine\`
2. Implement feature + tests
3. Run: \`npm run lint\`, \`npm run typecheck\`, \`npm run test\`
4. Push and create PR
\`\`\`

### src/ARCHITECTURE.md

```markdown
# Musie Architecture

## Folder Structure

\`\`\`
src/
├── features/      Business logic (audio, player, library)
├── components/    React components
├── hooks/         Custom React hooks
├── services/      Utilities (storage, API)
├── types/         TypeScript types
└── utils/         Helper functions
\`\`\`

## Data Flow

HTMLAudioElement → useAudioPlayer Hook → AppShell State → UI Components

## Key Patterns

- Custom hooks for logic extraction
- Component composition over inheritance
- Storage service abstraction (IndexedDB, localStorage)
\`\`\`

---

## ⚠️ Git Config (5 minutos)

```bash
# From frontend/
npm install -D husky lint-staged

# Configure pre-commit
npx husky add .husky/pre-commit "npm run lint && npm run typecheck && npm run test"
```

---

## 📋 Checklist por Día (Semana 3)

### Día 1-2: AudioEngine
- [ ] Implement `audioEngine.ts` with methods
- [ ] Create presets in `presets.ts`
- [ ] Add JSDoc comments
- [ ] Create unit tests

### Día 3: EqualizerPanel Component
- [ ] Design component structure
- [ ] Implement preset dropdown
- [ ] Create frequency sliders
- [ ] Add reset functionality

### Día 4: Testing & Refactoring
- [ ] Extract custom hooks
- [ ] Create test suite (>80% coverage)
- [ ] Add error handling

### Día 5: Config & CI/CD
- [ ] Enable TypeScript strict
- [ ] Update GitHub Actions
- [ ] Final documentation

---

## 🎯 Success Criteria

✅ AudioEngine fully functional with 3+ presets
✅ Test coverage >80% for critical paths
✅ Custom hooks extracted and reusable
✅ Documentation complete and clear
✅ GitHub Actions running tests on PR
✅ Zero TypeScript strict errors

---

## 📞 Troubleshooting

**AudioContext not working?**
- Check browser support
- Use fallback (audio element only)

**IndexedDB tests failing?**
- Mock with `fake-indexeddb`
- Check test setup.ts

**Import times slow?**
- Prepare for Web Workers (Semana 4)
- Profile with DevTools
