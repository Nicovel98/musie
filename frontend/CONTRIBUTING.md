# Contribuyendo a Musie

¡Gracias por tu interés en contribuir a Musie! Este documento te guía a través del proceso.

## 🚀 Setup Rápido

### Requisitos

- Node.js 18+
- npm o yarn
- Git
- (Opcional) Android SDK para builds de móvil

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/Nicovel98/musie.git
cd musie/frontend

# Instalar dependencias
npm install

# Crear archivo .env.local (opcional)
touch .env.local

# Iniciar servidor de desarrollo
npm run dev
```

Visita http://localhost:5173

## 🧪 Testing

```bash
# Ejecutar tests (una vez)
npm run test

# Modo watch (reruns on changes)
npm run test:watch

# Coverage report
npm run test -- --coverage
```

Meta: >80% cobertura para funcionalidades críticas

## 💻 Código

### Lint & Format

```bash
# Revisar code style
npm run lint

# Auto-fix issues
npm run lint:fix

# Format código
npm run format

# Verificar formato sin cambios
npm run format:check

# Type check
npm run typecheck
```

### Estructura de Código

- **Imports**: Agrupa imports: React → dependencies → local modules
- **Naming**: camelCase para variables/funciones, PascalCase para componentes
- **Comments**: JSDoc para funciones públicas
- **Tipos**: Usa TypeScript types, no `any`

```typescript
// ✅ Bueno
import { useState } from 'react'
import { Button } from './Button'
import { formatTime } from '../../utils/formatters'

export interface PlayerProps {
  track: Track
  isPlaying: boolean
  onPlay: () => void
}

export function Player({ track, isPlaying, onPlay }: PlayerProps) {
  return <button onClick={onPlay}>{track.title}</button>
}

// ❌ Evitar
import { useState } from 'react'
import Button from './Button'
import * as utils from '../../utils'

export function player({ track, isPlaying, onPlay }: any) {
  return <button onClick={onPlay}>{track.title}</button>
}
```

## 📝 Commits

Utilizamos **Conventional Commits** para consistencia:

```
type(scope): subject

body (opcional)

footer (opcional)
```

### Tipos

- **feat**: Nueva feature
- **fix**: Bug fix
- **docs**: Cambios en documentación
- **style**: Formateo, cambios visuales
- **refactor**: Refactorización de código (sin cambios funcionales)
- **perf**: Mejoras de performance
- **test**: Tests nuevos o fixes
- **chore**: Cambios build, dependencies, etc

### Ejemplos

```bash
git commit -m "feat(audio): implement audioEngine with presets"
git commit -m "fix(player): correct seek position calculation"
git commit -m "docs: update CONTRIBUTING guide"
git commit -m "test: add audioEngine unit tests"
git commit -m "refactor(hooks): extract useAudioPlayer logic"
```

## 🔀 Pull Requests

### Proceso

1. **Crea una rama** desde `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Haz commits pequeños y descriptivos**:
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "test: add tests for feature"
   ```

3. **Asegúrate que todo pase**:
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   npm run build
   ```

4. **Push y crea PR**:
   ```bash
   git push origin feat/my-feature
   ```
   Luego abre PR en GitHub

### Checklist de PR

- [ ] Tests escritos y pasando
- [ ] Código formateado (`npm run format`)
- [ ] No hay lint errors (`npm run lint`)
- [ ] TypeScript strict sin errores (`npm run typecheck`)
- [ ] Documentación actualizada si es necesario
- [ ] Commits con mensajes descriptivos

### Descripción de PR

```markdown
## Descripción
Breve descripción de qué hace la PR.

## Cambios
- Punto 1
- Punto 2

## Testing
Cómo se testeo?

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva feature
- [ ] Breaking change
```

## 📚 Documentación

- Actualiza `README.md` si hay cambios significativos
- Documenta funciones públicas con JSDoc:
  ```typescript
  /**
   * Calcula el tiempo formateado
   * @param seconds - Segundos totales
   * @returns Tiempo formateado (MM:SS)
   */
  export function formatTime(seconds: number): string {
    // ...
  }
  ```

## 🎯 Áreas de Enfoque (Semana 3)

**Prioridad Alta:**
- AudioEngine implementation
- Testing (>80% coverage)
- Custom hooks extraction
- Error handling

**Mediana:**
- Vite config (base path)
- TypeScript strict
- Documentation (ARCHITECTURE.md)

**Baja:**
- Performance optimizations (Web Workers)
- UI improvements

## 🐛 Reportar Bugs

Abre un issue en GitHub con:
- Descripción clara del bug
- Pasos para reproducir
- Comportamiento esperado vs actual
- Capturas de pantalla si aplica

## 💬 Preguntas

- **Dudas técnicas**: Abre una discussion en GitHub
- **Chat**: Usa los comentarios en issues/PRs
- **Documentación**: Lee [ARCHITECTURE.md](src/ARCHITECTURE.md)

## 📋 Antes de Entregar

1. ```bash
   npm run lint:fix
   npm run format
   npm run typecheck
   npm run test
   npm run build
   ```

2. Verifica que no hay errores en consola
3. Prueba en browser (dev y producción)
4. Crea un commit limpio
5. Abre PR con descripción detallada

## 🎉 ¡Gracias!

Tu contribución ayuda a hacer Musie mejor. No importa si es código, tests, docs o ideas - ¡son todas bienvenidas!

---

**Questions?** Abre una issue o discussion en GitHub
**Want to contribute?** ¡Empieza aquí!

---

**Last Updated:** April 27, 2026 (Week 3, Day 1)
