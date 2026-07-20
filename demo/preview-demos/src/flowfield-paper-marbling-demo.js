import { canvasDemo, seeded } from './expansion-b-utils.js';

const streams = Array.from({ length: 70 }, (_, index) => ({ x: 128 + seeded(index, 2) * 184, y: 20 + seeded(index, 3) * 140, hue: [12, 41, 165, 214, 326][index % 5] }));
canvasDemo({
  id: 'flowfield-paper-marbling',
  draw(context, time, state) {
    const comb = state.pointer ? (state.pointer.x / 320 - .5) * 2 : Math.sin(time * .7); context.fillStyle = '#efe6d5'; context.fillRect(0, 0, 320, 180); context.save(); context.beginPath(); context.rect(125, 18, 188, 144); context.clip();
    streams.forEach((stream, index) => { let x = stream.x, y = stream.y; context.beginPath(); context.moveTo(x, y); for (let step = 0; step < 85; step += 1) { const angle = Math.sin(x * .025 + time * .35) * 1.25 + Math.cos(y * .04 - time * .23) * .75 + comb * Math.sin(y * .035); x += Math.cos(angle) * 1.8; y += Math.sin(angle) * 1.15; context.lineTo(x, y); } context.strokeStyle = `hsla(${stream.hue},${index % 2 ? 58 : 72}%,${index % 3 ? 42 : 56}%,.54)`; context.lineWidth = 1 + index % 4 * .32; context.stroke(); }); context.restore();
  },
  assert: () => streams.length === 70
});
