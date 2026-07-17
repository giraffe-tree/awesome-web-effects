import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const container = document.querySelector('#depth-stage');
  let previewTime = 0;
  let sketch;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  const smoothstep = value => {
    const x = Math.max(0, Math.min(1, value));
    return x * x * (3 - 2 * x);
  };

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(innerWidth, innerHeight).parent(container);
      p.noLoop();
      resolveReady();
    };

    const layer = (depth, transition, drawA, drawB) => {
      const local = smoothstep((transition - depth * .15) / .58);
      const blur = Math.sin(local * Math.PI) * (2.5 + depth * 7);
      p.push();
      p.drawingContext.filter = `blur(${blur}px)`;
      p.drawingContext.globalAlpha = 1 - local;
      drawA();
      p.drawingContext.globalAlpha = local;
      drawB();
      p.drawingContext.globalAlpha = 1;
      p.drawingContext.filter = 'none';
      p.pop();
    };

    p.draw = () => {
      const phase = (previewTime % 3) / 3;
      const transition = phase < .46 ? phase / .46 : phase < .62 ? 1 : phase < .96 ? 1 - ((phase - .62) / .34) : 0;
      p.background(6, 10, 19);

      layer(.92, transition,
        () => { p.noStroke(); p.fill(17, 28, 58); p.rect(0, 0, p.width, p.height); p.fill(41, 78, 132); p.circle(252, 35, 126); },
        () => { p.noStroke(); p.fill(36, 13, 45); p.rect(0, 0, p.width, p.height); p.fill(231, 92, 120); p.circle(65, 31, 112); });

      layer(.65, transition,
        () => { p.noStroke(); p.fill(39, 76, 99); p.beginShape(); p.vertex(0, 132); p.vertex(46, 66); p.vertex(101, 121); p.vertex(154, 55); p.vertex(218, 125); p.vertex(274, 77); p.vertex(320, 127); p.vertex(320, 180); p.vertex(0, 180); p.endShape(p.CLOSE); },
        () => { p.noStroke(); p.fill(93, 45, 91); p.beginShape(); p.vertex(0, 118); p.vertex(54, 91); p.vertex(108, 48); p.vertex(171, 111); p.vertex(228, 63); p.vertex(320, 115); p.vertex(320, 180); p.vertex(0, 180); p.endShape(p.CLOSE); });

      layer(.32, transition,
        () => { const ctx = p.drawingContext; ctx.fillStyle = '#198f85'; ctx.beginPath(); ctx.moveTo(0, 147); ctx.bezierCurveTo(73, 112, 138, 165, 208, 126); ctx.bezierCurveTo(255, 101, 290, 134, 320, 116); ctx.lineTo(320, 180); ctx.lineTo(0, 180); ctx.closePath(); ctx.fill(); },
        () => { const ctx = p.drawingContext; ctx.fillStyle = '#f17166'; ctx.beginPath(); ctx.moveTo(0, 143); ctx.bezierCurveTo(61, 129, 114, 105, 173, 139); ctx.bezierCurveTo(229, 168, 268, 111, 320, 139); ctx.lineTo(320, 180); ctx.lineTo(0, 180); ctx.closePath(); ctx.fill(); });

      layer(.02, transition,
        () => { p.noStroke(); p.fill(238, 202, 111); p.ellipse(75, 153, 116, 43); p.fill(10, 39, 52); p.rect(0, 164, p.width, 16); },
        () => { p.noStroke(); p.fill(83, 229, 193); p.ellipse(252, 151, 128, 48); p.fill(43, 17, 48); p.rect(0, 165, p.width, 15); });

    };
  }, container);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => sketch instanceof p5 && Boolean(container.querySelector('canvas')?.getContext('2d'));
  installPreviewController({
    id: 'depth-layer-blur-dissolve',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: time => { previewTime = time; sketch.redraw(); },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
