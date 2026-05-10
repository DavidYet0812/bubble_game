import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/bubble_game/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['bubble-icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '泡泡情緒 — 情緒收集遊戲',
        short_name: '泡泡情緒',
        description: '在夢幻盤面上收集散落的彩色情緒泡泡',
        theme_color: '#e0f7fa',
        background_color: '#e0f7fa',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
});
