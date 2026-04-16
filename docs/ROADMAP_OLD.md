# Musie Roadmap

Este documento concentra la planificacion de evolucion de Musie hacia un reproductor local-first moderno, escalable y preparado para Android.

## 📊 Estado General (Abril 2026)

| Componente | Estado | Notas |
| --- | --- | --- |
| **Base React + TS** | ✅ Hecho | Vite, ESLint, Prettier, Husky configurados |
| **Reproducción local** | ✅ Hecho | Play/pause/next/prev/seek/volumen funcional |
| **Biblioteca + Búsqueda** | ✅ Hecho | Metadatos normalizados, filtros, cola con reanudación |
| **Web Audio API** | 🚧 En progreso | Pipeline de audio, ecualizador, presets pendientes |
| **Testing** | 🟡 Parcial | 2 tests básicos; necesita cobertura integral |
| **Mobile (Capacitor)** | 📅 Pendiente | Después de Semana 3 completada |
| **Vite config** | 🟡 Incompleto | Falta base path para GitHub Pages |

## Objetivo del Mes

1. Completar Web Audio API + presets + ecualizador (Semana 3).
2. Refactorizar arquitectura interna: custom hooks, mejores servicios, error handling.
3. Testing integral: cobertura >80% para funcionalidades críticas.
4. Documentación: API, estructura, guía de contribución.
5. Optimizaciones: Web Workers, virtualización de listas, memoización.
6. Preparar empaquetado con Capacitor y primer release en Google Play (testing).

## Plan de 30 Dias

### Semana 1 - Fundacion Tecnica

Meta: base limpia, mantenible y lista para crecimiento.

1. Crear proyecto React + Vite + TypeScript.
2. Configurar ESLint, Prettier, Husky y lint-staged.
3. Definir estructura modular de carpetas.
4. Montar layout responsive inicial.
5. Migrar core del player (play, pause, next, prev, seek, volumen, shuffle, repeat).
6. Implementar biblioteca local (file input + drag and drop desktop).
7. Persistir estado basico (tema, volumen, ultima pista).

### Semana 2 - Biblioteca y UX

Meta: experiencia local-first estable y fluida.

1. Normalizar tracks y metadatos (titulo, artista, duracion, cover).
2. Busqueda y orden de biblioteca.
3. Cola de reproduccion y reanudacion de sesion.
4. Pulir responsive para tablet y movil.
5. Mejorar performance con listas largas.
6. Publicar demo web en GitHub Pages (frontend React).
7. Configurar GitHub Actions para build y deploy automatico a la rama de Pages.
8. Documentar URL publica de demo y limitaciones de la demo en el README.

### Semana 3 - Web Audio API, Presets y Refactorización

Meta: Mejorar calidad de sonido, arquitectura interna y cobertura de testing.

#### Parte A: Audio Engine (Dias 1-2)

1. Crear `src/features/audio/audioEngine.ts`: AudioEngine tipado en TypeScript.
2. Pipeline recomendado: source -> gain -> eq -> compressor (opcional) -> destination.
3. Métodos principales:
   - `initAudioContext()`: Crear/reutilizar contexto.
   - `attachAudioElement(element)`: Conectar elemento HTML.
   - `disconnect()`: Cleanup seguro.
   - `setFrequency(band, value)`: Actualizar EQ.
   - `setPreset(presetName)`: Aplicar preset.
4. Documentación JSDoc en cada método.

#### Parte B: Presets e Interfaz (Dias 2-3)
Optimizaciones, Capacitor y Google Play

Meta: Primera build Android funcional + optimizaciones de performance.

#### Parte A: Optimizaciones de Performance (Dias 1-2)

1. **Web Workers** para `trackNormalization`:
   - Crear `src/workers/trackNormalizer.worker.ts`.
   - Descargar parsing de MP3 del hilo principal.
   - Medir impacto: tiempos de import antes/después.
   
2. **Virtualización de listas** (si hay >500 tracks):
   - Implementar `react-virtual` o similar en `LibraryPanel.tsx`.
   - Medir scroll performance con DevTools.

3. **Memoización agresiva**:
   - `useMemo()` para filtros de biblioteca.
   - `React.memo()` para componentes de lista.

4. **Lazy loading de covers**:
   - Cargar portadas bajo demanda (intersection observer).
   - Limitar requests simultáneos a 3-5.

#### Parte B: Integración Capacitor y Android (Dias 2-4)

