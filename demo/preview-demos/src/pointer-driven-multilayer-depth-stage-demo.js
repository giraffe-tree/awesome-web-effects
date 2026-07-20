import { animate } from 'motion';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp, loopTime } from './batch-b-utils.js';

try {
  const stage = document.querySelector('#depth-stage');
  const layers = [...document.querySelectorAll('.depth-layer')];
  const figure = document.querySelector('.depth-figure');
  const readout = document.querySelector('#depth-readout');
  const depths = [0.18, 0.52, 1];
  const keyframeTimes = [0, 0.33, 0.66, 0.9, 1];
  const layerTracks = [
    { x: [-8, 13, -11, 9, -8], y: [4, -7, 6, -5, 4], scale: [1.04, 1.1, 1.05, 1.09, 1.04] },
    { x: [-22, 34, -29, 25, -22], y: [9, -13, 10, -10, 9], scale: [1.06, 1.15, 1.08, 1.14, 1.06] },
    { x: [-46, 62, -58, 40, -46], y: [16, -17, 13, -14, 16], scale: [1.08, 1.22, 1.1, 1.18, 1.08] },
  ];
  const motions = layers.map((layer, index) => {
    const control = animate(layer, layerTracks[index], {
      duration: 3,
      ease: 'linear',
      times: keyframeTimes,
    });
    control.pause();
    return control;
  });
  const figureMotion = animate(
    figure,
    {
      x: [-34, 48, -42, 32, -34],
      y: [11, -12, 9, -10, 11],
      scale: [0.92, 1.14, 0.96, 1.1, 0.92],
    },
    { duration: 3, ease: 'linear', times: keyframeTimes },
  );
  figureMotion.pause();

  let pointer = null;
  stage.addEventListener('pointermove', (event) => {
    const bounds = stage.getBoundingClientRect();
    pointer = {
      x: clamp((event.clientX - bounds.left) / bounds.width),
      y: clamp((event.clientY - bounds.top) / bounds.height),
    };
  });
  stage.addEventListener('keydown', (event) => {
    const movement = {
      ArrowLeft: [-0.08, 0],
      ArrowRight: [0.08, 0],
      ArrowUp: [0, -0.08],
      ArrowDown: [0, 0.08],
    }[event.key];
    if (!movement) return;
    event.preventDefault();
    pointer ??= { x: 0.5, y: 0.5 };
    pointer = {
      x: clamp(pointer.x + movement[0]),
      y: clamp(pointer.y + movement[1]),
    };
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () =>
    motions.length === 3 &&
    [...motions, figureMotion].every(
      (control) => typeof control.pause === 'function' && control.duration === 3,
    );

  installPreviewController({
    id: 'pointer-driven-multilayer-depth-stage',
    library: 'motion@12.42.2',
    renderer: 'dom',
    render: (time) => {
      const phase = loopTime(time) / 3;
      const automaticPointer = {
        x: clamp(0.5 + Math.sin(phase * Math.PI * 2 - 0.65) * 0.43),
        y: clamp(0.5 + Math.cos(phase * Math.PI * 2 + 0.35) * 0.36),
      };
      const activePointer = pointer ?? automaticPointer;
      const timelineTime = pointer ? activePointer.x * 3 : loopTime(time);
      motions.forEach((control) => {
        control.time = timelineTime;
      });
      figureMotion.time = timelineTime;
      layers.forEach((layer, index) => {
        const depth = depths[index];
        const blur = index === 0 ? 0.45 : index === 1 ? 0.15 : 0;
        layer.style.filter = `brightness(${1.12 - activePointer.y * depth * 0.24}) saturate(${0.9 + depth * 0.24}) blur(${blur}px)`;
      });
      readout.textContent = `X ${activePointer.x.toFixed(2)} / Y ${activePointer.y.toFixed(2)}`;
    },
    ready: document.fonts.ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
