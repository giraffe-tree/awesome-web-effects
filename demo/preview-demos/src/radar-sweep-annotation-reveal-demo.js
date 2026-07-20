import { TAU, mountP5Demo } from './expansion-a-utils.js';

mountP5Demo({
  id: 'radar-sweep-annotation-reveal',
  draw(p, time, state, pointer) {
    p.background('#06110d');
    const cx = 198;
    const cy = 92;
    const sweep = state.pointerDriven ? Math.atan2(pointer.y * p.height - cy, pointer.x * p.width - cx) : time / 3 * TAU - Math.PI;
    p.noFill();
    p.stroke('#63e99b44');
    p.strokeWeight(1);
    [36, 70, 106, 142].forEach((diameter) => p.circle(cx, cy, diameter));
    for (let ray = 0; ray < 8; ray += 1) {
      const angle = ray / 8 * TAU;
      p.line(cx, cy, cx + Math.cos(angle) * 72, cy + Math.sin(angle) * 72);
    }
    const context = p.drawingContext;
    const gradient = context.createConicGradient(sweep - 0.72, cx, cy);
    gradient.addColorStop(0, '#59ff9e00');
    gradient.addColorStop(0.12, '#59ff9e88');
    gradient.addColorStop(0.2, '#59ff9e00');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(cx, cy, 73, 0, TAU);
    context.fill();
    p.stroke('#b5ffd0');
    p.strokeWeight(2);
    p.line(cx, cy, cx + Math.cos(sweep) * 73, cy + Math.sin(sweep) * 73);
    const targets = [
      { a: -2.45, r: 54, label: 'TRACE / 07' },
      { a: -0.55, r: 63, label: 'SIGNAL / 12' },
      { a: 1.12, r: 45, label: 'PROOF / 03' },
    ];
    targets.forEach((target) => {
      const delta = Math.abs(Math.atan2(Math.sin(sweep - target.a), Math.cos(sweep - target.a)));
      const alpha = Math.max(0.18, 1 - delta / 0.65);
      const x = cx + Math.cos(target.a) * target.r;
      const y = cy + Math.sin(target.a) * target.r;
      p.noStroke();
      p.fill(123, 255, 172, alpha * 255);
      p.circle(x, y, 7 + alpha * 7);
      p.textSize(6);
      p.textStyle(p.BOLD);
      p.text(target.label, x + 8, y + 2);
    });
    p.noStroke();
    p.fill('#dffff0');
    p.textStyle(p.BOLD);
    p.textSize(19);
    p.text('SCAN FOR\nTHE SIGNAL.', 15, 73);
  },
});
