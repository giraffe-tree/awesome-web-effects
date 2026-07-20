import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp, loopPhase, loopTime, pointerUnit } from './batch-c-utils.js';

try {
  const host = document.querySelector('#dome-host');
  const focus = document.querySelector('#dome-focus');
  let time = 0;
  let yaw = 0;
  let pitch = 0;
  let drag = null;
  let selected = -1;
  let draws = 0;
  let lastRealtime = -Infinity;
  let sketch;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  const tiles = Array.from({ length: 18 }, (_, index) => ({
    azimuth: (index % 9) / 9 * Math.PI * 2,
    elevation: .18 + Math.floor(index / 9) * .31,
    color: `hsl(${205 + index * 17} 72% ${48 + index % 3 * 9}%)`
  }));
  const featured = [0, 4, 9, 13];

  host.addEventListener('pointerdown', event => {
    drag = { ...pointerUnit(event, host), yaw, pitch };
    host.setPointerCapture(event.pointerId);
  });
  host.addEventListener('pointermove', event => {
    if (!drag) return;
    const point = pointerUnit(event, host);
    yaw = drag.yaw + (point.x - drag.x) * 3;
    pitch = clamp(drag.pitch + (point.y - drag.y) * 1.4, -.38, .38);
  });
  host.addEventListener('pointerup', event => {
    if (!drag) return;
    const point = pointerUnit(event, host);
    if (Math.hypot(point.x - drag.x, point.y - drag.y) < .025) selected = (selected + 1) % tiles.length;
    drag = null;
  });
  host.addEventListener('keydown', event => {
    if (event.key === 'Escape') selected = -1;
  });

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(innerWidth, innerHeight, p.WEBGL).parent(host);
      p.noLoop();
      resolveReady();
    };
    p.draw = () => {
      draws += 1;
      const auto = loopPhase(time) * .2;
      const activeIndex = selected >= 0 ? selected : featured[Math.floor(loopTime(time) / .75) % featured.length];
      p.background('#040811');
      p.camera(0, 0, 350, 0, 0, 0, 0, 1, 0);
      p.ambientLight(68);
      p.pointLight(135, 202, 255, 30, -45, 135);
      p.translate(34, 18, 0);
      p.rotateX(-.05 + pitch * .45);
      p.rotateY(yaw + auto);
      p.noFill();
      p.stroke(80, 142, 190, 52);
      p.strokeWeight(1);
      p.push();
      p.rotateX(Math.PI / 2);
      p.torus(58, .45, 40, 4);
      p.pop();
      p.push();
      p.translate(0, -22, 0);
      p.rotateX(Math.PI / 2);
      p.torus(45, .4, 40, 4);
      p.pop();
      tiles.forEach((tile, index) => {
        const radius = 68;
        const x = Math.sin(tile.azimuth) * Math.cos(tile.elevation) * radius;
        const y = -Math.sin(tile.elevation) * 46;
        const z = Math.cos(tile.azimuth) * Math.cos(tile.elevation) * 42;
        const active = index === activeIndex;
        p.push();
        p.translate(x, y, z);
        p.rotateY(tile.azimuth);
        p.rotateX(-tile.elevation * .4);
        p.stroke(active ? '#fff0a4' : '#1a273d');
        p.strokeWeight(active ? 1.5 : .7);
        if (active) p.emissiveMaterial(tile.color);
        else p.ambientMaterial(tile.color);
        p.box(active ? 31 : 22, active ? 23 : 16, 2, 2);
        p.noStroke();
        p.translate(0, 0, 1.5);
        p.ambientMaterial(active ? '#fff5ca' : '#142033');
        p.box(active ? 18 : 12, active ? 10 : 7, 1);
        p.pop();
      });
      focus.textContent = `TILE ${String(activeIndex + 1).padStart(2, '0')}`;
    };
  }, host);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    sketch instanceof p5 &&
    tiles.length === 18 &&
    featured.length === 4 &&
    draws > 0 &&
    Boolean(host.querySelector('canvas')?.getContext('webgl2') || host.querySelector('canvas')?.getContext('webgl'))
  );
  installPreviewController({
    id: 'draggable-dome-gallery',
    library: 'p5@2.3.0',
    renderer: 'webgl',
    render: (nextTime, manual) => {
      if (!manual && nextTime - lastRealtime < 1 / 18) return;
      lastRealtime = nextTime;
      time = nextTime;
      sketch.redraw();
    },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
