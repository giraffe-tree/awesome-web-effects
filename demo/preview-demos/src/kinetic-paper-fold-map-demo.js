import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL(
  '../assets/aesthetic-wave-06/kinetic-paper-fold-map/harbor-arts-walking-map.jpg',
  import.meta.url,
).href;
const EXPECTED_ASSET = {
  bytes: 267598,
  width: 960,
  height: 540,
  sha256: '21b5265a21ba86ce963df14d267875320c0d723d16761c3c5be37c36e4fbdafd',
};
const clamp = (value, minimum = 0, maximum = 1) =>
  Math.max(minimum, Math.min(maximum, value));
const mix = (from, to, progress) => from + (to - from) * progress;
const samePoint = (a, b) => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6;

const destinations = [
  { short: 'Hall', name: 'Market Hall', distance: '540 m', point: [754, 95], accent: '#f5d6aa' },
  { short: 'Look', name: 'Harbor Lookout', distance: '320 m', point: [483, 436], accent: '#f1a36b' },
  { short: 'Dome', name: 'Glasshouse Dome', distance: '860 m', point: [820, 497], accent: '#8dd7cb' },
];
const routeOrigin = [333, 236];
const stage = document.querySelector('#expansion-stage');
const status = document.querySelector('#route-status');
const destinationButtons = [...document.querySelectorAll('[data-destination]')];
const foldButtons = [...document.querySelectorAll('[data-fold]')];
let renderCurrent = () => {};

const state = {
  id: 'kinetic-paper-fold-map',
  task: 'human-folded-fictional-harbor-walking-map',
  claimedLibrary: 'p5@2.3.0',
  mechanism: 'p5-canvas2d-four-panel-eight-affine-texture-triangle-fold',
  acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard', 'visible-buttons'],
  fold: 0,
  destination: 0,
  dragging: false,
  pointerId: null,
  pointerType: 'none',
  dragStartX: 0,
  dragStartFold: 0,
  dragTravel: 0,
  renderCount: 0,
  visualMutationCount: 0,
  geometryMutationCount: 0,
  destinationMutationCount: 0,
  inputCount: 0,
  rejectedInputCount: 0,
  pointerCaptureCount: 0,
  pointerReleaseCount: 0,
  inputCounts: { pointerdown: 0, pointermove: 0, pointerup: 0, mouse: 0, touch: 0, pen: 0, keyboard: 0, button: 0 },
  firstInput: null,
  lastInput: null,
  asset: null,
  geometry: null,
  initialStill: null,
  userInputRequired: true,
  strictTrustedInputGuard: true,
  autoPlayback: false,
  rehearsal: false,
  fallback: false,
  syntheticInput: false,
  captureClockMutation: false,
};
window.__PREVIEW_INTERACTION_STATE__ = state;

function acceptTrusted(event) {
  if (event?.isTrusted === true) return true;
  state.rejectedInputCount += 1;
  return false;
}

function describeInput(kind, event, before, after) {
  const entry = {
    kind,
    trusted: event.isTrusted === true,
    pointerType: event.pointerType || (kind.startsWith('key') ? 'keyboard' : 'button'),
    before: Number(before.toFixed(4)),
    after: Number(after.toFixed(4)),
    destination: state.destination,
  };
  state.inputCount += 1;
  state.inputCounts[kind] = (state.inputCounts[kind] || 0) + 1;
  if (event.pointerType && state.inputCounts[event.pointerType] !== undefined) {
    state.inputCounts[event.pointerType] += 1;
  }
  if (kind.startsWith('key')) state.inputCounts.keyboard += 1;
  if (kind.startsWith('button')) state.inputCounts.button += 1;
  state.firstInput ||= entry;
  state.lastInput = entry;
}

function setFold(next, kind, event) {
  if (!acceptTrusted(event)) return;
  const before = state.fold;
  state.fold = clamp(next);
  if (Math.abs(state.fold - before) > 1e-5) {
    state.visualMutationCount += 1;
    state.geometryMutationCount += 1;
  }
  describeInput(kind, event, before, state.fold);
  syncControls();
  renderCurrent();
}

