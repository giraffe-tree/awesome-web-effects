import { domDemo, wave } from './expansion-b-utils.js';

const lens = document.querySelector('#lens');
domDemo({
  id: 'liquid-lens-card-refraction',
  render(time, state) {
    const x = state.pointer ? state.pointer.x * 96 : 38 + Math.cos(time * 1.6) * 30;
    const y = state.pointer ? state.pointer.y * 40 : 20 + Math.sin(time * 2) * 15;
    lens.style.setProperty('--x', `${x}px`); lens.style.setProperty('--y', `${y}px`); lens.style.setProperty('--s', String(.9 + wave(time) * .18));
    lens.style.borderRadius = `${43 + Math.sin(time * 2.4) * 12}% ${57 - Math.sin(time * 2.4) * 12}% ${48 + Math.cos(time * 1.7) * 10}% ${52 - Math.cos(time * 1.7) * 10}%`;
  },
  assert: () => lens.style.getPropertyValue('--x').endsWith('px') && lens.style.borderRadius.includes('%')
});
