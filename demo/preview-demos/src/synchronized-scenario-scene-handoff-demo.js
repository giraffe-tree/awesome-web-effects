import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const sceneA = document.querySelector('#scene-a');
  const sceneB = document.querySelector('#scene-b');
  const overlay = document.querySelector('#handoff-overlay');
  const copy = document.querySelector('#handoff-copy');
  const label = document.querySelector('#scenario-label');
  const kicker = document.querySelector('#scenario-kicker');
  const title = document.querySelector('#scenario-title');

  const animations = [
    animate(sceneA, { opacity: [1, 0], scale: [1, 1.08] }, { duration: 1, ease: [.22, .7, .2, 1] }),
    animate(sceneB, { opacity: [0, 1], scale: [1.08, 1] }, { duration: 1, ease: [.22, .7, .2, 1] }),
    animate(overlay, { opacity: [.58, 1, .72] }, { duration: 1, times: [0, .45, 1] }),
    animate(copy, { x: [0, -28, 0], opacity: [1, 0, 1] }, { duration: 1, times: [0, .46, .62], ease: 'easeInOut' }),
    animate(label, { rotateX: [0, -88, 18, 0], y: [0, 8, -3, 0], scale: [1, .86, 1.06, 1] }, { duration: 1, times: [0, .43, .72, 1], ease: 'easeInOut' })
  ];
  animations.forEach(animation => animation.pause());
  const duration = animations[0].duration;

  const seek = progress => {
    const clamped = Math.max(0, Math.min(1, progress));
    animations.forEach(animation => { animation.time = clamped * duration; });
    const second = clamped >= .55;
    kicker.textContent = second ? '02 · booking' : '01 · support';
    title.textContent = second ? 'Move with confidence.' : 'Answer with empathy.';
    label.textContent = second ? 'Booking' : 'Support';
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    seek(.7);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const changed = sceneB.style.transform !== '' && label.style.transform !== '';
    seek(0);
    return changed
      && animations.every(animation => typeof animation.pause === 'function' && typeof animation.play === 'function');
  };

  installPreviewController({
    id: 'synchronized-scenario-scene-handoff',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: time => {
      const cycle = (time % 3) / 3;
      const progress = cycle < .42 ? cycle / .42 : cycle < .57 ? 1 : cycle < .95 ? 1 - ((cycle - .57) / .38) : 0;
      seek(progress);
    },
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
