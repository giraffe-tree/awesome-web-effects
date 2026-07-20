import { TAU, mountP5Demo } from './expansion-a-utils.js';

mountP5Demo({
  id: 'accordion-image-slices',
  pointerPhase: 0.4,
  draw(p, time, state, pointer) {
    p.background('#efe9d9');
    const startX = 104;
    const top = 31;
    const height = 128;
    const slices = 11;
    const baseWidth = 19;
    const opening = 0.35 + pointer.x * 0.9;
    const colors = ['#ff674f', '#6a6bff', '#c8f160', '#f7ca55'];
    let cursor = startX;
    for (let index = 0; index < slices; index += 1) {
      const pulse = Math.sin(time / 3 * TAU + index * 0.72);
      const width = baseWidth * (0.72 + opening * (0.45 + 0.25 * pulse));
      const slant = (index % 2 ? -1 : 1) * (8 + opening * 9);
      p.fill(colors[index % colors.length]);
      p.stroke('#1b1b17');
      p.strokeWeight(1);
      p.quad(cursor, top + slant, cursor + width, top - slant, cursor + width, top + height + slant, cursor, top + height - slant);
      p.noStroke();
      p.fill('#16171377');
      p.circle(cursor + width * 0.5, 90 + Math.sin(index * 1.7) * 35, 9 + index % 3 * 5);
      cursor += width * 0.82;
    }
    p.noStroke();
    p.fill('#1a1a16');
    p.textStyle(p.BOLD);
    p.textSize(21);
    p.textLeading(18);
    p.text('FOLD THE\nIMAGE.', 15, 72);
    p.textSize(7);
    p.text('MEDIA / 11 SLICES', 16, 47);
  },
});
