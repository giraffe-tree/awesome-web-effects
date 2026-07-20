import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp, cosineLoop, loopPhase, pointerUnit } from './batch-c-utils.js';

try {
  const host = document.querySelector('#assembly-host');
  const slider = document.querySelector('#assembly-range');
  const readout = document.querySelector('#assembly-readout');
  let previewTime = 0;
  let forcedProgress = null;
  let orbit = { yaw: -.38, pitch: -.2 };
  let drag = null;
  let drawCount = 0;
  let lastRealtimeDraw = -Infinity;
  let sketch;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  const setProgress = value => {
    forcedProgress = clamp(value);
    slider.value = String(Math.round(forcedProgress * 100));
  };
  slider.addEventListener('input', () => setProgress(Number(slider.value) / 100));
  slider.addEventListener('dblclick', () => { forcedProgress = null; });
  host.addEventListener('pointerdown', event => {
    host.setPointerCapture(event.pointerId);
    drag = { ...pointerUnit(event, host), origin: { ...orbit } };
  });
  host.addEventListener('pointermove', event => {
    if (!drag) return;
    const point = pointerUnit(event, host);
    orbit.yaw = drag.origin.yaw + (point.x - drag.x) * 2.4;
    orbit.pitch = clamp(drag.origin.pitch + (point.y - drag.y) * 1.6, -.8, .55);
  });
  host.addEventListener('pointerup', () => { drag = null; });
  host.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') setProgress(0);
    else setProgress((forcedProgress ?? cosineLoop(previewTime)) + (event.key === 'ArrowRight' ? .08 : -.08));
  });

  sketch = new p5(p => {
    const parts = [
      { axis: [-1, 0, 0], distance: 76, color: '#67e3c0', draw: () => p.cylinder(32, 16, 36, 1) },
      { axis: [1, 0, 0], distance: 76, color: '#b8fff0', draw: () => p.cylinder(28, 14, 36, 1) },
      { axis: [0, -1, 0], distance: 56, color: '#ffb75e', draw: () => p.box(56, 13, 42) },
      { axis: [0, 1, 0], distance: 54, color: '#ff735f', draw: () => p.box(28, 18, 33) },
      { axis: [0, 0, 1], distance: 66, color: '#8096ff', draw: () => p.cylinder(19, 18, 28, 1) },
      { axis: [0, 0, -1], distance: 58, color: '#d6c7ff', draw: () => p.box(46, 38, 12, 3) }
    ];

    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(innerWidth, innerHeight, p.WEBGL).parent(host);
      p.noLoop();
      resolveReady();
    };

    p.draw = () => {
      drawCount += 1;
      const progress = forcedProgress ?? cosineLoop(previewTime);
      const phase = loopPhase(previewTime);
      p.background('#071011');
      p.perspective(Math.PI / 3.2, p.width / p.height, 10, 900);
      p.camera(0, 0, 235, 0, 0, 0, 0, 1, 0);
      p.ambientLight(38, 51, 50);
      p.directionalLight(180, 255, 229, -.5, .2, -1);
      p.pointLight(255, 121, 86, 100, -100, 120);
      p.rotateX(orbit.pitch + Math.sin(phase) * .035);
      p.rotateY(orbit.yaw + Math.sin(phase) * .13);
      p.noStroke();

      p.push();
      p.ambientMaterial('#102c29');
      p.box(58, 48, 52, 4);
      p.emissiveMaterial('#54cfad');
      p.box(25, 22, 58, 3);
      p.pop();

      for (const part of parts) {
        p.push();
        p.translate(
          part.axis[0] * part.distance * progress,
          part.axis[1] * part.distance * progress,
          part.axis[2] * part.distance * progress
        );
        if (part.axis[0]) p.rotateZ(Math.PI / 2);
        if (part.axis[2]) p.rotateX(Math.PI / 2);
        p.ambientMaterial(part.color);
        part.draw();
        p.pop();
      }
      readout.textContent = `${String(Math.round(progress * 100)).padStart(2, '0')}%`;
      if (forcedProgress === null) slider.value = String(Math.round(progress * 100));
    };
  }, host);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    sketch instanceof p5 &&
    drawCount > 0 &&
    slider instanceof HTMLInputElement &&
    Boolean(host.querySelector('canvas')?.getContext('webgl2') || host.querySelector('canvas')?.getContext('webgl'))
  );
  installPreviewController({
    id: 'slider-controlled-exploded-3d-assembly',
    library: 'p5@2.3.0',
    renderer: 'webgl',
    render: (time, manual) => {
      if (!manual && time - lastRealtimeDraw < 1 / 20) return;
      previewTime = time;
      lastRealtimeDraw = time;
      sketch.redraw();
    },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
