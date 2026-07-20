import { TAU, mountP5Demo } from './expansion-a-utils.js';

mountP5Demo({
  id: 'typographic-time-slit',
  pointerPhase: 1.5,
  draw(p, time, state, pointer) {
    p.background('#e94b3c');
    p.textStyle(p.BOLD);
    p.textSize(41);
    p.textLeading(34);
    p.fill('#18100e');
    p.text('BEFORE\nBECOMES\nAFTER', 18, 63);
    const slitY = pointer.y * p.height;
    const slitHeight = 34 + Math.sin(time / 3 * TAU) * 7;
    const context = p.drawingContext;
    context.save();
    context.beginPath();
    context.rect(0, slitY - slitHeight / 2, p.width, slitHeight);
    context.clip();
    p.background('#161317');
    p.fill('#f8e9cc');
    p.text('NOW\nBREAKS\nTHROUGH', 18 + (pointer.x - 0.5) * 34, 63);
    context.restore();
    p.stroke('#f8e9cc');
    p.strokeWeight(1);
    p.line(0, slitY - slitHeight / 2, p.width, slitY - slitHeight / 2);
    p.line(0, slitY + slitHeight / 2, p.width, slitY + slitHeight / 2);
    p.noStroke();
    p.fill('#18100e');
    p.textSize(7);
    p.text('TIME / MOVING APERTURE', 210, 165);
  },
});
