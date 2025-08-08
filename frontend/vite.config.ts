import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
        // Suppression du rewrite pour garder le préfixe /api
      },
      '/scan-assets': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/data': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/assets': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
