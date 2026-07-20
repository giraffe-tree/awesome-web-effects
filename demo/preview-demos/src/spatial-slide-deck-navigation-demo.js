import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp, loopTime } from './batch-b-utils.js';

try {
  const deck = document.querySelector('#deck');
  const slides = [...document.querySelectorAll('.slide')];
  const buttons = [...document.querySelectorAll('.deck-nav button')];

  const motions = slides.map((slide, index) => {
    const control = animate(
      slide,
      {
        x: [index * 18, (index - 1) * 28, (index - 2) * 36, index * 18],
        z: [-index * 42, index === 1 ? 22 : -28, index === 2 ? 26 : -45, -index * 42],
        rotateY: [index * 7, (index - 1) * -8, (index - 2) * -10, index * 7],
        opacity: [1, index === 0 ? 0.28 : 1, index === 2 ? 1 : 0.25, 1],
      },
      { duration: 3, ease: 'linear' },
    );
    control.pause();
    return control;
  });

  let forced = null;
  const select = (index) => {
    forced = index;
  };

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(index));
  });

  deck.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    forced = clamp(
      (forced ?? Math.floor(loopTime(0))) + (event.key === 'ArrowRight' ? 1 : -1),
      0,
      2,
    );
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () =>
    motions.length === 3 &&
    motions.every((control) => control.duration === 3 && typeof control.pause === 'function');

  installPreviewController({
    id: 'spatial-slide-deck-navigation',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: (time) => {
      const phase = forced === null ? loopTime(time) : forced + 0.5;
      motions.forEach((control) => {
        control.time = phase;
      });
      buttons.forEach((button, index) => {
        button.setAttribute('aria-current', String(index === Math.min(2, Math.floor(phase))));
      });
    },
    ready: document.fonts.ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
