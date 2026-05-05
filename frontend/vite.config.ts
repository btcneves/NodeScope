import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/health': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/summary': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/mempool': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/events': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/blocks': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/tx': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
})
