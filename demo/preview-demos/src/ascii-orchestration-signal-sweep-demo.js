import './batch-a-qa.js';
import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const host = document.querySelector('#ascii-field');
  const glyphs = ['.', '+', 'x', '-', '*'];
  const columns = 42;
  const rows = 22;
  const cells = Array.from({ length: columns * rows }, (_, index) => ({
    glyph: glyphs[(index * 17 + Math.floor(index / columns) * 7) % glyphs.length],
    pulse: ((index * 37) % 101) / 101
  }));
  let previewTime = 0;
  let pointerBend = 0;
  let reversed = false;
  let renderCount = 0;
  let sketch;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  const structureAt = (x, y) => {
    const nodeA = Math.hypot(x - .58, y - .36) < .08;
    const nodeB = Math.hypot(x - .78, y - .58) < .07;
    const nodeC = Math.hypot(x - .5, y - .72) < .065;
    const lineAB = Math.abs(y - (.36 + (x - .58) * 1.05)) < .026 && x > .58 && x < .78;
    const lineAC = Math.abs(y - (.36 + (x - .58) * -4.4)) < .025 && x > .5 && x < .58;
    const lineBC = Math.abs(y - (.72 + (x - .5) * -.5)) < .025 && x > .5 && x < .78;
    return nodeA || nodeB || nodeC || lineAB || lineAC || lineBC;
  };

  host.addEventListener('pointermove', event => {
    pointerBend = ((event.clientY / Math.max(1, innerHeight)) - .5) * .22;
  });
  host.addEventListener('click', () => { reversed = !reversed; });

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(innerWidth, innerHeight).parent(host);
      p.textFont('ui-monospace, monospace');
      p.textAlign(p.CENTER, p.CENTER);
      p.noLoop();
      resolveReady();
    };
    p.draw = () => {
      renderCount += 1;
      p.background(5, 16, 13);
      const progress = previewTime / 3;
      const front = reversed ? 1.18 - progress * 1.36 : -.18 + progress * 1.36;
      const cellW = p.width / columns;
      const cellH = p.height / rows;
      cells.forEach((cell, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const x = (col + .5) / columns;
        const y = (row + .5) / rows;
        const bentFront = front + Math.sin(y * 8 + pointerBend * 14) * .035 + pointerBend * (y - .5);
        const distance = Math.abs(x - bentFront);
        const band = Math.max(0, 1 - distance / .115);
        const structure = structureAt(x, y);
        const twinkle = .5 + .5 * Math.sin(previewTime * 3 + cell.pulse * 9);
        const alpha = structure ? 32 + band * 223 : 25 + twinkle * 34 + band * 90;
        const color = structure ? [210 + band * 30, 255, 90 + band * 95] : [90 + band * 45, 160 + band * 70, 135 + band * 25];
        p.noStroke();
        p.fill(color[0], color[1], color[2], alpha);
        p.textSize(structure && band > .2 ? 8.2 : 6.2);
        p.text(structure && band > .18 ? (index % 3 ? '■' : '◆') : cell.glyph, (col + .5) * cellW, (row + .5) * cellH);
      });
      const frontX = front * p.width;
      const glow = p.drawingContext.createLinearGradient(frontX - 30, 0, frontX + 30, 0);
      glow.addColorStop(0, 'rgba(215,255,84,0)');
      glow.addColorStop(.5, 'rgba(215,255,84,.22)');
      glow.addColorStop(1, 'rgba(215,255,84,0)');
      p.drawingContext.fillStyle = glow;
      p.rect(frontX - 30, 0, 60, p.height);
    };
  }, host);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = host.querySelector('canvas');
    const context = canvas?.getContext('2d');
    previewTime = 0;
    sketch.redraw();
    const a = context?.getImageData(210, 80, 1, 1).data.join(',');
    previewTime = 1.5;
    sketch.redraw();
    const b = context?.getImageData(210, 80, 1, 1).data.join(',');
    return sketch instanceof p5 && cells.length === columns * rows && renderCount > 1 && structureAt(.58, .36) && a !== undefined && b !== undefined;
  };

  installPreviewController({
    id: 'ascii-orchestration-signal-sweep',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: time => { previewTime = ((time % 3) + 3) % 3; sketch.redraw(); },
    ready
  });
} catch (error) {
  markPreviewFailure(error);
}