5. Instalar Capacitor en `frontend/`:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init
   ```
6. Configurar `capacitor.config.ts` con estándar de NAMING.md:
   - appId: `com.nicovel98.musie` (producción).
   - appName: `Musie`.
   - webDir: `dist`.
7. Generar plataforma Android:
   ```bash
   npx cap add android
   ```
8. Configurar en `android/app/build.gradle`:
   - App ID, versión (versionCode, versionName).
   - Permisos en `AndroidManifest.xml` (READ_MEDIA_AUDIO, READ_MEDIA_IMAGES para Android 13+).
9. Generar keystore para firma:
   ```bash
   keytool -genkey -v -keystore musie-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000
   ```
10. Firmar AAB en Play Console (recomendado) o locally:
    ```bash
    bundletool build-apks --bundle=app-release.aab --output=app.apks --ks=musie-release-key.keystore
    ```
11. Probar en dispositivo real con APK extraído.

#### Parte C: Play Console y QA (Dias 4-5)

12. Crear cuenta en Google Play Console (si no existe).
13. Crear app: 
    - Nombre: Musie
    - Package name: `com.nicovel98.musie`
    - Canal: Internal Testing (no production aún).
14. Cargar primera versión (v1.0.0, versionCode 1) con AAB.
15. Escribir descripción, screenshots, política de privacidad.
16. Invitar testers internos, recopilar feedback.
17. QA checklist:
    - ✅ Importar canciones (archivo local, drag-drop).
    - ✅ Reproducir, pausar, siguiente, anterior.
   🎯 Mejoras Identficadas (Revisión Exhaustiva Abril 2026)

### Arquitectura

- **Custom Hooks**: Carpetas `src/hooks` vacía. Necesario extraer lógica de `AppShell.tsx` en hooks reutilizables.
- **Audio Engine**: No existe aún. Semana 3 debe incluir `src/features/audio/audioEngine.ts` con pipeline tipado.
- **Web Workers**: Parsing de metadatos (mp3tag.js) bloquea hilo. Usar Worker para imports masivos.
- **Error Handling**: Faltan try-catch robustos en servicios de storage. Implementar retry logic.
- **State Management**: Centralizado en AppShell. Considerar refactorización con hooks + Context API.

### Configuración

- **Vite base path**: Falta configuración de `/musie/` para GitHub Pages. Agregar en vite.config.ts.
- **TypeScript strict**: Habilitar `strict: true` para detección de errores más temprana.
- **ESLint rules**: Actualizar a type-aware rules (tseslint.configs.strictTypeChecked).

### Testing

- **Cobertura mínima**: Solo 2 tests (NowPlayingCard). Necesario >80% para funcionalidades críticas.
- **Tests por feature**: Reorganizar en `src/components/__tests__/`, `src/services/__tests__/`, etc.
- **Mocks**: Faltan mocks para AudioContext, IndexedDB, fetch.
- **GitHub Actions**: Incluir `npm run test` antes de deploy en workflow.

### Rendimiento

- **Listas largas**: Sin virtualización. Implementar para >500 tracks.
- **Lazy loading covers**: Cargar portadas bajo demanda con intersection observer.
- **Memoización**: Agregar useMemo, React.memo en componentes costosos.

### Documentación

- **src/ARCHITECTURE.md**: Guía de carpetas, patrones, flujo de datos.
- **CONTRIBUTING.md**: Cómo contribuir, setup, testing, PR guidelines.
- **API docs**: Documentación JSDoc en AudioEngine, custom hooks.

### Seguridad y UX

- **Validación de archivos**: Validar formato audio antes de cargar.
- **Permisos Android**: Documentar estrategia READ_MEDIA_AUDIO para Android 13+.
- **Fallback storage**: Si IndexedDB falla, usar in-memory + localStorage.

##  - ✅ Volumen, seek, shuffle, repeat.
    - ✅ Aplicar presets de audio.
    - ✅ Reanudación de sesión después de cerrar.
    - ✅ Búsqueda, filtros de biblioteca.
    - ✅ Cambio de tema (light/dark).
18. Fixes críticos: crashe, rendimiento, permisos negados.

#### Parte D: Documentación y Cierre (Dia 5)

19. Documentar en README.md:
    - Instrucciones para build Android local.
    - Estructura de Capacitor plugins si se usan.
    - Limitaciones conocidas (permisos Android 13+).
20. Crear CONTRIBUTING.md: cómo clonar, setup, run dev, run tests, enviar PR.
21. Tag versión en Git: `git tag -a v1.0.0 -m "First stable release"`.
22. Celebrar primer release público en testing

9. Restructurar tests en carpeta por features:
   - `src/components/player/__tests__/` 
   - `src/features/audio/__tests__/`
   - `src/services/storage/__tests__/`
10. Cubrir casos críticos con cobertura >80%:
    - **Player controls**: play, pause, next, prev, seek (React Testing Library).
    - **Importación de biblioteca**: archivo single/múltiple, validación de formato.
    - **Persistencia**: localStorage/IndexedDB save/load ciclos.
    - **AudioEngine**: preset switching, frequency updates, cleanup.
    - **trackNormalization**: parsing de metadatos, normalización edge-cases.
11. Usar mocks para AudioContext, Blob, fetch para coverage offline.
12. Ejecutar: `npm run test` y validar >80%.

#### Parte D: Refactorización Arquitectónica (Dias 4-5)

13. Extraer custom hooks de `AppShell.tsx`:
    - `useAudioPlayer()`: play/pause/seek, volumen, estado.
    - `useLibraryState()`: tracks, filtros, búsqueda.
    - `usePersistenceSession()`: save/load session, localStorage, IndexedDB.
14. Crear `src/hooks/index.ts` para re-export centralizado.
15. Mejorar `src/services/storage/` con mejor error handling:
    - Retry logic para IndexedDB fallidos.
    - Fallback a in-memory si IndexedDB no disponible.
    - Logging de errores sin bloquear app.
16. Crear `src/utils/errorBoundary.ts`: Wrapper para recuperación de errores.
17. Documentar en `src/ARCHITECTURE.md`: estructura de carpetas, flujo de datos, patrones.

#### Parte E: Configuración y CI/CD (Dia 5)

18. **Vite config**: Agregar base path para GitHub Pages en `vite.config.ts`:
    ```typescript
    base: process.env.NODE_ENV === 'production' ? '/musie/' : '/',
    ```
19. **ESLint mejorado**: Habilitar rules más estrictas (type-aware, jsx-a11y).
20. **GitHub Actions**: Agregar paso de test antes de deploy en `.github/workflows/deploy.yml`.
21. **TypeScript estricto**: Activar `strict: true` en `tsconfig.app.json`.
22. **Husky pre-commit**: Incluir `npm run test` en hook para PRs.

### Semana 4 - Capacitor y Google Play

Meta: primera build Android funcional.

1. Integrar Capacitor en el frontend.
2. Generar plataforma Android.
3. Configurar app id, iconos y splash.
4. Generar AAB firmado.
5. Probar en dispositivo real.
6. Subir a Play Console en canal interno/cerrado.
7. Cerrar QA y fixes criticos.
8. Aplicar estandar de naming oficial de [docs/NAMING.md](docs/NAMING.md).

## Plan Operativo Semana 1 (Dia a Dia)

*Nota: Semana 1 ya completada. Aquí se documenta para referencia y mejoras futuras.*

### Dia 1: Setup y Estructura

Comandos:

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

### Dia 2: Linting y Calidad de Código

Comandos:

```bash
npm install -D eslint prettier eslint-config-prettier eslint-plugin-react-hooks eslint-plugin-react-refresh @typescript-eslint/eslint-plugin @typescript-eslint/parser husky lint-staged
npx husky init
```

Tareas:

1. Configurar `.eslintrc.js` con reglas React.
2. Crear `.prettierrc` con estándar de formato (2 espacios, semi true, single quotes).
3. Configurar `.husky/pre-commit` para lint + format en staging.
4. Agregar scripts en `package.json`:
   - `lint`, `lint:fix`, `format`, `format:check`, `typecheck`.

### Dia 3: Estructura de Carpetas y Componentes Iniciales

Tareas:

1. Crear estructura base de `src/`:
   ```
   src/
   ├── components/      (UI components reutilizables)
   ├── features/        (Features del negocio: player, library, etc)
   ├── hooks/           (Custom React hooks)
   ├── services/        (Audio, storage, API, covers)
   ├── store/           (State management, si aplica)
   ├── types/           (TypeScript tipos compartidos)
   ├── utils/           (Utilidades genéricas)
   ├── styles/          (CSS global)
   ├── test/            (Setup de testing)
   └── App.tsx
   ```

2. Crear componentes base: `Layout`, `Player`, `Library`, `Sidebar`.

### Dia 4: Reproducción de Audio

Tareas:

1. Implementar core del player:
   - `<audio>` ref en AppShell.
   - Métodos: play(), pause(), next(), prev(), seek(), setVolume().
   - Estado: currentTrack, isPlaying, currentTime, duration, volume.
2. Conectar con NowPlayingCard UI.
3. Guardar volumen en localStorage.

### Dia 5: Importación Local y Persistencia

Tareas:

1. Drag & drop de archivos MP3.
2. Extraer metadatos con mp3tag.js: title, artist, duration, cover.
3. Crear Blobs reutilizables (Object URLs).
4. Persistir en IndexedDB con Dexie.
5. Cargar biblioteca al iniciar.

### Dia 6-7: Responsive y Pulido

Tareas:

1. Layout responsive: desktop (split view), tablet, mobile.
2. Media queries para breakpoints: 1360px (desktop), 768px (tablet), 480px (mobile).
3. Optimizaciones: lazy load, virtualización inicial si muchos tracks.
4. Demo web: Deploy a GitHub Pages con GitHub Actions.

## Plan Operativo Semana 2 (Dia a Dia)

*Nota: Semana 2 ya completada. Aquí se documenta para referencia.*

### Dia 1: Normalización de Metadatos

Tareas:

1. Crear `src/features/library/trackNormalization.ts`:
   - Parsear metadatos de archivos con mp3tag.js.
   - Extraer title, artist, duration, cover (embedded).
   - Normalizar casos edge: sin metadatos, caracteres especiales, duraciones inválidas.
2. Crear tipos `Track` en `src/types/player.ts` con campos: id, title, artist, src, duration, coverUrl.

### Dia 2: Búsqueda y Filtros

Tareas:

1. Agregar filtros a `LibraryPanel.tsx`:
   - Search input (búsqueda por title, artist).
   - Sort: por título, artista, duración, fecha agregada.
2. Implementar búsqueda con `useDeferredValue` para performance.

### Dia 3: Cola de Reproducción y Sesión

Tareas:

1. Implementar lógica de cola:
   - Next/prev con shuffle logic (shuffle aleatorio).
   - Repeat modes: off, all, one.
2. Reanudación de sesión: 
   - Guardar currentTrackId + currentTime.
   - Persistir en `PlayerSession` en localStorage.
   - Restaurar al iniciar app.

### Dia 4: Responsive Design

Tareas:

1. Layout responsivo:
   - Desktop: Sidebar izquierda (library) + Main area (player/queue) con split view.
   - Tablet: Tabs o drawer para navigation.
   - Mobile: Bottom tabs para pantallas.
2. Media queries: 1360px (desktop), 768px (tablet), <480px (mobile).
3. Touch-friendly: botones >44px, espaciado.

### Dia 5: Optimizaciones de Performance

Tareas:

1. Virtualización (si >500 tracks): scroll performance.
2. React.memo en LibraryPanel items para evitar re-renders.
3. useMemo para cálculos costosos (búsqueda, sort).

### Dia 6-7: Deploy en GitHub Pages

Tareas:

1. Configurar workflow `.github/workflows/deploy.yml` para build + deploy automático.
2. Verificar demo en https://nicovel98.github.io/musie/.
3. Actualizar README.md con estado de proyecto.
4. Documentar limitaciones de demo web (almacenamiento, autoplay, etc).

## Plan Operativo Semana 3 (Dia a Dia)



### Dia 1-2: AudioEngine Implementation

1. Crear `src/features/audio/audioEngine.ts`:
   ```typescript
   class AudioEngine {
     private audioContext: AudioContext
     private audioSource: AudioBufferSourceNode | MediaElementAudioSourceNode
     private gainNode: GainNode
     private eqBands: BiquadFilterNode[] // 5-8 bandas
     private preampGain: GainNode
     
     init()
     attachAudioElement(element: HTMLAudioElement)
     setFrequency(band: number, gain: number)
     setPreamp(value: number)
     setPreset(name: PresetName)
     cleanup()
   }
   ```
2. Documentar cada método con JSDoc.
3. Crear tipos en `src/types/audio.ts`: Preset, EQBand, etc.

### Dia 2-3: Presets UI

1. Definir presets en `src/features/equalizer/presets.ts`.
2. Crear componente `EqualizerPanel.tsx` con:
   - Dropdown de presets (Flat, Vocal Boost, Bass Boost, Treble Boost, Instrumental Focus).
   - Sliders por banda (frecuencia, ganancia).
   - Preamp slider.
   - Reset button.
   - Validación anti-clipping (max gain: 0dB).

### Dia 3-4: Testing Infrastructure

1. Reorganizar tests en `src/components/__tests__/`, `src/features/__tests__/`, `src/services/__tests__/`.
2. Crear mocks para AudioContext, IndexedDB, fetch.
3. Escribir tests para:
   - Player controls: play, pause, next, prev, seek.
   - Library import: single/multiple files, validation.
   - Persistencia: localStorage, IndexedDB save/load.
   - AudioEngine: preset switching, frequency updates.
   - trackNormalization: edge cases.
4. Meta: >80% coverage.
5. Ejecutar `npm run test` para validar.

### Dia 4-5: Refactorización Arquitectónica

1. Extraer custom hooks de AppShell:
   - `useAudioPlayer()`: play/pause/seek logic.
   - `useLibraryState()`: tracks, filtros, búsqueda.
   - `usePersistenceSession()`: save/load de sesión.
2. Crear `src/hooks/index.ts` para re-export centralizado.
3. Mejorar servicios de storage:
   - Retry logic para fallos de IndexedDB.
   - Fallback a in-memory si IndexedDB no disponible.
   - Error handling robusto.
4. Crear `src/ARCHITECTURE.md`:
   - Estructura de carpetas.
   - Flujo de datos.
   - Patrones usados.
5. Habilitar TypeScript estricto en `tsconfig.app.json`.

### Dia 5: Configuración y CI/CD

1. **Vite config**: Agregar base path para GitHub Pages.
   ```typescript
   base: process.env.NODE_ENV === 'production' ? '/musie/' : '/',
   ```
2. **GitHub Actions**: Agregar test step en workflow.
3. **ESLint mejorado**: Reglas type-aware.
4. **Husky pre-commit**: Incluir test para PRs.

## Plan Operativo Semana 4 (Dia a Dia)

```text
frontend/
  src/
    app/
      providers/
      router/
    components/
      layout/
      player/
      library/
      common/
    features/
      player/
      library/
      equalizer/
      settings/
    hooks/
    services/
      audio/
      storage/
    store/
    styles/
    types/
    utils/
