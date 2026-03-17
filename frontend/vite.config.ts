import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), process.env.VITE_NO_SSL ? null : basicSsl()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5995,
    proxy: {
      '/api': {
        target: 'http://localhost:8998',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'http://localhost:8998',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
