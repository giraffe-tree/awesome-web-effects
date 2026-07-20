import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { loopTime } from './batch-b-utils.js';

try {
  const stage = document.querySelector('#image-menu');
  const menu = document.querySelector('#menu-list');
  const rows = [...menu.querySelectorAll('.menu-row')];
  const rails = rows.map(row => row.querySelector('.row-rail'));
  const images = [...menu.querySelectorAll('img')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const railMotions = rails.map((rail, index) => {
    const control = animate(rail, { x: [index % 2 ? -152 : 0, index % 2 ? 0 : -152] }, {
      duration: 3,
      ease: 'linear'
    });
    control.pause();
    return control;
  });

  let hoverIndex = null;
  let focusIndex = null;
  let selectedIndex = null;
  let latestTime = 0;

  const automaticIndex = phase => phase < .9 ? 0 : phase < 1.8 ? 1 : phase < 2.7 ? 2 : 0;
  const interactionIndex = () => hoverIndex ?? focusIndex ?? selectedIndex;

  function render(time, seeking = false) {
    latestTime = Number(time) || 0;
    const phase = loopTime(latestTime);
    const index = interactionIndex() ?? (reducedMotion.matches ? 0 : automaticIndex(phase));

    stage.dataset.active = String(index);
    stage.classList.toggle('is-seeking', Boolean(seeking));
    rows.forEach((row, rowIndex) => {
      const active = rowIndex === index;
      row.classList.toggle('active', active);
      row.setAttribute('aria-pressed', String(active));
    });
    railMotions.forEach((motion, motionIndex) => {
      motion.time = reducedMotion.matches ? 0 : loopTime(phase + motionIndex * .37);
    });
  }

  rows.forEach((row, index) => {
    row.addEventListener('pointerenter', () => {
      hoverIndex = index;
      render(latestTime);
    });
    row.addEventListener('focus', () => {
      focusIndex = index;
      render(latestTime);
    });
    row.addEventListener('click', () => {
      selectedIndex = index;
      render(latestTime);
    });
  });

  menu.addEventListener('pointerleave', () => {
    hoverIndex = null;
    render(latestTime);
  });
  menu.addEventListener('focusout', event => {
    if (menu.contains(event.relatedTarget)) return;
    focusIndex = null;
    render(latestTime);
  });

  const decodedImages = Promise.all(images.map(image => image.decode()));
  const ready = Promise.all([document.fonts.ready, decodedImages]).catch(error => {
    markPreviewFailure(error);
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () =>
    railMotions.length === 3
    && railMotions.every(control =>
      typeof control.play === 'function' && typeof control.pause === 'function'
    )
    && rows.length === 3
    && images.length === 12
    && images.every(image => image.complete && image.naturalWidth > 0)
    && rails.every(rail => rail.style.transform !== '');

  installPreviewController({
    id: 'hover-activated-image-marquee-menu',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
