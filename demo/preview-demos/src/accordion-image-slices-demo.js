import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const DESIGN_WIDTH = 320;
const DESIGN_HEIGHT = 180;
const SLICE_COUNT = 9;
const INITIAL_OPEN = 0.38;
const IMAGE_TOP = 14;
const IMAGE_HEIGHT = 152;
const IMAGE_RIGHT = 308;
const COLLAPSED_WIDTH = 92;
const EXPANDED_WIDTH = 220;
const EXPECTED_ASSET_SHA256 = '220ad04c64ee1b8d8266e62aa93c16819406d7082956595f4fce6fffb34be0b5';
const PHOTO_URL = new URL('../assets/aesthetic-wave-06/accordion-image-slices/tidal-gallery-proof.jpg', import.meta.url).href;

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
  const stage = document.querySelector('#accordion-stage');
  const canvas = document.querySelector('#accordion-canvas');
  const openReadout = document.querySelector('#open-readout');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let p5Instance;
  let sketch;
  let photo;
  let photoObjectUrl = '';
  let resolveCanvasReady;
  let dirty = true;

  const state = {
    id: 'accordion-image-slices',
    task: 'human-operated-exhibition-accordion-proof',
    mechanism: 'p5-canvas-nine-slice-local-raster-accordion',
    acceptedInputs: ['mouse', 'touch', 'pen', 'keyboard'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    automaticPath: false,
    automaticPlayback: false,
    automaticFallback: false,
    previewClockDriven: false,
    previewClockMutation: false,
    syntheticInputDispatch: false,
    sliceCount: SLICE_COUNT,
    initialOpen: INITIAL_OPEN,
    open: INITIAL_OPEN,
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
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    keyboardInputCount: 0,
    openMutationCount: 0,
    humanOpenMutationCount: 0,
    nonInputOpenMutationCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: false,
    inputRecords: [],
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
    sampledPixelCount: 0,
    sourcePixelChecksum: 0,
    p5CanvasCreated: false,
    p5DrawCount: 0,
    imageDrawCalls: 0,
    lastDrawnAssetSha256: '',
    renderedSampleCount: 0,
    renderedPixelChecksum: 0,
    renderedLuminanceRange: 0,
    resizeCount: 0,
    redrawRequestCount: 0,
    previewRenderCalls: 0,
    layout: { width: DESIGN_WIDTH, height: DESIGN_HEIGHT, dpr: 1, scale: 1, offsetX: 0, offsetY: 0 },
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__ACCORDION_IMAGE_SLICES_STATE__ = state;

  function updateEvidenceDataset() {
    stage.dataset.open = state.open.toFixed(4);
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedCount = String(state.rejectedUntrustedCount);
    stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
    stage.dataset.pointerCaptureReleaseCount = String(state.pointerCaptureReleaseCount);
    stage.dataset.keyboardInputCount = String(state.keyboardInputCount);
    stage.dataset.openMutationCount = String(state.openMutationCount);
    stage.dataset.assetChecksumVerified = String(state.assetChecksumVerified);
    stage.dataset.imageDrawCalls = String(state.imageDrawCalls);
    stage.dataset.automaticPath = String(state.automaticPath);
    stage.dataset.previewClockMutation = String(state.previewClockMutation);
    stage.dataset.syntheticInputDispatch = String(state.syntheticInputDispatch);
  }

  function updateAccessibility() {
    const percentage = Math.round(state.open * 100);
    canvas.setAttribute('aria-valuenow', String(percentage));
    canvas.setAttribute('aria-valuetext', `Accordion proof ${percentage} percent open`);
    openReadout.textContent = `${percentage === 100 ? 'FLAT' : 'FOLD'} ${String(percentage).padStart(2, '0')}%`;
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
    updateEvidenceDataset();
    return true;
  }

  function requestDraw(reason) {
    dirty = true;
    state.redrawRequestCount += 1;
    state.lastRedrawReason = reason;
    p5Instance?.redraw();
  }

  function setOpenFromTrustedInput(value, source, event) {
    if (event?.isTrusted !== true) {
      state.nonInputOpenMutationCount += 1;
      updateEvidenceDataset();
      return false;
    }
    const next = clamp(value, 0, 1);
    const before = state.open;
    if (Math.abs(next - before) < 0.0001) return false;
    state.open = next;
    state.openMutationCount += 1;
    state.humanOpenMutationCount += 1;
    state.inputRecords.push({
      source,
      kind: state.lastInputKind,
      trusted: true,
      before: round(before),
      after: round(next),
      delta: round(next - before),
    });
    if (state.inputRecords.length > 32) state.inputRecords.shift();
    updateAccessibility();
    requestDraw(`trusted-${source}`);
    return true;
  }

  function openForClientX(clientX) {
    const bounds = canvas.getBoundingClientRect();
    return clamp((clientX - bounds.left) / Math.max(1, bounds.width), 0, 1);
  }

  function drawCover(context, image, x, y, width, height) {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (image.naturalWidth - sourceWidth) * 0.5;
    const sourceY = (image.naturalHeight - sourceHeight) * 0.5;
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  }

  function panelPath(context, x0, x1, top0, top1, bottom0, bottom1) {
    context.beginPath();
    context.moveTo(x0, top0);
    context.lineTo(x1, top1);
    context.lineTo(x1, bottom1);
    context.lineTo(x0, bottom0);
    context.closePath();
  }

  function drawAccordion(context) {
    const totalWidth = COLLAPSED_WIDTH + (EXPANDED_WIDTH - COLLAPSED_WIDTH) * state.open;
    const left = IMAGE_RIGHT - totalWidth;
    const panelWidth = totalWidth / SLICE_COUNT;
    const foldDepth = (1 - state.open) * 13;
    const sourceWidth = photo.naturalWidth / SLICE_COUNT;

    context.save();
    context.shadowColor = 'rgba(0,0,0,.42)';
    context.shadowBlur = 14;
    context.shadowOffsetY = 7;
    context.fillStyle = '#02070a';
    context.fillRect(left - 2, IMAGE_TOP - 2, totalWidth + 4, IMAGE_HEIGHT + 4);
    context.restore();

    for (let index = 0; index < SLICE_COUNT; index += 1) {
      const x0 = left + index * panelWidth;
      const x1 = left + (index + 1) * panelWidth + (index === SLICE_COUNT - 1 ? 0 : 0.35);
      const top0 = IMAGE_TOP + (index % 2 ? foldDepth : 0);
      const top1 = IMAGE_TOP + ((index + 1) % 2 ? foldDepth : 0);
      const bottom0 = IMAGE_TOP + IMAGE_HEIGHT - (index % 2 ? foldDepth : 0);
      const bottom1 = IMAGE_TOP + IMAGE_HEIGHT - ((index + 1) % 2 ? foldDepth : 0);

      context.save();
      panelPath(context, x0, x1, top0, top1, bottom0, bottom1);
      context.clip();
      context.drawImage(
        photo,
        sourceWidth * index,
        0,
        sourceWidth + 0.5,
        photo.naturalHeight,
        x0,
        IMAGE_TOP,
        x1 - x0,
        IMAGE_HEIGHT,
      );
      state.imageDrawCalls += 1;
      state.lastDrawnAssetSha256 = state.assetSha256;

      const shade = context.createLinearGradient(x0, 0, x1, 0);
      const shadeStrength = (1 - state.open) * (index % 2 ? 0.42 : 0.28);
      if (index % 2) {
        shade.addColorStop(0, `rgba(2,10,16,${shadeStrength})`);
        shade.addColorStop(1, 'rgba(255,220,170,.03)');
      } else {
        shade.addColorStop(0, 'rgba(255,236,195,.055)');
        shade.addColorStop(1, `rgba(1,8,15,${shadeStrength})`);
      }
      context.fillStyle = shade;
      context.fillRect(x0, IMAGE_TOP, x1 - x0, IMAGE_HEIGHT);
      context.restore();

      context.save();
      context.strokeStyle = `rgba(230,240,236,${0.12 + (1 - state.open) * 0.34})`;
      context.lineWidth = 0.7;
      context.beginPath();
      context.moveTo(x1, top1);
      context.lineTo(x1, bottom1);
      context.stroke();
      context.restore();
    }

    context.save();
    context.strokeStyle = 'rgba(225,237,234,.38)';
    context.lineWidth = 0.75;
    context.beginPath();
    context.moveTo(left, IMAGE_TOP);
    for (let boundary = 1; boundary <= SLICE_COUNT; boundary += 1) {
      const x = left + boundary * panelWidth;
      const y = IMAGE_TOP + (boundary % 2 ? foldDepth : 0);
      context.lineTo(x, y);
    }
    for (let boundary = SLICE_COUNT; boundary >= 0; boundary -= 1) {
      const x = left + boundary * panelWidth;
      const y = IMAGE_TOP + IMAGE_HEIGHT - (boundary % 2 ? foldDepth : 0);
      context.lineTo(x, y);
    }
    context.closePath();
    context.stroke();
    context.restore();

    return { left, totalWidth, foldDepth };
  }

  function sampleRenderedCanvas() {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const width = canvas.width;
    const height = canvas.height;
    if (!width || !height) return;
    const pixels = context.getImageData(0, 0, width, height).data;
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
  }

  function updateLayout() {
    const width = Math.max(1, Math.round(stage.clientWidth || DESIGN_WIDTH));
    const height = Math.max(1, Math.round(stage.clientHeight || DESIGN_HEIGHT));
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const changed = !p5Instance || p5Instance.width !== width || p5Instance.height !== height || state.layout.dpr !== dpr;
    if (changed && p5Instance) {
      if (state.layout.dpr !== dpr) p5Instance.pixelDensity(dpr);
      p5Instance.resizeCanvas(width, height, false);
      state.resizeCount += 1;
    }
    const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
    state.layout = {
      width,
      height,
      dpr,
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
    p.background('#07131a');
    p.push();
    p.translate(state.layout.offsetX, state.layout.offsetY);
    p.scale(state.layout.scale);

    context.save();
    const atmosphere = context.createRadialGradient(250, 80, 10, 250, 80, 230);
    atmosphere.addColorStop(0, 'rgba(40,89,119,.27)');
    atmosphere.addColorStop(1, 'rgba(4,13,19,0)');
    context.fillStyle = atmosphere;
    context.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    context.fillStyle = 'rgba(222,235,232,.12)';
    context.fillRect(54, 0, 0.75, DESIGN_HEIGHT);
    context.restore();

    const geometry = drawAccordion(context);

    context.save();
    context.fillStyle = 'rgba(232,240,237,.5)';
    context.font = '700 5px ui-monospace, monospace';
    context.letterSpacing = '.09em';
    context.fillText('TIDAL GALLERY / BLUE HOUR', geometry.left + 5, 174);
    context.textAlign = 'right';
    context.fillStyle = '#f0b968';
    context.fillText(`${SLICE_COUNT} PANELS · ${Math.round(state.open * 100)}%`, IMAGE_RIGHT, 174);
    context.restore();

    p.pop();
    state.p5DrawCount += 1;
    if (state.p5DrawCount === 1) {
      state.initialStillVerified = state.inputCount === 0
        && state.openMutationCount === 0
        && Math.abs(state.open - INITIAL_OPEN) < 0.0001
        && state.automaticPath === false;
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
      instance.pixelDensity(Math.min(devicePixelRatio || 1, 2));
      instance.createCanvas(width, height, instance.P2D, canvas);
      instance.noLoop();
      state.p5CanvasCreated = true;
      resolveCanvasReady();
    };
    instance.draw = drawScene;
  }, stage);

  async function loadPhoto() {
    const response = await fetch(PHOTO_URL, { cache: 'force-cache' });
    state.assetFetchCount += 1;
    state.assetFetchStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    if (!response.ok) throw new Error(`Accordion source image request failed: HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    state.assetByteLength = buffer.byteLength;
    state.assetSha256 = await sha256(buffer);
    state.assetChecksumVerified = state.assetSha256 === EXPECTED_ASSET_SHA256;
    if (!state.assetChecksumVerified) throw new Error('Accordion source image checksum does not match its recorded local asset');

    const blob = new Blob([buffer], { type: state.assetMimeType || 'image/jpeg' });
    photoObjectUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.decoding = 'async';
    image.src = photoObjectUrl;
    await image.decode();
    if (!image.complete || image.naturalWidth !== 960 || image.naturalHeight !== 640) {
      throw new Error(`Unexpected accordion source dimensions: ${image.naturalWidth}x${image.naturalHeight}`);
    }

    const sampler = document.createElement('canvas');
    sampler.width = 96;
    sampler.height = 64;
    const samplerContext = sampler.getContext('2d', { willReadFrequently: true });
    drawCover(samplerContext, image, 0, 0, sampler.width, sampler.height);
    const sampledPixels = samplerContext.getImageData(0, 0, sampler.width, sampler.height).data;
    state.sampledPixelCount = sampler.width * sampler.height;
    state.sourcePixelChecksum = fnv1a(sampledPixels);
    state.assetDecoded = true;
    state.assetDecodeCount += 1;
    state.assetNaturalWidth = image.naturalWidth;
    state.assetNaturalHeight = image.naturalHeight;
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
    try {
      canvas.setPointerCapture(event.pointerId);
      state.pointerCaptured = canvas.hasPointerCapture(event.pointerId);
      if (state.pointerCaptured) state.pointerCaptureCount += 1;
    } catch {
      state.pointerCaptured = false;
    }
    setOpenFromTrustedInput(openForClientX(event.clientX), `pointer-${pointerType}-down`, event);
  }

  function pointerMove(event) {
    if (event.pointerId !== state.activePointerId) return;
    const pointerType = event.pointerType || state.activePointerType || 'mouse';
    if (!acceptInput(event, pointerType, `pointer-${pointerType}-move`)) return;
    event.preventDefault();
    state.pointerMoveCount += 1;
    setOpenFromTrustedInput(openForClientX(event.clientX), `pointer-${pointerType}-move`, event);
  }

  function finishPointer(event, cancelled = false) {
    if (event.pointerId !== state.activePointerId) return;
    const pointerType = event.pointerType || state.activePointerType || 'mouse';
    if (!acceptInput(event, pointerType, cancelled ? `pointer-${pointerType}-cancel` : `pointer-${pointerType}-up`)) return;
    event.preventDefault();
    if (!cancelled) setOpenFromTrustedInput(openForClientX(event.clientX), `pointer-${pointerType}-up`, event);
    if (state.pointerCaptured) {
      try {
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      } catch {}
      state.pointerCaptureReleaseCount += 1;
    }
    state.pointerCaptured = false;
    state.activePointerId = null;
    state.activePointerType = 'none';
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    updateEvidenceDataset();
  }

  function keyDown(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageDown', 'PageUp'].includes(event.key)) return;
    if (!acceptInput(event, 'keyboard', `keyboard-${event.key}`)) return;
    event.preventDefault();
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? 1
        : event.key === 'PageDown'
          ? state.open - 0.25
          : event.key === 'PageUp'
            ? state.open + 0.25
            : state.open + (event.key === 'ArrowRight' ? 0.08 : -0.08);
    setOpenFromTrustedInput(next, `keyboard-${event.key}`, event);
  }

  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', event => finishPointer(event, false));
  canvas.addEventListener('pointercancel', event => finishPointer(event, true));
  canvas.addEventListener('keydown', keyDown);
  reducedMotionQuery.addEventListener?.('change', event => { state.reducedMotion = event.matches; });
  state.listenersBound = true;

  const resourcesReady = Promise.all([document.fonts.ready, canvasReady, loadPhoto()]).then(([, , image]) => {
    photo = image;
    state.ready = true;
    updateAccessibility();
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
    const recordsTrusted = state.inputRecords.every(record => record.trusted === true
      && /^pointer-(mouse|touch|pen)-(down|move|up)$|^keyboard-(ArrowLeft|ArrowRight|Home|End|PageDown|PageUp)$/.test(record.source)
      && Number.isFinite(record.before)
      && Number.isFinite(record.after)
      && Math.abs(record.delta) > 0);
    const captureAccounting = state.pointerCaptureReleaseCount <= state.pointerCaptureCount
      && state.pointerCaptureCount - state.pointerCaptureReleaseCount <= (state.pointerCaptured ? 1 : 0);
    const inputAccounting = state.trustedInputCount === state.inputCount
      && state.humanOpenMutationCount === state.openMutationCount
      && state.inputRecords.length <= state.openMutationCount
      && (state.openMutationCount === 0 || state.inputRecords.length > 0);
    const assetEvidence = state.assetFetchCount === 1
      && state.assetFetchStatus === 200
      && state.assetMimeType.includes('image/jpeg')
      && state.assetByteLength > 20_000
      && state.assetDecodeCount === 1
      && state.assetDecoded
      && state.assetNaturalWidth === 960
      && state.assetNaturalHeight === 640
      && state.assetSha256 === EXPECTED_ASSET_SHA256
      && state.assetChecksumVerified
      && state.sampledPixelCount === 96 * 64
      && state.sourcePixelChecksum > 0
      && state.imageDrawCalls >= SLICE_COUNT
      && state.lastDrawnAssetSha256 === EXPECTED_ASSET_SHA256;

    return sketch instanceof p5
      && window.__PREVIEW_INTERACTION_STATE__ === state
      && stage.dataset.previewMechanism === 'p5-image-sampled-accordion-proof'
      && !!canvas.getContext('2d')
      && state.p5CanvasCreated
      && state.ready
      && state.initialStillVerified
      && state.listenersBound
      && state.sliceCount === 9
      && state.userInputRequired
      && state.strictTrustedInputGuard
      && state.automaticPath === false
      && state.automaticPlayback === false
      && state.automaticFallback === false
      && state.previewClockDriven === false
      && state.previewClockMutation === false
      && state.syntheticInputDispatch === false
      && state.nonInputOpenMutationCount === 0
      && state.p5DrawCount > 0
      && state.renderedSampleCount > 1000
      && state.renderedPixelChecksum > 0
      && state.renderedLuminanceRange > 80
      && state.open >= 0
      && state.open <= 1
      && assetEvidence
      && recordsTrusted
      && captureAccounting
      && inputAccounting;
  };

  installPreviewController({
    id: 'accordion-image-slices',
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
