import { domDemo, wave } from './expansion-b-utils.js';

const stencil = document.querySelector('#stencil'), scan = document.querySelector('#scan');
domDemo({
  id: 'stencil-text-scanline-window',
  render(time, state) {
    const progress = state.pointer?.x ?? wave(time);
    stencil.style.setProperty('--cut', `${(1 - progress) * 100}%`);
    scan.style.setProperty('--x', `${progress * 265}px`);
    stencil.style.filter = `hue-rotate(${progress * 120}deg)`;
  },
  assert: () => stencil.style.getPropertyValue('--cut').endsWith('%') && scan.style.getPropertyValue('--x').endsWith('px')
});
