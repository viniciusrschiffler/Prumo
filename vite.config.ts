import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const DEV_SERVER_PORT = 1420

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: DEV_SERVER_PORT,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
})
