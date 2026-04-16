# Musie Roadmap

Este documento concentra la planificación de evolución de Musie hacia un reproductor local-first moderno, escalable y preparado para Android.

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

## 🎯 Objetivo del Mes

1. **Completar Web Audio API + presets + ecualizador** (Semana 3).
2. **Refactorizar arquitectura**: custom hooks, mejores servicios, error handling robusto.
3. **Testing integral**: cobertura >80% para funcionalidades críticas.
4. **Documentación**: API, estructura, guía de contribución.
5. **Optimizaciones**: Web Workers, virtualización de listas, memoización.
6. **Preparar empaquetado con Capacitor** y primer release en Google Play (testing).

---

## Plan de 30 Días

### Semana 1 - Fundación Técnica ✅ (Completada)

Meta: base limpia, mantenible y lista para crecimiento.

1. ✅ Crear proyecto React + Vite + TypeScript
2. ✅ Configurar ESLint, Prettier, Husky y lint-staged
3. ✅ Definir estructura modular de carpetas
4. ✅ Montar layout responsive inicial
5. ✅ Migrar core del player (play, pause, next, prev, seek, volumen, shuffle, repeat)
6. ✅ Implementar biblioteca local (file input + drag and drop desktop)
7. ✅ Persistir estado básico (tema, volumen, última pista)

### Semana 2 - Biblioteca y UX ✅ (Completada)

Meta: experiencia local-first estable y fluida.

1. ✅ Normalizar tracks y metadatos (título, artista, duración, cover)
2. ✅ Búsqueda y orden de biblioteca
3. ✅ Cola de reproducción y reanudación de sesión
4. ✅ Pulir responsive para tablet y móvil
5. ✅ Mejorar performance con listas largas
6. ✅ Publicar demo web en GitHub Pages (frontend React)
7. ✅ Configurar GitHub Actions para build y deploy automático
8. ✅ Documentar URL pública de demo y limitaciones en README

### Semana 3 - Web Audio API, Presets y Refactorización 🚧 (En Progreso)

Meta: Mejorar calidad de sonido, arquitectura interna y cobertura de testing.

#### Parte A: Audio Engine (Días 1-2)

1. Crear `src/features/audio/audioEngine.ts`: AudioEngine tipado en TypeScript
2. Pipeline recomendado: source → gain → eq → compressor (opcional) → destination
3. Métodos principales:
   - `initAudioContext()`: Crear/reutilizar contexto
   - `attachAudioElement(element)`: Conectar elemento HTML
   - `disconnect()`: Cleanup seguro
   - `setFrequency(band, value)`: Actualizar EQ
   - `setPreset(presetName)`: Aplicar preset
4. Documentación JSDoc en cada método

#### Parte B: Presets e Interfaz (Días 2-3)

5. Definir presets iniciales en `src/features/equalizer/presets.ts`:
   - **Flat**: Sin modificación (ganancia unitaria)
   - **Vocal Boost**: +3dB mid (~1.5kHz)
   - **Bass Boost**: +5dB low (~60Hz) + +3dB mid-bass (~250Hz)
   - **Treble Boost**: +3dB high (~8kHz)
   - **Instrumental Focus**: +2dB low, -2dB mid, +2dB high

6. Control de clipping: `PresetBuilder` con validación de ganancia máxima (0dB)
7. Crear componente `EqualizerPanel.tsx` con:
   - Dropdown de presets
   - Sliders por banda
   - Preamp slider
   - Reset button
   - Validación anti-clipping

#### Parte C: Testing Integral (Días 3-4)

8. Restructurar tests en carpetas por features:
   - `src/components/__tests__/`
   - `src/features/__tests__/`
   - `src/services/__tests__/`

9. Cubrir casos críticos con cobertura >80%:
   - **Player controls**: play, pause, next, prev, seek
   - **Importación de biblioteca**: single/múltiple archivos, validación
   - **Persistencia**: localStorage/IndexedDB save/load
   - **AudioEngine**: preset switching, frequency updates
   - **trackNormalization**: parsing de metadatos, edge-cases

10. Crear mocks para AudioContext, IndexedDB, fetch
11. Ejecutar: `npm run test` y validar >80%

