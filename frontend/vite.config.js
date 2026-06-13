import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api':       'http://localhost:3001',
      '/outputs':   'http://localhost:3001',
      '/templates': 'http://localhost:3001',
    },
  },
})
