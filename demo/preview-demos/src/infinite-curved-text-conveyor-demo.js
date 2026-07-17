import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const upperTexts = [...document.querySelectorAll('.flow-text--upper')];
  const lowerTexts = [...document.querySelectorAll('.flow-text--lower')];
  const upperRail = document.querySelector('#upper-rail');
  const lowerRail = document.querySelector('#lower-rail');
  const upperCopy = document.querySelector('#upper-copy');
  const control = document.querySelector('#curve-control');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const upperRailMotion = animate(upperRail, {
    opacity: [.24, .72, .24],
    strokeDashoffset: [0, -24, -48]
  }, { duration: 3, ease: 'linear' });
  const lowerRailMotion = animate(lowerRail, {
    opacity: [.64, .28, .64],
    strokeDashoffset: [0, 28, 56]
  }, { duration: 3, ease: 'linear' });
  const copyMotion = animate(upperCopy, {
    opacity: [.8, 1, .8],
    y: [0, -2, 0]
  }, { duration: 3, ease: 'linear' });
  [upperRailMotion, lowerRailMotion, copyMotion].forEach(motion => motion.pause());

  const bases = [-96, 4, 104];
  let reversed = false;
  let latestTime = 0;

  const seekMotions = time => {
    upperRailMotion.time = time;
    lowerRailMotion.time = time;
    copyMotion.time = time;
  };

  const setOffsets = (elements, progress, direction) => {
    elements.forEach((element, index) => {
      element.setAttribute('startOffset', `${bases[index] + (progress * 100 * direction)}%`);
    });
  };

  const render = time => {
    const cycle = reducedMotion.matches ? 1.5 : time % 3;
    latestTime = time;
    seekMotions(cycle);
    const progress = cycle / 3;
    const direction = reversed ? -1 : 1;
    setOffsets(upperTexts, progress, direction);
    setOffsets(lowerTexts, 1 - progress, direction);
  };

  control.addEventListener('click', () => {
    if (reducedMotion.matches) return;
    reversed = !reversed;
    control.setAttribute('aria-pressed', String(reversed));
    control.textContent = reversed ? 'Forward flow' : 'Reverse flow';
    render(latestTime);
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => [upperRailMotion, lowerRailMotion, copyMotion].every(control =>
    typeof control.play === 'function' && typeof control.pause === 'function'
  ) && upperTexts.every(textPath => /%$/.test(textPath.getAttribute('startOffset') || ''));

  installPreviewController({
    id: 'infinite-curved-text-conveyor',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
