import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api/profile': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/tracker': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/api/analytics': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
    },
  },
})
