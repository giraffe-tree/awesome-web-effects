import { TAU, clamp, mountP5Demo } from './expansion-a-utils.js';

mountP5Demo({
  id: 'iris-aperture-navigation',
  pointerPhase: 0.2,
  draw(p, time, state, pointer) {
    p.background('#07110f');
    const cx = p.width * 0.64;
    const cy = p.height * 0.5;
    const openness = clamp(0.12 + pointer.x * 0.7 + Math.sin(time * 3.1) * 0.05);
    p.noStroke();
    p.fill('#dcae54');
    for (let index = 0; index < 10; index += 1) {
      const angle = (index / 10) * TAU + openness * 0.32;
      const inner = 12 + openness * 38;
      const outer = 72;
      p.beginShape();
      p.vertex(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      p.vertex(cx + Math.cos(angle + 0.32) * outer, cy + Math.sin(angle + 0.32) * outer);
      p.vertex(cx + Math.cos(angle + 0.82) * outer, cy + Math.sin(angle + 0.82) * outer);
      p.vertex(cx + Math.cos(angle + 0.62) * inner, cy + Math.sin(angle + 0.62) * inner);
      p.endShape(p.CLOSE);
    }
    p.fill('#07110f');
    p.circle(cx, cy, (16 + openness * 76) * 2);
    p.noFill();
    p.stroke('#f7dc9b');
    p.strokeWeight(1);
    p.circle(cx, cy, 150);
    p.circle(cx, cy, 22 + openness * 78);
    p.line(cx - 84, cy, cx - 65, cy);
    p.line(cx + 65, cy, cx + 84, cy);
    p.noStroke();
    p.fill('#f4ead1');
    p.textStyle(p.BOLD);
    p.textSize(23);
    p.textLeading(19);
    p.text('OPEN\nTHE FOCUS.', 17, 77);
    p.fill('#dcae54');
    p.textSize(7);
    p.text(`IRIS / ${(openness * 100).toFixed(0)}%`, 18, 49);
  },
  assert: () => document.querySelector('[data-preview-mechanism="p5-iris-aperture"]') !== null,
});
