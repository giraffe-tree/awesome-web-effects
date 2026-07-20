import { canvasDemo, seeded } from './expansion-b-utils.js';

const letters = Array.from('TYPOGRAPHYMAKESWEATHERPRESS', (glyph, index) => ({ glyph, x: 130 + seeded(index, 2) * 174, start: seeded(index, 4) * 180, speed: 24 + seeded(index, 8) * 62, size: 8 + seeded(index, 9) * 12 }));
canvasDemo({
  id: 'kinetic-rain-letterpress',
  draw(context, time, state) {
    const force = state.pointer ? .4 + state.pointer.y / 180 * 1.6 : 1;
    context.fillStyle = '#e8dfca'; context.fillRect(0, 0, 320, 180); context.fillStyle = '#d6c7ad'; context.fillRect(124, 145, 188, 4);
    letters.forEach((letter, index) => { const cycle = 174 / (letter.speed * force), y = ((letter.start + time * letter.speed * force) % 174) - 18; context.font = `900 ${letter.size}px Georgia`; context.textAlign = 'center'; context.fillStyle = '#2b2925'; context.fillText(letter.glyph, letter.x, y); const impact = 1 - Math.min(1, Math.abs(y - 143) / 19); if (impact > 0) { context.save(); context.globalAlpha = impact * .45; context.scale(1 + impact * .65, .5); context.fillStyle = index % 4 ? '#8e3f31' : '#263b35'; context.fillText(letter.glyph, letter.x / (1 + impact * .65), 286); context.restore(); } if (cycle < 0) context.fillRect(0, 0, 0, 0); });
    context.fillStyle = '#29231d'; context.textAlign = 'left'; context.font = '900 7px monospace'; context.fillText('IMPRESSION / 1.4MM', 132, 164);
  },
  assert: () => letters.length === 27
});