```



### Dia 1-2: Performance Optimizations

1. **Web Workers** para trackNormalization:
   - Crear `src/workers/trackNormalizer.worker.ts`.
   - Mover parsing de MP3 del hilo principal.
   - Medir impacto: tiempos de import.

2. **Virtualización de listas** (si >500 tracks):
   - Implementar `react-virtual` o similar en `LibraryPanel.tsx`.
   - Medir scroll performance.

3. **Lazy loading de covers**:
   - Intersection observer para cargar bajo demanda.
   - Limitar requests simultáneos a 3-5.

### Dia 2-4: Capacitor Integration

1. Instalar Capacitor:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init
   ```

2. Configurar `capacitor.config.ts`:
   ```typescript
   const config: CapacitorConfig = {
     appId: 'com.nicovel98.musie',
     appName: 'Musie',
     webDir: 'dist',
   }
   ```

3. Generar plataforma Android:
   ```bash
   npx cap add android
   ```

4. Configurar permisos en `android/app/src/main/AndroidManifest.xml`:
   - READ_MEDIA_AUDIO (Android 13+)
   - READ_MEDIA_IMAGES
   - READ_EXTERNAL_STORAGE (Android <13)

5. Configurar firma de app:
   ```bash
   keytool -genkey -v -keystore musie-release-key.keystore -keyalg RSA -keysize 2048 -validity 10000
   ```

