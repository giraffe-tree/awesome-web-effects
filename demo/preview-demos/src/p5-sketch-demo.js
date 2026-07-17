import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const container = document.querySelector('#p5-stage');
  let previewTime = 0;
  let sketch;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(innerWidth, innerHeight).parent(container);
      p.colorMode(p.HSB, 360, 100, 100, 100);
      p.noLoop();
      resolveReady();
    };

    p.draw = () => {
      p.background(210, 58, 8);
      p.blendMode(p.ADD);
      p.noFill();
      for (let band = 0; band < 6; band += 1) {
        const hue = 166 + band * 22;
        p.stroke(hue, 78, 92, 34);
        p.strokeWeight(1.2 + band * .12);
        p.beginShape();
        for (let x = -10; x <= p.width + 10; x += 5) {
          const wave = Math.sin(x * .026 + previewTime * (1.1 + band * .06) + band * .8);
          const ripple = Math.cos(x * .011 - previewTime * .7 + band) * 10;
          p.vertex(x, 88 + wave * (14 + band * 3.5) + ripple);
        }
        p.endShape();
      }

      p.noStroke();
      for (let index = 0; index < 26; index += 1) {
        const progress = (index / 26 + previewTime * .075) % 1;
        const x = progress * p.width;
        const y = 88 + Math.sin(x * .026 + previewTime * 1.24 + index * .12) * 29;
        p.fill((175 + index * 7) % 360, 70, 100, 72);
        p.circle(x, y, 3 + (index % 4) * 1.2);
      }
      p.blendMode(p.BLEND);
    };
  }, container);
  window.__PREVIEW_RUNTIME_ASSERT__ = () => sketch instanceof p5 && Boolean(container.querySelector('canvas')?.getContext('2d'));

  installPreviewController({
    id: 'sketch-style-creative-coding-loop',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: time => {
      previewTime = time;
      sketch.redraw();
    },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
