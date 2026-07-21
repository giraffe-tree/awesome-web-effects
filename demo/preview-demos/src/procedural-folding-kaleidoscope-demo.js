import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const DESIGN_WIDTH = 320;
const DESIGN_HEIGHT = 180;
const MIN_FOLDS = 4;
const MAX_FOLDS = 10;
const INITIAL_FOLDS = 6;
const INITIAL_SAMPLE = Object.freeze({ x: 0.47, y: 0.49 });
const EXPECTED_ASSET_SHA256 = 'ce776202b72992c05a4e41e03d2e5ddc4f89289dc4599833b802aadab66af6a6';
const EXPECTED_ASSET_BYTES = 578402;
const ARTWORK_URL = new URL('../assets/aesthetic-wave-06/procedural-folding-kaleidoscope/wrapping-printmaster.jpg', import.meta.url).href;

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const round = (value, places = 4) => Number(value.toFixed(places));

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function fnv1a(bytes, stride = 1) {
  let value = 2166136261;
  for (let index = 0; index < bytes.length; index += stride) {
    value ^= bytes[index];
    value = Math.imul(value, 16777619) >>> 0;
  }
  return value >>> 0;
}

async function sha256(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

try {
  const stage = document.querySelector('#fold-proof-stage');
  const canvas = document.querySelector('#fold-proof-canvas');
  const foldOutput = document.querySelector('#fold-count');
  const lessButton = document.querySelector('#fold-less');
  const moreButton = document.querySelector('#fold-more');
  const resetButton = document.querySelector('#fold-reset');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  let p5Instance;
  let sketch;
  let artwork;
  let artworkObjectUrl = '';
  let resolveCanvasReady;
  let dirty = true;
  let dragOrigin = null;

  const state = {
    id: 'procedural-folding-kaleidoscope',
    task: 'human-operated-wrapping-paper-folding-proof',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'local-raster-sampled-into-clipped-alternating-mirror-sectors',
    captureType: 'interactive',
    causality: 'trusted-human-input-only',
    acceptedInputs: ['mouse-hover', 'mouse-drag', 'touch-drag', 'pen-drag', 'keyboard', 'button'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    automaticPath: false,
    automaticPlayback: false,
    automaticFallback: false,
    rehearsalMode: false,
    previewClockDriven: false,
    previewClockMutation: false,
    visualMutationFromPreviewClock: false,
    syntheticInputDispatch: false,
    initialFolds: INITIAL_FOLDS,
    folds: INITIAL_FOLDS,
    minimumFolds: MIN_FOLDS,
    maximumFolds: MAX_FOLDS,
    initialSample: { ...INITIAL_SAMPLE },
    sample: { ...INITIAL_SAMPLE },
    initialStillVerified: false,
    reducedMotion: reducedMotionQuery.matches,
    ready: false,
    listenersBound: false,
    activePointerId: null,
    activePointerType: 'none',
    pointerCaptured: false,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedCount: 0,
    hoverInputCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    keyboardInputCount: 0,
    buttonInputCount: 0,
    pointerDownCount: 0,
    pointerDragCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    mutationCount: 0,
    humanMutationCount: 0,
    nonInputMutationCount: 0,
    foldMutationCount: 0,
    sampleMutationCount: 0,
    resetCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false,
    transitionRecords: [],
    assetUrl: ARTWORK_URL,
    assetFetchCount: 0,
    assetFetchStatus: 0,
    assetMimeType: '',
    assetByteLength: 0,
    assetDecoded: false,
    assetDecodeCount: 0,
    assetNaturalWidth: 0,
    assetNaturalHeight: 0,
    assetSha256: '',
    expectedAssetSha256: EXPECTED_ASSET_SHA256,
    assetChecksumVerified: false,
    p5ImageCreated: false,
    p5ImagePixelCount: 0,
    p5ImagePixelByteLength: 0,
    sourcePixelChecksum: 0,
    sourceDistinctColorBuckets: 0,
    sourceLuminanceRange: 0,
    samplePixelCount: 0,
    samplePixelChecksum: 0,
    sampleDistinctColorBuckets: 0,
    sampleLuminanceRange: 0,
    sampleInkCoverage: 0,
    printVerdict: 'WAITING',
    p5CanvasCreated: false,
    p5DrawCount: 0,
    p5ImageDrawCalls: 0,
    sourcePreviewDrawCalls: 0,
    topologySectorDrawCalls: 0,
    lastDrawnAssetSha256: '',
    currentSectorCount: INITIAL_FOLDS * 2,
    currentMirroredSectorCount: INITIAL_FOLDS,
    currentClipCount: INITIAL_FOLDS * 2,
    currentWedgeRadians: Math.PI / INITIAL_FOLDS,
    topologyRecords: [],
    renderedSampleCount: 0,
    renderedPixelChecksum: 0,
    renderedLuminanceRange: 0,
    initialRenderedPixelChecksum: 0,
    redrawRequestCount: 0,
    resizeCount: 0,
    previewRenderCalls: 0,
    previewManualRenderCalls: 0,
    layout: { width: DESIGN_WIDTH, height: DESIGN_HEIGHT, dpr: 1, scale: 1, offsetX: 0, offsetY: 0 },
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__PROCEDURAL_FOLDING_KALEIDOSCOPE_STATE__ = state;

  function updateEvidenceDataset() {
    stage.dataset.folds = String(state.folds);
    stage.dataset.sectors = String(state.currentSectorCount);
    stage.dataset.sampleX = state.sample.x.toFixed(4);
    stage.dataset.sampleY = state.sample.y.toFixed(4);
    stage.dataset.inkCoverage = state.sampleInkCoverage.toFixed(4);
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedCount = String(state.rejectedUntrustedCount);
    stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
    stage.dataset.pointerCaptureReleaseCount = String(state.pointerCaptureReleaseCount);
    stage.dataset.keyboardInputCount = String(state.keyboardInputCount);
    stage.dataset.buttonInputCount = String(state.buttonInputCount);
    stage.dataset.mutationCount = String(state.mutationCount);
    stage.dataset.assetChecksumVerified = String(state.assetChecksumVerified);
    stage.dataset.samplePixelChecksum = String(state.samplePixelChecksum);
    stage.dataset.automaticPath = String(state.automaticPath);
    stage.dataset.previewClockMutation = String(state.previewClockMutation);
    stage.dataset.syntheticInputDispatch = String(state.syntheticInputDispatch);
  }

  function updateInterface() {
    foldOutput.value = `${String(state.folds).padStart(2, '0')} FOLDS`;
    foldOutput.textContent = foldOutput.value;
    canvas.setAttribute('aria-valuenow', String(state.folds));
    canvas.setAttribute('aria-valuetext', `${state.folds} folds, ${state.folds * 2} mirrored print panels`);
    lessButton.disabled = state.folds <= MIN_FOLDS;
    moreButton.disabled = state.folds >= MAX_FOLDS;
    updateEvidenceDataset();
  }

  function rejectUntrusted(event, source) {
    if (event?.isTrusted === true) return false;
    state.rejectedUntrustedCount += 1;
    state.lastInputTrusted = false;
    state.lastInputSource = source;
    updateEvidenceDataset();
    return true;
  }

  function acceptInput(event, kind, source) {
    if (rejectUntrusted(event, source)) return false;
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    if (kind === 'hover') state.hoverInputCount += 1;
    if (kind === 'mouse') state.mouseInputCount += 1;
    if (kind === 'touch') state.touchInputCount += 1;
    if (kind === 'pen') state.penInputCount += 1;
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    if (kind === 'button') state.buttonInputCount += 1;
    updateEvidenceDataset();
    return true;
  }

  function requestDraw(reason) {
    dirty = true;
    state.redrawRequestCount += 1;
    state.lastRedrawReason = reason;
    p5Instance?.redraw();
  }

  function sampleArtworkWindow() {
    if (!artwork?.pixels?.length) return;
    const halfWindow = 92;
    const centerX = Math.round(state.sample.x * (artwork.width - 1));
    const centerY = Math.round(state.sample.y * (artwork.height - 1));
    const minimumX = clamp(centerX - halfWindow, 0, artwork.width - 1);
    const maximumX = clamp(centerX + halfWindow, 0, artwork.width - 1);
    const minimumY = clamp(centerY - halfWindow, 0, artwork.height - 1);
    const maximumY = clamp(centerY + halfWindow, 0, artwork.height - 1);
    const sampled = [];
    const buckets = new Set();
    let luminanceMinimum = 255;
    let luminanceMaximum = 0;
    let inkPixels = 0;
    let pixelCount = 0;

    for (let y = minimumY; y <= maximumY; y += 5) {
      for (let x = minimumX; x <= maximumX; x += 5) {
        const offset = (y * artwork.width + x) * 4;
        const red = artwork.pixels[offset];
        const green = artwork.pixels[offset + 1];
        const blue = artwork.pixels[offset + 2];
        const maximum = Math.max(red, green, blue);
        const minimum = Math.min(red, green, blue);
        const saturation = maximum === 0 ? 0 : (maximum - minimum) / maximum;
        const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
        if (saturation > 0.17 || luminance < 185) inkPixels += 1;
        luminanceMinimum = Math.min(luminanceMinimum, luminance);
        luminanceMaximum = Math.max(luminanceMaximum, luminance);
        buckets.add(`${red >> 4}-${green >> 4}-${blue >> 4}`);
        sampled.push(red, green, blue);
        pixelCount += 1;
      }
    }

    state.samplePixelCount = pixelCount;
    state.samplePixelChecksum = fnv1a(sampled, 1);
    state.sampleDistinctColorBuckets = buckets.size;
    state.sampleLuminanceRange = round(luminanceMaximum - luminanceMinimum, 2);
    state.sampleInkCoverage = round(inkPixels / Math.max(1, pixelCount), 4);
    state.printVerdict = state.sampleLuminanceRange > 72 && state.sampleDistinctColorBuckets > 32
      ? 'PRESS READY'
      : 'LOW CONTRAST';
  }

  function mutateFromTrustedInput(event, patch, source) {
    if (event?.isTrusted !== true) {
      state.nonInputMutationCount += 1;
      updateEvidenceDataset();
      return false;
    }

    const before = { folds: state.folds, x: state.sample.x, y: state.sample.y };
    const nextFolds = patch.folds === undefined
      ? before.folds
      : clamp(Math.round(patch.folds), MIN_FOLDS, MAX_FOLDS);
    const nextX = patch.x === undefined ? before.x : clamp(patch.x, 0.12, 0.88);
    const nextY = patch.y === undefined ? before.y : clamp(patch.y, 0.12, 0.88);
    const foldsChanged = nextFolds !== before.folds;
    const sampleChanged = Math.abs(nextX - before.x) > 0.0001 || Math.abs(nextY - before.y) > 0.0001;
    if (!foldsChanged && !sampleChanged) return false;

    state.folds = nextFolds;
    state.sample.x = nextX;
    state.sample.y = nextY;
    state.mutationCount += 1;
    state.humanMutationCount += 1;
    if (foldsChanged) state.foldMutationCount += 1;
    if (sampleChanged) state.sampleMutationCount += 1;
    if (source === 'button-reset' || source === 'keyboard-r') state.resetCount += 1;
    sampleArtworkWindow();
    state.transitionRecords.push({
      source,
      kind: state.lastInputKind,
      trusted: true,
      before: { folds: before.folds, x: round(before.x), y: round(before.y) },
      after: { folds: nextFolds, x: round(nextX), y: round(nextY) },
      samplePixelChecksum: state.samplePixelChecksum,
    });
    if (state.transitionRecords.length > 96) state.transitionRecords.shift();
    updateInterface();
    requestDraw(`trusted-${source}`);
    return true;
  }

  function updateLayout() {
    const width = Math.max(1, Math.round(stage.clientWidth || DESIGN_WIDTH));
    const height = Math.max(1, Math.round(stage.clientHeight || DESIGN_HEIGHT));
    const changed = !p5Instance || p5Instance.width !== width || p5Instance.height !== height;
    if (changed && p5Instance) {
      p5Instance.resizeCanvas(width, height, false);
      state.resizeCount += 1;
    }
    const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
    state.layout = {
      width,
      height,
      dpr: 1,
      scale,
      offsetX: (width - DESIGN_WIDTH * scale) / 2,
      offsetY: (height - DESIGN_HEIGHT * scale) / 2,
    };
    return changed;
  }

  function pointerToDesign(event) {
    const bounds = canvas.getBoundingClientRect();
    const localX = (event.clientX - bounds.left - state.layout.offsetX) / Math.max(0.0001, state.layout.scale);
    const localY = (event.clientY - bounds.top - state.layout.offsetY) / Math.max(0.0001, state.layout.scale);
    return {
      designX: localX,
      designY: localY,
      x: clamp(localX / DESIGN_WIDTH, 0.12, 0.88),
      y: clamp(localY / DESIGN_HEIGHT, 0.12, 0.88),
    };
  }

  function drawRegistrationMarks(p, centerX, centerY, radius) {
    p.noFill();
    p.stroke('rgba(43,20,46,.40)');
    p.strokeWeight(0.7);
    for (let index = 0; index < 4; index += 1) {
      const angle = index * Math.PI / 2;
      const inner = radius + 4;
      const outer = radius + 8;
      p.line(
        centerX + Math.cos(angle) * inner,
        centerY + Math.sin(angle) * inner,
        centerX + Math.cos(angle) * outer,
        centerY + Math.sin(angle) * outer,
      );
    }
    p.circle(centerX, centerY, radius * 2 + 2);
    p.stroke('rgba(240,74,44,.42)');
    p.strokeWeight(0.65);
    p.circle(centerX, centerY, radius * 2 + 8);
  }

  function drawSourceProof(p) {
    const x = 14;
    const y = 101;
    const width = 76;
    const height = 43;
    p.push();
    p.noStroke();
    p.fill('#f2e6cf');
    p.rect(x - 2, y - 2, width + 4, height + 4, 2);
    p.image(artwork, x, y, width, height, 0, 0, artwork.width, artwork.height);
    state.p5ImageDrawCalls += 1;
    state.sourcePreviewDrawCalls += 1;
    const crossX = x + state.sample.x * width;
    const crossY = y + state.sample.y * height;
    p.noFill();
    p.stroke('#f8eedb');
    p.strokeWeight(1.7);
    p.circle(crossX, crossY, 7);
    p.stroke('#28142c');
    p.strokeWeight(0.7);
    p.circle(crossX, crossY, 7);
    p.line(crossX - 5, crossY, crossX + 5, crossY);
    p.line(crossX, crossY - 5, crossX, crossY + 5);
    p.pop();
  }

  function drawFoldedArtwork(p, centerX, centerY, radius) {
    const context = p.drawingContext;
    const folds = state.folds;
    const wedge = Math.PI / folds;
    const sectorCount = folds * 2;
    const cropSize = Math.round(artwork.width * 0.39);
    const sourceX = clamp(
      Math.round(state.sample.x * artwork.width - cropSize / 2),
      0,
      artwork.width - cropSize,
    );
    const sourceY = clamp(
      Math.round(state.sample.y * artwork.height - cropSize / 2),
      0,
      artwork.height - cropSize,
    );
    const records = [];
    let mirroredCount = 0;

    p.push();
    p.noStroke();
    p.fill('#f8edda');
    p.circle(centerX, centerY, radius * 2 + 6);
    p.pop();

    for (let sector = 0; sector < sectorCount; sector += 1) {
      const mirrored = sector % 2 === 1;
      context.save();
      context.translate(centerX, centerY);
      context.rotate(sector * wedge);
      if (mirrored) {
        context.scale(1, -1);
        mirroredCount += 1;
      }
      context.beginPath();
      context.moveTo(0, 0);
      context.arc(0, 0, radius, -wedge / 2 - 0.002, wedge / 2 + 0.002);
      context.closePath();
      context.clip();
      p.image(
        artwork,
        -radius,
        -radius,
        radius * 2,
        radius * 2,
        sourceX,
        sourceY,
        cropSize,
        cropSize,
      );
      context.restore();
      state.p5ImageDrawCalls += 1;
      state.topologySectorDrawCalls += 1;
      records.push({ sector, mirrored, rotation: round(sector * wedge, 6), clip: true, assetSha256: state.assetSha256 });
    }

    state.currentSectorCount = sectorCount;
    state.currentMirroredSectorCount = mirroredCount;
    state.currentClipCount = records.filter(record => record.clip).length;
    state.currentWedgeRadians = round(wedge, 6);
    state.topologyRecords = records;
    state.lastDrawnAssetSha256 = state.assetSha256;
  }

  function drawCopy(p) {
    p.noStroke();
    p.fill('#f2e5ce');
    p.textFont('ui-monospace, monospace');
    p.textStyle(p.BOLD);
    p.textSize(4.6);
    p.textAlign(p.LEFT, p.TOP);
    p.text('WRAP LAB / PRESS 04', 14, 32);

    p.textFont('system-ui, sans-serif');
    p.textStyle(p.BOLD);
    p.textSize(18.5);
    p.textLeading(16.5);
    p.text('FOLDING\nPROOF', 13, 44);

    p.fill('#f2a147');
    p.textFont('ui-monospace, monospace');
    p.textSize(4.2);
    p.textLeading(6);
    p.text(`INK ${Math.round(state.sampleInkCoverage * 100)}%  ·  ΔL ${Math.round(state.sampleLuminanceRange)}\n${state.printVerdict}`, 14, 82);

    p.fill('rgba(244,232,211,.68)');
    p.textSize(3.9);
    p.textLeading(5.3);
    p.text('MOVE / SAMPLE\nDRAG ↔ / REFOLD', 14, 153);

    p.fill('rgba(40,20,44,.66)');
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(4.2);
    p.text(`${state.folds * 2} MIRRORED PANELS  ·  SAMPLE ${String(state.samplePixelChecksum).slice(-5).padStart(5, '0')}`, 223, 173);
  }

  function sampleRenderedCanvas() {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!canvas.width || !canvas.height) return;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const stride = Math.max(4, Math.floor(pixels.length / 4096 / 4) * 4);
    let luminanceMinimum = 255;
    let luminanceMaximum = 0;
    let count = 0;
    for (let index = 0; index < pixels.length; index += stride) {
      const luminance = pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722;
      luminanceMinimum = Math.min(luminanceMinimum, luminance);
      luminanceMaximum = Math.max(luminanceMaximum, luminance);
      count += 1;
    }
    state.renderedSampleCount = count;
    state.renderedPixelChecksum = fnv1a(pixels, stride);
    state.renderedLuminanceRange = round(luminanceMaximum - luminanceMinimum, 2);
    if (state.p5DrawCount === 1) state.initialRenderedPixelChecksum = state.renderedPixelChecksum;
  }

  function drawScene() {
    if (!state.ready || !artwork) return;
    updateLayout();
    const p = p5Instance;
    p.clear();
    p.background('#efe6d3');
    p.push();
    p.translate(state.layout.offsetX, state.layout.offsetY);
    p.scale(state.layout.scale);

    p.noStroke();
    p.fill('#28142c');
    p.rect(0, 0, 108, DESIGN_HEIGHT);
    p.fill('#e9dcc6');
    p.rect(108, 0, DESIGN_WIDTH - 108, DESIGN_HEIGHT);

    p.stroke('rgba(40,20,44,.08)');
    p.strokeWeight(0.55);
    for (let x = 117; x < DESIGN_WIDTH; x += 18) p.line(x, 0, x, DESIGN_HEIGHT);
    for (let y = 9; y < DESIGN_HEIGHT; y += 18) p.line(108, y, DESIGN_WIDTH, y);

    drawSourceProof(p);
    p.stroke('rgba(240,74,44,.48)');
    p.strokeWeight(0.65);
    p.drawingContext.setLineDash([2, 2]);
    p.line(91, 123, 143, 106);
    p.drawingContext.setLineDash([]);
    p.noStroke();
    p.fill('#f04a2c');
    p.circle(143, 106, 2.6);

    const centerX = 224;
    const centerY = 96;
    const radius = 66;
    p.noStroke();
    p.fill('rgba(63,30,52,.12)');
    p.circle(centerX + 3, centerY + 5, radius * 2 + 10);
    drawFoldedArtwork(p, centerX, centerY, radius);
    drawRegistrationMarks(p, centerX, centerY, radius);

    p.stroke('rgba(246,235,214,.52)');
    p.strokeWeight(0.45);
    for (let sector = 0; sector < state.currentSectorCount; sector += 1) {
      const angle = sector * state.currentWedgeRadians - state.currentWedgeRadians / 2;
      p.line(centerX, centerY, centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
    }
    p.noStroke();
    p.fill('#f6ead5');
    p.circle(centerX, centerY, 4.2);
    p.fill('#28142c');
    p.circle(centerX, centerY, 1.8);
    drawCopy(p);
    p.pop();

    state.p5DrawCount += 1;
    if (state.p5DrawCount === 1) {
      state.initialStillVerified = state.inputCount === 0
        && state.mutationCount === 0
        && state.folds === INITIAL_FOLDS
        && Math.abs(state.sample.x - INITIAL_SAMPLE.x) < 0.0001
        && Math.abs(state.sample.y - INITIAL_SAMPLE.y) < 0.0001
        && state.automaticPath === false
        && state.previewClockMutation === false;
    }
    sampleRenderedCanvas();
    dirty = false;
    updateEvidenceDataset();
  }

  const canvasReady = new Promise(resolve => { resolveCanvasReady = resolve; });
  sketch = new p5(instance => {
    p5Instance = instance;
    instance.setup = () => {
      const width = Math.max(1, Math.round(stage.clientWidth || DESIGN_WIDTH));
      const height = Math.max(1, Math.round(stage.clientHeight || DESIGN_HEIGHT));
      instance.pixelDensity(1);
      instance.createCanvas(width, height, instance.P2D, canvas);
      instance.noLoop();
      state.p5CanvasCreated = true;
      resolveCanvasReady();
    };
    instance.draw = drawScene;
  }, stage);

  function loadP5Image(url) {
    return new Promise((resolve, reject) => {
      p5Instance.loadImage(url, resolve, () => reject(new Error('p5 could not decode the generated wrapping printmaster')));
    });
  }

  async function loadArtwork() {
    const response = await fetch(ARTWORK_URL, { cache: 'force-cache' });
    state.assetFetchCount += 1;
    state.assetFetchStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    if (!response.ok) throw new Error(`Wrapping printmaster request failed: HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    state.assetByteLength = buffer.byteLength;
    state.assetSha256 = await sha256(buffer);
    state.assetChecksumVerified = state.assetSha256 === EXPECTED_ASSET_SHA256;
    if (!state.assetChecksumVerified) throw new Error('Wrapping printmaster checksum does not match the recorded local asset');

    artworkObjectUrl = URL.createObjectURL(new Blob([buffer], { type: state.assetMimeType || 'image/jpeg' }));
    const image = await loadP5Image(artworkObjectUrl);
    if (image.width !== 960 || image.height !== 960) {
      throw new Error(`Unexpected wrapping printmaster dimensions: ${image.width}x${image.height}`);
    }
    image.loadPixels();
    state.assetDecoded = true;
    state.assetDecodeCount += 1;
    state.assetNaturalWidth = image.width;
    state.assetNaturalHeight = image.height;
    state.p5ImageCreated = image instanceof p5.Image;
    state.p5ImagePixelCount = image.width * image.height;
    state.p5ImagePixelByteLength = image.pixels.length;
    state.sourcePixelChecksum = fnv1a(image.pixels, 97);

    const buckets = new Set();
    let luminanceMinimum = 255;
    let luminanceMaximum = 0;
    for (let index = 0; index < image.pixels.length; index += 4 * 113) {
      const red = image.pixels[index];
      const green = image.pixels[index + 1];
      const blue = image.pixels[index + 2];
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      luminanceMinimum = Math.min(luminanceMinimum, luminance);
      luminanceMaximum = Math.max(luminanceMaximum, luminance);
      buckets.add(`${red >> 4}-${green >> 4}-${blue >> 4}`);
    }
    state.sourceDistinctColorBuckets = buckets.size;
    state.sourceLuminanceRange = round(luminanceMaximum - luminanceMinimum, 2);
    return image;
  }

  function pointerDown(event) {
    if (!state.ready || !event.isPrimary || (event.button !== undefined && event.button !== 0)) return;
    const pointerType = event.pointerType || 'mouse';
    if (!acceptInput(event, pointerType, `pointer-${pointerType}-down`)) return;
    event.preventDefault();
    state.pointerDownCount += 1;
    state.activePointerId = event.pointerId;
    state.activePointerType = pointerType;
    const point = pointerToDesign(event);
    dragOrigin = {
      designX: point.designX,
      designY: point.designY,
      folds: state.folds,
      sampleX: state.sample.x,
      sampleY: state.sample.y,
    };
    try {
      canvas.setPointerCapture(event.pointerId);
      state.pointerCaptured = canvas.hasPointerCapture(event.pointerId);
      if (state.pointerCaptured) state.pointerCaptureCount += 1;
    } catch {
      state.pointerCaptured = false;
    }
    mutateFromTrustedInput(event, { x: point.x, y: point.y }, `pointer-${pointerType}-down`);
  }

  function pointerMove(event) {
    if (!state.ready) return;
    const point = pointerToDesign(event);
    const pointerType = event.pointerType || state.activePointerType || 'mouse';
    if (state.activePointerId === null) {
      if (pointerType !== 'mouse' || !acceptInput(event, 'hover', 'pointer-mouse-hover')) return;
      mutateFromTrustedInput(event, { x: point.x, y: point.y }, 'pointer-mouse-hover');
      return;
    }
    if (event.pointerId !== state.activePointerId || !dragOrigin) return;
    if (!acceptInput(event, pointerType, `pointer-${pointerType}-drag`)) return;
    event.preventDefault();
    state.pointerDragCount += 1;
    const deltaX = point.designX - dragOrigin.designX;
    const deltaY = point.designY - dragOrigin.designY;
    mutateFromTrustedInput(event, {
      folds: dragOrigin.folds + Math.round(deltaX / 18),
      x: dragOrigin.sampleX + deltaX / 250,
      y: dragOrigin.sampleY + deltaY / 150,
    }, `pointer-${pointerType}-drag`);
  }

  function finishPointer(event, cancelled = false) {
    if (event.pointerId !== state.activePointerId) return;
    const pointerType = event.pointerType || state.activePointerType || 'mouse';
    if (!acceptInput(event, pointerType, cancelled ? `pointer-${pointerType}-cancel` : `pointer-${pointerType}-up`)) return;
    event.preventDefault();
    if (state.pointerCaptured) {
      try {
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      } catch {}
      state.pointerCaptureReleaseCount += 1;
    }
    state.pointerCaptured = false;
    state.activePointerId = null;
    state.activePointerType = 'none';
    dragOrigin = null;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    updateEvidenceDataset();
  }

  function keyDown(event) {
    const key = event.key.toLowerCase();
    const allowed = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!allowed.includes(event.key) && key !== 'r') return;
    if (!acceptInput(event, 'keyboard', key === 'r' ? 'keyboard-r' : `keyboard-${event.key}`)) return;
    event.preventDefault();
    if (key === 'r') {
      mutateFromTrustedInput(event, { folds: INITIAL_FOLDS, ...INITIAL_SAMPLE }, 'keyboard-r');
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End') {
      const folds = event.key === 'Home'
        ? MIN_FOLDS
        : event.key === 'End'
          ? MAX_FOLDS
          : state.folds + (event.key === 'ArrowRight' ? 1 : -1);
      mutateFromTrustedInput(event, { folds }, `keyboard-${event.key}`);
      return;
    }
    mutateFromTrustedInput(event, {
      y: state.sample.y + (event.key === 'ArrowDown' ? 0.08 : -0.08),
    }, `keyboard-${event.key}`);
  }

  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', event => finishPointer(event, false));
  canvas.addEventListener('pointercancel', event => finishPointer(event, true));
  canvas.addEventListener('keydown', keyDown);
  lessButton.addEventListener('click', event => {
    if (!acceptInput(event, 'button', 'button-less')) return;
    mutateFromTrustedInput(event, { folds: state.folds - 1 }, 'button-less');
  });
  moreButton.addEventListener('click', event => {
    if (!acceptInput(event, 'button', 'button-more')) return;
    mutateFromTrustedInput(event, { folds: state.folds + 1 }, 'button-more');
  });
  resetButton.addEventListener('click', event => {
    if (!acceptInput(event, 'button', 'button-reset')) return;
    mutateFromTrustedInput(event, { folds: INITIAL_FOLDS, ...INITIAL_SAMPLE }, 'button-reset');
  });
  reducedMotionQuery.addEventListener?.('change', event => { state.reducedMotion = event.matches; });
  state.listenersBound = true;

  const resourcesReady = Promise.all([document.fonts.ready, canvasReady, loadArtwork()]).then(([, , image]) => {
    artwork = image;
    sampleArtworkWindow();
    state.ready = true;
    updateInterface();
    requestDraw('resources-ready');
  }, error => {
    markPreviewFailure(error);
    return new Promise(() => {});
  });

  new ResizeObserver(entries => {
    if (!entries[0] || !p5Instance) return;
    requestDraw('resize');
  }).observe(stage);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const transitionEvidence = state.transitionRecords.every(record => record.trusted === true
      && /^(pointer-(mouse|touch|pen)-(down|drag)|pointer-mouse-hover|keyboard-(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End|r)|button-(less|more|reset))$/.test(record.source)
      && record.after.folds >= MIN_FOLDS
      && record.after.folds <= MAX_FOLDS
      && record.after.x >= 0.12
      && record.after.x <= 0.88
      && record.after.y >= 0.12
      && record.after.y <= 0.88
      && Number.isInteger(record.samplePixelChecksum));
    const inputAccounting = state.trustedInputCount === state.inputCount
      && state.inputCount === state.hoverInputCount
        + state.mouseInputCount
        + state.touchInputCount
        + state.penInputCount
        + state.keyboardInputCount
        + state.buttonInputCount
      && state.humanMutationCount === state.mutationCount
      && state.transitionRecords.length <= state.mutationCount
      && (state.mutationCount === 0 || state.transitionRecords.length > 0);
    const pointerCaptureAccounting = state.pointerCaptureReleaseCount <= state.pointerCaptureCount
      && state.pointerCaptureCount - state.pointerCaptureReleaseCount <= (state.pointerCaptured ? 1 : 0);
    const assetEvidence = state.assetFetchCount === 1
      && state.assetFetchStatus === 200
      && state.assetMimeType.includes('image/jpeg')
      && state.assetByteLength === EXPECTED_ASSET_BYTES
      && state.assetDecodeCount === 1
      && state.assetDecoded
      && state.assetNaturalWidth === 960
      && state.assetNaturalHeight === 960
      && state.assetSha256 === EXPECTED_ASSET_SHA256
      && state.assetChecksumVerified
      && state.p5ImageCreated
      && state.p5ImagePixelCount === 960 * 960
      && state.p5ImagePixelByteLength === 960 * 960 * 4
      && state.sourcePixelChecksum > 0
      && state.sourceDistinctColorBuckets > 100
      && state.sourceLuminanceRange > 150
      && state.samplePixelCount > 1_000
      && state.samplePixelChecksum > 0
      && state.sampleDistinctColorBuckets > 32
      && state.sampleLuminanceRange > 72
      && state.sampleInkCoverage > 0.08
      && state.sampleInkCoverage < 0.96
      && state.printVerdict === 'PRESS READY'
      && state.p5ImageDrawCalls >= state.currentSectorCount + 1
      && state.sourcePreviewDrawCalls > 0
      && state.topologySectorDrawCalls >= state.currentSectorCount
      && state.lastDrawnAssetSha256 === EXPECTED_ASSET_SHA256;
    const topologyEvidence = state.currentSectorCount === state.folds * 2
      && state.currentMirroredSectorCount === state.folds
      && state.currentClipCount === state.currentSectorCount
      && Math.abs(state.currentWedgeRadians - Math.PI / state.folds) < 0.000002
      && state.topologyRecords.length === state.currentSectorCount
      && state.topologyRecords.every((record, index) => record.sector === index
        && record.clip === true
        && record.mirrored === (index % 2 === 1)
        && record.assetSha256 === EXPECTED_ASSET_SHA256);

    return sketch instanceof p5
      && window.__PREVIEW_META__?.library === state.claimedLibrary
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && stage.dataset.previewMechanism === 'p5-image-sampled-mirrored-folding-print-proof'
      && !!canvas.getContext('2d')
      && state.p5CanvasCreated
      && state.ready
      && state.initialStillVerified
      && state.listenersBound
      && state.captureType === 'interactive'
      && state.causality === 'trusted-human-input-only'
      && state.userInputRequired
      && state.strictTrustedInputGuard
      && state.automaticPath === false
      && state.automaticPlayback === false
      && state.automaticFallback === false
      && state.rehearsalMode === false
      && state.previewClockDriven === false
      && state.previewClockMutation === false
      && state.visualMutationFromPreviewClock === false
      && state.syntheticInputDispatch === false
      && state.nonInputMutationCount === 0
      && state.folds >= MIN_FOLDS
      && state.folds <= MAX_FOLDS
      && state.sample.x >= 0.12
      && state.sample.x <= 0.88
      && state.sample.y >= 0.12
      && state.sample.y <= 0.88
      && state.p5DrawCount > 0
      && state.renderedSampleCount > 1_000
      && state.renderedPixelChecksum > 0
      && state.renderedLuminanceRange > 150
      && assetEvidence
      && topologyEvidence
      && transitionEvidence
      && inputAccounting
      && pointerCaptureAccounting;
  };

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'canvas2d',
    render: (_time, manual) => {
      state.previewRenderCalls += 1;
      if (manual) state.previewManualRenderCalls += 1;
      if (updateLayout()) dirty = true;
      if (dirty) p5Instance.redraw();
    },
    ready: resourcesReady,
  });

  window.addEventListener('beforeunload', () => {
    if (artworkObjectUrl) URL.revokeObjectURL(artworkObjectUrl);
  }, { once: true });
} catch (error) {
  markPreviewFailure(error);
}
