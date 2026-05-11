# Wireframe del Reproductor

Documento base para definir la estructura visual y funcional del reproductor de Musie antes de pasar al diseño final.

## Objetivo

El reproductor debe permitir escuchar, controlar y explorar una biblioteca local con una interfaz minimalista, moderna, clara, rápida y centrada en la portada y los controles principales.

## Principios de diseño

- Priorizar la lectura rápida de información importante: título, artista y estado de reproducción.
- Mantener los controles principales siempre visibles.
- Dar protagonismo a la portada y al progreso de la pista.
- Adaptarse a escritorio y móvil sin perder jerarquía visual.

## Wireframe general

### Vista principal

```text
+------------------------------------------------------------------+
| Logo / App name                             | Ajustes | Usuario  |
+-----------+------------------------------------------------------+
|            |                    Now Playing                      |
| Navegación |   [ Portada del álbum ]                             |
| vertical   |              Título de la canción                   |
| Home       |                 Artista / Album       [Favorite]     |
| Library    |                                                     |
| | Albums    | |                                                   |
| | Playlist  | |                                                   |
| | Favorites | |                                                   |
| | Lyrics    | |                                                   |
|            |   00:42  ---/---//-----///----●---//--///----/--- 03:18  |
| Ajustes     |                                                   |
| | Equalizer | |      [Shuffle] [Prev] [Play/Pause] [Next] [Repeat]   |
| | Visualizer | |                                                   |
| | Preferences  | |                                                   |
|            |                                                     |
|            |   Volumen  [-----●--------]  Calidad / Estado     |
|            |                                                     |
| Usuario | Dark Mode |                                            |
+-----------+------------------------------------------------------+
```

### Vista General Móvil

```text
+------------------------------------------------------------------+
| Musie                                                    Ajustes |
|                                                                  |
|           [Minimizar]    Now Playing    [More]                   |
|                        [ Portada del álbum ]                     |
|                                                                  |
|                   Título de la canción    [Favorite]             |
|                   Artista / Álbum                                |
|                                                                  |
|                                                                  |
|      00:42  -----//------///-----●----//--////----/--  03:18     |
|                                                                  |
|           [Shuffle] [Prev] [Play/Pause] [Next] [Repeat]          |
|                                                                  |
|      Volumen  [-----●----------]  Calidad / Estado               |
|                                                                  |
|                                                                  |
|------------------------------------------------------------------|
|  [Home]   [Library]  [Lyrics]   [Equalizer]   [Settings]         |
+------------------------------------------------------------------+
```

## Distribución por zonas

### 1. Cabecera

- Nombre de la app o logo.
- Acceso a usuario, ajustes y configuración de audio.

### 2. Zona de reproducción

- Portada del álbum o visual principal.
- Título de la pista.
- Artista y/o álbum.
- Favorito.
- Estado de reproducción y modo activo.

### 3. Controles centrales

- Aleatorio.
- Anterior.
- Play / Pause.
- Siguiente.
- Repetición.

### 4. Progreso y tiempo

- Tiempo actual.
- Barra de progreso visualizer con scrubbing.
- Tiempo total.

### 5. Controles secundarios

- Volumen con scrubbing y sobreamplificación.
- Indicadores de calidad o modo de reproducción.

### 6. Navegación inferior o lateral

- Barra vertical lateral con acceso a Home, Biblioteca y Ajustes.
- Mantener el estado activo visible con resaltado claro y con fondo de color degradado animado.
- En móvil, esta navegación puede pasar a tabs inferiores.

## Estados que debe contemplar
- Thumbnails
- Sin reproducción activa.
- Reproduciendo pista local.
- Pausa.
- Cargando archivo o portada.
- Error al leer metadatos o archivo.
- Lista vacía.

## Versión móvil

En móvil, el wireframe debe simplificarse:

- Cabecera compacta.
- Portada más protagonista.
- Controles principales en una sola línea o bloque centrado.
- Tabs inferiores para navegación entre secciones.
- Barra de progreso siempre visible.

## Componentes sugeridos

- `NowPlayingCard` para la información de pista actual.
- `PlayerControls` para botones de reproducción.
- `ProgressBar` para el avance de la canción.
- `VolumeControl` para volumen y mute.
- `PlayerTabs` para home, biblioteca y ajustes.

## Próximo paso

Convertir este wireframe en un mock visual más preciso o en una especificación de componentes para implementación.