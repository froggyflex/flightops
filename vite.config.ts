import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Frontend will call  
      '/api/push': {
        target: 'https://script.google.com',
        changeOrigin: true,
        secure: true,
        // route to your web-app endpoint
        rewrite: () => `/macros/s/AKfycbxDKtStuDrGlzZMzQhpbnw2lEFttqSquPfqGPnqfNMajaUzNZyMO2FNl1EEvs7h95hQ/exec`,
        configure(proxy) {
          // Remove any origin headers that might confuse Apps Script
          proxy.on('proxyReq', (_proxyReq) => {
            _proxyReq.removeHeader('origin');
          });
        },
      },
    },
  },
})
