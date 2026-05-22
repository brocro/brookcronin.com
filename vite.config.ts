import { defineConfig } from 'vite';
import * as path from 'path';

export default defineConfig({
  root: 'experimental',
  base: '/experimental/',
  build: {
    outDir: '../dist/experimental',
    assetsDir: 'assets',
    sourcemap: true,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'experimental/src'),
    },
  },
  server: {
    host: true,
    port: 3000,
  },
  assetsInclude: ['**/*.mp3', '**/*.wav', '**/*.png', '**/*.jpg'],
  define: {
    'process.env': {},
  },
});
