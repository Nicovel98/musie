# Musie Roadmap

Este documento concentra la planificación de evolución de Musie hacia un reproductor local-first moderno, escalable y preparado para Android.

## 📊 Estado General (27 de Abril 2026)

**Fase Actual:** Semana 3, Día 1 (AudioEngine Implementation - Web Audio API)

| Componente | Estado | Notas |
| --- | --- | --- |
| **Base React + TS** | ✅ Hecho | Vite, ESLint, Prettier, Husky configurados |
| **Reproducción local** | ✅ Hecho | Play/pause/next/prev/seek/volumen funcional |
| **Biblioteca + Búsqueda** | ✅ Hecho | Metadatos normalizados, filtros, cola con reanudación |
| **Web Audio API** | � En progreso | Implementando AudioEngine y presets |
| **Testing** | 🟡 Parcial | 2 tests básicos; upgrade a >80% en Semana 3 |
| **Mobile (Capacitor)** | 📅 Pendiente | Después de Semana 3 completada |
| **Vite config** | 🟡 Incompleto | Falta base path para GitHub Pages (Semana 3) |

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

### Semana 2 - Biblioteca y UX ✅ (Completada - Día 8: Cierre y Documentación)

Meta: experiencia local-first estable y fluida.

**Entregables completados:**
1. ✅ Normalizar tracks y metadatos (título, artista, duración, cover)
2. ✅ Búsqueda y orden de biblioteca
3. ✅ Cola de reproducción y reanudación de sesión
4. ✅ Pulir responsive para tablet y móvil
5. ✅ Mejorar performance con listas largas
6. ✅ Publicar demo web en GitHub Pages (frontend React)
7. ✅ Configurar GitHub Actions para build y deploy automático
8. ✅ Documentar URL pública de demo y limitaciones en README

**Día 8 - Cierre y Preparación para Semana 3:**
- ✅ Revisión exhaustiva del proyecto completada
- ✅ Documentación actualizada: ROADMAP.md, MEJORAS_IDENTIFICADAS.md, SEMANA3_CHECKLIST.md
- ✅ Resumen ejecutivo creado (RESUMEN_REVISION.md)
- ✅ Identificadas 10 mejoras en 6 áreas clave
- ✅ KPIs y métricas definidas para Semana 3
- ✅ Team briefing sobre AudioEngine y testing
- ✅ Preparación de ambiente para Web Audio API

### Semana 3 - Web Audio API, Presets y Refactorización 📅 (Próxima - Comienza Día 9)

### Semana 3 - Web Audio API, Presets y Refactorización � (En Progreso - Día 1)

Meta: Mejorar calidad de sonido, arquitectura interna y cobertura de testing.

**Semana 3 (7 días):**

#### Día 1 - AudioEngine Setup y Estructura (HOY - Lunes)

**Objetivos:**
1. ✅ Habilitar TypeScript `strict: true` en `tsconfig.app.json`
2. ✅ Crear estructura de carpetas:
   - `src/features/audio/` (AudioEngine)
   - `src/features/equalizer/` (presets)
   - `src/types/audio.ts` (tipos)
   - `src/test/mocks/` (mocks para testing)

3. ✅ Crear template de AudioEngine en `src/features/audio/audioEngine.ts`
4. ✅ Documentación inicial: tipos, interfaces, JSDoc
5. ✅ Setup de mocks para AudioContext

**Deliverables:**
- ✅ Estructura lista
- ✅ AudioEngine interface definida
- ✅ Sin errores TypeScript strict

---

#### Día 2 - AudioEngine Core Implementation (Martes)

**Objetivos:**
1. Implementar `initAudioContext()` 
2. Implementar `attachAudioElement(element)`
3. Implementar `disconnect()`
4. Crear BiquadFilter nodes para EQ (5 bandas)
5. Crear gain node para preamp

**Deliverables:**
- AudioEngine funcional para lectura
- Métodos core testeados manualmente
- Primera prueba en browser

---

#### Día 3 - Presets e Interfaz de Control (Miércoles)

**Objetivos:**
1. Definir 5 presets en `src/features/equalizer/presets.ts`
2. Implementar `setPreset(presetName)` en AudioEngine
3. Implementar `setFrequency(band, gain)` en AudioEngine
4. Crear componente `EqualizerPanel.tsx` con:
   - Dropdown de presets
   - 5 sliders para bandas
   - Preamp slider
   - Reset button
   - Validación anti-clipping

**Deliverables:**
- UI de ecualizador funcional
- Cambio de presets funciona
- Validación de clipping activa

