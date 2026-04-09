import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('node_modules/react/')) {
            return 'vendor-react'
          }
          if (id.includes('socket.io-client')) {
            return 'vendor-socket'
          }
          if (id.includes('axios')) {
            return 'vendor-http'
          }
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) {
            return 'vendor-motion'  // add this
          }
          if (id.includes('react-icons') || id.includes('lucide-react')) {
            return 'vendor-icons'
          }
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['vernally-nondistortive-jarod.ngrok-free.dev'], 
    hmr:{
      clientPort: 5173,
    }
  } , 
  
})