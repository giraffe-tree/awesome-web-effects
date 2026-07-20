import { canvasDemo, TAU, seeded } from './expansion-b-utils.js';

const stars = Array.from({ length: 34 }, (_, index) => ({ x: 127 + seeded(index, 1) * 184, y: 24 + seeded(index, 2) * 132, r: 1 + seeded(index, 3) * 2.3 }));
canvasDemo({
  id: 'cursor-drawn-constellation-thread',
  draw(context, time, state) {
    const cursor = state.pointer ?? { x: 220 + Math.cos(time * 1.6) * 72, y: 90 + Math.sin(time * 2.1) * 53 };
    context.fillStyle = '#020712'; context.fillRect(0, 0, 320, 180); stars.forEach((star, index) => { context.beginPath(); context.arc(star.x, star.y, star.r, 0, TAU); context.fillStyle = index % 7 ? '#cbd6ff' : '#ffd887'; context.fill(); });
    const nearest = [...stars].sort((a, b) => Math.hypot(a.x - cursor.x, a.y - cursor.y) - Math.hypot(b.x - cursor.x, b.y - cursor.y)).slice(0, 7);
    context.beginPath(); context.moveTo(cursor.x, cursor.y); nearest.forEach(star => context.lineTo(star.x, star.y)); context.strokeStyle = '#718dff99'; context.lineWidth = 1; context.stroke();
    nearest.forEach(star => { context.beginPath(); context.arc(star.x, star.y, star.r + 4, 0, TAU); context.strokeStyle = '#8fa7ff66'; context.stroke(); }); context.beginPath(); context.arc(cursor.x, cursor.y, 5, 0, TAU); context.fillStyle = '#ffffff'; context.fill();
  },
  assert: () => stars.length === 34
});
