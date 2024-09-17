import { defineConfig } from 'vite';
import * as path from 'path';

export default defineConfig({
  base: '/',  // Base path, for GitHub Pages or custom domains, adjust this if needed
  build: {
    outDir: 'dist',  // Output directory for the build
    assetsDir: 'assets',  // Directory to store generated assets like images, audio, etc.
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),  // Example alias for easier imports
    },
  },
  server: {
    host: true,  // Set to true if you want to access via IP in your network
    port: 3000,  // Local dev server port
  },
  assetsInclude: ['**/*.mp3', '**/*.wav', '**/*.png', '**/*.jpg'],  // Asset extensions to include
  define: {
    'process.env': {},  // Fix for libraries depending on Node's process.env
  },
});