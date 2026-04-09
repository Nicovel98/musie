# Musie Naming Standard

Este documento define nombres e identificadores oficiales para mantener consistencia entre web, Android (Capacitor) y Google Play.

## Nombre de producto

- Nombre de marca: Musie
- Nombre visible en app stores: Musie
- Nombre visible en Android launcher: Musie

## Repositorio y carpetas

- Repositorio: musie
- Carpeta frontend React/Vite: frontend
- Carpeta backend legado: php

Nota: usar frontend como nombre tecnico no cambia la marca del producto. El producto siempre se llama Musie.

## Web (GitHub Pages)

- URL objetivo de demo: https://nicovel98.github.io/musie/
- Base path de Vite para Pages: /musie/

## Identificadores moviles (Capacitor)

Usar este patron reverse domain:

- appId (produccion): com.nicovel98.musie
- appName: Musie

Opcional para pruebas internas:

- appId (beta/internal): com.nicovel98.musie.beta

## Google Play

- Nombre de aplicacion: Musie
- Package name final recomendado: com.nicovel98.musie
- Canal inicial: Internal testing

Importante: una vez publicado en Play, el package name no se puede cambiar.

## Versionado recomendado

- versionName: SemVer (ejemplo 1.0.0)
- versionCode: entero incremental (ejemplo 1, 2, 3, ...)

## Archivos a configurar

1. frontend/package.json -> name: musie-frontend (opcional tecnico)
2. capacitor.config.ts -> appId y appName
3. android/app/build.gradle -> applicationId y versionCode/versionName
4. .github/workflows/deploy.yml -> build path y base para Pages

Plantilla base creada en este repositorio:

- frontend/capacitor.config.ts

## Regla de oro

En comunicacion de producto (README, demo, Play Console, UI), usar siempre "Musie".
En rutas internas y carpetas, se permiten nombres tecnicos como frontend.