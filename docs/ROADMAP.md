# 🎵 Musie: Roadmap de Simplificación & Optimización

**Objetivo:** Transformar Musie en una aplicación minimalista, mantenible y altamente optimizada.

**Período:** 8 días (1 Fase Pre + 7 días de ejecución)
**Inicio:** 6 de Mayo 2026
**Meta Final:** Lanzar v2.0.0-simplified

---

## 📊 Visión General

| Métrica | Actual | Target | Impacto |
| --- | --- | --- | --- |
| **Componentes** | 45+ | 31 (-31%) | Mantenibilidad |
| **Líneas CSS** | 2000+ | ~1200 (-40%) | Performance |
| **Hooks** | 7 dispersos | 3-4 consolidados | Claridad |
| **Bundle Size** | ~500KB | ~400KB (-20%) | Speed |
| **Test Coverage** | 40% | >70% | Calidad |
| **TypeScript Errors** | 5+ | 0 | Robustez |

---

## 🎯 Principios de Simplificación

### MoSCoW Priority

**MUST (No Negociable):**
- Play/pause/next/prev/seek/volumen ✅
- Cargar archivos locales ✅
- Búsqueda en biblioteca ✅
- Persistencia de sesión ✅
- Responsive mobile/tablet/desktop ✅

**SHOULD (Alta Prioridad):**
- Ecualizador (5 presets)
- Dark/Light theme
- Cola de reproducción
- Metadatos correctos

**COULD (Considerar):**
- Portadas online
- Web Workers
- Filtros avanzados
- Historial

**WON'T (Diferir):**
- Capacitor/Android (v2.1)
- Cloud sync
- Redes sociales

### Definiciones de "Simple"

**Componentes:**
```
✅ <250 líneas código
✅ <5 props o composition
✅ Una responsabilidad
✅ Reutilizable 2+ lugares
✅ 80% test coverage
```

**Hooks:**
```
✅ <100 líneas
✅ Responsabilidad clara
✅ Return type explícito
✅ JSDoc documentado
✅ Tests unitarios
```

**CSS:**
```
✅ <300 líneas por componente
✅ Tokens de design
✅ 3 breakpoints: mobile, tablet, desktop
✅ Sin duplicación color/spacing
✅ Variables CSS para temas
```

---

## 📈 Benchmarks de Performance

### Medidas Iniciales (Línea Base)
Ejecutar antes de Fase 0:
```bash
npm run build
npm run test -- --coverage
lighthouse http://localhost:5173
```

**Capturar:**
- Bundle gzip size
- Test coverage %
- Lighthouse score
- Tiempo inicial de carga
- Memory usage (DevTools)
- FPS en reproducción

### Checkpoints Diarios
Ejecutar al final de cada día:
```bash
npm run typecheck  # 0 errores
npm run test       # >80% pass
npm run build      # Bundle size no aumentó >5%
```

---

## 🔧 Plan de Ejecución

### FASE 0️⃣ - Pre-Simplificación & Auditoría Exhaustiva

**Duración:** 1 día completo (6-8 horas)
**Meta:** Mapear 100% de oportunidades sin hacer cambios

#### 0.1 - Documentar Estado Base (1h)
- [ ] `npm run build` → capturar bundle size
- [ ] `npm run test -- --coverage` → coverage report
- [ ] Screenshots de UI (desktop, tablet, mobile)
- [ ] Lighthouse score
- [ ] Performance timeline en DevTools
- [ ] Crear `STATE_BASELINE.md` con todas las métricas

#### 0.2 - Auditoría de Componentes (2h)
```
Checklist por componente:
- Ubicación y líneas de código
- Props: cuántas, cuáles necesarias
- ¿Se usa en múltiples lugares?
- ¿Duplica lógica?
- ¿Puede merg[arse] con otro?
- ¿Es MVP?
```

