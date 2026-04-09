# 🎵 Musie: Local-First Audio Player

**Musie** es un reproductor de música moderno enfocado en la privacidad y la velocidad. Diseñado para revivir la colección musical local del usuario en cualquier dispositivo (PC, Tablet o Móvil) sin depender de la nube.

## 🚀 Visión del Producto
Musie busca ser la alternativa ligera y estética a los reproductores pesados actuales. Priorizamos:
1. **Privacidad Absoluta:** Tus archivos nunca salen de tu dispositivo.
2. **Fidelidad Sonora:** Control total mediante **Web Audio API** con ecualizador paramétrico.
3. **Multiplataforma:** Una sola base de código para Web y Android mediante **Capacitor**.

## 🛠️ Stack Tecnológico
*   **Core:** React 18 + Vite + TypeScript.
*   **Audio Engine:** Web Audio API (Custom Hooks para gestión de nodos).
*   **State Management:** Zustand o Context API.
*   **Storage:** IndexedDB para persistir metadatos y portadas de álbumes.
*   **Mobile Bridge:** Capacitor para el acceso nativo al sistema de archivos.

## 📋 Estado del Proyecto


| Fase          | Estado       | Descripción                                      |
| :------------ | :----------- | :----------------------------------------------- |
| **Prototipo** | ✅ Completado | Versión funcional inicial en PHP + JS.           |
| **Migración** | 🚧 En Proceso | Refactorización a React + TS + Vite.             |
| **Mobile**    | 📅 Pendiente  | Implementación de Capacitor y generación de AAB. |

## 🛠️ Instalación y Desarrollo
Si quieres colaborar o probar el entorno de desarrollo:

1. Clona el repositorio: `git clone https://github.com/Nicovel98/musie`
2. Instala dependencias: `npm install`
3. Inicia el servidor de desarrollo: `npm run dev`

## 🗺️ Roadmap de Desarrollo: Musie (30 Días)

Este plan detalla la evolución de Musie desde un prototipo PHP/JS hacia una aplicación híbrida profesional.

- [docs/ROADMAP.md](docs/ROADMAP.md)

## 🏷️ Naming e Identidad

Estandar oficial de nombres, appId y configuracion para web/Android:

- [docs/NAMING.md](docs/NAMING.md)

### Scripts recomendados en `package.json`
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier . --write",
    "typecheck": "tsc --noEmit"
  }
}
```

## 📦 Entregables del Proyecto (Mes 1)

Al finalizar el ciclo inicial de 30 días, el proyecto contará con:
### 🗓️ Semana 1: Arquitectura y Motor de Audio
*   **Día 1-2:** Setup de React + Vite + TypeScript. Configuración de ESLint y Prettier.
*   **Día 3-4:** Implementación de `Web Audio API`. Creación de un custom hook `usePlayer` para manejar Play/Pause/Skip.
*   **Día 5-7:** Sistema de carga de archivos locales (File System Access API) y persistencia básica de la lista en `Zustand`.

### 🗓️ Semana 2: Gestión de Librería e IndexedDB
*   **Día 8-10:** Integración de **IndexedDB** (Dexie.js) para guardar metadatos de canciones y portadas (evitar re-escaneo).
*   **Día 11-13:** UI de la Librería: Buscador, filtrado por artista y álbum.
*   **Día 14:** Implementación de persistencia de "Última canción reproducida".

### 🗓️ Semana 3: Audio Pro y Experiencia de Usuario
*   **Día 15-17:** Creación del **Ecualizador de 5 bandas**.
*   **Día 18-19:** Desarrollo de Presets (Bass Boost, Vocal, etc.) usando `BiquadFilterNode`.
*   **Día 20-21:** Optimización Responsive: Ajustes finos para Mobile y Tablet (Touch gestures).

### 🗓️ Semana 4: Android Pipeline y Lanzamiento
*   **Día 22-23:** Integración de **Capacitor**. Configuración del proyecto Android en VS Code.
*   **Día 24-25:** Manejo de permisos nativos de Android y controles de reproducción en segundo plano.
*   **Día 26-28:** Generación del archivo `.aab` firmado y pruebas en dispositivos reales.
*   **Día 29-30:** Subida a **Google Play Console** (Canal de Testing Interno) y documentación final.

## ⚠️ Riesgos Identificados
1.  **Permisos de Archivos:** Android 13+ es estricto con el acceso a multimedia; requiere configuración especial en el `AndroidManifest`.
2.  **Rendimiento:** Escanear miles de archivos locales puede bloquear el hilo principal; se evaluará el uso de *Web Workers*.
3.  **Firma de App:** Perder la `keystore` impediría actualizar la app en el futuro.

## 🎨 Diseño y UI base
El diseño se centra en la legibilidad y una estética moderna (Glassmorphism). Puedes consultar el archivo original aquí:

*   **Figma:** [Ver Diseño en Figma](https://www.figma.com/file/C4ZuwHwHuSWdgDzrsM8DDT/Reproductor-de-m%C3%BAsica%3A-Musie?node-id=0%3A1&t=qdhn0wQ1TfIcGm7J-1)
*   **Preview del Prototipo:**
    ![Musie Preview](img/Musie.png)
## Nota Importante sobre Licencias

Si en el futuro se maneja musica que no sea del propio usuario, se deben validar derechos/licencias antes de publicacion comercial.