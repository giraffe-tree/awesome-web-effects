import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { clamp, loopTime, pointerUnit, seeded } from './batch-c-utils.js';

try {
  const host = document.querySelector('#force-host');
  const energyOutput = document.querySelector('#force-energy');
  let time = 0;
  let pinned = null;
  let dragging = false;
  let draws = 0;
  let lastRealtime = -Infinity;
  let sketch;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  const labels = ['Director', 'Writer', 'Light', 'Sound', 'Motion', 'Type', 'Code', 'Image', 'QA'];
  const links = [[0, 1], [0, 2], [0, 3], [0, 4], [1, 5], [2, 7], [3, 6], [4, 6], [6, 8], [7, 8], [5, 8]];

  function simulate(seconds) {
    const nodes = labels.map((label, index) => ({
      label,
      x: 210 + Math.cos(index * 2.39) * 48 + seeded(index, 2) * 6,
      y: 99 + Math.sin(index * 2.39) * 34 + seeded(index, 4) * 5,
      vx: 0,
      vy: 0
    }));
    const steps = Math.floor(seconds * 44) + 8;
    for (let step = 0; step < steps; step += 1) {
      nodes.forEach((a, index) => {
        for (let j = index + 1; j < nodes.length; j += 1) {
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const squared = dx * dx + dy * dy + 90;
          const force = 28 / squared;
          a.vx -= dx * force;
          a.vy -= dy * force;
          b.vx += dx * force;
          b.vy += dy * force;
        }
        a.vx += (210 - a.x) * .004;
        a.vy += (99 - a.y) * .004;
      });
      links.forEach(([aIndex, bIndex]) => {
        const a = nodes[aIndex];
        const b = nodes[bIndex];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.hypot(dx, dy) || 1;
        const force = (distance - 42) * .008;
        a.vx += dx / distance * force;
        a.vy += dy / distance * force;
        b.vx -= dx / distance * force;
        b.vy -= dy / distance * force;
      });
      nodes.forEach((node, index) => {
        if (index === 0 && pinned) {
          node.x = clamp(pinned.x, 126, 294);
          node.y = clamp(pinned.y, 48, 142);
          node.vx = node.vy = 0;
        } else {
          node.vx *= .82;
          node.vy *= .82;
          node.x = clamp(node.x + node.vx, 126, 294);
          node.y = clamp(node.y + node.vy, 48, 142);
          if (node.x === 126 || node.x === 294) node.vx *= -.35;
          if (node.y === 48 || node.y === 142) node.vy *= -.35;
        }
      });
    }
    return nodes;
  }

  host.addEventListener('pointerdown', event => {
    const point = pointerUnit(event, host);
    pinned = { x: point.x * 320, y: point.y * 180 };
    dragging = true;
    host.setPointerCapture(event.pointerId);
  });
  host.addEventListener('pointermove', event => {
    if (!dragging) return;
    const point = pointerUnit(event, host);
    pinned = { x: point.x * 320, y: point.y * 180 };
  });
  host.addEventListener('pointerup', () => {
    dragging = false;
    pinned = null;
  });

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(innerWidth, innerHeight).parent(host);
      p.textFont('system-ui');
      p.noLoop();
      resolveReady();
    };
    p.draw = () => {
      draws += 1;
      const nodes = simulate(loopTime(time));
      p.background('#081018');
      p.stroke(71, 130, 168, 125);
      p.strokeWeight(1);
      links.forEach(([a, b]) => p.line(nodes[a].x, nodes[a].y, nodes[b].x, nodes[b].y));
      nodes.forEach((node, index) => {
        p.noStroke();
        p.fill(index === 0 ? '#ffbd66' : '#74c8ff');
        p.circle(node.x, node.y, index === 0 ? 16 : 10);
        p.fill('#eaf6ff');
        p.textSize(index === 0 ? 6.5 : 5.2);
        p.textAlign(p.CENTER);
        p.text(node.label, node.x, node.y + (index === 0 ? 16 : 12));
      });
      const energy = nodes.reduce((sum, node) => sum + Math.hypot(node.vx, node.vy), 0);
      energyOutput.textContent = `ENERGY ${energy.toFixed(2)}`;
    };
  }, host);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    sketch instanceof p5 &&
    links.length === 11 &&
    draws > 0 &&
    Boolean(host.querySelector('canvas')?.getContext('2d'))
  );
  installPreviewController({
    id: 'draggable-force-directed-svg-network',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: (nextTime, manual) => {
      if (!manual && nextTime - lastRealtime < 1 / 20) return;
      lastRealtime = nextTime;
      time = nextTime;
      sketch.redraw();
    },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