Documentar en `AUDIT_COMPONENTS.md`:
```markdown
| Componente | LOC | Props | Reutilizable | Acción |
| --- | --- | --- | --- | --- |
| AppShell | 180 | 0 | N/A | Mantener |
| DesktopWorkspace | 120 | 2 | No | Eliminar |
| MobileWorkspace | 130 | 2 | No | Eliminar/Merge |
| ... | ... | ... | ... | ... |
```

#### 0.3 - Auditoría de Hooks (1.5h)
Documentar en `AUDIT_HOOKS.md`:
```markdown
- useAudioPlayer (145 LOC): Play, pause, seek, volume
- usePersistenceSession (80 LOC): Load/save state
- useLibraryState (200 LOC): Tracks, search, filter
- ... etc

Consolidación propuesta:
usePlayer (combine useAudioPlayer + usePersistenceSession)
useLibrary (combine useLibraryState)
useSettings (theme, eq presets, etc)
```

#### 0.4 - Auditoría de CSS (1h)
Documentar en `AUDIT_STYLES.md`:
```
Total CSS: 2000+ líneas
- Duplicación de colores: 12 shades, reducir a 8
- Spacing: escala inconsistente, estandarizar
- Breakpoints: 5 definidos, reducir a 3
- Animations: 8 custom, consolidar a 4 base
- Dark mode: 800 líneas, simplificar con CSS vars
```

#### 0.5 - Risk Assessment (1h)
Crear `ROLLBACK_PLAN.md`:
```markdown
## Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigation |
| --- | --- | --- | --- |
| Merge hooks rompe sesión | Media | Alto | Rama backup día 2 |
| Eliminar componente quiebra layout | Alta | Alto | Git revert script |
| CSS changes rompen responsive | Alta | Medio | Mobile tests diarios |

## Rollback Procedure
1. Crear rama `backup-preDay` antes de cada día importante
2. Commit "Working checkpoint" al final de cada día
3. En caso de error: git reset --hard backup-preDay
```

#### 0.6 - Crear Matriz de Impacto (1h)
Documentar en `IMPACT_MATRIX.md`:
```markdown
## Impact vs Effort (MoSCoW Score)

| Cambio | Impacto | Esfuerzo | Priority | Día |
| --- | --- | --- | --- | --- |
| Merge hooks (3→1) | Alto | Medio | 1 | Día 2 |
| Eliminar DesktopWorkspace | Medio | Bajo | 2 | Día 3 |
| Consolidar CSS | Alto | Alto | 1 | Día 4 |
| Simplificar EQ | Bajo | Bajo | 3 | Día 1 |
```

**Entregables Fase 0:**
- ✅ STATE_BASELINE.md (métricas iniciales)
- ✅ AUDIT_COMPONENTS.md (matriz de componentes)
- ✅ AUDIT_HOOKS.md (análisis de hooks)
- ✅ AUDIT_STYLES.md (análisis CSS)
- ✅ ROLLBACK_PLAN.md (planes de revertir)
- ✅ IMPACT_MATRIX.md (priorización)
- ✅ Rama `backup-pre-simplification` creada

---

### 🔴 **Día 1 - Simplificación de Hooks & Consolidación**

**Objetivo:** Reducir 7 hooks dispersos a 3-4 hooks principales consolidados.

#### 1.1 - Crear usePlayer Hook (2h)
Merge: `useAudioPlayer.ts` + `usePersistenceSession.ts`

```typescript
// src/hooks/usePlayer.ts
interface PlayerState {
  currentTrack: Track | null
  queue: Track[]
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
}

interface PlayerMethods {
  play(): void
  pause(): void
  next(): void
  prev(): void
  seek(time: number): void
  setVolume(vol: number): void
}

export function usePlayer(): PlayerState & PlayerMethods { ... }
```

**Checklist:**
- [ ] Copiar lógica de useAudioPlayer
- [ ] Copiar lógica de usePersistenceSession
- [ ] Agregar localStorage save() al cambiar estado
- [ ] Tests: 80% coverage
- [ ] Sin errores TypeScript

#### 1.2 - Crear useLibrary Hook (1.5h)
Merge: `useLibraryState.ts` + track normalization

