import { canvasDemo, TAU } from './expansion-b-utils.js';

canvasDemo({
  id: 'polar-waveform-sundial',
  draw(context, time, state) {
    const phase = state.pointer ? state.pointer.x / 320 * TAU : time * .8, cx = 224, cy = 90;
    context.fillStyle = '#f4eee0'; context.fillRect(0, 0, 320, 180); context.strokeStyle = '#27302826'; context.lineWidth = 1; [26, 44, 62].forEach(radius => { context.beginPath(); context.arc(cx, cy, radius, 0, TAU); context.stroke(); });
    context.beginPath(); for (let index = 0; index <= 240; index += 1) { const angle = index / 240 * TAU, amplitude = Math.sin(angle * 5 + phase) * 8 + Math.sin(angle * 13 - phase * 1.7) * 4, radius = 48 + amplitude; const x = cx + Math.cos(angle) * radius, y = cy + Math.sin(angle) * radius; index ? context.lineTo(x, y) : context.moveTo(x, y); } context.closePath(); context.strokeStyle = '#cf5841'; context.lineWidth = 2; context.stroke();
    const shadow = 52 + Math.sin(phase) * 18; context.beginPath(); context.moveTo(cx, cy); context.lineTo(cx + Math.cos(phase) * shadow, cy + Math.sin(phase) * shadow * .45); context.strokeStyle = '#1e2821aa'; context.lineWidth = 7; context.stroke(); context.beginPath(); context.arc(cx, cy, 7, 0, TAU); context.fillStyle = '#1e2821'; context.fill();
  },
  assert: ({ context }) => context.lineWidth === 7
});
