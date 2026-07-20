import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { cosineLoop, pointerUnit } from './batch-c-utils.js';

try {
  const stage = document.querySelector('#theme-stage');
  const layer = document.querySelector('#theme-layer');
  const button = document.querySelector('#theme-toggle');
  let origin = { x: 84, y: 22 };
  let forced = null;
  let reveal = 0;
  const control = animate(0, 145, {
    duration: 1,
    ease: [.22, .74, .2, 1],
    onUpdate: value => { reveal = value; },
  });
  control.pause();

  const toggle = event => {
    const point = pointerUnit(event, stage);
    origin = { x: point.x * 100, y: point.y * 100 };
    forced = forced === 1 ? 0 : 1;
  };
  button.addEventListener('click', toggle);
  stage.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    forced = forced === 1 ? 0 : 1;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    control.time = 0;
    await new Promise(resolve => requestAnimationFrame(resolve));
    const start = reveal;
    control.time = .5;
    await new Promise(resolve => requestAnimationFrame(resolve));
    const middle = reveal;
    control.time = 0;
    return typeof control.pause === 'function'
      && middle > start
      && CSS.supports('clip-path', 'circle(10% at 50% 50%)');
  };

  installPreviewController({
    id: 'clip-shape-theme-reveal',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: time => {
      const progress = forced ?? cosineLoop(time);
      control.time = progress;
      layer.style.clipPath = `circle(${reveal}% at ${origin.x}% ${origin.y}%)`;
      button.textContent = progress > .5 ? '☾' : '☼';
      button.style.color = progress > .5 ? '#242017' : '#edf6ff';
    },
    ready: document.fonts.ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
