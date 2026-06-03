# Playback Tests

Pruebas automáticas para medir si la reproducción pierde fluidez.

```bash
cd frontend
npm install --save-dev playwright
npx playwright install chromium
```

## Scripts

- `test:playback`: prueba simple con un archivo local.
- `test:playback:compare`: compara sin visualizer vs visualizer simulado.
- `test:playback:app-compare`: compara en la app real, con o sin URL propia.
- `test:playback:burnin`: ejecuta ciclos largos repetidos y reporta tendencia de recursos.

## Uso rápido

En los ejemplos, `30` es la duración de la medición en segundos. No es la duración total de la canción: solo el tiempo durante el que el script observa la reproducción. Puedes cambiarla por otro valor según lo que quieras probar, por ejemplo `15`, `60` o `120`.

Si quieres que observe toda la canción, usa `--until-end` en lugar del número de segundos.

```bash
cd frontend

# prueba simple
npm run test:playback -- ../music/archivo-grande.mp3 30

# comparación simulada
npm run test:playback:compare -- ../music/archivo-grande.mp3 30

# comparación en app real, dejando que el script levante Vite
npm run test:playback:app-compare -- ../music/archivo-grande.mp3 30

# burn-in: 10 ciclos de 120s (20 min aprox)
npm run test:playback:burnin -- ../music/archivo-grande.mp3 120 10

# burn-in corto (5 min): 5 ciclos de 60s
npm run test:playback:burnin -- ../music/archivo-grande.mp3 60 5

# burn-in de 1 hora: 30 ciclos de 120s
npm run test:playback:burnin -- ../music/archivo-grande.mp3 120 30
```

### Variantes de prueba

- `test:playback`: usa un archivo local y mide una sola corrida.
- `test:playback:compare`: corre dos variantes en local, sin visualizer y con visualizer simulado.
- `test:playback:app-compare`: corre la app real y admite dos variantes:
  - sin URL de app: el script intenta levantar Vite solo;
  - con URL de app: usa la URL que le pases y no arranca Vite.
  - con `--until-end`: mide hasta que el audio termine en lugar de cortar por segundos.
- `test:playback:burnin`: repite `test:playback:app-compare` varias veces y guarda un resumen global para detectar degradación con el tiempo.

## Qué reporta

- `stalls`: pausas o saltos detectados.
- `maxGap`: diferencia máxima entre tiempo real y `currentTime`.
- `test:playback:app-compare` imprime una ETA aproximada antes de medir, usando la duración detectada del audio.
- `test:playback:burnin` reporta por ciclo picos de RSS y CPU de procesos relevantes (`node/chromium/playwright`) y la delta de RSS entre primer y último ciclo.

## Notas

- `test:playback:app-compare` sirve el audio local en `http://localhost:8001/test-audio`.
- Si pasas una URL de app como tercer argumento, el script no arranca Vite.
- `noviz` desactiva el visualizer en la app real.
- `--until-end` puede ir como flag independiente y el script lo reconocerá aunque no sea el último argumento.
- `test:playback:burnin` guarda su reporte en `frontend/logs/playback-burnin-<timestamp>.json`.
