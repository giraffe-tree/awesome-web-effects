import { createP5Demo, loopPhase, seeded } from './expansion-a2-utils.js';

createP5Demo({
  id: 'recursive-quadtree-pulse-mosaic',
  draw(p, time, state) {
    const phase = loopPhase(time);
    const focus = state.pointer ?? { x: 228 + Math.cos(phase) * 54, y: 90 + Math.sin(phase) * 42 };
    p.background(19, 16, 13);
    p.rectMode(p.CORNER);
    const tile = (x, y, size, depth, seed) => {
      const distance = Math.hypot(x + size / 2 - focus.x, y + size / 2 - focus.y);
      const pulse = 72 + Math.sin(phase * 2 + seed) * 18;
      if (depth < 4 && size > 11 && distance < pulse + size * 0.72) {
        const half = size / 2;
        tile(x, y, half, depth + 1, seed + 1);
        tile(x + half, y, half, depth + 1, seed + 2);
        tile(x, y + half, half, depth + 1, seed + 3);
        tile(x + half, y + half, half, depth + 1, seed + 4);
        return;
      }
      const warmth = seeded(seed + depth * 7, 4);
      p.fill(74 + warmth * 92, 48 + warmth * 62, 31 + warmth * 22, 210);
      p.stroke(255, 213, 126, 52);
      p.rect(x + 1, y + 1, size - 2, size - 2, Math.min(8, size * 0.14));
    };
    tile(126, -5, 190, 0, 3);
    p.noFill();
    p.stroke(255, 197, 82, 170);
    p.circle(focus.x, focus.y, 15);
  },
});
