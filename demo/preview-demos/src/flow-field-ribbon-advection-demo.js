import { createP5Demo, loopPhase, seeded } from './expansion-a2-utils.js';

createP5Demo({
  id: 'flow-field-ribbon-advection',
  draw(p, time, state) {
    const phase = loopPhase(time);
    const focus = state.pointer ?? { x: 230 + Math.cos(phase) * 44, y: 90 + Math.sin(phase) * 36 };
    p.background(5, 24, 34);
    p.noFill();
    p.noiseSeed(4812);
    for (let ribbon = 0; ribbon < 34; ribbon += 1) {
      let x = 118 + seeded(ribbon, 2) * 205;
      let y = seeded(ribbon, 7) * 180;
      p.beginShape();
      for (let step = 0; step < 22; step += 1) {
        const pull = Math.atan2(focus.y - y, focus.x - x);
        const flow = p.noise(x * 0.012, y * 0.012, phase * 0.12 + ribbon * 0.01) * Math.PI * 4 - Math.PI * 2;
        const influence = Math.max(0, 1 - Math.hypot(x - focus.x, y - focus.y) / 90);
        const angle = flow * (1 - influence * 0.5) + pull * influence * 0.5;
        x += Math.cos(angle) * 5.2;
        y += Math.sin(angle) * 5.2;
        p.stroke(58 + ribbon * 2.8, 150 + ribbon * 2.2, 194 + ribbon * 1.4, 18 + step * 4.2);
        p.vertex(x, y);
      }
      p.endShape();
    }
    p.noStroke();
    p.fill(110, 232, 225, 190);
    p.circle(focus.x, focus.y, 8 + Math.sin(phase * 2) * 2);
  },
});
