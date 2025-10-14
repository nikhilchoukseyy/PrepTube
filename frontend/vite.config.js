import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(),],
  build:{
    sourcemap:true,
  },
  server:{
    host:true,
    port:5173,
    sourcemap:true,
  }
})