```typescript
// src/hooks/useLibrary.ts
interface LibraryState {
  tracks: Track[]
  searchQuery: string
  sortBy: 'name' | 'artist' | 'date'
  filterBy: string[]
}

interface LibraryMethods {
  addTracks(files: File[]): Promise<void>
  search(query: string): void
  filter(criteria: string[]): void
  sort(sortKey: string): void
}

export function useLibrary(): LibraryState & LibraryMethods { ... }
```

#### 1.3 - Crear useSettings Hook (1h)
Consolidar theme, EQ presets, language

```typescript
// src/hooks/useSettings.ts
interface Settings {
  theme: 'light' | 'dark'
  eqPreset: string
  language: 'es' | 'en'
}

export function useSettings(): Settings & setters { ... }
```

#### 1.4 - Eliminar Hooks Antiguos (30m)
- [ ] Borrar `src/hooks/useAudioPlayer.ts`
- [ ] Borrar `src/hooks/usePersistenceSession.ts`
- [ ] Borrar `src/hooks/useLibraryState.ts`
- [ ] Borrar `src/hooks/useEqualizerState.ts` (si existe)
- [ ] Actualizar `src/hooks/index.ts` con re-exports

#### 1.5 - Actualizar Componentes (2h)
- [ ] AppShell: cambiar imports a nuevo hooks
- [ ] Revisar que todo funciona en navegador
- [ ] Tests: play, pause, search siguen funcionando

#### 1.6 - Update Tests (1h)
- [ ] Tests para `usePlayer.ts` (150+ líneas)
- [ ] Tests para `useLibrary.ts` (150+ líneas)
- [ ] Tests para `useSettings.ts` (80+ líneas)

**Daily Checkpoint:**
- [ ] `npm run typecheck` → 0 errores
- [ ] `npm run test` → >80% pass
- [ ] Bundle size no aumentó >5%
- [ ] App funciona en navegador

**Entregable:** Commit "refactor: consolidate hooks - usePlayer, useLibrary, useSettings"

---

### 🟠 **Día 2 - Simplificación de Layout (Merge Componentes)**

**Objetivo:** Reducir componentes de layout de 5+ a 2-3.

#### 2.1 - Merge DesktopWorkspace + MobileWorkspace (2h)
- [ ] Analizar ambos componentes
- [ ] Extraer diferencias: layout grid vs flex, sidebar position
- [ ] Crear `Workspace.tsx` con media queries
- [ ] Usar breakpoints: $tablet, $desktop
- [ ] Eliminar DesktopWorkspace.tsx y MobileWorkspace.tsx

#### 2.2 - Simplificar SidebarMenu (1.5h)
- [ ] ¿Necesita componente separado?
- [ ] Opción: Inline en Workspace o crear `<Navigation />` base
- [ ] Máximo 150 líneas

#### 2.3 - Componente Principal AppShell (1h)
- [ ] Revisar si AppShell puede ser más simple
- [ ] Estructura clara: header, sidebar, content, player
- [ ] Grid CSS simple

#### 2.4 - Consolidar CSS de Layout (1h)
- [ ] `AppShell.css`
- [ ] `Workspace.css`
- [ ] `Navigation.css`
- [ ] Eliminar archivos de componentes mergeados

#### 2.5 - Tests de Layout (1.5h)
- [ ] Render en desktop viewport
- [ ] Render en tablet viewport
- [ ] Render en mobile viewport
- [ ] Responsive tests

**Daily Checkpoint:**
- [ ] ✅ App responde correctamente en móvil
- [ ] ✅ App responde correctamente en desktop
- [ ] ✅ Sidebar funciona en ambos
- [ ] ✅ Bundle CSS redujo

**Entregable:** Commit "refactor: merge layout components - desktop, mobile, sidebar"

---

### 🟡 **Día 3 - Simplificación de Biblioteca & Player**

**Objetivo:** Reducir componentes de biblioteca y player, eliminar redundancia.

