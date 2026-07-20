import { canvasDemo, TAU } from './expansion-b-utils.js';

canvasDemo({
  id: 'caustic-light-card-surface',
  draw(context, time, state) {
    const drift = state.pointer ? state.pointer.x / 320 * TAU : time * .8;
    context.fillStyle = '#031a22'; context.fillRect(0, 0, 320, 180);
    const water = context.createLinearGradient(128, 25, 308, 156); water.addColorStop(0, '#0d4c59'); water.addColorStop(1, '#062733'); context.fillStyle = water; context.fillRect(132, 26, 174, 130);
    context.save(); context.beginPath(); context.roundRect(145, 38, 148, 106, 15); context.clip(); context.fillStyle = '#0e5964'; context.fillRect(145, 38, 148, 106); context.globalCompositeOperation = 'lighter';
    for (let line = 0; line < 24; line += 1) { context.beginPath(); for (let x = 0; x <= 160; x += 4) { const y = line * 6 + Math.sin(x * .09 + drift + line) * 7 + Math.cos(x * .035 - drift * 1.7) * 5; x ? context.lineTo(140 + x, 28 + y) : context.moveTo(140 + x, 28 + y); } context.strokeStyle = `rgba(118,244,255,${.055 + (line % 4) * .018})`; context.lineWidth = 2 + Math.sin(line + drift) * .8; context.stroke(); }
    context.restore(); context.globalCompositeOperation = 'source-over'; context.fillStyle = '#dcfbff'; context.font = '900 20px system-ui'; context.fillText('TIDAL', 159, 111); context.fillStyle = '#a1e7ec'; context.font = '700 7px monospace'; context.fillText('LIGHT STUDY / 06', 159, 126);
  },
  assert: ({ context }) => typeof context.roundRect === 'function'
});
