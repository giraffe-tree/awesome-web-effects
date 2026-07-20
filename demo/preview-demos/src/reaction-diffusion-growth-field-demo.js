import { createP5Demo, loopPhase } from './expansion-a2-utils.js';

createP5Demo({
  id: 'reaction-diffusion-growth-field',
  draw(p, time, state) {
    const phase = loopPhase(time);
    const seed = state.pointer ?? { x: 226 + Math.cos(phase) * 45, y: 90 + Math.sin(phase) * 35 };
    p.background(238, 231, 217);
    p.noStroke();
    for (let y = 0; y < 180; y += 3) {
      for (let x = 0; x < 320; x += 3) {
        const distance = Math.hypot(x - seed.x, y - seed.y);
        const reaction = Math.sin(distance * 0.19 - phase * 2.2 + Math.sin(x * 0.045) * 1.4) + Math.sin((x + y) * 0.075 + phase);
        if (reaction > 0.45) {
          const edge = Math.min(1, (reaction - 0.45) * 1.8);
          p.fill(54 + edge * 90, 48 + edge * 34, 42 + edge * 24, 42 + edge * 150);
          p.rect(x, y, 3, 3);
        }
      }
    }
    p.noFill();
    p.stroke(225, 91, 74, 180);
    p.circle(seed.x, seed.y, 13 + Math.sin(phase * 2) * 4);
  },
});
