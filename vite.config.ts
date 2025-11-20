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
        rewrite: () => `/macros/s/AKfycbwZAntgpJOwKUFdu7EHYYnMu6ovhy_N4kZ_dKal1nr4-AK6aSL11XEc9LC483_4asdW/exec`,
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
