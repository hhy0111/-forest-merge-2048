import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  publicDir: path.resolve(__dirname, '../assets'),
  server: {
    port: 5173,
  },
  test: {
    environment: 'node',
  },
});
