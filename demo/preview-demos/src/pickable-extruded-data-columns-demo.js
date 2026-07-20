import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { loopPhase, loopTime, pointerUnit, seeded } from './batch-c-utils.js';

const inside = (point, polygon) => {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (((a.y > point.y) !== (b.y > point.y)) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) hit = !hit;
  }
  return hit;
};

try {
  const host = document.querySelector('#column-host');
  const tip = document.querySelector('#column-tip');
  let time = 0;
  let pointer = null;
  let keyboardActive = null;
  let lastPolygons = [];
  let draws = 0;
  let lastRealtime = -Infinity;
  let sketch;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  const columns = Array.from({ length: 36 }, (_, index) => ({
    row: Math.floor(index / 6),
    col: index % 6,
    value: 22 + Math.round(seeded(index, 7) * 72),
    name: `NODE ${String(index + 1).padStart(2, '0')}`
  }));
  const featured = [5, 14, 22, 31];

  host.addEventListener('pointermove', event => { pointer = pointerUnit(event, host); });
  host.addEventListener('pointerleave', () => { pointer = null; });
  host.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    keyboardActive = ((keyboardActive ?? featured[0]) + (event.key === 'ArrowRight' ? 1 : 35)) % 36;
  });

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(innerWidth, innerHeight).parent(host);
      p.noLoop();
      resolveReady();
    };
    p.draw = () => {
      draws += 1;
      p.background('#0b0b12');
      const phase = loopPhase(time);
      let active = keyboardActive ?? featured[Math.floor(loopTime(time) / .75) % featured.length];
      if (pointer && lastPolygons.length) {
        const point = { x: pointer.x * p.width, y: pointer.y * p.height };
        const hit = lastPolygons.findIndex(polygon => polygon && inside(point, polygon));
        if (hit >= 0) active = hit;
      }
      const polygons = [];
      columns.slice().sort((a, b) => (a.row + a.col) - (b.row + b.col)).forEach(column => {
        const index = column.row * 6 + column.col;
        const baseX = 190 + (column.col - column.row) * 14;
        const baseY = 62 + (column.col + column.row) * 6.2;
        const selected = index === active;
        const height = column.value * .62 + (selected ? 16 : 0) + Math.sin(phase + index * .7) * 1.4;
        const width = 10;
        const top = [
          { x: baseX, y: baseY - height },
          { x: baseX + width, y: baseY - height + 4 },
          { x: baseX, y: baseY - height + 8 },
          { x: baseX - width, y: baseY - height + 4 }
        ];
        const left = [top[3], top[2], { x: baseX, y: baseY + 8 }, { x: baseX - width, y: baseY + 4 }];
        const right = [top[1], top[2], { x: baseX, y: baseY + 8 }, { x: baseX + width, y: baseY + 4 }];
        polygons[index] = [...top, ...left, ...right];
        p.noStroke();
        p.fill(selected ? '#ffd46f' : '#8d62ff');
        p.quad(...top.flatMap(point => [point.x, point.y]));
        p.fill(selected ? '#bd7130' : '#4d36a4');
        p.quad(...left.flatMap(point => [point.x, point.y]));
        p.fill(selected ? '#f49b3f' : '#6948cb');
        p.quad(...right.flatMap(point => [point.x, point.y]));
      });
      lastPolygons = polygons;
      const datum = columns[active];
      tip.innerHTML = `${datum.name}<br>VALUE ${datum.value}`;
    };
  }, host);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    sketch instanceof p5 &&
    columns.length === 36 &&
    featured.length === 4 &&
    draws > 0 &&
    Boolean(host.querySelector('canvas')?.getContext('2d'))
  );
  installPreviewController({
    id: 'pickable-extruded-data-columns',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: (nextTime, manual) => {
      if (!manual && nextTime - lastRealtime < 1 / 24) return;
      lastRealtime = nextTime;
      time = nextTime;
      sketch.redraw();
    },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
