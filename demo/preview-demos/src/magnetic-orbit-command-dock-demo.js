import { domDemo, TAU, wave } from './expansion-b-utils.js';

const tools = [...document.querySelectorAll('.tool')];
domDemo({
  id: 'magnetic-orbit-command-dock',
  render(time, state) {
    const pulse = wave(time), pointer = state.pointer ?? { x: .72 + Math.cos(time * 1.4) * .08, y: .5 + Math.sin(time * 1.4) * .14 };
    tools.forEach((tool, index) => {
      const angle = index / tools.length * TAU + time * .38;
      const orbitX = 62 + Math.cos(angle) * (62 - pulse * 9), orbitY = 34 + Math.sin(angle) * (35 - pulse * 6);
      const targetX = pointer.x * 150 - 12, targetY = pointer.y * 92 - 12, pull = .16 + pulse * .24;
      tool.style.transform = `translate(${orbitX * (1 - pull) + targetX * pull}px,${orbitY * (1 - pull) + targetY * pull}px) rotate(${angle}rad) scale(${.9 + pulse * .18})`;
    });
  },
  assert: () => tools.length === 5 && tools.every(tool => tool.style.transform.includes('translate'))
});
