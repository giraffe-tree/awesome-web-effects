import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { loopPhase, pointerUnit } from './batch-c-utils.js';

try {
  const host = document.querySelector('#ribbon-host');
  const indexOutput = document.querySelector('#ribbon-index');
  let time = 0;
  let offset = 0;
  let velocity = 0;
  let drag = null;
  let draws = 0;
  let lastRealtime = -Infinity;
  let sketch;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  const colors = ['#ff6a55', '#ffd364', '#6fe4be', '#6986ff', '#d780ff', '#ff8aa7', '#7ad9ff'];

  host.addEventListener('wheel', event => {
    velocity += Math.sign(event.deltaY) * .18;
    event.preventDefault();
  }, { passive: false });
  host.addEventListener('pointerdown', event => {
    drag = pointerUnit(event, host).x;
    host.setPointerCapture(event.pointerId);
  });
  host.addEventListener('pointermove', event => {
    if (drag === null) return;
    const x = pointerUnit(event, host).x;
    velocity += (x - drag) * 2.2;
    drag = x;
  });
  host.addEventListener('pointerup', () => { drag = null; });
  host.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    velocity += event.key === 'ArrowRight' ? .28 : -.28;
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
      offset += velocity || Math.sin(loopPhase(time)) * .004;
      velocity *= .9;
      p.background('#0a0c10');
      p.camera(0, 0, 360, 0, 0, 0, 0, 1, 0);
      p.ambientLight(72);
      p.directionalLight(245, 246, 255, -.25, .35, -1);
      p.translate(34, 7, 0);
      const cards = colors.map((color, index) => {
        const angle = (index - 3) * .4 + offset;
        return {
          index,
          angle,
          depth: Math.cos(angle),
          x: Math.sin(angle) * 72,
          color
        };
      });
      cards.sort((a, b) => a.depth - b.depth).forEach(card => {
        const active = Math.abs(card.angle % (Math.PI * 2)) < .28;
        p.push();
        p.translate(card.x, Math.abs(Math.sin(card.angle)) * 4, card.depth * 38);
        p.rotateY(-card.angle * .82);
        p.stroke('#11131b');
        p.strokeWeight(1);
        if (active) p.emissiveMaterial(card.color);
        else p.ambientMaterial(card.color);
        p.box(active ? 31 : 28, active ? 48 : 44, 3, 3);
        p.noStroke();
        p.translate(0, -4, 2.2);
        p.ambientMaterial(active ? '#fff3c8' : '#171a26');
        p.box(active ? 20 : 18, active ? 26 : 24, 1);
        p.translate(0, 18, .2);
        p.ambientMaterial('#f7f0df');
        p.box(active ? 20 : 18, 2, 1);
        p.pop();
      });
      const active = cards.reduce((best, card) => card.depth > best.depth ? card : best, cards[0]);
      indexOutput.textContent = `FRAME ${String(active.index + 1).padStart(2, '0')}`;
    };
  }, host);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    sketch instanceof p5 &&
    colors.length === 7 &&
    draws > 0 &&
    Boolean(host.querySelector('canvas')?.getContext('webgl2') || host.querySelector('canvas')?.getContext('webgl'))
  );
  installPreviewController({
    id: 'bending-webgl-gallery-ribbon',
    library: 'p5@2.3.0',
    renderer: 'webgl',
    render: (nextTime, manual) => {
      if (!manual && nextTime - lastRealtime < 1 / 18) return;
      lastRealtime = nextTime;
      time = nextTime;
      if (manual) offset = Math.sin(loopPhase(nextTime)) * .82;
      sketch.redraw();
    },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
