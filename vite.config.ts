import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/mapping-tool/',
  define: {
    // Fix for potential issues with crypto
    global: {}
  },
})
