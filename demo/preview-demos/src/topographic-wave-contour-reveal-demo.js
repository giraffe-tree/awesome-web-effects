import { canvasDemo, TAU, wave } from './expansion-b-utils.js';

canvasDemo({
  id: 'topographic-wave-contour-reveal',
  draw(context, time, state) {
    const progress = state.pointer ? state.pointer.x / 320 : wave(time);
    context.fillStyle = '#07110f'; context.fillRect(0, 0, 320, 180);
    context.save(); context.beginPath(); context.rect(126, 20, 185 * progress, 145); context.clip();
    for (let level = 0; level < 13; level += 1) {
      const radius = 10 + level * 7.1, phase = time * .7 + level * .22;
      context.beginPath();
      for (let point = 0; point <= 100; point += 1) {
        const angle = point / 100 * TAU;
        const warp = 1 + .13 * Math.sin(angle * 3 + phase) + .08 * Math.cos(angle * 5 - phase);
        const x = 222 + Math.cos(angle) * radius * 1.06 * warp;
        const y = 91 + Math.sin(angle) * radius * .64 * warp;
        point ? context.lineTo(x, y) : context.moveTo(x, y);
      }
      context.strokeStyle = `hsl(${84 + level * 4} 58% ${42 + level * 2}%)`;
      context.lineWidth = level % 4 === 0 ? 1.8 : .75; context.stroke();
    }
    context.restore(); context.fillStyle = '#e8f6da'; context.fillRect(126 + 185 * progress, 21, 1, 143);
  },
  assert: ({ state }) => state.draws >= 2
});
