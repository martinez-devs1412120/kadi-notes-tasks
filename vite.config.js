import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base must match the GitHub Pages subpath for prod builds.
export default defineConfig({
  base: '/kadi-notes-tasks/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'KADI — Notes & Tasks',
        short_name: 'KADI',
        description: 'Notes, to-dos, scheduled reminders and daily completion tracking.',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone',
        start_url: '/kadi-notes-tasks/',
        scope: '/kadi-notes-tasks/',
        icons: [
          { src: '/kadi-notes-tasks/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/kadi-notes-tasks/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
});
