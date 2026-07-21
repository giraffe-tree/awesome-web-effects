import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ARTWORK_URL = new URL('../assets/curved-3d-text-orbit/orbital-resonance-release-art.jpg', import.meta.url).href;
const EXPECTED_ARTWORK_SHA256 = 'f34450cfd9f5215367008aea71c719dde3c1d6df848f85c3e4e86203c1e08c1c';
const EXPECTED_ARTWORK_BYTES = 217189;
const PHRASE = 'AURAL FORMS · LIVE SESSION 04 ·';
const DEFAULT_ROTATION = -.78;
const DEFAULT_DEPTH = .76;
const TAU = Math.PI * 2;
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const round = (value, digits = 5) => Number(value.toFixed(digits));

function wrapAngle(angle) {
  return ((angle + Math.PI) % TAU + TAU) % TAU - Math.PI;
}

function rgbString(rgb) {
  return `rgb(${rgb.map(value => Math.round(value)).join(', ')})`;
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function sampledArtworkData(image) {
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = 40;
  sampleCanvas.height = 40;
  const context = sampleCanvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Artwork sampling context is unavailable.');
  context.drawImage(image, 0, 0, sampleCanvas.width, sampleCanvas.height);
  const pixels = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height).data;
  let checksum = 2166136261;
  for (let index = 0; index < pixels.length; index += 7) {
    checksum ^= pixels[index];
    checksum = Math.imul(checksum, 16777619);
  }

  function regionAverage(minX, minY, maxX, maxY, predicate = () => true) {
    const sums = [0, 0, 0];
    let count = 0;
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const offset = (y * sampleCanvas.width + x) * 4;
        const rgb = [pixels[offset], pixels[offset + 1], pixels[offset + 2]];
        if (!predicate(rgb)) continue;
        sums[0] += rgb[0];
        sums[1] += rgb[1];
        sums[2] += rgb[2];
        count += 1;
      }
    }
    if (!count) throw new Error('Artwork palette sampling returned no qualifying pixels.');
    return sums.map(value => value / count);
  }

  const cobalt = regionAverage(8, 7, 31, 31, ([red, green, blue]) => blue > red * 1.22 && blue > green * 1.08 && blue > 55);
  const amber = regionAverage(14, 14, 25, 24, ([red, green, blue]) => red > blue * 1.5 && green > blue * 1.15 && red > 90);
  return {
    checksum: (checksum >>> 0).toString(16).padStart(8, '0'),
    cobalt,
    amber,
    sampledPixelCount: pixels.length / 4,
  };
}

