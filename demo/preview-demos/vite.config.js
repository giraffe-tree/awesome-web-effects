import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const demoIds = [
  'visually-authored-keyframe-sequence',
  'staggered-transform-choreography',
  'motion-graphics-burst',
  'compact-svg-shape-tween',
  'functional-webgl-draw-commands',
  'dom-synced-shader-planes',
  'scroll-scrubbed-master-timeline',
  'pinned-horizontal-scroll-scene',
  'shared-layout-spring-morph',
  'filterable-grid-reflow',
  'perspective-tilt-and-glare',
  'svg-stroke-drawing',
  'sketch-style-creative-coding-loop'
];

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
