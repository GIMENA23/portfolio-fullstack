import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// En desarrollo, todo pedido a /api se redirige al backend (puerto 4000).
// Así no hay problemas de CORS y nadie tiene que escribir la URL completa.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