try {
  const stage = document.querySelector('#orbit-stage');
  const host = document.querySelector('#orbit-text-host');
  const releaseStatus = document.querySelector('#release-status');
  const frontGlyphOutput = document.querySelector('#front-glyph');
  const interactionMode = document.querySelector('#interaction-mode');
  const depthControl = document.querySelector('#depth-control');
  const depthOutput = document.querySelector('#depth-output');
  const inspectControl = document.querySelector('#inspect-control');
  const resetControl = document.querySelector('#reset-control');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !host || !releaseStatus || !frontGlyphOutput || !interactionMode || !depthControl || !depthOutput || !inspectControl || !resetControl) {
    throw new Error('Aural Forms orbit DOM is incomplete.');
  }

  const phraseGlyphs = Array.from(PHRASE).map((character, sourceIndex) => ({
    character,
    sourceIndex,
    codePoint: character.codePointAt(0),
  }));
  const state = {
    id: 'curved-3d-text-orbit',
    task: 'human-operated-music-release-curved-type-lockup-review',
    acceptedInputs: ['wheel', 'mouse', 'touch', 'pen', 'keyboard', 'control'],
    userInputRequired: true,
    trustedInputOnly: true,
    automaticPlayback: false,
    automaticCruise: false,
    automaticRehearsal: false,
    automaticFallback: false,
    previewClockDriven: false,
    previewClockMutationCount: 0,
    syntheticInputDispatch: false,
    finiteInputInertiaOnly: false,
    inertiaEnabled: false,
    firstFrameStatic: true,
    initialStaticVerified: false,
    reducedMotion: reducedMotionQuery.matches,
    rotation: DEFAULT_ROTATION,
    depth: DEFAULT_DEPTH,
    mode: 'compose',
    dragging: false,
    pointerCaptured: false,
    activePointerId: null,
    activePointerType: null,
    pointerCaptureCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    dragMoveCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedCount: 0,
    pointerInputCount: 0,
    wheelInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    rotationMutationCount: 0,
    depthMutationCount: 0,
    inspectionCount: 0,
    resetCount: 0,
    positiveInputCount: 0,
    negativeInputCount: 0,
    reversalCount: 0,
    lastDirection: 0,
    lastInputType: 'none',
    lastInputTrusted: null,
    phrase: PHRASE,
    phraseGlyphCount: phraseGlyphs.length,
    phraseCodePoints: phraseGlyphs.map(glyph => glyph.codePoint),
    projectedGlyphCount: 0,
    backGlyphCount: 0,
    frontGlyphCount: 0,
    frontGlyphIndex: 0,
    frontGlyphCharacter: phraseGlyphs[0].character,
    lastGlyphOrderSignature: '',
    glyphOrderIntegrity: false,
    artworkUrl: ARTWORK_URL,
    artworkSourceKind: 'project-local-imagegen-asset',
    artworkAiDisclosure: 'fictional-ai-generated-release-artwork-not-a-real-artist-or-release',
    artworkByteLength: 0,
    artworkSha256: '',
    artworkWidth: 0,
    artworkHeight: 0,
    artworkDecoded: false,
    artworkDimensionsValid: false,
    artworkSampleChecksum: '',
    artworkSampledPixelCount: 0,
    artworkPalette: [],
    artworkPaletteDistinct: false,
    artworkDrawCount: 0,
    paletteDrivenInterface: false,
    p5Ready: false,
    canvas2dReady: false,
    drawCount: 0,
    resizeCount: 0,
    previewRenderCount: 0,
    redrawRequestCount: 0,
    revision: 0,
    drawnRevision: -1,
    ledger: [],
    lastLedgerEntry: null,
  };
  window.__PREVIEW_INTERACTION_STATE__ = state;

  let artwork = null;
  let sketch = null;
  let dragSession = null;
  let resizeFrame = 0;

  function recordLedger(entry) {
    const next = {
      ...entry,
      rotation: round(state.rotation),
      depth: round(state.depth),
      inputCountAtEntry: state.inputCount,
      trusted: true,
    };
    state.ledger.push(next);
    if (state.ledger.length > 48) state.ledger.shift();
    state.lastLedgerEntry = next;
  }

  function recordTrustedInput(event, kind, cause) {
    if (!event || event.isTrusted !== true) {
      state.rejectedUntrustedCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputType = kind;
    state.lastInputTrusted = true;
    if (kind === 'wheel') state.wheelInputCount += 1;
    else if (kind === 'keyboard') state.keyboardInputCount += 1;
    else if (kind === 'control') state.controlInputCount += 1;
    else {
      state.pointerInputCount += 1;
      if (kind === 'touch') state.touchInputCount += 1;
      if (kind === 'pen') state.penInputCount += 1;
    }
    recordLedger({ type: 'input', kind, cause });
    return true;
  }

  function registerDirection(delta, cause) {
    const direction = Math.sign(delta);
    if (!direction) return;
    if (direction > 0) state.positiveInputCount += 1;
    else state.negativeInputCount += 1;
    if (state.lastDirection && direction !== state.lastDirection) state.reversalCount += 1;
    state.lastDirection = direction;
    recordLedger({ type: 'direction', direction, cause });
  }

  function updateInterface() {
    const frontIndex = state.frontGlyphIndex;
    const displayCharacter = state.frontGlyphCharacter === ' ' ? 'SPACE' : state.frontGlyphCharacter;
    stage.dataset.inspecting = String(state.mode === 'order-checked');
    host.dataset.dragging = String(state.dragging);
    releaseStatus.textContent = state.mode === 'order-checked' ? 'Phrase order verified' : state.dragging ? 'Human rotation active' : 'Lockup stationary';
    frontGlyphOutput.textContent = `${String(frontIndex + 1).padStart(2, '0')} / ${String(phraseGlyphs.length).padStart(2, '0')} · ${displayCharacter}`;
    interactionMode.textContent = state.mode === 'order-checked' ? 'Start glyph aligned' : state.dragging ? 'Release to inspect' : 'Drag to orbit';
    depthOutput.value = String(Math.round(state.depth * 100));
    depthOutput.textContent = depthOutput.value;
    if (document.activeElement !== depthControl) depthControl.value = String(Math.round(state.depth * 100));
    inspectControl.textContent = state.mode === 'order-checked' ? 'Order checked' : 'Check order';
  }

  function requestDraw(cause) {
    if (!sketch || !state.p5Ready) return;
    state.redrawRequestCount += 1;
    state.revision += 1;
    state.lastDrawCause = cause;
    sketch.redraw();
  }

  function setRotation(nextRotation, cause) {
    const previous = state.rotation;
    const next = wrapAngle(nextRotation);
    if (Math.abs(next - previous) <= .000001) return false;
    state.rotation = next;
    state.rotationMutationCount += 1;
    state.mode = 'compose';
    registerDirection(wrapAngle(next - previous), cause);
    recordLedger({ type: 'rotation', cause, from: round(previous), to: round(next) });
    updateInterface();
    requestDraw(cause);
    return true;
  }

  function setDepth(nextDepth, cause) {
    const previous = state.depth;
    const next = clamp(nextDepth, .52, .96);
    if (Math.abs(next - previous) <= .000001) return false;
    state.depth = next;
    state.depthMutationCount += 1;
    state.mode = 'compose';
    recordLedger({ type: 'depth', cause, from: round(previous), to: round(next) });
    updateInterface();
    requestDraw(cause);
    return true;
  }

  function inspectOrder(cause) {
    const previous = state.rotation;
    state.rotation = 0;
    state.mode = 'order-checked';
    state.inspectionCount += 1;
    if (Math.abs(previous) > .000001) {
      state.rotationMutationCount += 1;
      registerDirection(wrapAngle(-previous), cause);
    }
    recordLedger({ type: 'order-check', cause, alignedGlyph: phraseGlyphs[0].character });
    updateInterface();
    requestDraw(cause);
  }

  function resetOrbit(cause) {
    state.rotation = DEFAULT_ROTATION;
    state.depth = DEFAULT_DEPTH;
    state.mode = 'compose';
    state.resetCount += 1;
    state.rotationMutationCount += 1;
    state.depthMutationCount += 1;
    state.lastDirection = 0;
    recordLedger({ type: 'reset', cause });
    updateInterface();
    requestDraw(cause);
  }

  function releasePointer(event, cause, cancelled = false) {
    if (!dragSession || event.pointerId !== dragSession.pointerId) return;
    if (!recordTrustedInput(event, event.pointerType || 'mouse', cause)) return;
    if (host.hasPointerCapture?.(event.pointerId)) host.releasePointerCapture(event.pointerId);
    state.pointerReleaseCount += cancelled ? 0 : 1;
    state.pointerCancelCount += cancelled ? 1 : 0;
    state.pointerCaptured = false;
    state.activePointerId = null;
    state.activePointerType = null;
    state.dragging = false;
    dragSession = null;
    recordLedger({ type: cancelled ? 'pointer-cancel' : 'pointer-release', cause });
    updateInterface();
  }

  host.addEventListener('pointerdown', event => {
    const kind = event.pointerType || 'mouse';
    if (!recordTrustedInput(event, kind, 'orbit-drag-start')) return;
    event.preventDefault();
    host.focus({ preventScroll: true });
    host.setPointerCapture(event.pointerId);
    dragSession = { pointerId: event.pointerId, lastX: event.clientX };
    state.dragging = true;
    state.pointerCaptured = host.hasPointerCapture(event.pointerId);
    state.activePointerId = event.pointerId;
    state.activePointerType = kind;
    state.pointerCaptureCount += state.pointerCaptured ? 1 : 0;
    recordLedger({ type: 'pointer-capture', cause: 'orbit-drag-start', pointerId: event.pointerId, pointerType: kind });
    updateInterface();
  });

  host.addEventListener('pointermove', event => {
    if (!dragSession || event.pointerId !== dragSession.pointerId) return;
    const kind = event.pointerType || 'mouse';
    if (!recordTrustedInput(event, kind, 'orbit-drag-move')) return;
    const deltaX = event.clientX - dragSession.lastX;
    dragSession.lastX = event.clientX;
    if (Math.abs(deltaX) < .05) return;
    state.dragMoveCount += 1;
    setRotation(state.rotation + (deltaX / Math.max(1, host.clientWidth)) * TAU * 1.45, 'pointer-drag');
  });

  host.addEventListener('pointerup', event => releasePointer(event, 'orbit-drag-end'));
  host.addEventListener('pointercancel', event => releasePointer(event, 'orbit-drag-cancel', true));

  host.addEventListener('wheel', event => {
    if (!recordTrustedInput(event, 'wheel', 'orbit-wheel')) return;
    event.preventDefault();
    setRotation(state.rotation + clamp(event.deltaY, -120, 120) * .0037, 'wheel');
  }, { passive: false });

  host.addEventListener('keydown', event => {
    const rotationKeys = { ArrowLeft: -.19, ArrowRight: .19, PageUp: -.52, PageDown: .52 };
    if (Object.hasOwn(rotationKeys, event.key)) {
      if (!recordTrustedInput(event, 'keyboard', `keyboard-${event.key}`)) return;
      event.preventDefault();
      setRotation(state.rotation + rotationKeys[event.key], `keyboard-${event.key}`);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      if (!recordTrustedInput(event, 'keyboard', 'keyboard-order-check')) return;
      event.preventDefault();
      inspectOrder('keyboard-order-check');
      return;
    }
    if (event.key === 'Home' || event.key.toLowerCase() === 'r' || event.key === 'Escape') {
      if (!recordTrustedInput(event, 'keyboard', `keyboard-${event.key}`)) return;
      event.preventDefault();
      resetOrbit(`keyboard-${event.key}`);
    }
  });

  depthControl.addEventListener('input', event => {
    if (!recordTrustedInput(event, 'control', 'depth-control')) return;
    setDepth(Number(depthControl.value) / 100, 'depth-control');
  });

  inspectControl.addEventListener('click', event => {
    if (!recordTrustedInput(event, 'control', 'order-control')) return;
    inspectOrder('order-control');
  });

  resetControl.addEventListener('click', event => {
    if (!recordTrustedInput(event, 'control', 'reset-control')) return;
    resetOrbit('reset-control');
  });

  function drawRoundedArtwork(context, image, x, y, size, radius) {
    context.save();
    context.beginPath();
    context.roundRect(x, y, size, size, radius);
    context.clip();
    context.drawImage(image, x, y, size, size);
    const shade = context.createLinearGradient(x, y, x, y + size);
    shade.addColorStop(0, 'rgba(2, 5, 12, .04)');
    shade.addColorStop(.68, 'rgba(2, 5, 12, .02)');
    shade.addColorStop(1, 'rgba(2, 5, 12, .32)');
    context.fillStyle = shade;
    context.fillRect(x, y, size, size);
    context.restore();
    state.artworkDrawCount += 1;
  }

  function drawGlyph(p, glyph, textSize, inspecting) {
    const frontness = (glyph.z + 1) / 2;
    const scale = .48 + frontness * .66;
    const alpha = .16 + frontness * .84;
    const isStart = glyph.sourceIndex === 0;
    p.push();
    p.translate(glyph.x, glyph.y);
    p.rotate(glyph.tangent);
    p.scale(scale);
    if (inspecting && isStart) {
      p.noFill();
      p.stroke(state.palette.amber[0], state.palette.amber[1], state.palette.amber[2], 235);
      p.strokeWeight(1.2 / scale);
      p.circle(0, 0, textSize * 1.5);
    }
    p.noStroke();
    const color = glyph.z >= 0 ? state.palette.ink : state.palette.cobalt;
    p.fill(color[0], color[1], color[2], alpha * 255);
    p.textSize(textSize);
    p.text(glyph.character, 0, 0);
    p.pop();
  }

  function renderScene(p) {
    const width = p.width;
    const height = p.height;
    const compact = width <= 200 || height <= 110;
    const centerX = width * .63;
    const centerY = height * .48;
    const artworkSize = Math.min(height * .64, width * .35);
    const radiusX = artworkSize * (.58 + state.depth * .33);
    const depthLift = artworkSize * (.09 + state.depth * .14);
    const textSize = Math.max(4.4, height * (compact ? .06 : .058));
    const artworkX = centerX - artworkSize / 2;
    const artworkY = centerY - artworkSize / 2;
    const context = p.drawingContext;

    p.clear();
    p.background(5, 8, 17);
    context.save();
    context.globalAlpha = .27;
    context.filter = `blur(${Math.max(8, height * .07)}px) saturate(1.2)`;
    const ambienceSize = Math.max(width, height * 1.45);
    context.drawImage(artwork, centerX - ambienceSize / 2, centerY - ambienceSize / 2, ambienceSize, ambienceSize);
    context.restore();
    state.artworkDrawCount += 1;

    const glyphs = phraseGlyphs.map(glyph => {
      const angle = state.rotation + (glyph.sourceIndex / phraseGlyphs.length) * TAU;
      const z = Math.cos(angle);
      return {
        ...glyph,
        angle,
        z,
        x: centerX + Math.sin(angle) * radiusX,
        y: centerY - z * depthLift,
        tangent: Math.cos(angle) * .3,
      };
    });
    const depthSortedGlyphs = [...glyphs].sort((left, right) => left.z - right.z);
    const backGlyphs = depthSortedGlyphs.filter(glyph => glyph.z < 0);
    const frontGlyphs = depthSortedGlyphs.filter(glyph => glyph.z >= 0);
    const frontGlyph = glyphs.reduce((closest, glyph) => glyph.z > closest.z ? glyph : closest, glyphs[0]);

    p.textFont('system-ui');
    p.textStyle(p.BOLD);
    p.textAlign(p.CENTER, p.CENTER);
    backGlyphs.forEach(glyph => drawGlyph(p, glyph, textSize, state.mode === 'order-checked'));

    context.save();
    context.shadowColor = 'rgba(0, 0, 0, .55)';
    context.shadowBlur = height * .09;
    drawRoundedArtwork(context, artwork, artworkX, artworkY, artworkSize, artworkSize * .045);
    context.restore();
    p.noFill();
    p.stroke(217, 229, 255, 42);
    p.strokeWeight(Math.max(.55, height * .0022));
    p.rect(artworkX, artworkY, artworkSize, artworkSize, artworkSize * .045);

    frontGlyphs.forEach(glyph => drawGlyph(p, glyph, textSize, state.mode === 'order-checked'));
    p.noFill();
    p.stroke(state.palette.cobalt[0], state.palette.cobalt[1], state.palette.cobalt[2], state.mode === 'order-checked' ? 102 : 48);
    p.strokeWeight(Math.max(.55, height * .0022));
    p.ellipse(centerX, centerY, radiusX * 2, depthLift * 2);

    state.projectedGlyphCount = glyphs.length;
    state.backGlyphCount = backGlyphs.length;
    state.frontGlyphCount = frontGlyphs.length;
    state.frontGlyphIndex = frontGlyph.sourceIndex;
    state.frontGlyphCharacter = frontGlyph.character;
    state.lastGlyphOrderSignature = [...glyphs].sort((left, right) => left.sourceIndex - right.sourceIndex).map(glyph => glyph.character).join('');
    state.glyphOrderIntegrity = state.lastGlyphOrderSignature === PHRASE && glyphs.every((glyph, index) => glyph.sourceIndex === index && glyph.codePoint === phraseGlyphs[index].codePoint);
    state.drawCount += 1;
    state.drawnRevision = state.revision;
    updateInterface();
    if (state.initialStaticVerified || state.inputCount > 0) {
      try {
        stage.dataset.runtimeAssert = String(window.__PREVIEW_RUNTIME_ASSERT__() === true);
      } catch {
        stage.dataset.runtimeAssert = 'false';
      }
    }
  }

  async function loadArtwork() {
    const response = await fetch(ARTWORK_URL, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Release artwork request failed with status ${response.status}.`);
    const bytes = await response.arrayBuffer();
    const sha256 = await sha256Hex(bytes);
    if (bytes.byteLength !== EXPECTED_ARTWORK_BYTES || sha256 !== EXPECTED_ARTWORK_SHA256) {
      throw new Error('Release artwork byte identity differs from the documented local asset.');
    }
    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: response.headers.get('content-type') || 'image/jpeg' }));
    const image = new Image();
    image.decoding = 'async';
    image.src = objectUrl;
    try {
      await image.decode();
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    if (image.naturalWidth !== 960 || image.naturalHeight !== 960) throw new Error('Release artwork dimensions must remain 960×960.');
    const sample = sampledArtworkData(image);
    state.artworkByteLength = bytes.byteLength;
    state.artworkSha256 = sha256;
    state.artworkWidth = image.naturalWidth;
    state.artworkHeight = image.naturalHeight;
    state.artworkDecoded = true;
    state.artworkDimensionsValid = true;
    state.artworkSampleChecksum = sample.checksum;
    state.artworkSampledPixelCount = sample.sampledPixelCount;
    state.artworkPalette = [sample.cobalt, sample.amber];
    state.artworkPaletteDistinct = Math.hypot(...sample.cobalt.map((channel, index) => channel - sample.amber[index])) > 75;
    state.paletteDrivenInterface = true;
    state.palette = {
      cobalt: sample.cobalt,
      amber: sample.amber,
      ink: [244, 240, 233],
    };
    stage.style.setProperty('--sample-cobalt', rgbString(sample.cobalt));
    stage.style.setProperty('--sample-amber', rgbString(sample.amber));
    artwork = image;
  }

  function initializeSketch() {
    return new Promise(resolve => {
      sketch = new p5(p => {
        p.setup = () => {
          p.pixelDensity(1);
          const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
          canvas.parent(host);
          p.noLoop();
          state.p5Ready = true;
          state.canvas2dReady = Boolean(canvas.elt.getContext('2d'));
          p.redraw();
          requestAnimationFrame(() => resolve());
        };
        p.draw = () => renderScene(p);
      }, host);
    });
  }

  function resizeSketch() {
    if (!sketch || !state.p5Ready) return;
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      const nextWidth = Math.max(1, stage.clientWidth);
      const nextHeight = Math.max(1, stage.clientHeight);
      if (sketch.width === nextWidth && sketch.height === nextHeight) return;
      sketch.resizeCanvas(nextWidth, nextHeight, false);
      state.resizeCount += 1;
      requestDraw('viewport-resize');
    });
  }
  window.addEventListener('resize', resizeSketch);

  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', event => {
      state.reducedMotion = event.matches;
      updateInterface();
    });
  }

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const assert = (condition, message) => {
      if (!condition) throw new Error(`curved-3d-text-orbit: ${message}`);
    };
    const canvas = host.querySelector('canvas');
    const stageRect = stage.getBoundingClientRect();
    const canvasRect = canvas?.getBoundingClientRect();
    const libraryBadge = stage.querySelector('.library-badge');
    const libraryBadgeRect = libraryBadge?.getBoundingClientRect();
    const libraryBadgeHidden = libraryBadge ? getComputedStyle(libraryBadge).display === 'none' : false;
    const assetUrl = new URL(ARTWORK_URL);
    assert(window.__PREVIEW_INTERACTION_STATE__ === state, 'interaction state export is missing');
    assert(sketch instanceof p5 && state.p5Ready && state.canvas2dReady, 'p5 Canvas2D renderer is not ready');
    assert(canvasRect && Math.abs(canvasRect.width - stageRect.width) < 1 && Math.abs(canvasRect.height - stageRect.height) < 1, 'canvas must fill the live preview stage');
    assert(canvas?.width === Math.round(stageRect.width) && canvas?.height === Math.round(stageRect.height), 'canvas backing buffer must match the stage pixels');
    assert(libraryBadge && (libraryBadgeHidden || (libraryBadgeRect.width < stageRect.width * .65 && libraryBadgeRect.height < stageRect.height * .18 && libraryBadgeRect.top > stageRect.height * .55)), 'library badge must remain a compact footer label instead of obscuring the live canvas');
    assert(state.userInputRequired && state.trustedInputOnly, 'rotation must remain human-operated with trusted inputs');
    assert(!state.automaticPlayback && !state.automaticCruise && !state.automaticRehearsal && !state.automaticFallback, 'automatic motion and fallback must remain disabled');
    assert(!state.previewClockDriven && state.previewClockMutationCount === 0 && !state.syntheticInputDispatch, 'preview clock and synthetic input must not drive the orbit');
    assert(!state.inertiaEnabled && !state.finiteInputInertiaOnly, 'this lockup must stop immediately when human input stops');
    assert(state.firstFrameStatic && (state.initialStaticVerified || state.inputCount > 0), 'the first frame must remain stationary');
    assert(state.phrase === PHRASE && state.phraseGlyphCount === Array.from(PHRASE).length, 'the complete release phrase changed');
    assert(state.projectedGlyphCount === state.phraseGlyphCount && state.glyphOrderIntegrity, 'every phrase glyph must project once in source order');
    assert(state.backGlyphCount > 0 && state.frontGlyphCount > 0 && state.backGlyphCount + state.frontGlyphCount === state.phraseGlyphCount, 'front/back depth sorting is incomplete');
    assert(assetUrl.origin === location.origin && assetUrl.pathname.includes('orbital-resonance-release-art') && assetUrl.pathname.endsWith('.jpg'), 'artwork must stay project-local');
    assert(state.artworkDecoded && state.artworkDimensionsValid && state.artworkWidth === 960 && state.artworkHeight === 960, 'release artwork is not decoded at its documented dimensions');
    assert(state.artworkByteLength === EXPECTED_ARTWORK_BYTES && state.artworkSha256 === EXPECTED_ARTWORK_SHA256, 'release artwork identity verification failed');
    assert(state.artworkSampledPixelCount === 1600 && state.artworkSampleChecksum.length === 8, 'real artwork pixel sampling is incomplete');
    assert(state.artworkPalette.length === 2 && state.artworkPaletteDistinct && state.paletteDrivenInterface, 'artwork-derived cobalt and amber roles are not active');
    assert(state.artworkDrawCount >= 2 && state.drawCount > 0 && state.drawnRevision === state.revision, 'decoded artwork and glyph projection must be visible in the latest p5 draw');
    assert(inspectControl.type === 'button' && resetControl.type === 'button' && depthControl.type === 'range' && host.tabIndex === 0, 'accessible human controls are incomplete');
    assert(!state.pointerCaptured || (state.dragging && state.activePointerId !== null), 'pointer capture state is inconsistent');
    assert(state.trustedInputCount === state.inputCount && state.rejectedUntrustedCount >= 0, 'trusted input ledger is inconsistent');
    return true;
  };

  const ready = Promise.resolve(document.fonts?.ready)
    .then(loadArtwork)
    .then(initializeSketch)
    .then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    .then(() => {
      const initialDrawCount = state.drawCount;
      const initialRotation = state.rotation;
      const initialDepth = state.depth;
      return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
        state.initialStaticVerified = state.inputCount === 0
          && state.drawCount === initialDrawCount
          && state.rotation === initialRotation
          && state.depth === initialDepth
          && state.mode === 'compose';
        if (!state.initialStaticVerified) throw new Error('Initial release lockup changed without human input.');
        if (window.__PREVIEW_RUNTIME_ASSERT__() !== true) throw new Error('Initial orbit runtime assertion failed.');
        stage.dataset.runtimeAssert = 'true';
        resolve();
      })));
    });

  ready.catch(markPreviewFailure);
  updateInterface();
  installPreviewController({
    id: 'curved-3d-text-orbit',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: () => {
      state.previewRenderCount += 1;
    },
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
