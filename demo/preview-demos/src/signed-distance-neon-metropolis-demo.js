import { canvasDemo } from './expansion-b-utils.js';

const buildings = [[151, 56, 18, 58], [176, 39, 23, 75], [207, 67, 19, 47], [233, 28, 27, 86], [268, 49, 17, 65], [292, 72, 13, 42]];
const boxDistance = (x, y, bx, by, width, height) => { const dx = Math.abs(x - bx) - width / 2, dy = Math.abs(y - by) - height / 2; return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0); };
canvasDemo({
  id: 'signed-distance-neon-metropolis',
  draw(context, time, state) {
    const shift = state.pointer ? (state.pointer.y / 180 - .5) * 18 : Math.sin(time) * 6; context.fillStyle = '#030615'; context.fillRect(0, 0, 320, 180);
    for (let y = 20; y < 157; y += 2) for (let x = 128; x < 312; x += 2) { let distance = Infinity; buildings.forEach(([bx, by, width, height]) => { distance = Math.min(distance, boxDistance(x, y, bx, by + height / 2 + shift, width, height)); }); const edge = Math.max(0, 1 - Math.abs(distance) / 7), inside = distance < 0; context.fillStyle = inside ? `rgba(26,35,74,${.75 + edge * .2})` : `rgba(${40 + edge * 40},${80 + edge * 170},${130 + edge * 125},${edge * .9})`; context.fillRect(x, y, 2, 2); }
    context.fillStyle = '#e9fdff'; context.font = '800 6px monospace'; buildings.forEach(([bx, by], index) => context.fillText(`0${index + 1}`, bx - 6, by + shift - 4));
  },
  assert: () => buildings.length === 6
});
