import { domDemo, wave } from './expansion-b-utils.js';

const paper = document.querySelector('#paper'), fold = document.querySelector('#fold');
domDemo({
  id: 'peelable-paper-corner-reveal',
  render(time, state) {
    const progress = state.pointer ? Math.max(state.pointer.x, state.pointer.y) : wave(time);
    const size = 12 + progress * 78;
    paper.style.setProperty('--peel', `${100 - progress * 68}%`);
    paper.style.setProperty('--fold', `${100 - progress * 68}%`);
    fold.style.setProperty('--size', `${size}px`);
  },
  assert: () => parseFloat(fold.style.getPropertyValue('--size')) > 20
});
