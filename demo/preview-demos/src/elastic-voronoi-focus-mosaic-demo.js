import { canvasDemo, seeded } from './expansion-b-utils.js';

const seeds = Array.from({ length: 15 }, (_, index) => ({ x: 128 + seeded(index, 1) * 179, y: 24 + seeded(index, 2) * 132, hue: 8 + seeded(index, 3) * 185 }));
canvasDemo({
  id: 'elastic-voronoi-focus-mosaic',
  draw(context, time, state) {
    const focus = state.pointer ?? { x: 221 + Math.cos(time * 1.5) * 55, y: 90 + Math.sin(time * 1.7) * 42 };
    const focusIndex = seeds.reduce((best, seed, index) => Math.hypot(seed.x - focus.x, seed.y - focus.y) < Math.hypot(seeds[best].x - focus.x, seeds[best].y - focus.y) ? index : best, 0);
    context.fillStyle = '#efeadf'; context.fillRect(0, 0, 320, 180);
    for (let y = 24; y < 157; y += 3) for (let x = 128; x < 309; x += 3) { let best = 0, distance = Infinity; seeds.forEach((seed, index) => { const weight = index === focusIndex ? .58 : 1; const candidate = Math.hypot(seed.x - x, seed.y - y) * weight; if (candidate < distance) { distance = candidate; best = index; } }); context.fillStyle = `hsl(${seeds[best].hue} 48% ${best === focusIndex ? 68 : 48}%)`; context.fillRect(x, y, 3, 3); }
    seeds.forEach((seed, index) => { context.beginPath(); context.arc(seed.x, seed.y, index === focusIndex ? 4 : 2, 0, Math.PI * 2); context.fillStyle = '#fff'; context.fill(); });
  },
  assert: () => seeds.length === 15
});
