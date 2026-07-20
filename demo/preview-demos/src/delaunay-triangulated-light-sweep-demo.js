import { createP5Demo, loopPhase, seeded, clamp } from './expansion-a2-utils.js';

const columns = 9;
const rows = 7;
const points = Array.from({ length: columns * rows }, (_, index) => {
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {
    x: 118 + column * 25 + (row % 2) * 9 + (seeded(index, 2) - 0.5) * 8,
    y: 8 + row * 28 + (seeded(index, 6) - 0.5) * 10,
  };
});

createP5Demo({
  id: 'delaunay-triangulated-light-sweep',
  draw(p, time, state) {
    const phase = loopPhase(time);
    const light = state.pointer ?? { x: 220 + Math.cos(phase) * 92, y: 88 + Math.sin(phase) * 64 };
    p.background(24, 21, 29);
    for (let row = 0; row < rows - 1; row += 1) {
      for (let column = 0; column < columns - 1; column += 1) {
        const a = points[row * columns + column];
        const b = points[row * columns + column + 1];
        const c = points[(row + 1) * columns + column];
        const d = points[(row + 1) * columns + column + 1];
        for (const triangle of (row + column) % 2 ? [[a, b, c], [b, d, c]] : [[a, b, d], [a, d, c]]) {
          const centerX = (triangle[0].x + triangle[1].x + triangle[2].x) / 3;
          const centerY = (triangle[0].y + triangle[1].y + triangle[2].y) / 3;
          const glow = clamp(1 - Math.hypot(centerX - light.x, centerY - light.y) / 118);
          p.fill(53 + glow * 200, 42 + glow * 112, 66 + glow * 66, 205);
          p.stroke(255, 202, 164, 22 + glow * 84);
          p.triangle(triangle[0].x, triangle[0].y, triangle[1].x, triangle[1].y, triangle[2].x, triangle[2].y);
        }
      }
    }
    p.noFill();
    p.stroke(255, 184, 136, 150);
    p.circle(light.x, light.y, 18);
  },
});
