import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const container = document.querySelector('#starfield-stage');
  const depthScale = document.querySelector('#depth-scale');
  const layers = [
    { count: 46, speed: .17, radius: 1, alpha: 90, hue: [184, 220] },
    { count: 30, speed: .48, radius: 1.55, alpha: 78, hue: [220, 278] },
    { count: 18, speed: 1, radius: 2.25, alpha: 92, hue: [284, 338] }
  ].map((layer, layerIndex) => ({
    ...layer,
    stars: Array.from({ length: layer.count }, (_, index) => {
      const seed = index + layerIndex * 71 + 1;
      return {
        x: ((seed * 73) % 997) / 997,
        y: ((seed * seed * 31 + 17) % 991) / 991,
        pulse: ((seed * 47) % 101) / 101,
        tint: ((seed * 29) % 97) / 97
      };
    })
  }));
  let previewTime = 0;
  let interactionOffset = 0;
  let renderCount = 0;
  let sketch;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  const scrollBy = delta => {
    interactionOffset = Math.max(-.7, Math.min(.7, interactionOffset + delta));
  };
  container.addEventListener('wheel', event => {
    event.preventDefault();
    scrollBy(event.deltaY * .0012);
  }, { passive: false });
  container.addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    scrollBy(event.key === 'ArrowDown' ? .12 : -.12);
  });

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(innerWidth, innerHeight).parent(container);
      p.colorMode(p.HSB, 360, 100, 100, 100);
      p.noLoop();
      resolveReady();
    };

    p.draw = () => {
      renderCount += 1;
      const loopProgress = .5 - .5 * Math.cos((previewTime / 3) * Math.PI * 2);
      const depth = Math.max(0, Math.min(1, loopProgress + interactionOffset));
      p.background(220, 74, 5);

      const glowX = p.width * (.7 - depth * .14);
      const glowY = p.height * (.42 + depth * .08);
      for (let ring = 9; ring > 0; ring -= 1) {
        p.noStroke();
        p.fill(224 + ring * 4, 72, 32, 2.5 + ring * .25);
        p.circle(glowX, glowY, ring * 25);
      }

      layers.forEach((layer, layerIndex) => {
        const distance = layer.speed * depth;
        layer.stars.forEach((star, index) => {
          const x = ((star.x + distance * .43 + Math.sin(star.y * 9 + depth * 2) * .012) % 1) * p.width;
          const y = ((star.y + distance * (.08 + layerIndex * .045)) % 1) * p.height;
          const hue = layer.hue[0] + (layer.hue[1] - layer.hue[0]) * star.tint;
          const twinkle = .72 + Math.sin(previewTime * 3.5 + star.pulse * 10) * .24;
          const streak = layerIndex === 2 ? depth * 7 : layerIndex === 1 ? depth * 2.5 : 0;
          p.stroke(hue, 38 + layerIndex * 13, 100, layer.alpha * twinkle);
          p.strokeWeight(layer.radius);
          p.line(x - streak, y, x + layer.radius, y);
          if (index % 9 === 0) {
            p.noFill();
            p.stroke(hue, 42, 100, 18 + depth * 15);
            p.circle(x, y, 5 + layerIndex * 3 + depth * 4);
          }
        });
      });

      p.noFill();
      p.stroke(196, 58, 90, 20);
      p.strokeWeight(1);
      p.arc(p.width * .68, p.height * .54, 100 + depth * 32, 100 + depth * 32, -1.15, 1.45);
      depthScale.style.setProperty('--depth', depth.toFixed(4));
    };
  }, container);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    sketch instanceof p5
    && layers.length === 3
    && layers.every(layer => layer.stars.length === layer.count)
    && Boolean(container.querySelector('canvas')?.getContext('2d'))
    && renderCount > 0
  );

  installPreviewController({
    id: 'scroll-linked-multilayer-starfield',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: time => {
      previewTime = ((time % 3) + 3) % 3;
      sketch.redraw();
    },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
