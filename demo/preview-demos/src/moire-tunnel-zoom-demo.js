import { TAU, mix, mountP5Demo } from './expansion-a-utils.js';

mountP5Demo({
  id: 'moire-tunnel-zoom',
  pointerPhase: 1.8,
  draw(p, time, state, pointer) {
    p.background('#f2efdf');
    const vanishingX = mix(210, pointer.x * p.width, 0.45);
    const vanishingY = mix(91, pointer.y * p.height, 0.45);
    p.noFill();
    p.strokeWeight(1.25);
    for (let ring = 0; ring < 34; ring += 1) {
      const progress = ((ring / 34 + time / 3) % 1);
      const eased = progress * progress;
      const diameter = 9 + eased * 285;
      const drift = Math.sin(progress * TAU * 2 + time * 2) * (1 - progress) * 18;
      p.stroke(ring % 2 ? '#22201c' : '#fa4f43');
      p.ellipse(vanishingX + drift, vanishingY + Math.cos(progress * 9) * 7, diameter, diameter * (0.46 + progress * 0.22));
    }
    p.noStroke();
    p.fill('#181714');
    p.textStyle(p.BOLD);
    p.textSize(23);
    p.textLeading(19);
    p.text('ENTER THE\nLINE FIELD.', 15, 70);
    p.fill('#fa4f43');
    p.textSize(7);
    p.text('DEPTH / INTERFERENCE', 16, 45);
  },
});
