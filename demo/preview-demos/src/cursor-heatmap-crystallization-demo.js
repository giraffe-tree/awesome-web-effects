import { canvasDemo, TAU, seeded } from './expansion-b-utils.js';

const crystals = Array.from({ length: 120 }, (_, index) => ({ x: 126 + seeded(index, 1) * 185, y: 20 + seeded(index, 2) * 142, a: seeded(index, 3) * TAU, size: 3 + seeded(index, 4) * 10 }));
canvasDemo({
  id: 'cursor-heatmap-crystallization',
  draw(context, time, state) {
    const source = state.pointer ?? { x: 222 + Math.cos(time * 1.6) * 54, y: 90 + Math.sin(time * 2.1) * 37 };
    context.fillStyle = '#060817'; context.fillRect(0, 0, 320, 180);
    const glow = context.createRadialGradient(source.x, source.y, 0, source.x, source.y, 74); glow.addColorStop(0, '#ff388899'); glow.addColorStop(.45, '#7f45ff44'); glow.addColorStop(1, '#06081700'); context.fillStyle = glow; context.fillRect(118, 10, 202, 160);
    crystals.forEach((crystal, index) => {
      const distance = Math.hypot(crystal.x - source.x, crystal.y - source.y), heat = Math.max(0, 1 - distance / 92);
      context.save(); context.translate(crystal.x, crystal.y); context.rotate(crystal.a + heat * time); context.beginPath();
      for (let side = 0; side < 3; side += 1) { const angle = side / 3 * TAU; const radius = crystal.size * (.35 + heat); side ? context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius) : context.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius); }
      context.closePath(); context.fillStyle = `hsla(${286 + heat * 65},90%,${48 + heat * 30}%,${.12 + heat * .8})`; context.fill(); context.restore();
    });
  },
  assert: () => crystals.length === 120
});
