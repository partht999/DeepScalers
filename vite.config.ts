import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-static-files',
      closeBundle() {
        // Create directories if they don't exist
        const staticDir = path.resolve(__dirname, 'dist/static/voice_recognition/js');
        if (!existsSync(staticDir)) {
          mkdirSync(staticDir, { recursive: true });
        }
        
        // Copy voice client file
        const sourceFile = path.resolve(__dirname, 'static/voice_recognition/js/voice_client.js');
        const destFile = path.resolve(__dirname, 'dist/static/voice_recognition/js/voice_client.js');
        try {
          copyFileSync(sourceFile, destFile);
          console.log('Voice recognition client copied to build output');
        } catch (err) {
          console.error('Error copying voice client:', err);
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
}); 