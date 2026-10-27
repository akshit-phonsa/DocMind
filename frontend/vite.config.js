import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const backend = process.env.VITE_BACKEND_URL || 'http://localhost:8081'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Proxy avoids CORS entirely in dev
    proxy: Object.fromEntries(
      ['/api', '/swagger-ui', '/v3/api-docs'].map((p) => [p, { target: backend, changeOrigin: true }]),
    ),
  },
})