#### 3.1 - Merge LibraryPanel + QueuePanel (2h)
- [ ] Análisis: LibraryPanel muestra tracks; QueuePanel muestra cola
- [ ] Solución: Tabs o toggle para alternar vista
- [ ] Crear `LibraryView.tsx` con tabs: "All Tracks" / "Queue"
- [ ] Eliminar LibraryPanel.tsx y QueuePanel.tsx

#### 3.2 - Simplificar DiscoveryDashboard (1h)
- [ ] ¿Es MVP?
- [ ] Opción A: Eliminar completamente
- [ ] Opción B: Mover a tab "Explorar" en LibraryView
- [ ] Decisión: Si no es crítico, eliminar

#### 3.3 - Simplificar EqualizerPanel (1h)
- [ ] ¿Siempre visible? ¿O collapsible?
- [ ] Presets reducidos: 5 en lugar de 15+
- [ ] Sliders simplificados: 3 bandas (bass, mid, treble)
- [ ] Máximo 200 líneas

#### 3.4 - Compactar NowPlayingCard (1h)
- [ ] Eliminar elementos innecesarios
- [ ] Portada pequeña + título + artist
- [ ] Controles esenciales (play/pause, next/prev)

#### 3.5 - CSS Consolidado (1h)
- [ ] `LibraryView.css` (<300 líneas)
- [ ] `EqualizerPanel.css` (<200 líneas)
- [ ] `NowPlayingCard.css` (<150 líneas)

#### 3.6 - Tests (1h)
- [ ] Buscar en biblioteca
- [ ] Ver cola
- [ ] Cambiar presets de EQ

**Daily Checkpoint:**
- [ ] Búsqueda funciona
- [ ] Cola se muestra correctamente
- [ ] EQ cambia al seleccionar preset
- [ ] UI no se quiebra

**Entregable:** Commit "refactor: simplify library and player components"

---

### 🟢 **Día 4 - Refactorización CSS Global & Tokens**

**Objetivo:** -40% líneas CSS, sistema de tokens unificado.

#### 4.1 - Crear Sistema de Tokens (2h)
Actualizar/crear `src/styles/tokens.css`:

```css
:root {
  /* Colors: 10 base + variations */
  --color-primary: #6366f1;
  --color-primary-dark: #4f46e5;
  --color-bg: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-text: #1f2937;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* Typography: 2 fonts */
  --font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Monaco', 'Courier New', monospace;

  /* Spacing: scale 4px */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);

  /* Breakpoints */
  --bp-mobile: 576px;
  --bp-tablet: 768px;
  --bp-desktop: 1024px;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #1f2937;
    --color-bg-secondary: #111827;
    --color-text: #f9fafb;
    --color-text-secondary: #d1d5db;
    --color-border: #374151;
  }
}
```

Documentar en `DESIGN_TOKENS.md`

#### 4.2 - Consolidar CSS de Componentes (2h)
- [ ] Revisar cada `.css` que existe
- [ ] Eliminar duplicación de colores/spacing
- [ ] Cambiar valores hardcoded por tokens
- [ ] Máximo 300 líneas por componente principal
- [ ] Eliminar archivos `.css` innecesarios

Ejemplo:
```css
/* ❌ Antes */
.button {
  background-color: #6366f1;
  padding: 12px 16px;
  color: #ffffff;
}

/* ✅ Después */
.button {
  background-color: var(--color-primary);
  padding: var(--space-sm) var(--space-md);
  color: var(--color-bg);
}
```

#### 4.3 - Simplificar Responsive (1h)
- [ ] 3 breakpoints: mobile ($bp-mobile), tablet ($bp-tablet), desktop ($bp-desktop)
- [ ] Eliminar media queries duplicadas
- [ ] Mobile-first approach

#### 4.4 - Dark Mode Robusto (30m)
- [ ] Usar `prefers-color-scheme: dark` CSS
- [ ] O: Toggle manual con localStorage
- [ ] Tests en ambos temas

