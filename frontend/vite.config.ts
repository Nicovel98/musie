import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // 1. DEFINIR LA BASE (Crucial para GitHub Pages)
  base: '/musie/',

  plugins: [
    react(),
    // 2. CONFIGURACIÓN PWA PARA OFFLINE
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Musie Player',
        short_name: 'Musie',
        description: 'Tu reproductor de música local minimalista',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        scope: '/musie/',
        start_url: '/musie/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cachear archivos de hasta 5MB para el Service Worker
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
});