#### Parte D: Refactorización Arquitectónica (Días 4-5)

12. Extraer custom hooks de `AppShell.tsx`:
    - `useAudioPlayer()`: play/pause/seek, volumen, estado
    - `useLibraryState()`: tracks, filtros, búsqueda
    - `usePersistenceSession()`: save/load session

13. Crear `src/hooks/index.ts` para re-export centralizado
14. Mejorar `src/services/storage/` con:
    - Retry logic para fallos de IndexedDB
    - Fallback a in-memory si IndexedDB no disponible
    - Error handling robusto

15. Crear `src/ARCHITECTURE.md`: estructura, flujo de datos, patrones
16. Crear `src/utils/errorBoundary.ts`: recuperación de errores

#### Parte E: Configuración y CI/CD (Día 5)

17. **Vite config**: Agregar base path para GitHub Pages
    ```typescript
    base: process.env.NODE_ENV === 'production' ? '/musie/' : '/',
    ```

18. **ESLint mejorado**: Habilitar rules más estrictas
19. **GitHub Actions**: Agregar `npm run test` antes de deploy
20. **TypeScript estricto**: Activar `strict: true` en tsconfig
21. **Husky pre-commit**: Incluir `npm run test` en hook

### Semana 4 - Optimizaciones, Capacitor y Google Play 📅 (Pendiente)

Meta: Primera build Android funcional + optimizaciones de performance.

#### Parte A: Optimizaciones de Performance (Días 1-2)

1. **Web Workers** para trackNormalization:
   - Crear `src/workers/trackNormalizer.worker.ts`
   - Descargar parsing de MP3 del hilo principal
   - Medir impacto en tiempos de import

2. **Virtualización de listas** (si >500 tracks):
   - Implementar `react-virtual` en `LibraryPanel.tsx`
   - Medir scroll performance

3. **Lazy loading de covers**:
   - Cargar bajo demanda con intersection observer
   - Limitar requests simultáneos a 3-5

4. **Memoización agresiva**:
   - `useMemo()` para filtros
   - `React.memo()` para componentes de lista

#### Parte B: Capacitor Integration (Días 2-4)

