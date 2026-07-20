import { canvasDemo, wave, seeded } from './expansion-b-utils.js';

const branch = (context, x, y, length, angle, depth, progress, seed) => {
  if (depth <= 0 || progress <= 0) return;
  const local = Math.min(1, progress * 8 - (7 - depth)), bend = (seeded(seed, depth) - .5) * .7;
  const ex = x + Math.cos(angle) * length * local, ey = y + Math.sin(angle) * length * local;
  context.beginPath(); context.moveTo(x, y); context.quadraticCurveTo(x + Math.cos(angle + bend) * length * .52, y + Math.sin(angle + bend) * length * .52, ex, ey); context.strokeStyle = `hsla(${98 + depth * 8},55%,${33 + depth * 5}%,.82)`; context.lineWidth = Math.max(.55, depth * .55); context.stroke();
  if (local >= .98) { branch(context, ex, ey, length * .72, angle - .43 - bend * .2, depth - 1, progress, seed + 3); branch(context, ex, ey, length * .68, angle + .48 + bend * .2, depth - 1, progress, seed + 7); }
};
canvasDemo({
  id: 'recursive-arc-forest-growth',
  draw(context, time, state) {
    const progress = state.pointer ? state.pointer.x / 320 : wave(time); context.fillStyle = '#06100d'; context.fillRect(0, 0, 320, 180);
    for (let tree = 0; tree < 5; tree += 1) branch(context, 142 + tree * 36, 159, 30 + tree % 2 * 9, -Math.PI / 2 + (tree - 2) * .035, 7, progress, 31 + tree * 17);
  },
  assert: ({ context }) => typeof context.quadraticCurveTo === 'function'
});
