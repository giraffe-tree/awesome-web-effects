import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const container = document.querySelector('#flock-stage');
  const obstacleElement = document.querySelector('#flock-obstacle');
  let previewTime = 0;
  let sketch;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  sketch = new p5(p => {
    const fish = Array.from({ length: 34 }, (_, index) => ({
      seed: index * 1.731,
      hue: index % 3,
      lane: (index % 7) - 3
    }));

    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(innerWidth, innerHeight).parent(container);
      p.noLoop();
      resolveReady();
    };

    p.mouseDragged = () => {
      const index = fish.length;
      fish.push({ seed: previewTime * 2.7 + index * 1.731, hue: index % 3, lane: Math.max(-3, Math.min(3, Math.round((p.mouseY - 90) / 12))) });
      if (fish.length > 70) fish.shift();
      return false;
    };

    p.draw = () => {
      p.background(5, 24, 29);
      const obstacle = obstacleElement.getBoundingClientRect();
      const cx = obstacle.left + obstacle.width / 2;
      const cy = obstacle.top + obstacle.height / 2;
      const dragHeadX = 22 + ((previewTime * 78) % 365);
      const dragHeadY = 86 + Math.sin(previewTime * 2.2) * 31;

      p.noFill();
      p.stroke(92, 235, 202, 82);
      p.strokeWeight(1);
      p.beginShape();
      for (let index = 0; index < 24; index += 1) {
        const x = dragHeadX - index * 7;
        const y = dragHeadY + Math.sin(previewTime * 2.2 - index * .25) * (5 + index * .18);
        p.vertex(x, y);
      }
      p.endShape();

      fish.forEach((item, index) => {
        const rawX = ((previewTime * (42 + item.hue * 4) + item.seed * 41) % 390) - 42;
        let x = rawX;
        let y = 91 + item.lane * 12 + Math.sin(previewTime * 1.8 + item.seed) * 9;
        const dx = x - cx;
        const dy = y - cy;
        const distance = Math.hypot(dx, dy);
        if (distance < 92) {
          const lift = (1 - distance / 92) * (index % 2 ? 48 : -48);
          y += lift;
          x -= (1 - distance / 92) * 9;
        }
        const angle = Math.cos(previewTime * 1.5 + item.seed) * .16;
        p.push();
        p.translate(x, y);
        p.rotate(angle);
        const colors = [[90, 238, 203], [255, 190, 93], [238, 105, 148]];
        p.noStroke();
        p.fill(...colors[item.hue], 220);
        p.triangle(-8, -4, 5, 0, -8, 4);
        p.fill(...colors[item.hue], 135);
        p.triangle(-7, 0, -13, -5, -12, 5);
        p.fill(255, 235);
        p.circle(1, -1, 1.8);
        p.pop();
      });

      p.noStroke();
      p.fill(119, 249, 217, 230);
      p.circle(dragHeadX, dragHeadY, 7);
      p.fill(119, 249, 217, 38);
      p.circle(dragHeadX, dragHeadY, 22);
    };
  }, container);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => sketch instanceof p5 && Boolean(container.querySelector('canvas')?.getContext('2d'));
  installPreviewController({
    id: 'dom-aware-drag-spawned-fish-flock',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: time => { previewTime = time; sketch.redraw(); },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