5. Instalar Capacitor:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init
   ```

6. Configurar `capacitor.config.ts`:
   ```typescript
   const config: CapacitorConfig = {
     appId: 'com.nicovel98.musie',
     appName: 'Musie',
     webDir: 'dist',
   }
   ```

7. Generar plataforma Android:
   ```bash
   npx cap add android
   ```

8. Configurar permisos en `AndroidManifest.xml`:
   - READ_MEDIA_AUDIO (Android 13+)
   - READ_MEDIA_IMAGES
   - READ_EXTERNAL_STORAGE (Android <13)

9. Generar keystore:
   ```bash
   keytool -genkey -v -keystore musie-release-key.keystore \
     -keyalg RSA -keysize 2048 -validity 10000
   ```

10. Generar AAB firmado:
    ```bash
    cd android && ./gradlew bundleRelease
    ```

#### Parte C: Play Console y QA (Días 4-5)

11. Crear app en Google Play Console
12. Cargar AAB (v1.0.0, versionCode 1)
13. Escribir descripción, screenshots, política de privacidad
14. Invitar testers internos, recopilar feedback
15. QA Checklist:
    - ✅ Importar canciones (local, drag-drop)
    - ✅ Play, pause, next, prev, seek
    - ✅ Volumen, shuffle, repeat
    - ✅ Presets de audio
    - ✅ Reanudación de sesión
    - ✅ Búsqueda y filtros
    - ✅ Tema light/dark
    - ✅ Permisos READ_MEDIA_AUDIO

16. Fixes críticos y optimizaciones

#### Parte D: Documentación Final (Día 5)

17. Crear `CONTRIBUTING.md`: setup, testing, PR guidelines
18. Actualizar `README.md` con instrucciones para build Android
19. Tag versión: `git tag -a v1.0.0`
20. Celebrar primer release en testing

---

## 🔍 Mejoras Identificadas (Revisión Exhaustiva Abril 2026)

### Arquitectura

- **Custom Hooks**: `src/hooks/` vacía. Extraer lógica de `AppShell.tsx`
- **Audio Engine**: No implementado. Necesario para Semana 3
- **Web Workers**: Parsing de metadatos (mp3tag.js) bloquea hilo principal
- **Error Handling**: Falta retry logic robusto en servicios de storage
- **State Management**: Centralizado en AppShell. Refactorizar con Context API

### Configuración

- **Vite base path**: Falta `/musie/` para GitHub Pages
- **TypeScript strict**: Habilitar `strict: true`
- **ESLint**: Actualizar a rules type-aware

### Testing

- **Cobertura mínima**: Solo 2 tests. Necesario >80%
- **Mocks**: Faltan para AudioContext, IndexedDB, fetch
- **CI/CD**: Agregar `npm run test` antes de deploy

### Rendimiento

- **Listas largas**: Sin virtualización para >500 tracks
- **Lazy loading**: Covers bajo demanda
- **Memoización**: Falta en componentes costosos

### Documentación

- **src/ARCHITECTURE.md**: Guía de carpetas y patrones
- **CONTRIBUTING.md**: Cómo contribuir
- **API docs**: JSDoc en AudioEngine y hooks

### Seguridad y UX

- **Validación de archivos**: Verificar formato antes de cargar
- **Permisos Android**: Documentar estrategia READ_MEDIA_AUDIO
- **Fallback storage**: In-memory + localStorage si IndexedDB falla

---

## 📂 Estructura Final de Carpetas

```
frontend/
├── src/
│   ├── app/
│   │   ├── providers/          (Context providers)
│   │   └── router/             (Routing)
│   ├── components/
│   │   ├── common/             (Button, Input, etc)
│   │   ├── layout/             (AppShell, Sidebar)
│   │   ├── library/            (LibraryPanel, Discovery)
│   │   ├── player/             (NowPlayingCard, Equalizer)
│   │   └── __tests__/
│   ├── features/
│   │   ├── audio/              (AudioEngine)
│   │   ├── equalizer/          (Presets, EQ logic)
│   │   ├── library/            (trackNormalization)
│   │   ├── player/             (Player core)
│   │   ├── settings/           (Settings)
│   │   └── __tests__/
│   ├── hooks/                  (useAudioPlayer, useLibraryState)
│   ├── services/
│   │   ├── audio/
│   │   ├── covers/
│   │   ├── storage/
│   │   └── __tests__/
│   ├── store/                  (Context o Zustand)
│   ├── styles/                 (CSS global)
│   ├── test/                   (Setup, mocks)
│   ├── types/                  (TypeScript types)
│   ├── utils/                  (Utility functions)
│   ├── workers/                (Web Workers)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   ├── audio/                  (Demo tracks)
│   └── icons/
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
├── capacitor.config.ts
└── package.json
```

---

## ✅ Entregables del Mes

| Semana | Entregable | Estado |
| --- | --- | --- |
| 1 | Base React + TS, player core, UI responsiva | ✅ |
| 2 | Biblioteca, búsqueda, cola, persistencia, demo web | ✅ |
| 3 | AudioEngine, presets, testing >80%, refactorización | 🚧 |
| 4 | Web Workers, Capacitor, Google Play beta, docs | 📅 |

---

## ⚠️ Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
| --- | --- | --- | --- |
| Diferencias Web Audio en móviles | Media | Alto | Preset Flat por defecto, detección de capacidades |
| Distorsión por ganancias extremas | Media | Medio | Preamp negativo, límites por banda |
| Parsing lento para miles de archivos | Baja | Alto | Web Workers, caching |
| Pérdida de keystore Android | Baja | Crítico | Backup seguro, documentación |
| Permisos negados Android 13+ | Media | Medio | UI clara, fallback a almacenamiento restringido |

---

## 📊 KPIs y Métricas

- **Performance**:
  - Import de 100 tracks: <2s (con Workers)
  - Scroll en 1000+ tracks: 60 FPS (virtualización)

- **Testing**:
  - Cobertura: >80% funcionalidades críticas
  - Tiempo de test suite: <10s

- **UX**:
  - Tiempo import + reproducción: <5s
  - Tamaño bundle web: <500KB (gzip)

---

## 🔗 Referencias

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [React 19 Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [React Testing Library](https://testing-library.com/react)
