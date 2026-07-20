import { TAU, mountP5Demo } from './expansion-a-utils.js';

mountP5Demo({
  id: 'liquid-chrome-letterform',
  pointerPhase: 2.4,
  draw(p, time, state, pointer) {
    p.background('#130f19');
    const context = p.drawingContext;
    const lightX = pointer.x * p.width;
    const gradient = context.createLinearGradient(lightX - 95, 0, lightX + 95, 0);
    gradient.addColorStop(0, '#2c1c4d');
    gradient.addColorStop(0.18, '#71e8ff');
    gradient.addColorStop(0.36, '#fff8df');
    gradient.addColorStop(0.52, '#ff79bd');
    gradient.addColorStop(0.7, '#6f5cff');
    gradient.addColorStop(1, '#17121f');
    context.save();
    context.font = '950 126px system-ui';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = '#6ee8ff88';
    context.shadowBlur = 20;
    context.fillStyle = gradient;
    context.fillText('S', 211, 101 + Math.sin(time / 3 * TAU) * 3);
    context.lineWidth = 2;
    context.strokeStyle = '#ffffffaa';
    context.strokeText('S', 211, 101 + Math.sin(time / 3 * TAU) * 3);
    context.restore();
    p.noFill();
    p.stroke('#ff79bd88');
    for (let index = 0; index < 5; index += 1) {
      const y = 53 + index * 22;
      p.beginShape();
      for (let x = 127; x < 292; x += 7) {
        p.vertex(x, y + Math.sin(x * 0.08 + time * 3 + index) * (3 + index));
      }
      p.endShape();
    }
    p.noStroke();
    p.fill('#f8efff');
    p.textStyle(p.BOLD);
    p.textSize(21);
    p.text('LIQUID\nLETTER.', 15, 72);
    p.fill('#bb9fcc');
    p.textSize(7);
    p.text('SPECULAR / TYPE', 16, 47);
  },
});
