import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const trigger = document.querySelector('#products-trigger');
  const menu = document.querySelector('#product-menu');
  const sweep = document.querySelector('#promo-sweep');
  const chip = document.querySelector('#promo-chip');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const menuAnimation = animate(menu, {
    opacity: [0, 1],
    y: [-12, 0],
    scale: [.965, 1]
  }, { duration: .45, ease: [.22, 1, .36, 1] });
  const sweepAnimation = animate(sweep, {
    x: ['-120%', '390%']
  }, { duration: .76, ease: [.2, .72, .3, 1] });
  const chipAnimation = animate(chip, {
    opacity: [0, 1],
    scale: [.72, 1],
    y: [3, 0]
  }, { duration: .3, ease: [.22, 1.4, .36, 1] });
  [menuAnimation, sweepAnimation, chipAnimation].forEach(animation => animation.pause());

  let lastTime = 0;
  let interactionState = null;
  let interactionStartedAt = 0;
  const clamp = value => Math.max(0, Math.min(1, value));
  const seek = (animation, progress) => { animation.time = animation.duration * clamp(progress); };

  function phaseFor(time) {
    if (interactionState === 'closed') return 2.99;
    if (interactionState === 'open') return Math.min(2.2, Math.max(0, time - interactionStartedAt));
    return ((time % 3) + 3) % 3;
  }

  function applyPhase(phase) {
    if (reducedMotion.matches) {
      seek(menuAnimation, 1);
      seek(sweepAnimation, 1);
      seek(chipAnimation, 1);
      trigger.setAttribute('aria-expanded', 'true');
      return;
    }
    const menuProgress = phase < .45 ? phase / .45
      : phase < 2.42 ? 1
        : phase < 2.88 ? 1 - (phase - 2.42) / .46
          : 0;
    const sweepProgress = (phase - .88) / .76;
    const chipProgress = (phase - .72) / .3;
    seek(menuAnimation, menuProgress);
    seek(sweepAnimation, sweepProgress);
    seek(chipAnimation, chipProgress);
    trigger.setAttribute('aria-expanded', String(menuProgress > .45));
  }

  trigger.addEventListener('click', () => {
    interactionState = interactionState === 'open' ? 'closed' : 'open';
    interactionStartedAt = lastTime;
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    interactionState = 'closed';
    trigger.focus();
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => [menuAnimation, sweepAnimation, chipAnimation].every(animation => (
    typeof animation.play === 'function' && typeof animation.pause === 'function'
  )) && sweep.style.transform !== '';

  installPreviewController({
    id: 'delayed-dropdown-promo-sweep',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: time => {
      lastTime = Number(time) || 0;
      applyPhase(phaseFor(lastTime));
    },
    ready: document.fonts.ready
  });
} catch (error) {
  markPreviewFailure(error);
}