function setDestination(index, kind, event) {
  if (!acceptTrusted(event)) return;
  const before = state.fold;
  const next = clamp(Number(index), 0, destinations.length - 1);
  if (next !== state.destination) {
    state.destination = next;
    state.visualMutationCount += 1;
    state.destinationMutationCount += 1;
  }
  describeInput(kind, event, before, state.fold);
  syncControls();
  renderCurrent();
}

function syncControls() {
  destinationButtons.forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index === state.destination));
  });
  foldButtons[0].setAttribute('aria-pressed', String(state.fold < 0.08));
  foldButtons[1].setAttribute('aria-pressed', String(state.fold > 0.72));
  const destination = destinations[state.destination];
  const angle = Math.round(Math.acos(1 - state.fold * 0.46) * 180 / Math.PI);
  status.textContent = `${destination.short} · ${state.fold < 0.03 ? 'open' : `${angle}°`}`;
}

stage.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button') || !acceptTrusted(event)) return;
  event.preventDefault();
  stage.focus({ preventScroll: true });
  state.dragging = true;
  state.pointerId = event.pointerId;
  state.pointerType = event.pointerType || 'mouse';
  state.dragStartX = event.clientX;
  state.dragStartFold = state.fold;
  state.dragTravel = 0;
  stage.setPointerCapture(event.pointerId);
  state.pointerCaptureCount += 1;
  describeInput('pointerdown', event, state.fold, state.fold);
});

stage.addEventListener('pointermove', (event) => {
  if (!state.dragging || event.pointerId !== state.pointerId) return;
  event.preventDefault();
  const bounds = stage.getBoundingClientRect();
  const delta = (state.dragStartX - event.clientX) / Math.max(1, bounds.width * 0.56);
  state.dragTravel = Math.max(state.dragTravel, Math.abs(event.clientX - state.dragStartX));
  setFold(state.dragStartFold + delta, 'pointermove', event);
});

function finishPointer(event) {
  if (!state.dragging || event.pointerId !== state.pointerId || !acceptTrusted(event)) return;
  const wasTap = state.dragTravel < 4;
  if (stage.hasPointerCapture(event.pointerId)) {
    stage.releasePointerCapture(event.pointerId);
    state.pointerReleaseCount += 1;
  }
  state.dragging = false;
  state.pointerId = null;
  describeInput('pointerup', event, state.fold, state.fold);
  if (wasTap) setFold(state.fold > 0.42 ? 0 : 0.82, 'pointer-tap', event);
}
stage.addEventListener('pointerup', finishPointer);
stage.addEventListener('pointercancel', finishPointer);

stage.addEventListener('keydown', (event) => {
  if (event.target.closest('button')) return;
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    setFold(state.fold - 0.12, 'keydown-left', event);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    setFold(state.fold + 0.12, 'keydown-right', event);
  } else if (event.key === 'Home') {
    event.preventDefault();
    setFold(0, 'keydown-home', event);
  } else if (event.key === 'End') {
    event.preventDefault();
    setFold(0.82, 'keydown-end', event);
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    setFold(state.fold > 0.42 ? 0 : 0.82, 'keydown-toggle', event);
  } else if (/^[123]$/.test(event.key)) {
    event.preventDefault();
    setDestination(Number(event.key) - 1, `keydown-destination-${event.key}`, event);
  }
});

destinationButtons.forEach((button, index) => {
  button.addEventListener('click', (event) => setDestination(index, `button-destination-${index + 1}`, event));
});
foldButtons[0].addEventListener('click', (event) => setFold(0, 'button-open', event));
foldButtons[1].addEventListener('click', (event) => setFold(0.82, 'button-fold', event));

