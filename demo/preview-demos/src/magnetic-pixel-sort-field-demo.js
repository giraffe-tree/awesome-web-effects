import { seeded, mountP5Demo } from './expansion-a-utils.js';

mountP5Demo({
  id: 'magnetic-pixel-sort-field',
  pointerPhase: 2.2,
  draw(p, time, state, pointer) {
    p.background('#111217');
    p.colorMode(p.HSB, 360, 100, 100, 100);
    const columns = 28;
    const rows = 12;
    const cellWidth = p.width / columns;
    const cellHeight = p.height / rows;
    p.noStroke();
    for (let column = 0; column < columns; column += 1) {
      const distance = Math.abs(column / (columns - 1) - pointer.x);
      const pull = Math.max(0, 1 - distance * 3.2);
      for (let row = 0; row < rows; row += 1) {
        const noise = seeded(column * rows + row, 4);
        const sortedRow = Math.round(noise * (rows - 1) * (1 - pull) + row * pull);
        const hue = (column * 11 + sortedRow * 17 + time * 28) % 360;
        const x = column * cellWidth;
        const y = sortedRow * cellHeight;
        const height = cellHeight * (0.55 + pull * 0.8);
        p.fill(hue, 72 + pull * 25, 92, 92);
        p.rect(x + 0.5, y + (cellHeight - height) / 2, cellWidth - 1, height, 1.5);
      }
    }
    p.colorMode(p.RGB, 255);
    const magnetX = pointer.x * p.width;
    p.stroke('#ffffffbb');
    p.noFill();
    p.circle(magnetX, pointer.y * p.height, 34);
    p.line(magnetX, 0, magnetX, p.height);
    p.noStroke();
    p.fill('#ffffff');
    p.textStyle(p.BOLD);
    p.textSize(19);
    p.text('SORT THE\nSIGNAL.', 14, 67);
  },
});
