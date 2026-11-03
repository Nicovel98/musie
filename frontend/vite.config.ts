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
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        lang: 'es',
        scope: '/musie/',
        start_url: '/musie/',
        icons: [
          {
            src: 'musie-logo.png',
            sizes: '2048x2048',
            type: 'image/png',
            purpose: 'any maskable',
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
