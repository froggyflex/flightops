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
        rewrite: () => `/macros/s/AKfycbzKzbL2BHiudBOwIXX1W7wU0pBZVdAswBLOVU2HgzuoM6mtIedUDUNrI3gKW_wrB7aF/exec`,
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
