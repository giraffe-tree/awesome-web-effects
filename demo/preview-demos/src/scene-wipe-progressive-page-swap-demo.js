import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp, loopTime, smoothstep } from './batch-b-utils.js';

try {
  const stage = document.querySelector('#wipe-stage');
  const day = document.querySelector('#day-scene');
  const progress = document.querySelector('#wipe-progress');
  const wipe = animate(
    day,
    { clipPath: ['circle(0% at 78% 58%)', 'circle(132% at 78% 58%)'] },
    { duration: 1, ease: 'linear' },
  );
  const rail = animate(progress, { scaleX: [0, 1] }, { duration: 1, ease: 'linear' });
  wipe.pause();
  rail.pause();

  let forced = null;
  const seek = (control, value) => {
    control.time = control.duration * clamp(value);
  };
  const toggle = () => {
    forced = forced === null ? 1 : forced ? 0 : 1;
  };

  stage.addEventListener('click', toggle);
  stage.addEventListener('keydown', (event) => {
    if (!['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    toggle();
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () =>
    [wipe, rail].every(
      (control) => typeof control.pause === 'function' && control.duration === 1,
    ) && CSS.supports('clip-path', 'circle(50%)');

  installPreviewController({
    id: 'scene-wipe-progressive-page-swap',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: (time) => {
      const phase = loopTime(time) / 3;
      const automatic =
        phase < 0.78
          ? smoothstep(phase / 0.78)
          : 1 - smoothstep((phase - 0.78) / 0.22);
      const value = forced ?? automatic;
      seek(wipe, value);
      seek(rail, value);
    },
    ready: document.fonts.ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
