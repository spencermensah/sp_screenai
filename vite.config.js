import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
    manifest: {
      name: 'Screen Recorder PWA',
      short_name: 'Recorder',
      description: 'A PWA for screen recording',
      theme_color: '#ffffff',
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
        },
      ],
    },
  }),],
  server: {
    proxy: {
      // Define the proxy rule
      '/openai-ass': {
        target: 'https://us-central1-koboodle-telagram-alerts.cloudfunctions.net/', // Target API server
        changeOrigin: true, // Needed for virtual hosted sites
        secure: false, // Allow requests to HTTPS servers
      }
    }
  }
})
