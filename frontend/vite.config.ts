import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Geliştirmede /api istekleri backend'e proxy'lenir; container'da
    // aynı işi nginx yapar. Frontend kodu her iki ortamda da '/api' kullanır.
    proxy: {
      '/api': 'http://localhost:5105',
    },
  },
})