6. Generar AAB (Android App Bundle):
   ```bash
   cd android
   ./gradlew bundleRelease
   # AAB estará en: app/build/outputs/bundle/release/
   ```

### Dia 4-5: Google Play Console

1. Crear app en Play Console:
   - Name: Musie
   - Package: com.nicovel98.musie
   - Canal: Internal Testing

2. Cargar AAB (v1.0.0, versionCode 1).

3. Escribir metadata:
   - Descripción breve y completa.
   - Screenshots (2-5, mostrando features clave).
   - Política de privacidad (link o inline).
   - Categoría: Música/Audio

4. QA Checklist:
   - ✅ Importar canciones (local, drag-drop).
   - ✅ Play, pause, next, prev, seek.
   - ✅ Volumen, shuffle, repeat.
   - ✅ Aplicar presets de audio.
   - ✅ Reanudación de sesión.
   - ✅ Búsqueda, filtros de biblioteca.
   - ✅ Tema light/dark.
   - ✅ Permisos (READ_MEDIA_AUDIO).

5. Invitar testers internos, recopilar feedback.

### Dia 5: Documentación Final

1. Crear `CONTRIBUTING.md`:
   - Cómo clonar, setup, run dev, run tests.
   - PR guidelines, code style.
   - Estructura de commits (conventional commits).

