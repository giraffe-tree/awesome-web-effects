import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const card = document.querySelector('#shared-card');
  const toggle = document.querySelector('#morph-toggle');
  const layoutState = document.querySelector('#layout-state');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const morph = animate(card, {
    x: 96,
    y: -14,
    width: 202,
    height: 122,
    borderRadius: 28,
    rotate: .001
  }, {
    type: 'spring',
    stiffness: 170,
    damping: 15,
    mass: .9,
    restDelta: .01,
    restSpeed: .01
  });
  morph.pause();

  const duration = morph.duration;
  const setState = progress => {
    const expanded = progress >= .5;
    layoutState.textContent = expanded ? 'expanded' : 'compact';
    toggle.setAttribute('aria-pressed', String(expanded));
  };

  const seek = progress => {
    const clamped = Math.max(0, Math.min(1, progress));
    morph.time = clamped * duration;
    setState(clamped);
  };

  let expanded = false;
  toggle.addEventListener('click', () => {
    if (reducedMotion.matches) return;
    expanded = !expanded;
    morph.speed = expanded ? 1 : -1;
    morph.time = expanded ? 0 : duration;
    setState(expanded ? 1 : 0);
    morph.play();
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    const initialTransform = getComputedStyle(card).transform;
    seek(.58);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const activeTransform = getComputedStyle(card).transform;
    seek(0);
    return duration > .25
      && typeof morph.play === 'function'
      && typeof morph.pause === 'function'
      && initialTransform !== activeTransform;
  };

  const render = time => {
    if (reducedMotion.matches) {
      seek(1);
      return;
    }
    const cycle = time % 3;
    const progress = cycle < 1.15 ? cycle / 1.15
      : cycle < 1.5 ? 1
        : cycle < 2.65 ? 1 - ((cycle - 1.5) / 1.15)
          : 0;
    seek(progress);
  };

  installPreviewController({
    id: 'shared-layout-spring-morph',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
