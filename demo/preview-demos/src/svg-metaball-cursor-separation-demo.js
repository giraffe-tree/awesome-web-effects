import { domDemo, TAU, wave } from './expansion-b-utils.js';

const blobs = [...document.querySelectorAll('.blob')];
domDemo({
  id: 'svg-metaball-cursor-separation', renderer: 'svg', motionTarget: () => document.querySelector('#metaballs'),
  render(time, state) {
    const split = state.pointer?.x ?? wave(time);
    blobs.forEach((blob, index) => {
      const angle = index / blobs.length * TAU + time * .5;
      const radius = 7 + split * (35 + index * 5);
      blob.setAttribute('cx', 225 + Math.cos(angle) * radius);
      blob.setAttribute('cy', 90 + Math.sin(angle) * radius * .72);
    });
  },
  assert: ({ state }) => blobs.length === 4 && state.motion.duration === 3 && blobs.every(blob => blob.hasAttribute('cx'))
});
