import { createP5Demo, loopPhase, seeded, clamp } from './expansion-a2-utils.js';

const points = Array.from({ length: 34 }, (_, index) => ({
  x: 126 + seeded(index, 3) * 184,
  y: 16 + seeded(index, 8) * 150,
  weight: 0.45 + seeded(index, 12) * 0.75,
}));

createP5Demo({
  id: 'poisson-constellation-bloom',
  draw(p, time, state) {
    const phase = loopPhase(time);
    const focus = state.pointer ?? { x: 222 + Math.cos(phase) * 58, y: 89 + Math.sin(phase) * 43 };
    p.background(8, 8, 23);
    for (let first = 0; first < points.length; first += 1) {
      for (let second = first + 1; second < points.length; second += 1) {
        const a = points[first];
        const b = points[second];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance > 47) continue;
        const proximity = 1 - distance / 47;
        const focusAmount = clamp(1 - Math.hypot((a.x + b.x) / 2 - focus.x, (a.y + b.y) / 2 - focus.y) / 96);
        p.stroke(132 + focusAmount * 95, 111 + focusAmount * 95, 241, 18 + proximity * 90 + focusAmount * 70);
        p.line(a.x, a.y, b.x, b.y);
      }
    }
    p.noStroke();
    for (const point of points) {
      const bloom = clamp(1 - Math.hypot(point.x - focus.x, point.y - focus.y) / 88);
      p.fill(203, 191, 255, 100 + bloom * 155);
      p.circle(point.x, point.y, 1.5 + point.weight * 2 + bloom * 5);
    }
    p.noFill();
    p.stroke(197, 181, 255, 90);
    p.circle(focus.x, focus.y, 28 + Math.sin(phase * 2) * 7);
  },
});
