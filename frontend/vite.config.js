import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build', // Optional: keep CRA's default build folder name
  },
  server: {
    open: false, // Optional: automatically open the app in the browser
    // port: 4000, // Optional: change the development port
    proxy: {
      '/submit': {
        target: 'http://localhost:6000', // your backend server
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});