import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const DESIGN_WIDTH = 320;
const DESIGN_HEIGHT = 180;
const BLADE_COUNT = 12;
const MIN_OPEN = 0.16;
const INITIAL_OPEN = 0.42;
const EXPECTED_ASSET_SHA256 = '4aa3eb7fb702d03313d32413186d58e21ac3bc480711042c2dd1224ee36b6618';
const EXPECTED_ASSET_BYTES = 206995;
const PHOTO_URL = new URL('../assets/aesthetic-wave-06/iris-aperture-navigation/north-atlantic-campus.jpg', import.meta.url).href;
const CHAPTERS = [
  { short: 'ARCHIVE', title: 'COASTAL\nARCHIVE', x: 0.18, y: 0.51 },
  { short: 'TIDE', title: 'TIDE\nOBSERVATORY', x: 0.54, y: 0.50 },
  { short: 'SIGNAL', title: 'SIGNAL\nTOWER', x: 0.85, y: 0.47 },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round = value => Number(value.toFixed(4));

function fnv1a(pixels, stride = 1) {
  let value = 2166136261;
  for (let index = 0; index < pixels.length; index += stride) {
    value ^= pixels[index];
    value = Math.imul(value, 16777619) >>> 0;
  }
  return value >>> 0;
}

async function sha256(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

try {
  const stage = document.querySelector('#iris-stage');
  const canvas = document.querySelector('#iris-canvas');
  const chapterTitle = document.querySelector('#chapter-title');
  const readout = document.querySelector('#iris-readout');
  const chapterButtons = [...document.querySelectorAll('[data-chapter]')];
  const closeButton = document.querySelector('#iris-close');
  const openButton = document.querySelector('#iris-open');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let p5Instance;
  let sketch;
  let photo;
  let photoObjectUrl = '';
  let resolveCanvasReady;
  let dirty = true;
  let dragOrigin = null;

  const initialChapter = 1;
  const initialCenter = { x: CHAPTERS[initialChapter].x, y: CHAPTERS[initialChapter].y };
  const state = {
    id: 'iris-aperture-navigation',
    task: 'human-operated-portfolio-chapter-navigation',
    mechanism: 'p5-canvas-local-raster-circular-clip-and-twelve-blade-iris',
    captureType: 'interactive',
    causality: 'trusted-human-input-only',
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard', 'button'],
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
    bladeCount: BLADE_COUNT,
    bladeVertexCount: BLADE_COUNT * 4,
    initialOpen: INITIAL_OPEN,
    open: INITIAL_OPEN,
    initialChapter,
    selectedChapter: initialChapter,
    initialCenter: { ...initialCenter },
    center: { ...initialCenter },
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
    pointerDownCount: 0,
    pointerDragCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    keyboardInputCount: 0,
    buttonInputCount: 0,
    geometryMutationCount: 0,
    humanGeometryMutationCount: 0,
    nonInputGeometryMutationCount: 0,
    centerMutationCount: 0,
    openMutationCount: 0,
    selectionMutationCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false,
    lastPointerType: 'none',
    transitionRecords: [],
    assetUrl: PHOTO_URL,
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
    p5CanvasCreated: false,
    p5DrawCount: 0,
    p5ImageDrawCalls: 0,
    lastDrawnAssetSha256: '',
    apertureClipCount: 0,
    lastApertureRadius: 0,
    lastApertureArea: 0,
    lastApertureCenter: { ...initialCenter },
    renderedSampleCount: 0,
    renderedPixelChecksum: 0,
    renderedLuminanceRange: 0,
    initialRenderedPixelChecksum: 0,
    resizeCount: 0,
    redrawRequestCount: 0,
    previewRenderCalls: 0,
    layout: { width: DESIGN_WIDTH, height: DESIGN_HEIGHT, dpr: 1, scale: 1, offsetX: 0, offsetY: 0 },
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__IRIS_APERTURE_NAVIGATION_STATE__ = state;

  function updateEvidenceDataset() {
    stage.dataset.open = state.open.toFixed(4);
    stage.dataset.chapter = String(state.selectedChapter);
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedCount = String(state.rejectedUntrustedCount);
    stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
    stage.dataset.pointerCaptureReleaseCount = String(state.pointerCaptureReleaseCount);
    stage.dataset.keyboardInputCount = String(state.keyboardInputCount);
    stage.dataset.buttonInputCount = String(state.buttonInputCount);
    stage.dataset.geometryMutationCount = String(state.geometryMutationCount);
    stage.dataset.assetChecksumVerified = String(state.assetChecksumVerified);
    stage.dataset.p5ImageDrawCalls = String(state.p5ImageDrawCalls);
    stage.dataset.automaticPath = String(state.automaticPath);
    stage.dataset.previewClockMutation = String(state.previewClockMutation);
    stage.dataset.syntheticInputDispatch = String(state.syntheticInputDispatch);
  }

  function updateInterface() {
    const percentage = Math.round(state.open * 100);
    readout.value = `IRIS ${percentage}%`;
    readout.textContent = `IRIS ${percentage}%`;
    chapterTitle.innerHTML = CHAPTERS[state.selectedChapter].title.replace('\n', '<br>');
    canvas.setAttribute('aria-valuenow', String(percentage));
    canvas.setAttribute('aria-valuetext', `${CHAPTERS[state.selectedChapter].short} chapter, aperture ${percentage} percent open`);
    chapterButtons.forEach((button, index) => button.setAttribute('aria-current', String(index === state.selectedChapter)));
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
    if (kind === 'keyboard') state.keyboardInputCount += 1;
    if (kind === 'button') state.buttonInputCount += 1;
    if (kind === 'hover') state.hoverInputCount += 1;
    if (kind === 'mouse') state.mouseInputCount += 1;
    if (kind === 'touch') state.touchInputCount += 1;
    if (kind === 'pen') state.penInputCount += 1;
    if (kind === 'hover') state.lastPointerType = 'mouse';
    if (['mouse', 'touch', 'pen'].includes(kind)) state.lastPointerType = kind;
    updateEvidenceDataset();
    return true;
  }

  function requestDraw(reason) {
    dirty = true;
    state.redrawRequestCount += 1;
    state.lastRedrawReason = reason;
    p5Instance?.redraw();
  }

  function mutateFromTrustedInput(event, patch, source) {
    if (event?.isTrusted !== true) {
      state.nonInputGeometryMutationCount += 1;
      updateEvidenceDataset();
      return false;
    }

    const before = {
      open: state.open,
      x: state.center.x,
      y: state.center.y,
      chapter: state.selectedChapter,
    };
    const nextOpen = patch.open === undefined ? before.open : clamp(patch.open, MIN_OPEN, 1);
    const nextX = patch.x === undefined ? before.x : clamp(patch.x, 0.08, 0.92);
    const nextY = patch.y === undefined ? before.y : clamp(patch.y, 0.16, 0.79);
    const nextChapter = patch.chapter === undefined
      ? before.chapter
      : clamp(Math.round(patch.chapter), 0, CHAPTERS.length - 1);
    const changedOpen = Math.abs(nextOpen - before.open) > 0.0001;
    const changedCenter = Math.abs(nextX - before.x) > 0.0001 || Math.abs(nextY - before.y) > 0.0001;
    const changedChapter = nextChapter !== before.chapter;
    if (!changedOpen && !changedCenter && !changedChapter) return false;

    state.open = nextOpen;
    state.center.x = nextX;
    state.center.y = nextY;
    state.selectedChapter = nextChapter;
    state.geometryMutationCount += 1;
    state.humanGeometryMutationCount += 1;
    if (changedOpen) state.openMutationCount += 1;
    if (changedCenter) state.centerMutationCount += 1;
    if (changedChapter) state.selectionMutationCount += 1;
    state.transitionRecords.push({
      source,
      kind: state.lastInputKind,
      trusted: true,
      before: { open: round(before.open), x: round(before.x), y: round(before.y), chapter: before.chapter },
      after: { open: round(nextOpen), x: round(nextX), y: round(nextY), chapter: nextChapter },
    });
    if (state.transitionRecords.length > 64) state.transitionRecords.shift();
    updateInterface();
    requestDraw(`trusted-${source}`);
    return true;
  }

  function pointerToDesign(event) {
    const bounds = canvas.getBoundingClientRect();
    const localX = (event.clientX - bounds.left - state.layout.offsetX) / Math.max(0.0001, state.layout.scale);
    const localY = (event.clientY - bounds.top - state.layout.offsetY) / Math.max(0.0001, state.layout.scale);
    return {
      x: clamp(localX / DESIGN_WIDTH, 0.08, 0.92),
      y: clamp(localY / DESIGN_HEIGHT, 0.16, 0.79),
      designX: localX,
      designY: localY,
    };
  }

  function nearestChapter(x, y) {
    return CHAPTERS.reduce((nearest, chapter, index) => {
      const distance = Math.hypot(chapter.x - x, chapter.y - y);
      return distance < nearest.distance ? { index, distance } : nearest;
    }, { index: 0, distance: Infinity });
  }

  function selectChapterFromTrustedInput(index, event, source) {
    const chapter = CHAPTERS[index];
    return mutateFromTrustedInput(event, {
      chapter: index,
      x: chapter.x,
      y: chapter.y,
      open: Math.max(state.open, 0.58),
    }, source);
  }

  function drawPhotoCover(p) {
    const sourceHeight = photo.width / (DESIGN_WIDTH / DESIGN_HEIGHT);
    const sourceY = (photo.height - sourceHeight) * 0.5;
    p.image(photo, 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT, 0, sourceY, photo.width, sourceHeight);
    state.p5ImageDrawCalls += 1;
    state.lastDrawnAssetSha256 = state.assetSha256;
  }

  function drawBladeRing(p, centerX, centerY, radius) {
    const outerRadius = radius + 14;
    p.strokeWeight(0.7);
    for (let index = 0; index < BLADE_COUNT; index += 1) {
      const angle = -Math.PI / 2 + index / BLADE_COUNT * Math.PI * 2 + state.open * 0.22;
      const next = angle + Math.PI * 2 / BLADE_COUNT;
      const bite = angle + 0.36;
      p.fill(index % 2 ? 'rgba(31,39,40,.94)' : 'rgba(56,59,56,.94)');
      p.stroke(index % 2 ? 'rgba(235,190,123,.36)' : 'rgba(231,238,229,.20)');
      p.quad(
        centerX + Math.cos(angle) * (radius + 1), centerY + Math.sin(angle) * (radius + 1),
        centerX + Math.cos(next) * outerRadius, centerY + Math.sin(next) * outerRadius,
        centerX + Math.cos(next + 0.12) * (outerRadius + 6), centerY + Math.sin(next + 0.12) * (outerRadius + 6),
        centerX + Math.cos(bite) * (radius + 4), centerY + Math.sin(bite) * (radius + 4),
      );
    }
    p.noFill();
    p.stroke('#e6b66f');
    p.strokeWeight(1.1);
    p.circle(centerX, centerY, radius * 2 + 1);
    p.stroke('rgba(232,235,225,.38)');
    p.strokeWeight(0.65);
    p.circle(centerX, centerY, outerRadius * 2 + 6);
  }

  function drawMarkers(p, centerX, centerY, radius) {
    CHAPTERS.forEach((chapter, index) => {
      const x = chapter.x * DESIGN_WIDTH;
      const y = chapter.y * DESIGN_HEIGHT;
      const insideAperture = Math.hypot(x - centerX, y - centerY) < radius - 4;
      p.noFill();
      p.stroke(index === state.selectedChapter ? '#f1b66d' : 'rgba(232,238,228,.42)');
      p.strokeWeight(index === state.selectedChapter ? 1.2 : 0.65);
      p.circle(x, y, index === state.selectedChapter ? 8 : 5);
      p.noStroke();
      p.fill(index === state.selectedChapter ? '#f1c27e' : 'rgba(235,239,229,.62)');
      p.circle(x, y, insideAperture ? 2.6 : 1.7);
      p.textFont('ui-monospace, monospace');
      p.textStyle(p.BOLD);
      p.textSize(4.8);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text(`${index + 1}`, x, y - 5);
    });
  }

  function sampleRenderedCanvas() {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!canvas.width || !canvas.height) return;
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const stride = Math.max(4, Math.floor(pixels.length / 4096 / 4) * 4);
    let minimum = 255;
    let maximum = 0;
    let count = 0;
    for (let index = 0; index < pixels.length; index += stride) {
      const luminance = pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722;
      minimum = Math.min(minimum, luminance);
      maximum = Math.max(maximum, luminance);
      count += 1;
    }
    state.renderedSampleCount = count;
    state.renderedPixelChecksum = fnv1a(pixels, stride);
    state.renderedLuminanceRange = round(maximum - minimum);
    if (state.p5DrawCount === 1) state.initialRenderedPixelChecksum = state.renderedPixelChecksum;
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

  function drawScene() {
    if (!state.ready || !photo) return;
    updateLayout();
    const p = p5Instance;
    const context = p.drawingContext;
    p.clear();
    p.background('#071013');
    p.push();
    p.translate(state.layout.offsetX, state.layout.offsetY);
    p.scale(state.layout.scale);

    drawPhotoCover(p);
    p.noStroke();
    p.fill('rgba(5,15,18,.78)');
    p.rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    p.fill('rgba(13,38,43,.20)');
    p.rect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    p.stroke('rgba(225,235,226,.10)');
    p.strokeWeight(0.6);
    for (let x = 8; x < DESIGN_WIDTH; x += 24) p.line(x, 0, x, DESIGN_HEIGHT);
    for (let y = 10; y < DESIGN_HEIGHT; y += 20) p.line(0, y, DESIGN_WIDTH, y);

    const radius = 20 + state.open * 42;
    const centerX = state.center.x * DESIGN_WIDTH;
    const centerY = state.center.y * DESIGN_HEIGHT;
    context.save();
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.clip();
    drawPhotoCover(p);
    const glow = context.createRadialGradient(centerX, centerY, radius * 0.38, centerX, centerY, radius);
    glow.addColorStop(0, 'rgba(255,215,154,0)');
    glow.addColorStop(1, 'rgba(239,175,94,.16)');
    context.fillStyle = glow;
    context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    context.restore();
    state.apertureClipCount += 1;
    state.lastApertureRadius = round(radius);
    state.lastApertureArea = round(Math.PI * radius * radius);
    state.lastApertureCenter = { x: round(state.center.x), y: round(state.center.y) };

    drawBladeRing(p, centerX, centerY, radius);
    drawMarkers(p, centerX, centerY, radius);

    p.noStroke();
    p.fill('rgba(238,240,231,.44)');
    p.textFont('ui-monospace, monospace');
    p.textStyle(p.BOLD);
    p.textSize(4.6);
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.text('DRAG ↑ OPEN  ·  ← → CHAPTER', 309, 169);
    p.pop();

    state.p5DrawCount += 1;
    if (state.p5DrawCount === 1) {
      state.initialStillVerified = state.inputCount === 0
        && state.geometryMutationCount === 0
        && Math.abs(state.open - INITIAL_OPEN) < 0.0001
        && state.selectedChapter === initialChapter
        && Math.abs(state.center.x - initialCenter.x) < 0.0001
        && Math.abs(state.center.y - initialCenter.y) < 0.0001
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
      p5Instance.loadImage(url, resolve, () => reject(new Error('p5 could not decode the generated destination artwork')));
    });
  }

  async function loadPhoto() {
    const response = await fetch(PHOTO_URL, { cache: 'force-cache' });
    state.assetFetchCount += 1;
    state.assetFetchStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    if (!response.ok) throw new Error(`Iris destination artwork request failed: HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    state.assetByteLength = buffer.byteLength;
    state.assetSha256 = await sha256(buffer);
    state.assetChecksumVerified = state.assetSha256 === EXPECTED_ASSET_SHA256;
    if (!state.assetChecksumVerified) throw new Error('Iris destination artwork checksum does not match its recorded local asset');

    photoObjectUrl = URL.createObjectURL(new Blob([buffer], { type: state.assetMimeType || 'image/jpeg' }));
    const image = await loadP5Image(photoObjectUrl);
    if (image.width !== 960 || image.height !== 640) {
      throw new Error(`Unexpected iris destination dimensions: ${image.width}x${image.height}`);
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
    return image;
  }

  function pointerDown(event) {
    if (!event.isPrimary || (event.button !== undefined && event.button !== 0)) return;
    const pointerType = event.pointerType || 'mouse';
    if (!acceptInput(event, pointerType, `pointer-${pointerType}-down`)) return;
    event.preventDefault();
    state.pointerDownCount += 1;
    state.activePointerId = event.pointerId;
    state.activePointerType = pointerType;
    const point = pointerToDesign(event);
    dragOrigin = { x: point.designX, y: point.designY, open: state.open };
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
    const point = pointerToDesign(event);
    const pointerType = event.pointerType || state.activePointerType || 'mouse';
    if (state.activePointerId === null) {
      if (pointerType !== 'mouse' || !acceptInput(event, 'hover', 'pointer-mouse-hover')) return;
      mutateFromTrustedInput(event, { x: point.x, y: point.y }, 'pointer-mouse-hover');
      return;
    }
    if (event.pointerId !== state.activePointerId) return;
    if (!acceptInput(event, pointerType, `pointer-${pointerType}-drag`)) return;
    event.preventDefault();
    state.pointerDragCount += 1;
    const nextOpen = dragOrigin.open + (dragOrigin.y - point.designY) / 92;
    mutateFromTrustedInput(event, { x: point.x, y: point.y, open: nextOpen }, `pointer-${pointerType}-drag`);
  }

  function finishPointer(event, cancelled = false) {
    if (event.pointerId !== state.activePointerId) return;
    const pointerType = event.pointerType || state.activePointerType || 'mouse';
    if (!acceptInput(event, pointerType, cancelled ? `pointer-${pointerType}-cancel` : `pointer-${pointerType}-up`)) return;
    event.preventDefault();
    const point = pointerToDesign(event);
    const moved = dragOrigin ? Math.hypot(point.designX - dragOrigin.x, point.designY - dragOrigin.y) : Infinity;
    if (!cancelled && moved < 7) {
      const nearest = nearestChapter(point.x, point.y);
      if (nearest.distance < 0.24) selectChapterFromTrustedInput(nearest.index, event, `pointer-${pointerType}-select`);
    }
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
    const allowed = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' '];
    if (!allowed.includes(event.key) || !acceptInput(event, 'keyboard', `keyboard-${event.key === ' ' ? 'Space' : event.key}`)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const index = (state.selectedChapter + direction + CHAPTERS.length) % CHAPTERS.length;
      selectChapterFromTrustedInput(index, event, `keyboard-${event.key}`);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      selectChapterFromTrustedInput(state.selectedChapter, event, `keyboard-${event.key === ' ' ? 'Space' : 'Enter'}`);
      return;
    }
    const nextOpen = event.key === 'Home'
      ? MIN_OPEN
      : event.key === 'End'
        ? 1
        : state.open + (event.key === 'ArrowUp' ? 0.1 : -0.1);
    mutateFromTrustedInput(event, { open: nextOpen }, `keyboard-${event.key}`);
  }

  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', event => finishPointer(event, false));
  canvas.addEventListener('pointercancel', event => finishPointer(event, true));
  canvas.addEventListener('keydown', keyDown);
  chapterButtons.forEach((button, index) => {
    button.addEventListener('click', event => {
      if (!acceptInput(event, 'button', `button-chapter-${index}`)) return;
      selectChapterFromTrustedInput(index, event, `button-chapter-${index}`);
    });
  });
  closeButton.addEventListener('click', event => {
    if (!acceptInput(event, 'button', 'button-close')) return;
    mutateFromTrustedInput(event, { open: state.open - 0.16 }, 'button-close');
  });
  openButton.addEventListener('click', event => {
    if (!acceptInput(event, 'button', 'button-open')) return;
    mutateFromTrustedInput(event, { open: state.open + 0.16 }, 'button-open');
  });
  reducedMotionQuery.addEventListener?.('change', event => { state.reducedMotion = event.matches; });
  state.listenersBound = true;

  const resourcesReady = Promise.all([document.fonts.ready, canvasReady, loadPhoto()]).then(([, , image]) => {
    photo = image;
    state.ready = true;
    updateInterface();
    requestDraw('resources-ready');
  }, error => {
    markPreviewFailure(error);
    return new Promise(() => {});
  });

  new ResizeObserver(entries => {
    if (!entries[0] || !p5Instance) return;
    dirty = true;
    requestDraw('resize');
  }).observe(stage);

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const recordsTrusted = state.transitionRecords.every(record => record.trusted === true
      && /^(pointer-(mouse|touch|pen)-(down|drag|select)|pointer-mouse-hover|keyboard-(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Home|End|Enter|Space)|button-(chapter-[0-2]|close|open))$/.test(record.source)
      && Number.isFinite(record.before.open)
      && Number.isFinite(record.after.open)
      && Number.isFinite(record.before.x)
      && Number.isFinite(record.after.x));
    const captureAccounting = state.pointerCaptureReleaseCount <= state.pointerCaptureCount
      && state.pointerCaptureCount - state.pointerCaptureReleaseCount <= (state.pointerCaptured ? 1 : 0);
    const inputAccounting = state.trustedInputCount === state.inputCount
      && state.inputCount === state.hoverInputCount
        + state.mouseInputCount
        + state.touchInputCount
        + state.penInputCount
        + state.keyboardInputCount
        + state.buttonInputCount
      && state.humanGeometryMutationCount === state.geometryMutationCount
      && state.transitionRecords.length <= state.geometryMutationCount
      && (state.geometryMutationCount === 0 || state.transitionRecords.length > 0);
    const assetEvidence = state.assetFetchCount === 1
      && state.assetFetchStatus === 200
      && state.assetMimeType.includes('image/jpeg')
      && state.assetByteLength === EXPECTED_ASSET_BYTES
      && state.assetDecodeCount === 1
      && state.assetDecoded
      && state.assetNaturalWidth === 960
      && state.assetNaturalHeight === 640
      && state.assetSha256 === EXPECTED_ASSET_SHA256
      && state.assetChecksumVerified
      && state.p5ImageCreated
      && state.p5ImagePixelCount === 960 * 640
      && state.p5ImagePixelByteLength === 960 * 640 * 4
      && state.sourcePixelChecksum > 0
      && state.p5ImageDrawCalls >= 2
      && state.lastDrawnAssetSha256 === EXPECTED_ASSET_SHA256;
    const geometryEvidence = state.bladeCount === 12
      && state.bladeVertexCount === 48
      && state.lastApertureRadius >= 20 + MIN_OPEN * 42
      && state.lastApertureRadius <= 62
      && state.lastApertureArea > 2_000
      && state.lastApertureCenter.x >= 0.08
      && state.lastApertureCenter.x <= 0.92
      && state.lastApertureCenter.y >= 0.16
      && state.lastApertureCenter.y <= 0.79
      && state.apertureClipCount > 0;

    return sketch instanceof p5
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && stage.dataset.previewMechanism === 'p5-image-sampled-iris-navigation'
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
      && state.nonInputGeometryMutationCount === 0
      && state.p5DrawCount > 0
      && state.renderedSampleCount > 1000
      && state.renderedPixelChecksum > 0
      && state.renderedLuminanceRange > 80
      && state.open >= MIN_OPEN
      && state.open <= 1
      && state.selectedChapter >= 0
      && state.selectedChapter < CHAPTERS.length
      && assetEvidence
      && geometryEvidence
      && recordsTrusted
      && captureAccounting
      && inputAccounting;
  };

  installPreviewController({
    id: 'iris-aperture-navigation',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: () => {
      state.previewRenderCalls += 1;
      if (updateLayout()) dirty = true;
      if (dirty) p5Instance.redraw();
    },
    ready: resourcesReady,
  });

  window.addEventListener('beforeunload', () => {
    if (photoObjectUrl) URL.revokeObjectURL(photoObjectUrl);
  }, { once: true });
} catch (error) {
  markPreviewFailure(error);
}
