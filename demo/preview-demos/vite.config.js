import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const demoIds = [
  'visually-authored-keyframe-sequence',
  'staggered-transform-choreography',
  'render-agnostic-value-tween',
  'motion-graphics-burst',
  'functional-value-pipeline',
  'compact-svg-shape-tween',
  'functional-webgl-draw-commands',
  'dom-synced-shader-planes',
  'accessible-interactive-3d-product-view',
  'declarative-html-3d-scene',
  'vue-declarative-three-js',
  'svelte-declarative-three-js',
  'scroll-scrubbed-master-timeline',
  'pinned-horizontal-scroll-scene',
  'shared-layout-spring-morph',
  'filterable-grid-reflow',
  'perspective-tilt-and-glare',
  'svg-stroke-drawing',
  'sketch-style-creative-coding-loop',
  'anchored-popover-flip-and-shift'
];

export default defineConfig({
  base: './',
  plugins: [vue(), svelte()],
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
