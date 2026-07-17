import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const container = document.querySelector('#telemetry-stage');
  const header = document.querySelector('#telemetry-header');
  const systemLabel = document.querySelector('#system-label');
  const bootSegments = [...document.querySelectorAll('#boot-sequence i')];
  const lineValues = [22, 34, 29, 48, 43, 61, 56, 72, 67, 82, 74, 88];
  const barValues = [42, 71, 55, 88, 62];
  let previewTime = 0;
  let restartAt = 0;
  let lastTime = 0;
  let renderCount = 0;
  let sketch;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  const easeOut = value => 1 - (1 - Math.max(0, Math.min(1, value))) ** 3;

  const restart = () => { restartAt = lastTime; };
  container.addEventListener('pointerdown', restart);
  container.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    restart();
  });

  sketch = new p5(p => {
    const panel = (x, y, width, height) => {
      p.noStroke();
      p.fill(252, 252, 242, 248);
      p.rect(x, y, width, height, 7);
      p.stroke(26, 43, 31, 24);
      p.noFill();
      p.rect(x, y, width, height, 7);
    };

    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(innerWidth, innerHeight).parent(container);
      p.noLoop();
      p.strokeCap(p.ROUND);
      p.strokeJoin(p.ROUND);
      resolveReady();
    };

    p.draw = () => {
      renderCount += 1;
      const local = ((previewTime - restartAt) % 3 + 3) % 3;
      const envelope = local < 2.55 ? 1 : Math.max(0, 1 - (local - 2.55) / .45);
      const progresses = [
        easeOut((local - .18) / .58) * envelope,
        easeOut((local - .68) / .58) * envelope,
        easeOut((local - 1.18) / .62) * envelope
      ];

      p.background(238, 240, 230);
      panel(12, 34, 142, 80);
      panel(161, 34, 147, 80);
      panel(12, 120, 296, 43);

      p.noStroke();
      p.fill(28, 41, 31, 150);
      p.textFont('monospace');
      p.textStyle(p.BOLD);
      p.textSize(6);
      p.text('SIGNAL VELOCITY', 21, 47);
      p.text('LOAD DISTRIBUTION', 170, 47);
      p.text('NETWORK SATURATION', 21, 133);

      p.stroke(27, 48, 35, 20);
      p.strokeWeight(1);
      for (let row = 0; row < 4; row += 1) p.line(22, 57 + row * 14, 144, 57 + row * 14);
      p.noFill();
      p.stroke(16, 142, 101, 230);
      p.strokeWeight(2);
      p.beginShape();
      const lineEnd = Math.max(1, Math.ceil((lineValues.length - 1) * progresses[0]));
      for (let index = 0; index <= lineEnd; index += 1) {
        const precise = Math.min(index, (lineValues.length - 1) * progresses[0]);
        const left = Math.floor(precise);
        const mix = precise - left;
        const value = lineValues[left] * (1 - mix) + lineValues[Math.min(left + 1, lineValues.length - 1)] * mix;
        p.vertex(22 + precise * 11, 104 - value * .52);
      }
      p.endShape();

      barValues.forEach((value, index) => {
        const height = value * .55 * progresses[1];
        p.noStroke();
        p.fill(index === 3 ? '#ff7557' : '#283a2f');
        p.rect(174 + index * 25, 102 - height, 14, height, 3, 3, 0, 0);
      });

      const centerX = 257;
      const centerY = 141;
      p.noFill();
      p.stroke(35, 52, 40, 22);
      p.strokeWeight(6);
      p.arc(centerX, centerY, 27, 27, -Math.PI, Math.PI);
      p.stroke(114, 87, 255, 230);
      p.strokeWeight(6);
      p.arc(centerX, centerY, 27, 27, -Math.PI, -Math.PI + Math.PI * 2 * .78 * progresses[2]);
      p.noStroke();
      p.fill(31, 45, 35, 210);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(6);
      p.text(`${Math.round(78 * progresses[2])}%`, centerX, centerY);

      p.textAlign(p.LEFT, p.BASELINE);
      p.fill(29, 45, 34, 70);
      p.textStyle(p.NORMAL);
      p.text('EDGE 01', 170, 110);
      p.text('CORE', 291, 155);

      progresses.forEach((progress, index) => bootSegments[index].classList.toggle('active', progress > .92));
      const online = progresses.every(progress => progress > .92);
      header.dataset.online = String(online);
      systemLabel.textContent = online ? 'ALL SYSTEMS LIVE' : `BOOT ${1 + progresses.filter(progress => progress > .92).length} / 3`;
    };
  }, container);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    sketch instanceof p5
    && lineValues.length === 12
    && barValues.length === 5
    && bootSegments.length === 3
    && Boolean(container.querySelector('canvas')?.getContext('2d'))
    && renderCount > 0
  );

  installPreviewController({
    id: 'staggered-multichart-telemetry-boot',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: time => {
      lastTime = Number(time) || 0;
      previewTime = lastTime;
      sketch.redraw();
    },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
