import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/health': { target: apiTarget, changeOrigin: true },
      '/summary': { target: apiTarget, changeOrigin: true },
      '/mempool': { target: apiTarget, changeOrigin: true },
      '/events': { target: apiTarget, changeOrigin: true },
      '/blocks': { target: apiTarget, changeOrigin: true },
      '/tx': { target: apiTarget, changeOrigin: true },
    },
  },
})
