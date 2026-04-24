import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', 'macpro.trex.gr', 'typetition.trex.gr'],
    port: 5173,
  },
})
