import mojs from '@mojs/core';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const field = document.querySelector('#burst-field');
  const phaseLabel = document.querySelector('#burst-phase');
  const meterFill = document.querySelector('#energy-meter-fill');
  const palette = ['#75f4d4', '#ffbd5b', '#ff5d8f', '#8c7dff'];

  const shardBurst = new mojs.Burst({
    parent: field,
    left: '50%',
    top: '50%',
    count: 12,
    degree: 360,
    angle: 15,
    radius: { 18: 82 },
    duration: 920,
    easing: 'cubic.out',
    children: {
      shape: 'rect',
      fill: palette,
      radius: { 6: 0 },
      radiusX: 2,
      scale: { 1: .35 },
      rotate: { 0: 180 },
      duration: 920,
      easing: 'quad.out'
    }
  });

  const sparkBurst = new mojs.Burst({
    parent: field,
    left: '50%',
    top: '50%',
    count: 8,
    degree: 360,
    angle: 37.5,
    radius: { 6: 59 },
    duration: 740,
    delay: 90,
    easing: 'expo.out',
    children: {
      shape: 'line',
      stroke: ['#ffffff', '#75f4d4', '#ffbd5b', '#ff5d8f'],
      strokeWidth: { 3: 0 },
      radius: 9,
      scaleX: { .7: 1.35 },
      duration: 650,
      easing: 'quad.out'
    }
  });

  const shockwave = new mojs.Shape({
    parent: field,
    left: '50%',
    top: '50%',
    shape: 'circle',
    fill: 'none',
    stroke: '#8c7dff',
    strokeWidth: { 7: 0 },
    radius: { 4: 62 },
    opacity: { 1: 0 },
    duration: 820,
    easing: 'cubic.out'
  });

  const core = new mojs.Shape({
    parent: field,
    left: '50%',
    top: '50%',
    shape: 'polygon',
    points: 6,
    fill: { '#ffffff': '#ffbd5b' },
    radius: { 3: 15 },
    scale: { .4: 1 },
    rotate: { 0: 90 },
    opacity: { 1: 0 },
    duration: 620,
    easing: 'elastic.out'
  });

  const composition = new mojs.Timeline().add(shardBurst, sparkBurst, shockwave, core);
  composition.stop();

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    mojs.revision === '1.7.1'
    && shardBurst instanceof mojs.Burst
    && sparkBurst instanceof mojs.Burst
    && composition instanceof mojs.Timeline
    && composition._timelines.includes(shardBurst.timeline)
    && field.querySelectorAll('svg').length >= 4
  );

  const render = time => {
    const progress = (time % 1.5) / 1.5;
    composition.setProgress(progress);
    meterFill.style.transform = `scaleX(${Math.sin(progress * Math.PI)})`;
    phaseLabel.textContent = progress < .18 ? 'Charge' : progress < .58 ? 'Release' : 'Dissipate';
  };

  installPreviewController({
    id: 'motion-graphics-burst',
    library: '@mojs/core@1.7.1',
    renderer: 'dom',
    render,
    ready: Promise.resolve()
  });
} catch (error) {
  markPreviewFailure(error);
}
