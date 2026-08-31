import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/membership/',
  server: {
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log(`[PROXY] --> ${req.method} ${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(`[PROXY] <-- ${proxyRes.statusCode} ${req.method} ${req.url}`);
          });
          proxy.on('error', (err, req) => {
            console.log(`[PROXY] ERROR ${req.method} ${req.url}:`, err.message);
          });
        },
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../../membership-php'),
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/index.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'assets/index.css';
          return 'assets/[name][extname]';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})