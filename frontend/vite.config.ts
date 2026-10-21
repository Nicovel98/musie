import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // 1. DEFINIR LA BASE (Crucial para GitHub Pages)
  base: '/musie/',

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Musie Player',
        short_name: 'Musie',
        description: 'Tu reproductor de música local minimalista',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        lang: 'es',
        scope: '/musie/',
        start_url: '/musie/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
});
