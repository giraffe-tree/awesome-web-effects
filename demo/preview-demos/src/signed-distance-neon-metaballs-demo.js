import { createP5Demo, loopPhase } from './expansion-a2-utils.js';

createP5Demo({
  id: 'signed-distance-neon-metaballs',
  draw(p, time, state) {
    const phase = loopPhase(time);
    const pointer = state.pointer ?? { x: 236 + Math.cos(phase) * 48, y: 90 + Math.sin(phase * 2) * 38 };
    const balls = [
      [185 + Math.cos(phase) * 38, 68 + Math.sin(phase) * 24, 31],
      [238 + Math.cos(phase + 2.1) * 42, 111 + Math.sin(phase + 1.3) * 30, 27],
      [pointer.x, pointer.y, state.pressed ? 43 : 30],
    ];
    p.background(2, 5, 18);
    p.noStroke();
    for (let y = 0; y < 180; y += 3) {
      for (let x = 0; x < 320; x += 3) {
        let field = 0;
        for (const [bx, by, radius] of balls) field += radius * radius / Math.max(30, (x - bx) ** 2 + (y - by) ** 2);
        if (field < 0.34) continue;
        const glow = Math.min(1, (field - 0.34) * 2.3);
        p.fill(42 + glow * 78, 88 + glow * 167, 171 + glow * 78, 40 + glow * 210);
        p.rect(x, y, 3.2, 3.2);
      }
    }
  },
});
