// Copyright (c) 2025 Murr (https://github.com/vtstv)
// path: vite.frontend.config.ts
// Vite configuration for React frontend

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: './src/web/frontend',
  publicDir: './public',
  build: {
    outDir: '../../../dist/web/frontend',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/web/frontend/src'),
    },
  },
});
