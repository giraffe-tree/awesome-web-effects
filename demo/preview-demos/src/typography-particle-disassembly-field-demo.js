import { canvasDemo, TAU, wave, seeded } from './expansion-b-utils.js';

const mask = document.createElement('canvas'); mask.width = 170; mask.height = 72;
const maskContext = mask.getContext('2d'); maskContext.fillStyle = '#fff'; maskContext.font = '900 48px system-ui'; maskContext.fillText('FORM', 0, 52);
const pixels = maskContext.getImageData(0, 0, mask.width, mask.height).data;
const particles = [];
for (let y = 0, index = 0; y < 72; y += 3) for (let x = 0; x < 170; x += 3, index += 1) if (pixels[(y * 170 + x) * 4 + 3] > 100) particles.push({ x: 139 + x, y: 54 + y, dx: (seeded(index, 4) - .5) * 150, dy: (seeded(index, 8) - .5) * 110, spin: seeded(index, 2) * TAU });
canvasDemo({
  id: 'typography-particle-disassembly-field',
  draw(context, time, state) {
    const progress = state.pointer?.x ? state.pointer.x / 320 : wave(time);
    context.fillStyle = '#040a12'; context.fillRect(0, 0, 320, 180); context.fillStyle = '#63f3db';
    particles.forEach((particle, index) => { const ease = progress * progress; const swirl = particle.spin + time; const x = particle.x + particle.dx * ease + Math.cos(swirl) * 10 * ease, y = particle.y + particle.dy * ease + Math.sin(swirl) * 8 * ease; context.globalAlpha = .35 + (index % 4) * .18; context.fillRect(x, y, 1.4 + ease * 1.2, 1.4 + ease * 1.2); }); context.globalAlpha = 1;
  },
  assert: () => particles.length > 200
});
