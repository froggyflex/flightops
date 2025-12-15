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
        rewrite: () => `/macros/s/AKfycbxbzNXwJwkRPt6D_4Ts93yC4Ek4LQTAK2ARbux8EgEyiIpgObDyV_8QmIpS_x8XfL4v/exec`,
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
