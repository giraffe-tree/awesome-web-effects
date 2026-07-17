import KUTE from 'kute.js';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const morphPath = document.querySelector('#morph-path');
  const startPath = 'M144 18 L156 45 L186 45 L162 63 L171 92 L144 76 L117 92 L126 63 L102 45 L132 45 Z';
  const endPath = 'M144 94 C134 85 104 65 104 43 C104 23 128 16 144 34 C160 16 184 23 184 43 C184 65 154 85 144 94 Z';
  const duration = 1500;

  const createTween = () => {
    const tween = KUTE.fromTo(morphPath, { path: startPath }, { path: endPath }, {
      duration,
      easing: 'easingCubicInOut',
      repeat: 1,
      yoyo: true,
      morphPrecision: 4
    });
    tween.start(0);
    tween.pause();
    tween.update(0);
    return tween;
  };
  let tween = createTween();
  let previousCycle = 0;

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    KUTE.Version === '2.2.6'
      && tween instanceof KUTE.Tween
      && tween._duration === duration
      && tween.valuesStart.path.polygon.length === tween.valuesEnd.path.polygon.length
      && tween.valuesEnd.path.original === endPath
  );

  const render = time => {
    const cycle = (time % 3) * 1000;
    if (cycle < previousCycle) tween = createTween();
    tween.update(cycle);
    previousCycle = cycle;
  };

  installPreviewController({
    id: 'compact-svg-shape-tween',
    library: 'kute.js@2.2.6',
    renderer: 'svg',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
