import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const viewport = document.querySelector('#contrast-viewport');
  const track = document.querySelector('#contrast-track');
  const navigation = document.querySelector('#fixed-nav');
  const brand = document.querySelector('#nav-brand');
  const meter = document.querySelector('#contrast-meter');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const trackAnimation = animate(track, { y: [0, -180] }, { duration: 1, ease: 'linear' });
  trackAnimation.pause();

  let interactionOffset = 0;
  let interactionTarget = null;
  let lastProgress = 0;
  const clamp = value => Math.max(0, Math.min(1, value));
  const smoothstep = value => {
    const progress = clamp(value);
    return progress * progress * (3 - 2 * progress);
  };
  const seek = (animation, progress) => { animation.time = animation.duration * clamp(progress); };

  const adjust = delta => {
    interactionTarget = null;
    interactionOffset = Math.max(-.8, Math.min(.8, interactionOffset + delta));
  };
  viewport.addEventListener('wheel', event => {
    event.preventDefault();
    adjust(event.deltaY * .0012);
  }, { passive: false });
  viewport.addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    adjust(event.key === 'ArrowDown' ? .16 : -.16);
  });
  brand.addEventListener('click', () => {
    interactionTarget = lastProgress < .5 ? 1 : 0;
    interactionOffset = 0;
  });

  function applyProgress(progress) {
    const sceneProgress = reducedMotion.matches ? Math.round(progress) : clamp(progress);
    const contrastProgress = smoothstep((sceneProgress - .48) / .23);
    seek(trackAnimation, sceneProgress);
    meter.style.setProperty('--contrast-progress', contrastProgress.toFixed(4));
    lastProgress = sceneProgress;
  }

  window.__PREVIEW_STATE__ = () => ({
    trackDuration: trackAnimation.duration,
    trackTime: trackAnimation.time,
    transform: track.style.transform,
    blendMode: getComputedStyle(navigation).mixBlendMode
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => typeof trackAnimation.play === 'function'
    && typeof trackAnimation.pause === 'function'
    && getComputedStyle(navigation).mixBlendMode === 'difference';

  installPreviewController({
    id: 'self-inverting-fixed-navigation',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: time => {
      const loop = .5 - .5 * Math.cos((((Number(time) || 0) % 3) / 3) * Math.PI * 2);
      const progress = interactionTarget === null ? clamp(loop + interactionOffset) : interactionTarget;
      applyProgress(progress);
    },
    ready: document.fonts.ready
  });
} catch (error) {
  markPreviewFailure(error);
}
