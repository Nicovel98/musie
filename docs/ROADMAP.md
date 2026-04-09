# Musie Roadmap

Este documento concentra la planificacion de evolucion de Musie hacia un reproductor local-first moderno, escalable y preparado para Android.

## Objetivo del Mes

1. Migrar a React + Vite + TypeScript.
2. Implementar audio avanzado con Web Audio API.
3. Preparar empaquetado con Capacitor y primer release en Google Play (testing).

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

### Semana 3 - Web Audio API y Presets

Meta: mejorar calidad de sonido con controles utiles.

1. Crear AudioEngine tipado en TypeScript.
2. Pipeline sugerido: source -> gain -> eq -> compressor (opcional) -> destination.
3. Presets iniciales:
- Flat
- Vocal Boost
- Bass Boost
- Treble Boost
- Instrumental Focus
4. UI de sliders por banda + preamp + reset.
5. Control de clipping y limites de ganancia.

### Semana 4 - Capacitor y Google Play

Meta: primera build Android funcional.

1. Integrar Capacitor en el frontend.
2. Generar plataforma Android.
3. Configurar app id, iconos y splash.
4. Generar AAB firmado.
5. Probar en dispositivo real.
6. Subir a Play Console en canal interno/cerrado.
7. Cerrar QA y fixes criticos.

## Plan Operativo Semana 1 (Dia a Dia)

### Dia 1

Comandos:

```bash
npm create vite@latest musie-next -- --template react-ts
cd musie-next
npm install
```

### Dia 2

Comandos:

```bash
npm install -D eslint prettier eslint-config-prettier eslint-plugin-react-hooks eslint-plugin-react-refresh @typescript-eslint/eslint-plugin @typescript-eslint/parser husky lint-staged
npx husky init
```

Tareas:

1. Reglas de lint y formato.
2. Scripts de calidad.
3. Hook pre-commit.

### Dia 3

Tareas:

1. Estructura base de src por dominios.
2. Componentes iniciales (layout, player, library).

### Dia 4

Tareas:

1. App shell responsive.
2. Navegacion y pantallas base.

### Dia 5

Tareas:

1. Core de reproduccion estable.
2. Controles principales y progreso.

### Dia 6

Tareas:

1. Carga de audio local.
2. Drag and drop desktop.
3. Parsing de metadatos basicos.

### Dia 7

Tareas:

1. Persistencia de sesion local.
2. Ajustes UX + bugs.
3. Demo estable para iniciar semana 2.

## Estructura Sugerida

```text
musie-next/
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

## Entregables del Mes

1. Frontend React + TypeScript estable.
2. Reproductor local-first responsive.
3. Ecualizador funcional con presets utiles.
4. Preparacion completa para Android con Capacitor.
5. Primera build en testing de Google Play.

## Riesgos y Mitigacion

1. Diferencias de soporte Web Audio en moviles.
Mitigacion: preset Flat y deteccion de capacidades.
2. Distorsion por ganancias extremas.
Mitigacion: preamp negativo y limites por banda.
3. Restricciones de acceso a archivos segun plataforma.
Mitigacion: flujos alternos de importacion y UX clara.

## Nota de Licencias

Si en el futuro se distribuye musica que no pertenezca al usuario, se deben definir licencias y politicas de copyright antes de una salida comercial.