2. Crear `src/ARCHITECTURE.md`:
   - Descripción de cada carpeta.
   - Flujo de datos (player state, audio engine).
   - Patrones usados (hooks, custom components).

3. Actualizar README.md:
   - Stack final.
   - Instrucciones para build Android local.
   - Limitaciones conocidas y FAQ.

4. Tag versión en Git:
   ```bash
   git tag -a v1.0.0 -m "First stable release"
   git push origin v1.0.0
   ```

## Estructura Final de Carpetas

```
frontend/
├── src/
│   ├── app/
│   │   ├── providers/          (Context providers, si aplica)
│   │   └── router/             (Routing, si aplica)
│   ├── components/
│   │   ├── common/             (Button, Input, etc)
│   │   ├── layout/             (AppShell, Sidebar, etc)
│   │   ├── library/            (LibraryPanel, DiscoveryDashboard, etc)
│   │   ├── player/             (NowPlayingCard, EqualizerPanel, etc)
│   │   └── __tests__/          (Component tests)
│   ├── features/
│   │   ├── audio/              (AudioEngine, audio utilities)
│   │   ├── equalizer/          (Presets, EQ logic)
│   │   ├── library/            (trackNormalization, libraryUtils)
│   │   ├── player/             (Player core, queue logic)
│   │   ├── settings/           (Settings features)
│   │   └── __tests__/          (Feature tests)
│   ├── hooks/                  (useAudioPlayer, useLibraryState, etc)
│   ├── services/
│   │   ├── audio/              (Web Audio utilities)
│   │   ├── covers/             (onlineCoverLookup)
│   │   ├── storage/            (libraryDb, playerSession)
│   │   └── __tests__/          (Service tests)
│   ├── store/                  (Context API o Zustand, si necesario)
│   ├── styles/
│   │   ├── app.css
│   │   ├── tokens.css          (Colors, fonts, spacing)
│   │   └── ui.css
│   ├── test/
│   │   ├── setup.ts            (Testing configuration)
│   │   └── mocks/              (Mock implementations)
│   ├── types/
│   │   ├── player.ts           (Player types)
│   │   ├── audio.ts            (Audio types)
│   │   └── ui.ts               (UI types)
│   ├── utils/                  (Utility functions)
│   ├── workers/                (Web Workers)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   ├── audio/                  (Bundle demo tracks)
│   └── icons/
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── .prettierrc
├── .husky/
│   └── pre-commit
├── capacitor.config.ts
└── package.json
```