async function loadAsset() {
  const response = await fetch(ASSET_URL, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Map asset request failed: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const sha256 = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
  const image = new Image();
  image.src = objectUrl;
  await image.decode();

  const analysis = document.createElement('canvas');
  analysis.width = image.naturalWidth;
  analysis.height = image.naturalHeight;
  const context = analysis.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const pixelData = context.getImageData(0, 0, analysis.width, analysis.height).data;
  let fingerprint = 2166136261;
  for (let index = 0; index < pixelData.length; index += 1) {
    fingerprint ^= pixelData[index];
    fingerprint = Math.imul(fingerprint, 16777619) >>> 0;
  }
  const samples = [routeOrigin, ...destinations.map((destination) => destination.point)].map(([x, y]) => {
    const offset = (y * analysis.width + x) * 4;
    return [...pixelData.slice(offset, offset + 4)];
  });
  state.asset = {
    requested: true,
    decoded: true,
    sameOrigin: new URL(ASSET_URL).origin === location.origin,
    bytes: bytes.byteLength,
    sha256,
    width: image.naturalWidth,
    height: image.naturalHeight,
    pixelCount: image.naturalWidth * image.naturalHeight,
    rgbaBytes: pixelData.byteLength,
    pixelFingerprint: fingerprint,
    samples,
  };
  return image;
}

function triangleTransform(source, destination) {
  const [s0, s1, s2] = source;
  const [d0, d1, d2] = destination;
  const determinant = s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
  return {
    a: (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) / determinant,
    b: (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) / determinant,
    c: (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) / determinant,
    d: (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) / determinant,
    e: (d0.x * (s1.x * s2.y - s2.x * s1.y) + d1.x * (s2.x * s0.y - s0.x * s2.y) + d2.x * (s0.x * s1.y - s1.x * s0.y)) / determinant,
    f: (d0.y * (s1.x * s2.y - s2.x * s1.y) + d1.y * (s2.x * s0.y - s0.x * s2.y) + d2.y * (s0.x * s1.y - s1.x * s0.y)) / determinant,
  };
}

function drawTexturedTriangle(context, image, source, destination) {
  const transform = triangleTransform(source, destination);
  context.save();
  context.beginPath();
  context.moveTo(destination[0].x, destination[0].y);
  context.lineTo(destination[1].x, destination[1].y);
  context.lineTo(destination[2].x, destination[2].y);
  context.closePath();
  context.clip();
  context.transform(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f);
  context.drawImage(image, 0, 0);
  context.restore();
}

function calculateGeometry(width, height, image) {
  const outer = {
    x: Math.max(4, width * 0.035),
    y: Math.max(4, height * 0.055),
    width: width - Math.max(8, width * 0.07),
    height: height - Math.max(8, height * 0.11),
  };
  const projectedWidth = outer.width * (1 - state.fold * 0.46);
  const left = width / 2 - projectedWidth / 2;
  const panelWidth = projectedWidth / 4;
  const lift = outer.height * 0.055 * Math.sin(state.fold * Math.PI / 2);
  const top = [];
  const bottom = [];
  for (let index = 0; index <= 4; index += 1) {
    const inset = index % 2 === 1 ? lift : 0;
    top.push({ x: left + panelWidth * index, y: outer.y + inset });
    bottom.push({ x: left + panelWidth * index, y: outer.y + outer.height - inset });
  }
  const sourceWidth = image.naturalWidth / 4;
  const panels = Array.from({ length: 4 }, (_, index) => {
    const source = {
      tl: { x: sourceWidth * index, y: 0 },
      tr: { x: sourceWidth * (index + 1), y: 0 },
      br: { x: sourceWidth * (index + 1), y: image.naturalHeight },
      bl: { x: sourceWidth * index, y: image.naturalHeight },
    };
    const destination = { tl: top[index], tr: top[index + 1], br: bottom[index + 1], bl: bottom[index] };
    return { index, source, destination };
  });
  const seamErrors = panels.slice(0, -1).map((panel, index) => Math.max(
    Math.hypot(panel.destination.tr.x - panels[index + 1].destination.tl.x, panel.destination.tr.y - panels[index + 1].destination.tl.y),
    Math.hypot(panel.destination.br.x - panels[index + 1].destination.bl.x, panel.destination.br.y - panels[index + 1].destination.bl.y),
    Math.abs(panel.source.tr.x - panels[index + 1].source.tl.x),
    Math.abs(panel.source.br.x - panels[index + 1].source.bl.x),
  ));
  return {
    outer,
    panels,
    projectedWidth,
    panelWidth,
    foldAngle: Math.acos(projectedWidth / outer.width) * 180 / Math.PI,
    seamErrors,
    continuous: seamErrors.every((error) => error < 1e-6),
    sourceCoverage: panels[panels.length - 1].source.tr.x - panels[0].source.tl.x,
  };
}

function mapPointToFold(point, geometry, image) {
  const panelIndex = Math.min(3, Math.floor(point[0] / (image.naturalWidth / 4)));
  const panel = geometry.panels[panelIndex];
  const localU = (point[0] - panel.source.tl.x) / (image.naturalWidth / 4);
  const localV = point[1] / image.naturalHeight;
  const { tl, tr, br, bl } = panel.destination;
  if (localV <= localU) {
    return {
      x: (1 - localU) * tl.x + (localU - localV) * tr.x + localV * br.x,
      y: (1 - localU) * tl.y + (localU - localV) * tr.y + localV * br.y,
      panel: panelIndex,
    };
  }
  return {
    x: (1 - localV) * tl.x + localU * br.x + (localV - localU) * bl.x,
    y: (1 - localV) * tl.y + localU * br.y + (localV - localU) * bl.y,
    panel: panelIndex,
  };
}

function drawPaper(sketch, image) {
  const geometry = calculateGeometry(sketch.width, sketch.height, image);
  const context = sketch.drawingContext;
  const shadowStrength = 0.18 + state.fold * 0.24;
  sketch.clear();
  sketch.background('#071923');
  sketch.noStroke();
  sketch.fill(`rgba(0, 0, 0, ${shadowStrength})`);
  const shadowX = state.fold * 8 + 2;
  const shadowY = state.fold * 7 + 3;
  const first = geometry.panels[0].destination;
  const last = geometry.panels[3].destination;
  sketch.quad(first.tl.x + shadowX, first.tl.y + shadowY, last.tr.x + shadowX, last.tr.y + shadowY, last.br.x + shadowX, last.br.y + shadowY, first.bl.x + shadowX, first.bl.y + shadowY);

  geometry.panels.forEach((panel, index) => {
    const { source, destination } = panel;
    drawTexturedTriangle(context, image, [source.tl, source.tr, source.br], [destination.tl, destination.tr, destination.br]);
    drawTexturedTriangle(context, image, [source.tl, source.br, source.bl], [destination.tl, destination.br, destination.bl]);
    const shade = state.fold * (index % 2 === 0 ? 0.18 : 0.05);
    sketch.noStroke();
    sketch.fill(`rgba(7, 25, 35, ${shade})`);
    sketch.quad(destination.tl.x, destination.tl.y, destination.tr.x, destination.tr.y, destination.br.x, destination.br.y, destination.bl.x, destination.bl.y);
  });

  context.save();
  context.setLineDash([Math.max(2, sketch.width / 160), Math.max(2, sketch.width / 190)]);
  context.lineWidth = Math.max(0.65, sketch.width / 720);
  context.strokeStyle = `rgba(7, 25, 35, ${0.28 + state.fold * 0.45})`;
  geometry.panels.slice(0, 3).forEach((panel) => {
    context.beginPath();
    context.moveTo(panel.destination.tr.x, panel.destination.tr.y);
    context.lineTo(panel.destination.br.x, panel.destination.br.y);
    context.stroke();
  });
  context.restore();

  const active = destinations[state.destination];
  const target = mapPointToFold(active.point, geometry, image);
  const origin = mapPointToFold(routeOrigin, geometry, image);
  const landmarkPoints = destinations.map((destination) => mapPointToFold(destination.point, geometry, image));
  const marker = clamp(sketch.width / 95, 2.3, 7.5);
  sketch.noStroke();
  sketch.fill('#071923b5');
  sketch.circle(target.x + marker * 0.45, target.y + marker * 0.6, marker * 3.1);
  sketch.fill('#fff3d9');
  sketch.circle(target.x, target.y, marker * 2.75);
  sketch.fill('#d84424');
  sketch.circle(target.x, target.y, marker * 1.35);
  sketch.fill('#fff3d9');
  sketch.circle(origin.x, origin.y, marker * 1.25);
  sketch.fill('#071923');
  sketch.circle(origin.x, origin.y, marker * 0.55);

  sketch.noFill();
  sketch.stroke('#f8ead0b8');
  sketch.strokeWeight(Math.max(0.7, sketch.width / 640));
  const outline = [first.tl, last.tr, last.br, first.bl];
  sketch.beginShape();
  outline.forEach((point) => sketch.vertex(point.x, point.y));
  sketch.endShape(sketch.CLOSE);

  state.geometry = {
    faceCount: geometry.panels.length,
    triangleCount: geometry.panels.length * 2,
    sourceCoverage: geometry.sourceCoverage,
    seamErrors: geometry.seamErrors,
    maxSeamError: Math.max(...geometry.seamErrors),
    continuous: geometry.continuous,
    projectedWidth: geometry.projectedWidth,
    flatWidth: geometry.outer.width,
    foldAngle: geometry.foldAngle,
    selectedPanel: target.panel,
    expectedSelectedPanel: Math.min(3, Math.floor(active.point[0] / (image.naturalWidth / 4))),
    landmarkPanels: landmarkPoints.map((point) => point.panel),
    expectedLandmarkPanels: destinations.map((destination) => Math.min(3, Math.floor(destination.point[0] / (image.naturalWidth / 4)))),
    landmarkPointsVisible: landmarkPoints.every((point) => point.x >= 0 && point.x <= sketch.width && point.y >= 0 && point.y <= sketch.height),
    selectedPointVisible: target.x >= 0 && target.x <= sketch.width && target.y >= 0 && target.y <= sketch.height,
    routeOriginVisible: origin.x >= 0 && origin.x <= sketch.width && origin.y >= 0 && origin.y <= sketch.height,
    canvasWidth: sketch.width,
    canvasHeight: sketch.height,
  };
  state.renderCount += 1;
  state.initialStill ||= { fold: state.fold, destination: state.destination, inputCount: state.inputCount };
}

async function start() {
  const image = await loadAsset();
  let renderer;
  let sketchInstance;
  const initialized = new Promise((resolve, reject) => {
    try {
      sketchInstance = new p5((sketch) => {
        sketch.setup = () => {
          sketch.pixelDensity(1);
          renderer = sketch.createCanvas(innerWidth, innerHeight);
          renderer.elt.setAttribute('aria-hidden', 'true');
          sketch.noLoop();
          resolve(sketch);
        };
      }, stage);
    } catch (error) {
      reject(error);
    }
  });
  const sketch = await initialized;
  renderCurrent = () => {
    if (sketch.width !== innerWidth || sketch.height !== innerHeight) {
      sketch.resizeCanvas(innerWidth, innerHeight);
    }
    drawPaper(sketch, image);
  };
  syncControls();

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const geometry = state.geometry;
    const asset = state.asset;
    return sketchInstance instanceof p5 &&
      renderer?.elt instanceof HTMLCanvasElement &&
      sketch.drawingContext instanceof CanvasRenderingContext2D &&
      sketch.pixelDensity() === 1 &&
      sketch.width === innerWidth &&
      sketch.height === innerHeight &&
      state.id === 'kinetic-paper-fold-map' &&
      state.claimedLibrary === 'p5@2.3.0' &&
      state.mechanism === 'p5-canvas2d-four-panel-eight-affine-texture-triangle-fold' &&
      state.renderCount > 0 &&
      state.autoPlayback === false &&
      state.rehearsal === false &&
      state.fallback === false &&
      state.syntheticInput === false &&
      state.captureClockMutation === false &&
      state.userInputRequired === true &&
      state.strictTrustedInputGuard === true &&
      asset?.requested === true &&
      asset?.decoded === true &&
      asset?.sameOrigin === true &&
      asset?.bytes === EXPECTED_ASSET.bytes &&
      asset?.sha256 === EXPECTED_ASSET.sha256 &&
      asset?.width === EXPECTED_ASSET.width &&
      asset?.height === EXPECTED_ASSET.height &&
      asset?.pixelCount === EXPECTED_ASSET.width * EXPECTED_ASSET.height &&
      asset?.rgbaBytes === EXPECTED_ASSET.width * EXPECTED_ASSET.height * 4 &&
      asset?.pixelFingerprint > 0 &&
      asset?.samples?.length === destinations.length + 1 &&
      asset.samples.every((sample) => sample.length === 4 && sample[3] === 255) &&
      new Set(asset.samples.map((sample) => sample.slice(0, 3).join(','))).size === destinations.length + 1 &&
      geometry?.faceCount === 4 &&
      geometry?.triangleCount === 8 &&
      geometry?.sourceCoverage === EXPECTED_ASSET.width &&
      geometry?.continuous === true &&
      geometry?.maxSeamError < 1e-6 &&
      geometry?.projectedWidth > 0 &&
      geometry?.projectedWidth <= geometry?.flatWidth &&
      Math.abs(geometry?.foldAngle - Math.acos(geometry?.projectedWidth / geometry?.flatWidth) * 180 / Math.PI) < 1e-9 &&
      geometry?.selectedPanel === geometry?.expectedSelectedPanel &&
      JSON.stringify(geometry?.landmarkPanels) === JSON.stringify(geometry?.expectedLandmarkPanels) &&
      geometry?.landmarkPointsVisible === true &&
      geometry?.selectedPointVisible === true &&
      geometry?.routeOriginVisible === true &&
      geometry?.canvasWidth === innerWidth &&
      geometry?.canvasHeight === innerHeight &&
      state.initialStill?.fold === 0 &&
      state.initialStill?.destination === 0 &&
      state.initialStill?.inputCount === 0 &&
      state.fold >= 0 && state.fold <= 1 &&
      state.destination >= 0 && state.destination < destinations.length &&
      state.geometryMutationCount + state.destinationMutationCount === state.visualMutationCount &&
      (state.visualMutationCount === 0 || state.inputCount > 0) &&
      (state.inputCount === 0 || (state.firstInput?.trusted === true && state.lastInput?.trusted === true)) &&
      state.pointerCaptureCount >= state.pointerReleaseCount &&
      state.rejectedInputCount === 0;
  };

  window.__PREVIEW_STATE__ = () => ({
    task: state.task,
    mechanism: state.mechanism,
    library: state.claimedLibrary,
    acceptedInputs: state.acceptedInputs,
    userInputRequired: state.userInputRequired,
    strictTrustedInputGuard: state.strictTrustedInputGuard,
    fold: Number(state.fold.toFixed(4)),
    destination: destinations[state.destination].name,
    destinationIndex: state.destination,
    inputCount: state.inputCount,
    inputCounts: { ...state.inputCounts },
    visualMutationCount: state.visualMutationCount,
    geometryMutationCount: state.geometryMutationCount,
    destinationMutationCount: state.destinationMutationCount,
    pointerCaptureCount: state.pointerCaptureCount,
    pointerReleaseCount: state.pointerReleaseCount,
    rejectedInputCount: state.rejectedInputCount,
    firstInput: state.firstInput,
    lastInput: state.lastInput,
    initialStill: state.initialStill,
    asset: state.asset,
    geometry: state.geometry,
    autoPlayback: state.autoPlayback,
    rehearsal: state.rehearsal,
    fallback: state.fallback,
    syntheticInput: state.syntheticInput,
    captureClockMutation: state.captureClockMutation,
    ready: window.__PREVIEW_READY__ === true,
  });

  installPreviewController({
    id: 'kinetic-paper-fold-map',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    ready: Promise.resolve(),
    render: renderCurrent,
  });
}

start().catch(markPreviewFailure);
