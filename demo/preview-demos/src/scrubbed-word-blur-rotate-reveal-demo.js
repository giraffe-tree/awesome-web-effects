import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp, loopTime, smoothstep } from './batch-b-utils.js';

try {
  const stage = document.querySelector('#word-stage');
  const words = [...document.querySelectorAll('.word-line span')];
  const rail = document.querySelector('#word-progress');
  const controls = words.map((word) => {
    const control = animate(
      word,
      {
        opacity: [0.38, 1],
        y: [12, 0],
        rotate: [7, 0],
        filter: ['blur(4px)', 'blur(0px)'],
      },
      { duration: 1, ease: [0.22, 1, 0.36, 1] },
    );
    control.pause();
    return control;
  });
  const railMotion = animate(rail, { scaleX: [0, 1] }, { duration: 1, ease: 'linear' });
  railMotion.pause();

  let offset = 0;
  stage.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault();
      offset = clamp(offset + event.deltaY * 0.0008, -0.22, 0.22);
    },
    { passive: false },
  );
  stage.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    offset = clamp(
      offset + (event.key === 'ArrowRight' ? 0.12 : -0.12),
      -0.22,
      0.22,
    );
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () =>
    controls.length === 5 &&
    [...controls, railMotion].every(
      (control) => typeof control.pause === 'function' && control.duration === 1,
    );

  installPreviewController({
    id: 'scrubbed-word-blur-rotate-reveal',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: (time) => {
      const phase = loopTime(time) / 3;
      const automatic =
        phase < 0.72
          ? 0.18 + 0.82 * smoothstep(phase / 0.72)
          : 1 - 0.82 * smoothstep((phase - 0.72) / 0.28);
      const progress = clamp(automatic + offset);
      controls.forEach((control, index) => {
        control.time = clamp((progress - index * 0.1) / 0.62);
      });
      railMotion.time = progress;
    },
    ready: document.fonts.ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
