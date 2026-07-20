import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp, cosineLoop } from './batch-c-utils.js';

try {
  const scroller = document.querySelector('#ink-scroll');
  const line = document.querySelector('#ink-line');
  const meter = document.querySelector('#ink-meter');
  const words = line.textContent.trim().split(/\s+/);
  line.replaceChildren(...words.flatMap((word, index) => {
    const span = document.createElement('span');
    span.className = 'ink-word';
    span.textContent = word;
    return index === words.length - 1 ? [span] : [span, document.createTextNode(' ')];
  }));
  const spans = [...line.querySelectorAll('.ink-word')];
  const controls = spans.map((span, index) => {
    const control = animate(span, {
      color: ['#bdb6a9', index === 5 ? '#bd5b38' : '#25231f'],
      y: [5, 0]
    }, { duration: 1, ease: [.25, .7, .2, 1] });
    control.pause();
    return control;
  });
  let userProgress = null;

  scroller.addEventListener('wheel', event => {
    userProgress = clamp((userProgress ?? scroller.scrollTop / (scroller.scrollHeight - scroller.clientHeight)) + Math.sign(event.deltaY) * .09);
    event.preventDefault();
  }, { passive: false });
  scroller.addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    userProgress = clamp((userProgress ?? 0) + (event.key === 'ArrowDown' ? .08 : -.08));
  });
  scroller.addEventListener('dblclick', () => { userProgress = null; });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    controls.length === words.length &&
    controls.every(control => typeof control.pause === 'function' && control.duration === 1) &&
    getComputedStyle(document.querySelector('.ink-sticky')).position === 'sticky'
  );
  installPreviewController({
    id: 'sticky-paragraph-ink-reveal',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: time => {
      const progress = userProgress ?? cosineLoop(time);
      scroller.scrollTop = progress * (scroller.scrollHeight - scroller.clientHeight);
      controls.forEach((control, index) => { control.time = clamp(progress * spans.length - index); });
      meter.textContent = `INK ${String(Math.round(progress * 100)).padStart(3, '0')}%`;
    },
    ready: document.fonts.ready
  });
} catch (error) {
  markPreviewFailure(error);
}
