import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/home': 'http://localhost:8000',
      '/trends': 'http://localhost:8000',
      '/skills': 'http://localhost:8000',
      '/postings': 'http://localhost:8000',
      '/salary': 'http://localhost:8000',
    }
  }
})