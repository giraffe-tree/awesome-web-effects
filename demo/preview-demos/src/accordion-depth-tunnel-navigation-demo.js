import { domDemo, wave } from './expansion-b-utils.js';

const panels = [...document.querySelectorAll('.panel')];
domDemo({
  id: 'accordion-depth-tunnel-navigation',
  render(time, state) {
    const progress = state.pointer?.x ?? wave(time);
    panels.forEach((panel, index) => {
      const open = Math.max(0, Math.min(1, progress * 4 - index * .55));
      panel.style.transform = `translateZ(${-index * 34}px) translateX(${index * 9}px) rotateY(${-open * (index ? 64 : 14)}deg)`;
      panel.style.filter = `brightness(${1 - index * .09 + open * .12})`;
      panel.style.zIndex = String(10 - index);
    });
  },
  assert: () => panels.length === 4 && panels.every(panel => panel.style.transform.includes('rotateY'))
});
