import Vivus from 'vivus';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const drawing = new Vivus('line-art', {
    type: 'oneByOne',
    duration: 160,
    start: 'manual',
    forceRender: true,
    animTimingFunction: Vivus.EASE
  });
  window.__PREVIEW_RUNTIME_ASSERT__ = () => drawing instanceof Vivus && drawing.map.length >= 5;

  const render = time => {
    const cycle = (time % 4) / 4;
    const progress = cycle < .65 ? cycle / .65 : 1 - (cycle - .65) / .35;
    drawing.setFrameProgress(Math.max(0, Math.min(1, progress)));
  };

  installPreviewController({
    id: 'svg-stroke-drawing',
    library: 'vivus@0.4.6',
    renderer: 'svg',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
