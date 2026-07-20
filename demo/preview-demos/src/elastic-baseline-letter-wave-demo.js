import { TAU, mountP5Demo } from './expansion-a-utils.js';

mountP5Demo({
  id: 'elastic-baseline-letter-wave',
  pointerPhase: 1.1,
  draw(p, time, state, pointer) {
    p.background('#f3ead4');
    const word = 'SPRING';
    const points = [];
    for (let index = 0; index < word.length; index += 1) {
      const x = 42 + index * 43;
      const influence = Math.exp(-Math.pow(x / p.width - pointer.x, 2) * 25);
      const wave = Math.sin(time / 3 * TAU + index * 0.82) * 15;
      const y = 98 + wave + (pointer.y - 0.5) * influence * 90;
      points.push({ x, y });
    }
    const context = p.drawingContext;
    context.save();
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length - 1; index += 1) {
      const point = points[index];
      const next = points[index + 1];
      context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
    }
    context.lineTo(points.at(-1).x, points.at(-1).y);
    context.strokeStyle = '#ff5b48';
    context.lineWidth = 2;
    context.stroke();
    context.restore();
    p.noStroke();
    points.forEach((point, index) => {
      const previous = points[Math.max(0, index - 1)];
      const next = points[Math.min(points.length - 1, index + 1)];
      p.push();
      p.translate(point.x, point.y - 7);
      p.rotate(Math.atan2(next.y - previous.y, next.x - previous.x) * 0.58);
      p.fill(index === 2 ? '#ff5b48' : '#17201d');
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textStyle(p.BOLD);
      p.textSize(35);
      p.text(word[index], 0, 0);
      p.pop();
    });
    const anchorX = pointer.x * p.width;
    const anchorY = pointer.y * p.height;
    p.fill('#ff5b48');
    p.circle(anchorX, anchorY, 9);
    p.stroke('#ff5b4888');
    p.line(anchorX, anchorY, anchorX, 165);
    p.noStroke();
    p.fill('#17201d');
    p.textSize(7);
    p.textStyle(p.BOLD);
    p.text('TYPE / TENSION FIELD', 16, 47);
  },
});
