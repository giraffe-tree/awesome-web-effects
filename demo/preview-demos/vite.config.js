import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const manifest = JSON.parse(readFileSync(new URL('./preview-manifest.json', import.meta.url), 'utf8'));
const demoIds = manifest.demos.map(demo => demo.id);

export default defineConfig({
  base: './',
  server: {
    headers: { 'Cache-Control': 'no-store' }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(demoIds.map(id => [id, resolve(import.meta.dirname, `${id}.html`)]))
    }
  }
});
