import { canvasDemo, TAU, seeded } from './expansion-b-utils.js';

const foldLabel = document.querySelector('#fold-count');
canvasDemo({
  id: 'procedural-folding-kaleidoscope',
  draw(context, time, state) {
    const folds = 5 + Math.round((state.pointer ? state.pointer.x / 320 : (Math.sin(time * .9) + 1) / 2) * 5), centerX = 229, centerY = 90, radius = 73;
    context.fillStyle = '#140a20'; context.fillRect(0, 0, 320, 180); context.save(); context.translate(centerX, centerY);
    for (let fold = 0; fold < folds; fold += 1) for (let mirror = 0; mirror < 2; mirror += 1) { context.save(); context.rotate(fold / folds * TAU); context.scale(mirror ? -1 : 1, 1); context.beginPath(); context.moveTo(0, 0); context.arc(0, 0, radius, -Math.PI / folds, Math.PI / folds); context.closePath(); context.clip(); for (let shape = 0; shape < 10; shape += 1) { const phase = time * .8 + shape * .73, angle = (seeded(shape, 2) * 1.5 - .75) * Math.PI / folds + Math.sin(phase) * .08, distance = 13 + seeded(shape, 4) * 48 + Math.sin(phase * .7) * 6, size = 5 + seeded(shape, 8) * 13; context.save(); context.translate(Math.cos(angle) * distance, Math.sin(angle) * distance); context.rotate(angle + time * .65); context.fillStyle = `hsla(${292 + shape * 17},88%,${46 + shape % 3 * 12}%,.72)`; context.fillRect(-size / 2, -size / 2, size, size); context.restore(); } context.restore(); }
    context.restore(); foldLabel.textContent = `FOLDS ${String(folds).padStart(2, '0')}`;
  },
  assert: () => /^FOLDS \d{2}$/.test(foldLabel.textContent)
});
