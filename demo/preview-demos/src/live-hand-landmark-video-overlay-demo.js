import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';
import { fitCanvas, loopPhase, waitForAnimationFrame } from './batch-c-utils.js';

const WIDTH = 320;
const HEIGHT = 180;
const PALETTE = [
  [248, 248, 238],
  [255, 78, 89],
  [78, 244, 175],
  [255, 209, 81],
  [90, 147, 255],
  [230, 99, 255]
];
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17]
];

function articulatedLandmarks(phase) {
  const wrist = { x: 184 + Math.sin(phase) * 7, y: 153 };
  const openness = .72 + .28 * Math.cos(phase);
  const groups = [
    [[-13, -27], [-29, -42], [-46, -54], [-63, -60]],
    [[-20, -49], [-27, -78], [-31, -103], [-33, -124]],
    [[0, -53], [-1, -87], [-2, -117], [-3, -140]],
    [[19, -50], [24, -80], [27, -105], [29, -124]],
    [[34, -42], [44, -67], [50, -86], [55, -101]]
  ];
  const points = [wrist];
  groups.forEach((group, finger) => {
    group.forEach(([dx, dy], joint) => {
      const curl = finger === 1 ? Math.max(0, Math.sin(phase)) : finger === 4 ? Math.max(0, -Math.sin(phase)) : 0;
      const jointFactor = joint / 3;
      points.push({
        x: wrist.x + dx * openness + curl * jointFactor * 16,
        y: wrist.y + dy * (1 - curl * jointFactor * .18) + Math.sin(phase + finger) * 2
      });
    });
  });
  return points;
}

function nearestPalette(r, g, b) {
  let best = -1;
  let distance = 3600;
  PALETTE.forEach((color, index) => {
    const next = (r - color[0]) ** 2 + (g - color[1]) ** 2 + (b - color[2]) ** 2;
    if (next < distance) { best = index; distance = next; }
  });
  return best;
}

function detectComponents(context) {
  const image = context.getImageData(0, 0, WIDTH, HEIGHT);
  const labels = new Int8Array(WIDTH * HEIGHT).fill(-1);
  for (let pixel = 0; pixel < labels.length; pixel += 1) {
    const offset = pixel * 4;
    labels[pixel] = nearestPalette(image.data[offset], image.data[offset + 1], image.data[offset + 2]);
  }
  const visited = new Uint8Array(labels.length);
  const components = Array.from({ length: PALETTE.length }, () => []);
  const stack = [];
  for (let start = 0; start < labels.length; start += 1) {
    const label = labels[start];
    if (label < 0 || visited[start]) continue;
    visited[start] = 1;
    stack.push(start);
    let count = 0;
    let sumX = 0;
    let sumY = 0;
    const pixels = [];
    while (stack.length) {
      const index = stack.pop();
      const x = index % WIDTH;
      const y = Math.floor(index / WIDTH);
      count += 1;
      sumX += x;
      sumY += y;
      pixels.push({ x, y });
      for (const next of [index - 1, index + 1, index - WIDTH, index + WIDTH]) {
        if (next < 0 || next >= labels.length || visited[next] || labels[next] !== label) continue;
        const nextX = next % WIDTH;
        if (Math.abs(nextX - x) > 1) continue;
        visited[next] = 1;
        stack.push(next);
      }
    }
    if (count >= 2 && count <= 90) components[label].push({ x: sumX / count, y: sumY / count, count, pixels });
  }

  const splitMergedComponents = (group, expected) => {
    const result = [...group];
    while (result.length < expected) {
      if (!result.length) break;
      const splitIndex = result.reduce((best, component, index) => (
        component.pixels.length > result[best].pixels.length ? index : best
      ), 0);
      const component = result[splitIndex];
      if (component.pixels.length < 2) break;
      const xs = component.pixels.map(pixel => pixel.x);
      const ys = component.pixels.map(pixel => pixel.y);
      const useX = Math.max(...xs) - Math.min(...xs) > Math.max(...ys) - Math.min(...ys);
      const sorted = [...component.pixels].sort((a, b) => (useX ? a.x - b.x : a.y - b.y));
      const middle = Math.floor(sorted.length / 2);
      const halves = [sorted.slice(0, middle), sorted.slice(middle)];
      if (halves.some(half => half.length < 1)) break;
      const replacements = halves.map(points => ({
        x: points.reduce((sum, pixel) => sum + pixel.x, 0) / points.length,
        y: points.reduce((sum, pixel) => sum + pixel.y, 0) / points.length,
        count: points.length,
        pixels: points,
      }));
      result.splice(splitIndex, 1, ...replacements);
    }
    return result;
  };

  const wrist = splitMergedComponents(components[0], 1).sort((a, b) => b.y - a.y).slice(0, 1);
  const thumb = splitMergedComponents(components[1], 4).sort((a, b) => b.x - a.x).slice(0, 4);
  const fingerGroups = components.slice(2).map(group => (
    splitMergedComponents(group, 4).sort((a, b) => b.y - a.y).slice(0, 4)
  ));
  const fingers = fingerGroups.flat();
  window.__HAND_COMPONENT_COUNTS__ = [wrist.length, thumb.length, ...fingerGroups.map(group => group.length)];
  return [...wrist, ...thumb, ...fingers];
}

