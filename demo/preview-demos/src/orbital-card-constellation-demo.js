import { TAU, mix, mountP5Demo } from './expansion-a-utils.js';

mountP5Demo({
  id: 'orbital-card-constellation',
  draw(p, time, state, pointer) {
    p.background('#090914');
    const angle = time / 3 * TAU;
    const cx = mix(160, pointer.x * p.width, 0.22);
    const cy = mix(92, pointer.y * p.height, 0.18);
    const radius = state.active ? 45 : 70;
    const colors = ['#ff765e', '#7675ff', '#bcf36a', '#f6cf61', '#f4efe5'];
    const positions = colors.map((_, index) => {
      const theta = angle + index / colors.length * TAU;
      return { x: cx + Math.cos(theta) * radius, y: cy + Math.sin(theta) * radius * 0.58, theta };
    });
    p.stroke('#7878a455');
    p.strokeWeight(1);
    positions.forEach((point, index) => {
      const next = positions[(index + 2) % positions.length];
      p.line(point.x, point.y, next.x, next.y);
    });
    positions.forEach((point, index) => {
      p.push();
      p.translate(point.x, point.y);
      p.rotate(point.theta * 0.18);
      p.fill(colors[index]);
      p.stroke('#05050b');
      p.rectMode(p.CENTER);
      p.rect(0, 0, 54, 35, 7);
      p.noStroke();
      p.fill('#11131a');
      p.textStyle(p.BOLD);
      p.textSize(7);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(`NODE 0${index + 1}`, 0, 0);
      p.pop();
    });
    p.noStroke();
    p.fill('#eef0ff');
    p.textStyle(p.BOLD);
    p.textSize(20);
    p.text('ORBITAL\nEDITORIAL', 15, 71);
    p.fill('#9d9dcc');
    p.textSize(7);
    p.text(state.active ? 'GRAVITY / TIGHT' : 'GRAVITY / WIDE', 16, 48);
  },
});