#### 4.5 - Auditar Bundle CSS (30m)
- [ ] `npm run build`
- [ ] Revisar tamaño en `dist/`
- [ ] Si hay CSS no usado, aplicar PurgeCSS
- [ ] Meta: <100KB gzip

**Daily Checkpoint:**
- [ ] CSS es consistente
- [ ] Tokens se usan en 90%+ del CSS
- [ ] Dark mode funciona
- [ ] Responsive OK

**Entregable:** Commit "style: unify tokens and reduce CSS by 40%"

---

### 🔵 **Día 5 - Limpieza de Servicios, Features & Utils**

**Objetivo:** Eliminar código muerto y redundancia en servicios.

#### 5.1 - Auditar Features (1.5h)

**audio/**
- [ ] `audioEngine.ts`: ¿Qué hace realmente?
- [ ] ¿Se puede simplificar a funciones puras?
- [ ] Mantener: init, attach element, disconnect
- [ ] Eliminar: complejidad innecesaria

**equalizer/**
- [ ] `presets.ts`: Reducir presets
  - Keep: Flat, Bass Boost, Treble Boost, Classical, Podcast
  - Remove: 10 presets adicionales

**library/**
- [ ] `trackNormalization.ts`: ¿Necesario archivo separado?
- [ ] Opción: Inline en `useLibrary.ts`
- [ ] Si se mantiene: máx 100 líneas

#### 5.2 - Auditar Services (1.5h)

**covers/**
- [ ] `onlineCoverLookup.ts`: ¿MVP?
- [ ] Considerar desactivar por defecto
- [ ] O: Mover a feature opt-in

**storage/**
- [ ] `libraryDb.ts`: Mantener (IndexedDB)
- [ ] `playerSession.ts`: Mantener (localStorage)
- [ ] ¿Consolidar en un service?

#### 5.3 - Limpiar Utils (1h)
- [ ] Revisar cada archivo en `src/utils/`
- [ ] Eliminar si no se usa
- [ ] Consolidar funciones similares
- [ ] Documentar con JSDoc

#### 5.4 - Revisar Dependencias npm (1h)
```bash
npm list
npm audit
```

Documentar en `package.json` comentarios sobre cada dependencia:
```json
{
  "dependencies": {
    "react": "essential - UI framework",
    "dexie": "used for IndexedDB library",
    "mp3tag.js": "used for track metadata"
  }
}
```

**Daily Checkpoint:**
- [ ] No hay archivos `.test.ts` sin correspondiente `.ts`
- [ ] No hay imports no usados
- [ ] `npm run typecheck` OK

**Entregable:** Commit "refactor: clean features, services, utils - remove redundancy"

---

### 🟣 **Día 6 - Testing, Validación & Performance**

**Objetivo:** >70% test coverage, validación exhaustiva, optimizaciones.

#### 6.1 - Unit Tests de Hooks (2h)

**usePlayer.ts:**
- [ ] Test: play/pause funciona
- [ ] Test: next/prev funciona
- [ ] Test: seek funciona
- [ ] Test: volume funciona
- [ ] Test: persistencia guarda en localStorage
- [ ] Coverage: >85%

**useLibrary.ts:**
- [ ] Test: addTracks funciona
- [ ] Test: search filtra correctamente
- [ ] Test: sort ordena
- [ ] Test: filter filtra
- [ ] Coverage: >85%

**useSettings.ts:**
- [ ] Test: get/set settings
- [ ] Test: persistencia localStorage
- [ ] Coverage: >80%

#### 6.2 - Integration Tests (1h)
- [ ] Test: Cargar archivo → mostrar en biblioteca
- [ ] Test: Click play → reproducer inicia
- [ ] Test: Search → filtra biblioteca
- [ ] Test: Cambiar tema → UI actualiza

#### 6.3 - Validación Manual (2h)

**Desktop (1920x1080):**
- [ ] Reproducción: play/pause/next/prev
- [ ] Volumen: cambiar volumen funciona
- [ ] Búsqueda: escribir → filtra
- [ ] Ordenamiento: select order funciona
- [ ] Ecualizador: presets funcionan
- [ ] Tema: toggle dark/light
- [ ] Persistencia: reload → sesión se mantiene

**Tablet (768x1024):**
- [ ] Layout responsive
- [ ] Sidebar collapsible
- [ ] Búsqueda accesible
- [ ] Player funciona

**Mobile (375x667):**
- [ ] Touch-friendly
- [ ] Sidebar collapsible
- [ ] Player compacto pero usable
- [ ] Búsqueda accesible

#### 6.4 - Performance Benchmarking (1.5h)

```bash
npm run build
```

Medir:
- [ ] Bundle gzip size (target: <400KB)
- [ ] Initial load time (target: <2s)
- [ ] Time to interactive (target: <3s)
- [ ] Lighthouse score (target: >90)

```bash
# Lighthouse
npx lighthouse http://localhost:5173 --output-path=./lighthouse-report.html
```

Memory usage:
- [ ] DevTools Memory profiler
- [ ] Reproducir canción 5 min
- [ ] Verificar no hay memory leaks

#### 6.5 - TypeScript Strict Validation (1h)
```bash
npm run typecheck
```
- [ ] 0 errors
- [ ] 0 warnings
- [ ] Todos los types explícitos

**Daily Checkpoint:**
- [ ] ✅ npm run test: >70% pass
- [ ] ✅ npm run typecheck: 0 errors
- [ ] ✅ npm run build: Bundle <400KB gzip
- [ ] ✅ Lighthouse: >90 score
- [ ] ✅ Manual validation: OK

**Entregable:** Commit "test: comprehensive tests & validation v2.0"

---

### 🟢 **Día 7 - Documentación, Cleanup & Release**

**Objetivo:** Documentar cambios, limpiar, preparar v2.0.0-simplified.

#### 7.1 - Actualizar Documentación (2h)

**ARCHITECTURE.md:**
- [ ] Nueva estructura simplificada
- [ ] Hooks consolidados
- [ ] Componentes reducidos
- [ ] Flujo de datos actualizado
- [ ] Diagrama ASCII

**CONTRIBUTING.md:**
- [ ] Setup instructions
- [ ] "Writing Components" guide (max 250 LOC)
- [ ] "Writing Hooks" guide (max 100 LOC)
- [ ] "Writing Tests" guide
- [ ] PR workflow

**Crear SIMPLIFICATION_SUMMARY.md:**
```markdown
# v2.0.0 Simplification Summary

## What Changed
- 45 → 31 components (-31%)
- 7 → 3 hooks (consolidated)
- 2000 → 1200 CSS lines (-40%)
- 500KB → 400KB bundle (-20%)

## Why
1. Better maintainability
2. Faster performance
3. Clearer codebase
4. Easier onboarding

## Migration Guide
- Import changes: useLibraryState → useLibrary
- Component removal: DesktopWorkspace removed
- Styling: Use tokens from src/styles/tokens.css
```

**Crear DESIGN_TOKENS.md:**
- Documentar todos los tokens CSS
- Ejemplos de uso
- Cómo agregar nuevos tokens

#### 7.2 - Crear Guides (1h)

**PERFORMANCE_OPTIMIZATION.md:**
- Cómo mantener bundle pequeño
- Best practices de rendering
- Memoization patterns
- Web Worker opportunities (para futuro)

**TESTING_GUIDE.md:**
- Setup testing environment
- Writing unit tests
- Writing integration tests
- Coverage targets

#### 7.3 - Cleanup Final (1h)
- [ ] Eliminar archivos `.old`, `.bak`, temporales
- [ ] Limpiar comentarios de debug
- [ ] Revisar imports no usados
- [ ] `npm run lint:fix` en todos los archivos
- [ ] Revisar TODO comments (resolver o documentar)

#### 7.4 - Commit & Tag (1h)
```bash
git add -A
git commit -m "docs: comprehensive documentation and v2.0 cleanup

- Update ARCHITECTURE.md with new structure
- Create SIMPLIFICATION_SUMMARY.md
- Create DESIGN_TOKENS.md
- Create CONTRIBUTING.md improvements
- Clean up temporary files"

git tag -a v2.0.0-simplified -m "Version 2.0: Complete simplification and optimization"
git push origin main --tags
```

#### 7.5 - Demo Web Validation (1h)
- [ ] Deploy a GitHub Pages
- [ ] Prueba la demo web en navegador
- [ ] Sin errores en console
- [ ] Performance OK
- [ ] Mobile responsive

**Entregable:** 
- ✅ Commit + Tag v2.0.0-simplified
- ✅ Documentación completa
- ✅ Demo web actualizada
- ✅ CHANGELOG.md actualizado

---

## 📋 Checklist Final (Validación Completa)

### Code Quality
- [ ] 0 TypeScript errors (`npm run typecheck`)
- [ ] 0 ESLint errors (`npm run lint`)
- [ ] Prettier applied (`npm run format`)

### Performance
- [ ] Bundle size: <400KB gzip
- [ ] Initial load: <2s
- [ ] TTI: <3s
- [ ] Lighthouse: >90

### Testing
- [ ] Overall coverage: >70%
- [ ] Hooks coverage: >85%
- [ ] Components coverage: >70%
- [ ] All tests pass: `npm run test`

### Components
- [ ] 31 or fewer components
- [ ] Each <250 LOC
- [ ] Each has clear responsibility
- [ ] Each has tests

### Hooks
- [ ] 3-4 main hooks: usePlayer, useLibrary, useSettings
- [ ] Each <100 LOC
- [ ] Each has JSDoc
- [ ] Each has tests

### Styles
- [ ] ~1200 CSS lines (-40%)
- [ ] All use tokens
- [ ] Responsive tested
- [ ] Dark mode works

### Documentation
- [ ] ARCHITECTURE.md updated
- [ ] CONTRIBUTING.md complete
- [ ] DESIGN_TOKENS.md created
- [ ] SIMPLIFICATION_SUMMARY.md created
- [ ] CHANGELOG.md updated

### Git
- [ ] All commits push to origin
- [ ] v2.0.0-simplified tag created
- [ ] No merge conflicts
- [ ] Clean history

---

## 🚨 Rollback Procedure

**En caso de bloqueo o error crítico:**

```bash
# Ver ramas de backup
git branch | grep backup

# Revert a último checkpoint
git reset --hard backup-preDay2

# O revert a branch específica
git checkout before-cleanup
```

**Rollback checklist:**
- [ ] Qué se rompió exactamente
- [ ] En qué commit sucedió
- [ ] Quién necesita ser informado
- [ ] Crear issue post-mortem

---

## 🎯 Success Criteria

| Criterio | Cumplido | Validación |
| --- | --- | --- |
| Bundle -20% | | npm run build |
| CSS -40% | | wc -l src/styles/* |
| 7→3 hooks | | grep "export function use" src/hooks |
| 45→31 components | | find src/components -name "*.tsx" |
| Test coverage >70% | | npm run test -- --coverage |
| 0 TS errors | | npm run typecheck |
| Lighthouse >90 | | npx lighthouse http://... |
| Demo web live | | https://nicovel98.github.io/musie |

---

## 📊 Commits por Día

```
Día 1: refactor: consolidate hooks - usePlayer, useLibrary, useSettings
Día 2: refactor: merge layout components - desktop, mobile
Día 3: refactor: simplify library and player components
Día 4: style: unify CSS tokens and reduce by 40%
Día 5: refactor: clean features, services, utils
Día 6: test: comprehensive tests and validation
Día 7: docs: documentation and v2.0.0-simplified release
```

---

## 💡 Notas Finales

1. **MVP First:** Si no reproducés música, elimínalo.
2. **Performance Over Features:** Rápido < Completo.
3. **User First:** Si se quiebra UX, no lo hagas.
4. **Test as You Go:** No dejes testing para el final.
5. **Documento Decisions:** Por qué > Qué.
6. **Measure Twice, Cut Once:** Valida antes de eliminar.
