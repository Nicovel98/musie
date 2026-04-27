# Arquitectura de Musie Frontend

## 📁 Estructura de Carpetas

```
frontend/src/
├── app/                 # Configuración de app (providers, router)
│   ├── providers/      # Context providers
│   └── router/         # Routing configuration
│
├── components/         # Componentes React reutilizables
│   ├── common/         # Button, Input, loader, etc
│   ├── layout/         # AppShell, Sidebar, navegación
│   ├── library/        # LibraryPanel, DiscoveryDashboard
│   ├── player/         # NowPlayingCard, EqualizerPanel
│   └── __tests__/      # Component tests
│
├── features/           # Business logic y features
│   ├── audio/          # AudioEngine, Web Audio utilities
│   │   ├── audioEngine.ts
│   │   ├── audioEngine.test.ts
│   │   └── hooks/
│   ├── equalizer/      # EQ presets y lógica
│   │   ├── presets.ts
│   │   └── __tests__/
│   ├── library/        # Gestión de biblioteca
│   │   ├── trackNormalization.ts
│   │   ├── trackNormalization.test.ts
│   │   └── libraryUtils.ts
│   ├── player/         # Lógica de reproducción
│   │   ├── playerLogic.ts
│   │   └── __tests__/
│   ├── settings/       # Configuraciones
│   │   ├── settingsState.ts
│   │   └── __tests__/
│   └── __tests__/      # Feature tests
│
├── hooks/              # Custom React hooks
│   ├── useAudioPlayer.ts       # Reproducción, volumen, seek
│   ├── useLibraryState.ts      # Tracks, búsqueda, filtros
│   ├── usePersistenceSession.ts # Save/load de sesión
│   ├── useEqualizerState.ts    # Estado del ecualizador
│   └── index.ts                # Re-exports
│
├── services/           # Servicios y utilidades
│   ├── audio/          # Web Audio utilities
│   │   └── audioUtils.ts
│   ├── covers/         # Búsqueda de portadas
│   │   └── onlineCoverLookup.ts
│   ├── storage/        # Persistencia
│   │   ├── libraryDb.ts       # IndexedDB
│   │   ├── playerSession.ts   # localStorage
│   │   └── __tests__/
│   └── __tests__/      # Service tests
│
├── store/              # State management (si aplica)
│   ├── context/        # Context API providers
│   └── hooks/          # Custom store hooks
│
├── types/              # TypeScript types
│   ├── player.ts       # Track, Player types
│   ├── audio.ts        # EQ, AudioEngine types
│   ├── ui.ts           # UI component types
│   └── index.ts        # Re-exports
│
├── utils/              # Funciones utilitarias
│   ├── errorBoundary.ts
│   ├── formatters.ts
│   ├── validation.ts
│   └── logger.ts
│
├── workers/            # Web Workers
│   ├── trackNormalizer.worker.ts
│   └── index.ts
│
├── styles/             # CSS global
│   ├── app.css
│   ├── tokens.css      # Colors, fonts, spacing
│   └── ui.css
│
├── test/               # Testing setup
│   ├── setup.ts        # Vitest configuration
│   └── mocks/          # Mock implementations
│       ├── audioContext.mock.ts
│       ├── indexedDb.mock.ts
│       └── fetch.mock.ts
│
├── App.tsx
├── main.tsx
└── index.css
```

## 🔄 Flujo de Datos

### Reproducción de Audio

```
HTMLAudioElement
    ↓
useAudioPlayer Hook (AppShell state)
    ├─ currentTrack, isPlaying, currentTime
    ├─ onPlay(), onPause(), onSeek()
    └─ calls audioEngine methods
    ↓
AudioEngine (Web Audio API pipeline)
    ├─ source → preamp → EQ bands → gain → destination
    └─ manages presets, frequency control
    ↓
NowPlayingCard Component (UI update)
    ├─ displays track info
    ├─ shows progress bar
    └─ user interacts with controls
```

### Gestión de Biblioteca

```
Import Files (user action)
    ↓
trackNormalization (extract metadata)
    ├─ parse MP3 tags (mp3tag.js)
    ├─ extract cover image
    └─ normalize track data
    ↓
libraryDb.saveLocalTracks (IndexedDB)
    ├─ persist tracks with Blob
    └─ store metadata
    ↓
LibraryPanel (render)
    ├─ useLibraryState hook (search, filter)
    ├─ useDeferredValue (performance)
    └─ display tracks
```

### Persistencia de Sesión

```
User Action (play track, change volume, etc)
    ↓
AppShell state update
    ↓
usePersistenceSession Hook
    ├─ collect: currentTrackId, currentTime, volume
    ├─ collect: theme, favoriteIds
    └─ save to localStorage
    ↓
Next app load
    ├─ loadPlayerSession() from storage
    ├─ restore state
    └─ resume playback
```

## 📐 Patrones Utilizados

### 1. **Custom Hooks para Lógica**
```typescript
// Extraer lógica compleja de componentes
const { play, pause, seek, volume } = useAudioPlayer(audioRef)
```

### 2. **Service Abstraction**
```typescript
// Servicios desacoplados de UI
await libraryDb.saveLocalTracks(tracks)
const session = loadPlayerSession()
```

### 3. **Type-Safe State**
```typescript
// TypeScript strict mode para catch errors early
type RepeatMode = 'off' | 'all' | 'one'
```

### 4. **Component Composition**
```typescript
// Componentes pequeños y reutilizables
<NowPlayingCard tracks={tracks} />
<EqualizerPanel presets={PRESETS} />
```

### 5. **Mocking for Tests**
```typescript
// Mock AudioContext para testing
setupAudioContextMock()
```

## 🧪 Testing Strategy

- **Unit Tests**: `src/features/__tests__/`, `src/services/__tests__/`
- **Component Tests**: `src/components/__tests__/`
- **Integration**: API flows (import → storage → display)
- **E2E**: Manual testing (browser, mobile)
- **Target**: >80% coverage for critical paths

## ⚡ Performance Optimizations

- **Lazy Loading**: Covers load on demand with Intersection Observer
- **Memoization**: `useMemo()`, `React.memo()` for expensive components
- **Virtualization**: `react-window` for large lists (>500 items)
- **Web Workers**: Off-thread processing for trackNormalization
- **Bundle**: <500KB gzip via code splitting

## 🔐 Error Handling

- **AudioContext Fallback**: Graceful degradation if Web Audio not available
- **IndexedDB Fallback**: In-memory storage if IndexedDB fails
- **Error Boundary**: Catch React component errors globally
- **Retry Logic**: Exponential backoff for failed operations
- **Logging**: Structured logging for debugging (no console.log in prod)

## 🚀 Build & Deploy

- **Vite**: Fast dev server, optimized builds
- **TypeScript**: Strict mode for type safety
- **ESLint + Prettier**: Code quality and formatting
- **Husky**: Pre-commit hooks for quality gates
- **GitHub Actions**: Automated tests + deploy to Pages

## 📚 Key Files

- `App.tsx`: Main component, renders layout
- `components/layout/AppShell.tsx`: Root layout, state management
- `features/audio/audioEngine.ts`: Web Audio API wrapper
- `features/equalizer/presets.ts`: EQ presets definitions
- `services/storage/libraryDb.ts`: IndexedDB abstraction
- `types/player.ts`: Player and track types

---

**Last Updated:** April 27, 2026 (Week 3, Day 1)
