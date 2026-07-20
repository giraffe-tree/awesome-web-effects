import { domDemo, wave } from './expansion-b-utils.js';

const blocks = [...document.querySelectorAll('.block')], progressLabel = document.querySelector('#blueprint-progress');
const destinations = [[0, 42], [47, 15], [92, 42], [47, 69], [94, 94]];
domDemo({
  id: 'scroll-stitched-isometric-blueprint', motionTarget: () => document.querySelector('#iso'),
  render(time, state) {
    const progress = state.pointer?.y ?? wave(time);
    blocks.forEach((block, index) => { const local = Math.max(0, Math.min(1, progress * 1.7 - index * .14)); block.style.setProperty('--x', `${destinations[index][0] * local}px`); block.style.setProperty('--y', `${destinations[index][1] * local - (1 - local) * 85}px`); block.style.setProperty('--o', String(.12 + local * .88)); });
    progressLabel.textContent = `ASSEMBLY ${String(Math.round(progress * 100)).padStart(2, '0')}%`;
  },
  assert: ({ state }) => blocks.length === 5 && state.motion.duration === 3 && blocks.every(block => block.style.getPropertyValue('--x').endsWith('px'))
});
