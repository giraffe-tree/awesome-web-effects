import { createP5Demo, loopPhase, seeded, clamp } from './expansion-a2-utils.js';

createP5Demo({
  id: 'boids-flock-pointer-avoidance',
  draw(p, time, state) {
    const phase = loopPhase(time);
    const focus = state.pointer ?? { x: 226 + Math.cos(phase) * 46, y: 91 + Math.sin(phase * 2) * 34 };
    p.background(8, 20, 27);
    p.noFill();
    p.stroke(83, 226, 191, 45);
    p.circle(focus.x, focus.y, 62 + Math.sin(phase) * 8);
    for (let index = 0; index < 42; index += 1) {
      const lane = index % 7;
      const baseX = 132 + seeded(index, 2) * 182;
      const baseY = 18 + lane * 22 + seeded(index, 5) * 11;
      const drift = phase + seeded(index, 7) * Math.PI * 2;
      let x = baseX + Math.cos(drift) * (9 + seeded(index, 9) * 17);
      let y = baseY + Math.sin(drift * 1.4) * 8;
      const dx = x - focus.x;
      const dy = y - focus.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const avoid = clamp(1 - distance / 72);
      x += dx / distance * avoid * 34;
      y += dy / distance * avoid * 34;
      const angle = Math.atan2(Math.sin(drift * 1.4) * 8 + dy / distance * avoid * 34, -Math.sin(drift) * 18 + dx / distance * avoid * 34);
      p.push();
      p.translate(x, y);
      p.rotate(angle);
      p.noStroke();
      p.fill(148 + avoid * 92, 239, 214, 105 + avoid * 150);
      p.triangle(7, 0, -5, -3.2, -2, 0);
      p.pop();
    }
  },
});
