import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward API calls to the Spring Boot backend so no CORS config is needed in dev
    proxy: {
      '/createURL': 'http://localhost:8080',
    },
  },
})
