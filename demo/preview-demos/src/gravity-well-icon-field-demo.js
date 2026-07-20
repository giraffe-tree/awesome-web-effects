import { canvasDemo, TAU, seeded } from './expansion-b-utils.js';

const icons = ['✦', '⌁', '↗', '◫', '⌘', '◎', '△', '↻', '＋', '◌', '◇', '×'];
const bodies = Array.from({ length: 26 }, (_, index) => ({ angle: seeded(index, 1) * TAU, radius: 22 + seeded(index, 2) * 82, speed: .15 + seeded(index, 3) * .5, icon: icons[index % icons.length] }));
canvasDemo({
  id: 'gravity-well-icon-field',
  draw(context, time, state) {
    const well = state.pointer ?? { x: 225 + Math.cos(time * 1.2) * 22, y: 90 + Math.sin(time * 1.5) * 18 };
    context.fillStyle = '#f6f1e6'; context.fillRect(0, 0, 320, 180); context.textAlign = 'center'; context.textBaseline = 'middle';
    bodies.forEach((body, index) => { const angle = body.angle + time * body.speed, wobble = Math.sin(time * 2 + index) * 5; const x = well.x + Math.cos(angle) * (body.radius + wobble), y = well.y + Math.sin(angle) * (body.radius + wobble) * .62; context.save(); context.translate(x, y); context.rotate(angle + Math.PI / 2); context.font = `${9 + index % 4}px system-ui`; context.fillStyle = index % 5 ? '#22332d' : '#b74732'; context.fillText(body.icon, 0, 0); context.restore(); });
    context.beginPath(); context.arc(well.x, well.y, 12 + Math.sin(time * 3) * 2, 0, TAU); context.fillStyle = '#17231f'; context.fill(); context.strokeStyle = '#c35b45'; context.lineWidth = 2; context.stroke();
  },
  assert: () => bodies.length === 26
});
