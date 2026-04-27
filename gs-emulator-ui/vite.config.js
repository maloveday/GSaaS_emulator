import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/satellites':    'http://localhost:5000',
      '/groundstations':'http://localhost:5000',
      '/assignments':   'http://localhost:5000',
      '/passes':        'http://localhost:5000',
      '/telemetry':     'http://localhost:5000',
    },
  },
  build: {
    outDir: 'dist',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
  },
})