## Entregables del Mes

1. ✅ Frontend React + TypeScript estable.
2. ✅ Reproductor local-first responsive.
3. 🚧 Ecualizador funcional con presets útiles (Semana 3).
4. 🚧 Preparación completa para Android con Capacitor (Semana 4).
5. 🚧 Primera build en testing de Google Play (Semana 4).
6. ✅ Demo web pública en GitHub Pages con despliegue automático.
7. 🚧 Suite inicial de pruebas automatizadas >80% (Semana 3).

## Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
| --- | --- | --- | --- |
| Diferencias Web Audio en móviles | Media | Alto | Preset Flat por defecto, detección de capacidades |
| Distorsión por ganancias extremas | Media | Medio | Preamp negativo, límites por banda, metering visual |
| Parsing lento para miles de archivos | Baja | Alto | Web Workers, caching, virtualización |
| Pérdida de keystore Android | Baja | Crítico | Backup seguro, documentación de proceso |
| Permisos negados en Android 13+ | Media | Medio | UI clara, fallback a almacenamiento restringido |

## KPIs y Métricas

- **Performance**: 
  - Import de 100 tracks: <2s (con Workers).
  - Scroll en 1000+ tracks: 60 FPS (virtualización).
  
- **Testing**: 
  - Cobertura: >80% para funcionalidades críticas.
  - Tiempo de test suite: <10s.

- **UX**:
  - Tiempo para importar + reproducir: <5s.
  - Tamaño del bundle web: <500KB (gzip).

## Referencias y Recursos

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [React 19 Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Testing Library](https://testing-library.com/react)
3. Restricciones de acceso a archivos segun plataforma.
Mitigacion: flujos alternos de importacion y UX clara.

## Nota de Licencias

Si en el futuro se distribuye musica que no pertenezca al usuario, se deben definir licencias y politicas de copyright antes de una salida comercial.