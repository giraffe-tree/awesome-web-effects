import { domDemo } from './expansion-b-utils.js';

const flaps = [...document.querySelectorAll('.flap')];
domDemo({
  id: 'spring-loaded-split-flap-counter', motionTarget: () => document.querySelector('#counter'),
  render(time) {
    const raw = Math.floor((((time % 3) + 3) % 3) / 3 * 188), digits = String(raw).padStart(3, '0').split('');
    flaps.forEach((flap, index) => { const phase = ((time * 4 - index * .18) % 1 + 1) % 1; flap.textContent = digits[index]; flap.style.transform = `rotateX(${Math.sin(phase * Math.PI) * -18}deg) translateY(${Math.sin(phase * Math.PI) * -3}px)`; flap.style.filter = `brightness(${.72 + phase * .35})`; });
  },
  assert: ({ state }) => flaps.length === 3 && state.motion.duration === 3 && flaps.every(flap => /^\d$/.test(flap.textContent))
});
