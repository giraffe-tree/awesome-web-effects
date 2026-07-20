import './batch-a-qa.js';
import { animate } from 'motion';import{installPreviewController,markPreviewFailure}from'../shared.js';
try {
  const paper = document.querySelector('#paper');
  const body = document.querySelector('#paper-body');
  const cursor = document.querySelector('#doc-cursor');
  const progressBar = document.querySelector('#doc-progress');
  const lines = [...document.querySelectorAll('.generated-line')];
  let offset = 0;
  let latest = 0;
  const bodyMotion = animate(body, { y: [0, 0, -45, -45, 0] }, { duration: 3, times: [0, .34, .72, .9, 1], ease: 'linear' });
  const cursorMotion = animate(cursor, { y: [0, 18, 42, 74, 0], x: [0, -2, 2, 0, 0] }, { duration: 3, times: [0, .25, .5, .82, 1], ease: 'linear' });
  bodyMotion.pause();
  cursorMotion.pause();

  const render = time => {
    latest = time;
    const t = ((time + offset) % 3 + 3) % 3;
    const progress = t / 3;
    bodyMotion.time = t;
    cursorMotion.time = t;
    lines.forEach((line, index) => {
      const reveal = Math.max(0, Math.min(1, (progress - index * .095) / .13));
      line.style.opacity = String(reveal);
      line.style.clipPath = `inset(0 ${(1 - reveal) * 100}% 0 0)`;
    });
    progressBar.style.setProperty('--p', String(progress));
  };

  paper.addEventListener('wheel', event => {
    event.preventDefault();
    offset = Math.max(-1.2, Math.min(1.2, offset + event.deltaY * .002));
    render(latest);
  }, { passive: false });
  paper.addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    offset += event.key === 'ArrowDown' ? .15 : -.15;
    render(latest);
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await window.__setPreviewTime(0);
    const initialTransform = getComputedStyle(body).transform;
    const initialClip = lines[4].style.clipPath;
    await window.__setPreviewTime(1.8);
    const scrubbedTransform = getComputedStyle(body).transform;
    const scrubbedClip = lines[4].style.clipPath;
    await window.__setPreviewTime(0);
    return lines.length === 7
      && initialTransform !== scrubbedTransform
      && initialClip !== scrubbedClip
      && scrubbedTransform !== 'none';
  };

  installPreviewController({
    id: 'scroll-scrubbed-document-generation-playback',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready: Promise.resolve(),
  });
} catch (error) {
  markPreviewFailure(error);
}