---

#### Día 4 - Testing Setup y Unit Tests (Jueves)

**Objetivos:**
1. Crear mocks para AudioContext en `src/test/mocks/audioContext.mock.ts`
2. Crear `src/features/audio/__tests__/audioEngine.test.ts`:
   - Test: initialization
   - Test: preset switching
   - Test: frequency updates
   - Test: clipping prevention
3. Crear `src/features/equalizer/__tests__/presets.test.ts`
4. Meta: >80% coverage para audio features

**Deliverables:**
- ✅ Tests implementados
- ✅ Coverage report: >80%
- ✅ CI/CD green ✨

---

#### Día 5 - Refactorización - Custom Hooks (Viernes)

**Objetivos:**
1. Crear `src/hooks/useAudioPlayer.ts`:
   - Extraer play/pause/seek logic de AppShell
   - Manejar volumen, progreso, estado
2. Crear `src/hooks/useLibraryState.ts`:
   - Búsqueda, filtros, sort
3. Crear `src/hooks/usePersistenceSession.ts`:
   - Save/load de sesión
4. Crear `src/hooks/index.ts` para re-export
5. Refactorizar AppShell para usar hooks

**Deliverables:**
- ✅ AppShell simplificado
- ✅ Hooks reutilizables
- ✅ Tests de hooks passing

---

#### Día 6 - Error Handling y Mejoras (Sábado)

**Objetivos:**
1. Mejorar `src/services/storage/` con:
   - Retry logic para IndexedDB
   - Fallback a in-memory
   - Error logging sin bloqueo
2. Crear `src/utils/errorBoundary.ts`
3. Implementar validación de archivos (audio MIME types)
4. Agregar JSDoc a funciones críticas

**Deliverables:**
- ✅ Error handling robusto
- ✅ Fallbacks implementados
- ✅ Storage más resiliente

---

#### Día 7 - Documentación y Cierre de Semana 3 (Domingo)

**Objetivos:**
1. Crear `src/ARCHITECTURE.md`:
   - Estructura de carpetas
   - Flujo de datos
   - Patrones usados
   - Diagrama simple ASCII
2. Crear `CONTRIBUTING.md` completo:
   - Setup instructions
   - Testing guide
   - PR workflow
   - Code style
3. Actualizar README.md con nueva versión
4. Tag versión en Git: `git tag -a v2.0.0-audio-engine`

**Deliverables:**
- ✅ Documentación completa
- ✅ Guía para contribuidores
- ✅ Ready para Semana 4

---

### Semana 4 - Optimizaciones, Capacitor y Google Play 📅 (Próxima - Comienza Día 8)

Meta: Primera build Android funcional + optimizaciones de performance.

### Semana 4 - Optimizaciones, Capacitor y Google Play 📅 (Próxima - Comienza Día 8)

Meta: Primera build Android funcional + optimizaciones de performance.

**Semana 4 (7 días):**

#### Día 1 - Web Workers Setup (Lunes)

1. Crear `src/workers/trackNormalizer.worker.ts`
2. Descargar parsing de MP3 del hilo principal
3. Implementar comunicación worker ↔ main thread
4. Medir: import de 100 tracks antes/después
5. Meta: <2 segundos

#### Día 2 - Virtualización de Listas (Martes)

1. Instalar y configurar `react-window`
2. Implementar en `LibraryPanel.tsx`
3. Pruebas con 1000+ tracks
4. Meta: 60 FPS scroll

#### Día 3 - Lazy Loading y Optimizaciones (Miércoles)

1. Intersection Observer para covers
2. Limitar requests simultáneos a 3-5
3. Memoización: `useMemo()`, `React.memo()`
4. Validación anti-clipping visual

#### Día 4 - Capacitor Setup (Jueves)

1. Instalar Capacitor
2. Configurar `capacitor.config.ts`
3. Generar plataforma Android
4. Configurar permisos en `AndroidManifest.xml`

#### Día 5 - Android Build y Firma (Viernes)

1. Generar keystore
2. Configurar gradle para firma
3. Generar AAB
4. Probar en dispositivo real

#### Día 6 - Google Play Console (Sábado)

1. Crear app en Play Console
2. Cargar AAB (v1.0.0)
3. Escribir descripción y screenshots
4. Invitar testers internos

#### Día 7 - Cierre y Release (Domingo)

1. QA final checklist
2. Documentación de deployment
3. Tag v3.0.0 en Git
4. Celebrar primer release 🎉

---

### Semana 5+ - Futuro 📅 (Próximas iteraciones)

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
