import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const GATEWAY = 'http://localhost:8080'
const GATEWAY_WS = 'ws://localhost:8080'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      // Auth endpoints (login, register, refresh, etc.)
      '/auth': {
        target: GATEWAY,
        changeOrigin: true,
      },
      // All API services routed through the gateway
      '/api': {
        target: GATEWAY,
        changeOrigin: true,
      },
      // WebSocket (chat-service via gateway)
      '/ws': {
        target: GATEWAY_WS,
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
