import { domDemo, wave } from './expansion-b-utils.js';

const slices = [...document.querySelectorAll('.slice')];
domDemo({
  id: 'gesture-sliced-image-shutters', motionTarget: () => document.querySelector('#shutters'),
  render(time, state) {
    const progress = state.pointer?.x ?? wave(time);
    slices.forEach((slice, index) => {
      const stagger = Math.sin(index * .82 + time * 1.8) * progress;
      slice.style.setProperty('--shift', `${stagger * 38}px`);
      slice.style.setProperty('--skew', `${stagger * -7}deg`);
      slice.style.filter = `saturate(${1 + progress * .7}) brightness(${.82 + (index % 3) * .09})`;
    });
  },
  assert: ({ state }) => slices.length === 8 && state.motion.duration === 3 && slices.every(slice => slice.style.getPropertyValue('--shift').endsWith('px'))
});
