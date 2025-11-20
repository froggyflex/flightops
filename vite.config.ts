import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Frontend will call http://localhost:5173/api/push
      '/api/push': {
        target: 'https://script.google.com',
        changeOrigin: true,
        secure: true,
        // route to your web-app endpoint
        rewrite: () => `/macros/s/AKfycbxjJL5FzAsf89r_Dg3nh50VQL8nBp0FhSSZkXEda3Fpu_xDCxUaasahcPzCS36gcTwX/exec`,
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
