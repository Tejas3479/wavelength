import { defineConfig } from 'vite';

export default defineConfig({
  base: './',  // Relative paths — critical for itch.io zip upload and Netlify subdirs
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2020',
  },
  server: {
    open: true,
    port: 3000,
  },
});
