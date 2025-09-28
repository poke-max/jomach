import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '192.168.100.227', // IP local fija
    port: 5174               // Puerto fijo
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        sw: './public/sw.js'
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'sw' ? 'sw.js' : '[name]-[hash].js'
        }
      }
    }
  }
})
