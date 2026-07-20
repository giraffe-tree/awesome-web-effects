import { createP5Demo, loopPhase, clamp } from './expansion-a2-utils.js';

const letters = [...'ELASTIC'];

createP5Demo({
  id: 'kinetic-typography-letter-springs',
  draw(p, time, state) {
    const phase = loopPhase(time);
    const focus = state.pointer ?? { x: 212 + Math.cos(phase) * 76, y: 93 + Math.sin(phase) * 30 };
    p.background(240, 234, 220);
    p.textAlign(p.CENTER, p.CENTER);
    p.textStyle(p.BOLD);
    p.textFont('Georgia');
    for (let index = 0; index < letters.length; index += 1) {
      const homeX = 134 + index * 25;
      const homeY = 92;
      const dx = homeX - focus.x;
      const dy = homeY - focus.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const force = clamp(1 - distance / 84);
      const spring = Math.sin(phase * 2 + index * 0.72) * 5 * (0.25 + force);
      const x = homeX + dx / distance * force * 22;
      const y = homeY + dy / distance * force * 19 + spring;
      p.push();
      p.translate(x, y);
      p.rotate((dx / distance) * force * 0.28);
      p.fill(force > 0.2 ? '#cf432f' : '#171512');
      p.noStroke();
      p.textSize(31 + force * 12);
      p.text(letters[index], 0, 0);
      p.pop();
      p.stroke(23, 21, 18, 24 + force * 50);
      p.line(homeX, homeY + 30, x, y + 22);
    }
    p.noFill();
    p.stroke(207, 67, 47, 105);
    p.circle(focus.x, focus.y, 20);
  },
});