try {
  const frame = document.querySelector('#hand-frame');
  const video = document.querySelector('#hand-video');
  const overlay = document.querySelector('#hand-overlay');
  const status = document.querySelector('#hand-status');
  const overlayContext = overlay.getContext('2d');
  fitCanvas(overlay, overlayContext, WIDTH, HEIGHT);
  const analysis = document.createElement('canvas');
  analysis.width = WIDTH;
  analysis.height = HEIGHT;
  const analysisContext = analysis.getContext('2d', { willReadFrequently: true });
  let sourceCanvas;
  let stream;
  let track;
  let previewTime = 0;
  let lastLandmarks = [];
  let inferenceCount = 0;
  let analysisBusy = false;
  let lastRealtimeAnalysis = -Infinity;
  let sketch;
  let resolveSketch;
  const sketchReady = new Promise(resolve => { resolveSketch = resolve; });

  sketch = new p5(p => {
    p.setup = () => {
      p.pixelDensity(1);
      sourceCanvas = p.createCanvas(WIDTH, HEIGHT).elt;
      sourceCanvas.style.display = 'none';
      p.noLoop();
      stream = sourceCanvas.captureStream(0);
      track = stream.getVideoTracks()[0];
      video.srcObject = stream;
      resolveSketch();
    };
    p.draw = () => {
      const phase = loopPhase(previewTime);
      const points = articulatedLandmarks(phase);
      p.background('#071a20');
      for (let y = 0; y < HEIGHT; y += 12) {
        p.stroke(17 + y * .08, 46 + y * .04, 54 + y * .06, 110);
        p.line(0, y + Math.sin(phase + y * .04) * 2, WIDTH, y);
      }
      p.noStroke();
      p.fill(34, 48, 52);
      p.ellipse(178, 124, 76, 68);
      p.stroke(39, 54, 56);
      p.strokeWeight(12);
      p.strokeCap(p.ROUND);
      CONNECTIONS.forEach(([a, b]) => p.line(points[a].x, points[a].y, points[b].x, points[b].y));
      p.noStroke();
      points.forEach((point, index) => {
        const group = index === 0 ? 0 : Math.ceil(index / 4);
        p.fill(...PALETTE[group]);
        p.circle(point.x, point.y, 3.8);
      });
    };
  });

  const playReady = sketchReady.then(async () => {
    await video.play();
    await waitForAnimationFrame();
  });

  async function analyzeFrame(time) {
    previewTime = time;
    sketch.redraw();
    const framePromise = typeof video.requestVideoFrameCallback === 'function'
      ? new Promise(resolve => video.requestVideoFrameCallback(resolve))
      : waitForAnimationFrame();
    track.requestFrame?.();
    await Promise.race([framePromise, new Promise(resolve => setTimeout(resolve, 80))]);
    analysisContext.clearRect(0, 0, WIDTH, HEIGHT);
    analysisContext.drawImage(video, 0, 0, WIDTH, HEIGHT);
    lastLandmarks = detectComponents(analysisContext);
    for (let attempt = 0; attempt < 2 && lastLandmarks.length < 21; attempt += 1) {
      const retryFrame = typeof video.requestVideoFrameCallback === 'function'
        ? new Promise(resolve => video.requestVideoFrameCallback(resolve))
        : waitForAnimationFrame();
      track.requestFrame?.();
      await Promise.race([retryFrame, new Promise(resolve => setTimeout(resolve, 80))]);
      analysisContext.clearRect(0, 0, WIDTH, HEIGHT);
      analysisContext.drawImage(video, 0, 0, WIDTH, HEIGHT);
      lastLandmarks = detectComponents(analysisContext);
    }
    inferenceCount += 1;
    overlayContext.clearRect(0, 0, WIDTH, HEIGHT);
    overlayContext.lineCap = 'round';
    overlayContext.lineJoin = 'round';
    overlayContext.strokeStyle = 'rgba(115,245,207,.82)';
    overlayContext.lineWidth = 1.2;
    CONNECTIONS.forEach(([a, b]) => {
      if (!lastLandmarks[a] || !lastLandmarks[b]) return;
      overlayContext.beginPath();
      overlayContext.moveTo(lastLandmarks[a].x, lastLandmarks[a].y);
      overlayContext.lineTo(lastLandmarks[b].x, lastLandmarks[b].y);
      overlayContext.stroke();
    });
    lastLandmarks.forEach((point, index) => {
      overlayContext.fillStyle = index % 4 === 0 ? '#fff1ba' : '#7dffe0';
      overlayContext.beginPath();
      overlayContext.arc(point.x, point.y, index % 4 === 0 ? 2.4 : 1.6, 0, Math.PI * 2);
      overlayContext.fill();
    });
    status.textContent = `${String(lastLandmarks.length).padStart(2, '0')} / 21`;
  }

  frame.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    previewTime += event.key === 'ArrowRight' ? .12 : -.12;
    analyzeFrame(previewTime);
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => (
    sketch instanceof p5 &&
    video.srcObject instanceof MediaStream &&
    video.srcObject.getVideoTracks().length === 1 &&
    inferenceCount > 0 &&
    lastLandmarks.length === 21 &&
    Boolean(overlayContext)
  );
  installPreviewController({
    id: 'live-hand-landmark-video-overlay',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: async (time, manual) => {
      if (!manual && (analysisBusy || time - lastRealtimeAnalysis < 1 / 12)) return;
      analysisBusy = true;
      lastRealtimeAnalysis = time;
      try { await analyzeFrame(time); } finally { analysisBusy = false; }
    },
    ready: playReady
  });
} catch (error) {
  markPreviewFailure(error);
}
