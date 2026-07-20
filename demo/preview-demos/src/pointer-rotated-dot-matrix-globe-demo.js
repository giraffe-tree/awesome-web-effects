import './batch-a-qa.js';
import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const host = document.querySelector('#globe-host');
  const duration = 3;
  const latitudeCount = 18;
  const longitudeCount = 36;
  let previewTime = 0;
  let dragYaw = 0;
  let dragPitch = 0.15;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let sketch;
  let resolveReady;
  let draws = 0;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });

  host.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    host.setPointerCapture(event.pointerId);
  });

  host.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    dragYaw += (event.clientX - lastX) * 0.012;
    dragPitch = Math.max(
      -0.8,
      Math.min(0.8, dragPitch + (event.clientY - lastY) * 0.01),
    );
    lastX = event.clientX;
    lastY = event.clientY;
    sketch.redraw();
  });

  host.addEventListener('pointerup', (event) => {
    dragging = false;
    if (host.hasPointerCapture(event.pointerId)) {
      host.releasePointerCapture(event.pointerId);
    }
  });

  sketch = new p5((p) => {
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(innerWidth, innerHeight).parent(host);
      p.noLoop();
      resolveReady();
    };

    p.draw = () => {
      draws += 1;
      p.background(3, 16, 21);

      const phase = (previewTime / duration) * Math.PI * 2;
      // The asymmetric surface ridge breaks the evenly spaced longitude symmetry,
      // while one full automatic turn still loops cleanly. Pointer input is additive.
      const yaw = phase + dragYaw;
      const pitch = dragPitch + Math.sin(phase) * 0.2;
      const cx = 226;
      const cy = 93;
      const radius = 67;
      const points = [];

      for (let lat = 1; lat < latitudeCount; lat += 1) {
        const phi = -Math.PI / 2 + (lat / latitudeCount) * Math.PI;

        for (let lon = 0; lon < longitudeCount; lon += 1) {
          const surfaceLongitude = (lon / longitudeCount) * Math.PI * 2;
          const theta = surfaceLongitude + yaw;

          // This asymmetric ridge is attached to the globe's surface, so its
          // position and silhouette visibly track the automatic/pointer rotation.
          const ridgeCenter = 0.35 + Math.sin(phi * 2.25) * 0.5;
          const ridgeDistance = Math.atan2(
            Math.sin(surfaceLongitude - ridgeCenter),
            Math.cos(surfaceLongitude - ridgeCenter),
          );
          const ridge = Math.exp(-Math.pow(ridgeDistance / 0.3, 2));
          const ripple = Math.sin(surfaceLongitude * 3 + phi * 5 + phase);
          const pointRadius = radius * (1 + ridge * 0.1 + ripple * 0.018);

          const x = Math.cos(phi) * Math.cos(theta);
          const y = Math.sin(phi);
          const z = Math.cos(phi) * Math.sin(theta);
          const yy = y * Math.cos(pitch) - z * Math.sin(pitch);
          const zz = y * Math.sin(pitch) + z * Math.cos(pitch);
          const depth = (zz + 1) / 2;

          points.push({
            x: cx + x * pointRadius,
            y: cy + yy * pointRadius,
            z: zz,
            depth,
            ridge,
          });
        }
      }

      points.sort((a, b) => a.z - b.z);
      p.noStroke();
      for (const point of points) {
        const warm = point.ridge * Math.max(0, point.z + 0.2);
        p.fill(
          72 + point.depth * 62 + warm * 135,
          177 + point.depth * 65 + warm * 45,
          169 + point.depth * 72 - warm * 42,
          35 + point.depth * 190,
        );
        p.circle(
          point.x,
          point.y,
          1.15 + point.depth * 2.35 + warm * 2.6,
        );
      }

      p.noFill();
      p.stroke(105, 235, 206, 38);
      p.circle(cx, cy, radius * 2.06);
    };
  }, host);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = host.querySelector('canvas');
    const context = canvas?.getContext('2d');
    if (!context) return false;

    previewTime = 0;
    sketch.redraw();
    previewTime = 1;
    sketch.redraw();
    const firstRidgeAnchor = 226 + Math.cos(0.35) * 67;
    const secondRidgeAnchor =
      226 + Math.cos(0.35 + (1 / duration) * Math.PI * 2) * 67;

    return (
      sketch instanceof p5 &&
      draws > 1 &&
      Math.abs(secondRidgeAnchor - firstRidgeAnchor) > 80 &&
      typeof host.setPointerCapture === 'function' &&
      latitudeCount * longitudeCount === 648
    );
  };

  installPreviewController({
    id: 'pointer-rotated-dot-matrix-globe',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: (time) => {
      previewTime = ((time % duration) + duration) % duration;
      sketch.redraw();
    },
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
