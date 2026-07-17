import { animate, stagger } from 'animejs';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const nodes = [...document.querySelectorAll('.choreo-node')];
  const staggerDelay = stagger(72, { from: 'first' });
  const choreography = animate(nodes, {
    x: (_target, index) => 198 + (index % 3) * 7,
    y: (_target, index) => (index % 2 ? -1 : 1) * (17 + (index % 3) * 4),
    rotate: { from: '-110deg', to: '250deg' },
    scale: [
      { to: 1.42, duration: 420 },
      { to: .78, duration: 360 },
      { to: 1, duration: 520 }
    ],
    opacity: { from: .38, to: 1 },
    borderRadius: { from: '6px', to: '50%' },
    delay: staggerDelay,
    duration: 1300,
    ease: 'inOutQuint',
    autoplay: false
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    choreography.targets.length === nodes.length
    && choreography.paused
    && choreography.duration > 1700
    && staggerDelay(nodes[1], 1, nodes) > staggerDelay(nodes[0], 0, nodes)
  );

  const render = time => {
    const cycle = ((time + .3) % 3) / 3;
    const progress = cycle < .5 ? cycle * 2 : (1 - cycle) * 2;
    choreography.seek(progress * choreography.duration, true);
  };

  installPreviewController({
    id: 'staggered-transform-choreography',
    library: 'animejs@4.5.0',
    renderer: 'dom',
    render,
    ready: document.fonts.ready
  });
} catch (error) {
  markPreviewFailure(error);
}
