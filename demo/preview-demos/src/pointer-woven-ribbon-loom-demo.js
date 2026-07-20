import { canvasDemo, wave } from './expansion-b-utils.js';

canvasDemo({
  id: 'pointer-woven-ribbon-loom',
  draw(context, time, state) {
    const bend = state.pointer ? (state.pointer.x / 320 - .5) * 22 : (wave(time) - .5) * 22;
    context.fillStyle = '#181126'; context.fillRect(0, 0, 320, 180); context.save(); context.beginPath(); context.rect(126, 22, 187, 136); context.clip();
    for (let row = 0; row < 8; row += 1) { context.beginPath(); for (let x = 126; x <= 314; x += 3) { const y = 32 + row * 17 + Math.sin(x * .055 + time + row) * bend; x === 126 ? context.moveTo(x, y) : context.lineTo(x, y); } context.strokeStyle = row % 2 ? '#f36bbccc' : '#efbb57cc'; context.lineWidth = 8; context.stroke(); }
    for (let column = 0; column < 12; column += 1) { context.beginPath(); for (let y = 22; y <= 160; y += 3) { const x = 134 + column * 16 + Math.cos(y * .061 - time + column) * bend * .65; y === 22 ? context.moveTo(x, y) : context.lineTo(x, y); } context.setLineDash([8, 8]); context.lineDashOffset = column % 2 ? 0 : 8; context.strokeStyle = column % 3 ? '#7d69dfcc' : '#61d5c4cc'; context.lineWidth = 6; context.stroke(); }
    context.restore(); context.setLineDash([]);
  },
  assert: ({ context }) => context.getLineDash().length === 0
});
