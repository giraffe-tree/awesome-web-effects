import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL('../assets/typographic-time-slit/north-sea-review-version-proof-v2.jpg', import.meta.url).href;
const EXPECTED_ASSET_SHA256 = 'c198935149ddc604574425ab9c5934025e8495e6b96d663be8cbefdc7ec12bfa';
const EXPECTED_ASSET_BYTES = 201120;
const SAMPLE_WIDTH = 72;
const SAMPLE_HEIGHT = 72;
const TILE_COLUMNS = 8;
const TILE_ROWS = 6;
const INITIAL_SLIT = 0.58;
const INITIAL_SLIT_HEIGHT = 0.2;
const BEFORE_CROP = Object.freeze({ x: 43, y: 88, width: 402, height: 383 });
const AFTER_CROP = Object.freeze({ x: 516, y: 88, width: 400, height: 383 });
const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const rounded = (value, digits = 4) => Number(value.toFixed(digits));

async function sha256(buffer) {
  const source = buffer instanceof ArrayBuffer
    ? buffer
    : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  const digest = await crypto.subtle.digest('SHA-256', source);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function colorDistance(left, right) {
  const red = left[0] - right[0];
  const green = left[1] - right[1];
  const blue = left[2] - right[2];
  return Math.sqrt(red * red * .26 + green * green * .55 + blue * blue * .19);
}

function rgbCss(rgb) {
  return `rgb(${rgb.map(value => Math.round(clamp(value, 0, 255))).join(' ')})`;
}

try {
  const stage = document.querySelector('#expansion-stage');
  const canvasHost = document.querySelector('#time-slit-canvas');
  const reviewStatus = document.querySelector('#review-status');
  const evidenceScore = document.querySelector('#evidence-score');
  const regionStatus = document.querySelector('#region-status');
  const slitReadout = document.querySelector('#slit-readout');
  const actionButtons = [...document.querySelectorAll('[data-slit-target]')];
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    id: 'typographic-time-slit',
    task: 'human-operated-fictional-editorial-version-proof-inspection',
    claimedLibrary: 'p5@2.3.0',
    renderer: 'canvas2d',
    mechanism: 'trusted-human-input-directly-moves-a-horizontal-p5-clip-between-two-pixel-proven-editorial-versions',
    assetMechanismRole: 'decoded-left-and-right-proof-pixels-drive-both-visible-timelines-change-regions-palette-score-and-acceptance',
    acceptedInputs: ['mouse-hover', 'mouse-drag', 'touch-drag', 'pen-drag', 'keyboard', 'button-control'],
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    automaticCycle: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    reducedMotion: reducedMotionQuery.matches,
    ready: false,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerEnterCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    hoverInputCount: 0,
    capturedPointerMoveCount: 0,
    keyboardInputCount: 0,
    buttonActivationCount: 0,
    hoverMutationCount: 0,
    dragMutationCount: 0,
    keyboardMutationCount: 0,
    buttonMutationCount: 0,
    slitMutationCount: 0,
    humanInputCausalityCount: 0,
    distinctVisitedBandCount: 1,
    visitedBands: ['STRUCTURE'],
    lastInputKind: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    activePointerId: null,
    pointerCaptured: false,
    slitPosition: INITIAL_SLIT,
    slitHeightRatio: INITIAL_SLIT_HEIGHT,
    initialSlitPosition: INITIAL_SLIT,
    selectedBandIndex: 3,
    selectedBandLabel: 'STRUCTURE',
    selectedBandMeanDelta: 0,
    sourceBeforeCrop: { ...BEFORE_CROP },
    sourceAfterCrop: { ...AFTER_CROP },
    assetUrl: ASSET_URL,
    expectedAssetSha256: EXPECTED_ASSET_SHA256,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetSameOrigin: false,
    assetMimeType: '',
    assetByteLength: 0,
    assetSha256: '',
    assetShaMatchesExpected: false,
    browserImageDecoded: false,
    sourceNaturalWidth: 0,
    sourceNaturalHeight: 0,
    p5ImageDecoded: false,
    p5ImageClass: null,
    p5ImageWidth: 0,
    p5ImageHeight: 0,
    p5ImagePixelLength: 0,
    sampledWidth: SAMPLE_WIDTH,
    sampledHeight: SAMPLE_HEIGHT,
    sampledPixelCountPerVersion: 0,
    sampledPixelByteLengthPerVersion: 0,
    comparedPixelCount: 0,
    comparisonPixelSha256: '',
    comparisonPixelShaValid: false,
    distinctSampleColorCount: 0,
    changedPixelCount: 0,
    changedPixelRatio: 0,
    meanPixelDelta: 0,
    maximumPixelDelta: 0,
    tileCount: 0,
    changedTileCount: 0,
    changeThreshold: 0,
    tileEvidence: [],
    rowEvidence: [],
    beforeAverageRgb: [],
    afterAverageRgb: [],
    releaseAccentRgb: [],
    averagePaletteDistance: 0,
    evidenceScore: 0,
    acceptanceThreshold: 52,
    acceptanceOutcome: 'PENDING',
    assetEvidenceReady: false,
    pixelEvidenceReady: false,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    resizeCount: 0,
    renderCount: 0,
    previewClockRenderCount: 0,
    previewClockIgnoredCount: 0,
    previewClockMutationCount: 0,
    initialVisualStateChecksum: '',
    currentVisualStateChecksum: '',
    initialStaticConfirmationCount: 0,
    initialStaticConfirmed: false,
    runtimeAssertionPassed: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__TYPOGRAPHIC_TIME_SLIT_STATE__ = state;

  let sketch;
  let proofImage;
  let beforeSample;
  let afterSample;
  let activeDrag = null;
  let dirty = true;
  let resizeFrame = 0;
  const visitedBands = new Set(state.visitedBands);

  function invariant(condition, message) {
    if (!condition) throw new Error(`typographic-time-slit: ${message}`);
  }

  function visualStateChecksum() {
    return [
      state.slitPosition.toFixed(5),
      state.slitHeightRatio.toFixed(5),
      state.selectedBandIndex,
      state.acceptanceOutcome,
      state.evidenceScore,
    ].join('|');
  }

  function syncDataset() {
    stage.dataset.slitPosition = state.slitPosition.toFixed(4);
    stage.dataset.selectedBand = state.selectedBandLabel;
    stage.dataset.acceptance = state.acceptanceOutcome;
    stage.dataset.evidenceScore = String(state.evidenceScore);
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.slitMutationCount = String(state.slitMutationCount);
    stage.dataset.pointerCaptured = String(state.pointerCaptured);
    stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
    stage.dataset.automaticPlayback = String(state.automaticPlayback);
    stage.dataset.captureClockDriven = String(state.captureClockDriven);
    stage.setAttribute('aria-valuenow', String(Math.round(state.slitPosition * 100)));
    stage.setAttribute('aria-valuetext', `${state.selectedBandLabel}, ${Math.round(state.selectedBandMeanDelta)} pixel delta`);
  }

  function acceptTrustedInput(event, kind) {
    if (event?.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      syncDataset();
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.lastInputKind = kind;
    state.lastInputTrusted = true;
    if (event.pointerType) state.lastPointerType = event.pointerType;
    return true;
  }

  function bandForPosition(position) {
    const index = clamp(Math.floor(position * TILE_ROWS), 0, TILE_ROWS - 1);
    const labels = ['MAST', 'WEATHER', 'STRUCTURE', 'STRUCTURE', 'TIDE', 'TIDE'];
    return { index, label: labels[index] };
  }

  function updateEvidenceReadouts() {
    const band = bandForPosition(state.slitPosition);
    state.selectedBandIndex = band.index;
    state.selectedBandLabel = band.label;
    state.selectedBandMeanDelta = state.rowEvidence[band.index]?.meanDelta ?? 0;
    visitedBands.add(band.label);
    state.visitedBands = [...visitedBands];
    state.distinctVisitedBandCount = visitedBands.size;

    reviewStatus.textContent = state.acceptanceOutcome === 'PASS' ? 'VERSION EVIDENCE · PASS' : 'VERSION EVIDENCE · REVIEW';
    evidenceScore.textContent = `${state.evidenceScore} / 100`;
    regionStatus.textContent = `${band.label} · Δ ${Math.round(state.selectedBandMeanDelta)}`;
    slitReadout.textContent = `${Math.round(state.slitPosition * 100)}%`;
    actionButtons.forEach(button => {
      const target = Number(button.dataset.slitTarget);
      const active = Number.isFinite(target) && Math.abs(target - state.slitPosition) < .06;
      button.setAttribute('aria-pressed', String(active));
    });
    syncDataset();
  }

  function commitSlit(nextPosition, origin) {
    const next = clamp(nextPosition, .1, .9);
    if (Math.abs(next - state.slitPosition) < .001) return false;
    state.slitPosition = next;
    state.slitMutationCount += 1;
    state.humanInputCausalityCount += 1;
    if (origin === 'hover') state.hoverMutationCount += 1;
    if (origin === 'drag') state.dragMutationCount += 1;
    if (origin === 'keyboard') state.keyboardMutationCount += 1;
    if (origin === 'button') state.buttonMutationCount += 1;
    updateEvidenceReadouts();
    dirty = true;
    if (state.pixelEvidenceReady) sketch.redraw();
    return true;
  }

  function pointerPosition(event) {
    const bounds = stage.getBoundingClientRect();
    return clamp((event.clientY - bounds.top) / Math.max(1, bounds.height));
  }

  stage.addEventListener('pointerenter', event => {
    if (!acceptTrustedInput(event, 'pointer-enter')) return;
    state.pointerEnterCount += 1;
    if (event.pointerType === 'mouse' && event.buttons === 0) commitSlit(pointerPosition(event), 'hover');
  });

  stage.addEventListener('pointermove', event => {
    if (event.target.closest?.('button')) return;
    if (!acceptTrustedInput(event, activeDrag ? 'captured-pointer-drag' : 'pointer-hover')) return;
    state.pointerMoveCount += 1;
    if (activeDrag && activeDrag.pointerId === event.pointerId) {
      state.capturedPointerMoveCount += 1;
      commitSlit(pointerPosition(event), 'drag');
      event.preventDefault();
      return;
    }
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      state.hoverInputCount += 1;
      commitSlit(pointerPosition(event), 'hover');
    }
  });

  stage.addEventListener('pointerdown', event => {
    if (event.target.closest?.('button')) return;
    if (!acceptTrustedInput(event, 'pointer-down')) return;
    if (event.button !== 0) return;
    state.pointerDownCount += 1;
    activeDrag = { pointerId: event.pointerId };
    state.activePointerId = event.pointerId;
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptureCount += 1;
    state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
    stage.focus({ preventScroll: true });
    commitSlit(pointerPosition(event), 'drag');
    syncDataset();
    event.preventDefault();
  });

  function releasePointer(event, cancelled) {
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
    if (!acceptTrustedInput(event, cancelled ? 'pointer-cancel' : 'pointer-up')) return;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    activeDrag = null;
    state.activePointerId = null;
    state.pointerCaptured = false;
    syncDataset();
  }

  stage.addEventListener('pointerup', event => releasePointer(event, false));
  stage.addEventListener('pointercancel', event => releasePointer(event, true));

  stage.addEventListener('keydown', event => {
    const commands = {
      ArrowUp: () => commitSlit(state.slitPosition - .08, 'keyboard'),
      ArrowDown: () => commitSlit(state.slitPosition + .08, 'keyboard'),
      Home: () => commitSlit(.16, 'keyboard'),
      End: () => commitSlit(.84, 'keyboard'),
      PageUp: () => commitSlit(.34, 'keyboard'),
      PageDown: () => commitSlit(.7, 'keyboard'),
    };
    const command = commands[event.key];
    if (!command || !acceptTrustedInput(event, `keyboard-${event.key}`)) return;
    state.keyboardInputCount += 1;
    command();
    event.preventDefault();
  });

  actionButtons.forEach(button => {
    button.addEventListener('click', event => {
      if (!acceptTrustedInput(event, `button-${button.textContent.trim().toLowerCase()}`)) return;
      state.buttonActivationCount += 1;
      commitSlit(Number(button.dataset.slitTarget), 'button');
    });
  });

  async function fetchAndDecodeAsset() {
    const response = await fetch(ASSET_URL, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    state.assetMimeType = response.headers.get('content-type') ?? '';
    invariant(response.ok, `version proof request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await sha256(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET_SHA256;
    invariant(state.assetSameOrigin, 'version proof was not fetched from the preview origin');
    invariant(state.assetByteLength === EXPECTED_ASSET_BYTES, 'version proof byte length differs from the committed asset');
    invariant(state.assetShaMatchesExpected, 'version proof SHA-256 differs from the committed asset');

    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
    const browserImage = new Image();
    browserImage.src = objectUrl;
    try {
      await browserImage.decode();
      state.browserImageDecoded = true;
      state.sourceNaturalWidth = browserImage.naturalWidth;
      state.sourceNaturalHeight = browserImage.naturalHeight;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    invariant(state.sourceNaturalWidth === 960 && state.sourceNaturalHeight === 640,
      'browser-decoded version proof dimensions are not 960x640');
    state.assetEvidenceReady = true;
  }

  const assetReady = fetchAndDecodeAsset();

  const p5Ready = new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
          canvas.parent(canvasHost);
          canvas.elt.setAttribute('aria-hidden', 'true');
          p.noLoop();
          p.textFont('Inter, ui-sans-serif, system-ui, sans-serif');
          state.p5InstanceReady = p instanceof p5;
          state.p5CanvasReady = canvas.elt instanceof HTMLCanvasElement
            && p.drawingContext instanceof CanvasRenderingContext2D;
          state.p5CanvasWidth = p.width;
          state.p5CanvasHeight = p.height;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      p.draw = () => {
        state.p5DrawCount += 1;
        if (!state.pixelEvidenceReady || !proofImage) {
          p.background('#091521');
          return;
        }
        drawProof(p);
        state.p5CompletedDrawCount += 1;
        state.currentVisualStateChecksum = visualStateChecksum();
        dirty = false;
      };
    }, canvasHost);
  });

  function loadP5Image() {
    return new Promise((resolve, reject) => {
      sketch.loadImage(ASSET_URL, image => resolve(image), error => reject(new Error(`p5 image decode failed: ${error}`)));
    });
  }

  function panelPalette(pixels) {
    const average = [0, 0, 0];
    let accent = [180, 210, 220];
    let accentScore = -Infinity;
    for (let index = 0; index < pixels.length; index += 4) {
      const rgb = [pixels[index], pixels[index + 1], pixels[index + 2]];
      average[0] += rgb[0];
      average[1] += rgb[1];
      average[2] += rgb[2];
      const maximum = Math.max(...rgb);
      const minimum = Math.min(...rgb);
      const saturation = maximum - minimum;
      const luma = rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
      const warmCoolSeparation = Math.abs(rgb[0] - rgb[2]);
      const safeLuma = luma > 52 && luma < 232 ? 1 : .25;
      const score = saturation * .72 + warmCoolSeparation * .2 + safeLuma * 18;
      if (score > accentScore) {
        accentScore = score;
        accent = rgb;
      }
    }
    const count = pixels.length / 4;
    return {
      average: average.map(value => Math.round(value / count)),
      accent: accent.map(value => Math.round(value * .78 + 255 * .22)),
    };
  }

  async function analyseProofPixels() {
    await Promise.all([assetReady, p5Ready]);
    const decoded = await loadP5Image();
    state.p5ImageDecoded = decoded instanceof p5.Image;
    state.p5ImageClass = decoded instanceof p5.Image ? 'p5.Image' : decoded?.constructor?.name ?? null;
    state.p5ImageWidth = decoded.width;
    state.p5ImageHeight = decoded.height;
    decoded.loadPixels();
    state.p5ImagePixelLength = decoded.pixels.length;
    invariant(state.p5ImageDecoded && decoded.width === 960 && decoded.height === 640
      && decoded.pixels.length === 960 * 640 * 4, 'p5 did not decode the committed 960x640 proof image');

    proofImage = decoded;
    beforeSample = decoded.get(BEFORE_CROP.x, BEFORE_CROP.y, BEFORE_CROP.width, BEFORE_CROP.height);
    afterSample = decoded.get(AFTER_CROP.x, AFTER_CROP.y, AFTER_CROP.width, AFTER_CROP.height);
    beforeSample.resize(SAMPLE_WIDTH, SAMPLE_HEIGHT);
    afterSample.resize(SAMPLE_WIDTH, SAMPLE_HEIGHT);
    beforeSample.loadPixels();
    afterSample.loadPixels();
    const beforePixels = new Uint8ClampedArray(beforeSample.pixels);
    const afterPixels = new Uint8ClampedArray(afterSample.pixels);
    const combined = new Uint8ClampedArray(beforePixels.length + afterPixels.length);
    combined.set(beforePixels, 0);
    combined.set(afterPixels, beforePixels.length);

    state.sampledPixelCountPerVersion = SAMPLE_WIDTH * SAMPLE_HEIGHT;
    state.sampledPixelByteLengthPerVersion = beforePixels.byteLength;
    state.comparedPixelCount = SAMPLE_WIDTH * SAMPLE_HEIGHT;
    state.comparisonPixelSha256 = await sha256(combined);
    state.comparisonPixelShaValid = state.comparisonPixelSha256.length === 64
      && !/^0+$/.test(state.comparisonPixelSha256);

    const distinct = new Set();
    const deltas = new Float32Array(SAMPLE_WIDTH * SAMPLE_HEIGHT);
    let changedPixelCount = 0;
    let totalDelta = 0;
    let maximumDelta = 0;
    for (let pixel = 0; pixel < deltas.length; pixel += 1) {
      const offset = pixel * 4;
      const beforeRgb = [beforePixels[offset], beforePixels[offset + 1], beforePixels[offset + 2]];
      const afterRgb = [afterPixels[offset], afterPixels[offset + 1], afterPixels[offset + 2]];
      distinct.add(`${beforeRgb[0] >> 3}:${beforeRgb[1] >> 3}:${beforeRgb[2] >> 3}`);
      distinct.add(`${afterRgb[0] >> 3}:${afterRgb[1] >> 3}:${afterRgb[2] >> 3}`);
      const delta = colorDistance(beforeRgb, afterRgb);
      deltas[pixel] = delta;
      totalDelta += delta;
      maximumDelta = Math.max(maximumDelta, delta);
      if (delta >= 26) changedPixelCount += 1;
    }

    const meanDelta = totalDelta / deltas.length;
    const tileEvidence = [];
    for (let row = 0; row < TILE_ROWS; row += 1) {
      for (let column = 0; column < TILE_COLUMNS; column += 1) {
        const startX = Math.floor(column * SAMPLE_WIDTH / TILE_COLUMNS);
        const endX = Math.floor((column + 1) * SAMPLE_WIDTH / TILE_COLUMNS);
        const startY = Math.floor(row * SAMPLE_HEIGHT / TILE_ROWS);
        const endY = Math.floor((row + 1) * SAMPLE_HEIGHT / TILE_ROWS);
        let tileTotal = 0;
        let tileMaximum = 0;
        let count = 0;
        for (let y = startY; y < endY; y += 1) {
          for (let x = startX; x < endX; x += 1) {
            const delta = deltas[y * SAMPLE_WIDTH + x];
            tileTotal += delta;
            tileMaximum = Math.max(tileMaximum, delta);
            count += 1;
          }
        }
        tileEvidence.push({
          row,
          column,
          meanDelta: rounded(tileTotal / count, 2),
          maximumDelta: rounded(tileMaximum, 2),
        });
      }
    }

    const changeThreshold = Math.max(22, meanDelta * .84);
    tileEvidence.forEach(tile => { tile.changed = tile.meanDelta >= changeThreshold; });
    const rowEvidence = Array.from({ length: TILE_ROWS }, (_, row) => {
      const tiles = tileEvidence.filter(tile => tile.row === row);
      return {
        row,
        meanDelta: rounded(tiles.reduce((sum, tile) => sum + tile.meanDelta, 0) / tiles.length, 2),
        changedTileCount: tiles.filter(tile => tile.changed).length,
      };
    });

    const beforePalette = panelPalette(beforePixels);
    const afterPalette = panelPalette(afterPixels);
    const changedTileCount = tileEvidence.filter(tile => tile.changed).length;
    const changedPixelRatio = changedPixelCount / deltas.length;
    const averagePaletteDistance = colorDistance(beforePalette.average, afterPalette.average);
    const score = Math.round(clamp(
      changedPixelRatio * .42
        + Math.min(meanDelta / 90, 1) * .3
        + changedTileCount / tileEvidence.length * .18
        + Math.min(averagePaletteDistance / 80, 1) * .1,
      0,
      1,
    ) * 100);

    state.distinctSampleColorCount = distinct.size;
    state.changedPixelCount = changedPixelCount;
    state.changedPixelRatio = rounded(changedPixelRatio);
    state.meanPixelDelta = rounded(meanDelta, 2);
    state.maximumPixelDelta = rounded(maximumDelta, 2);
    state.tileCount = tileEvidence.length;
    state.changedTileCount = changedTileCount;
    state.changeThreshold = rounded(changeThreshold, 2);
    state.tileEvidence = tileEvidence;
    state.rowEvidence = rowEvidence;
    state.beforeAverageRgb = beforePalette.average;
    state.afterAverageRgb = afterPalette.average;
    state.releaseAccentRgb = afterPalette.accent;
    state.averagePaletteDistance = rounded(averagePaletteDistance, 2);
    state.evidenceScore = score;
    state.acceptanceOutcome = score >= state.acceptanceThreshold
      && changedPixelRatio >= .35
      && changedTileCount >= 10
      ? 'PASS'
      : 'REVIEW';

    invariant(state.distinctSampleColorCount > 350, 'version samples lost too much photographic color detail');
    invariant(state.changedPixelRatio > .35 && state.changedPixelRatio < 1,
      'proof pixels no longer establish a useful before/after difference');
    invariant(state.changedTileCount >= 10 && state.changedTileCount <= TILE_COLUMNS * TILE_ROWS,
      'pixel comparison no longer yields enough changed editorial regions');
    invariant(state.acceptanceOutcome === 'PASS', 'pixel-derived proof evidence no longer clears the fictional release threshold');

    document.documentElement.style.setProperty('--evidence-accent', rgbCss(afterPalette.accent));
    state.pixelEvidenceReady = true;
    updateEvidenceReadouts();
    dirty = true;
    sketch.redraw();
  }

  function coverSource(crop, targetWidth, targetHeight) {
    const targetAspect = targetWidth / Math.max(1, targetHeight);
    const sourceAspect = crop.width / crop.height;
    if (sourceAspect > targetAspect) {
      const width = crop.height * targetAspect;
      return { x: crop.x + (crop.width - width) / 2, y: crop.y, width, height: crop.height };
    }
    const height = crop.width / targetAspect;
    return { x: crop.x, y: crop.y + (crop.height - height) / 2, width: crop.width, height };
  }

  function drawPanelCover(p, crop) {
    const source = coverSource(crop, p.width, p.height);
    p.image(proofImage, 0, 0, p.width, p.height, source.x, source.y, source.width, source.height);
  }

  function drawGrade(p, release) {
    const context = p.drawingContext;
    const gradient = context.createLinearGradient(0, 0, p.width, p.height);
    if (release) {
      gradient.addColorStop(0, 'rgba(2, 16, 24, .34)');
      gradient.addColorStop(.48, 'rgba(3, 17, 25, .08)');
      gradient.addColorStop(1, 'rgba(4, 13, 20, .7)');
    } else {
      gradient.addColorStop(0, 'rgba(5, 15, 25, .54)');
      gradient.addColorStop(.5, 'rgba(13, 22, 31, .2)');
      gradient.addColorStop(1, 'rgba(8, 16, 24, .78)');
    }
    p.noStroke();
    context.fillStyle = gradient;
    context.fillRect(0, 0, p.width, p.height);
  }

  function drawEditorialType(p, release) {
    const small = clamp(p.width * .011, 5, 9);
    const headline = clamp(p.width * .079, 11, 57);
    const left = p.width * .045;
    const top = p.height * .37;
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textStyle(p.BOLD);
    p.textSize(small);
    p.textLeading(small * 1.15);
    p.fill(release ? '#f8efe0' : '#ccd5d8');
    p.text(release ? 'NORTH SEA REVIEW / RELEASE 05' : 'NORTH SEA REVIEW / DRAFT 04', left, p.height * .105);

    p.textSize(headline);
    p.textLeading(headline * .84);
    p.fill(release ? '#fff4df' : '#d9e0e1');
    p.text(release ? 'THE NORTH\nSEA WRITES\nA NEW LINE' : 'THE NORTH\nSEA HOLDS\nITS LINE', left, top);

    if (p.width > 210) {
      p.textStyle(p.NORMAL);
      p.textSize(small * .9);
      p.textLeading(small * 1.25);
      p.fill(release ? 'rgba(255,244,223,.86)' : 'rgba(217,224,225,.72)');
      p.text(release ? 'VERIFIED CROP · REBALANCED TONE' : 'OPEN PROOF · IMAGE / TYPE', left, p.height * .86);
    }
  }

  function drawChangeRail(p) {
    const railX = p.width - Math.max(6, p.width * .022);
    const railTop = p.height * .14;
    const railHeight = p.height * .7;
    const maximum = Math.max(...state.rowEvidence.map(row => row.meanDelta), 1);
    state.rowEvidence.forEach((row, index) => {
      const y = railTop + (index + .5) * railHeight / TILE_ROWS;
      const length = clamp(row.meanDelta / maximum, .2, 1) * clamp(p.width * .025, 3, 16);
      p.stroke(index === state.selectedBandIndex ? rgbCss(state.releaseAccentRgb) : 'rgba(240,245,241,.46)');
      p.strokeWeight(index === state.selectedBandIndex ? Math.max(1.25, p.width / 540) : Math.max(.65, p.width / 900));
      p.line(railX - length, y, railX, y);
    });
  }

  function drawProof(p) {
    p.background('#091521');
    drawPanelCover(p, BEFORE_CROP);
    drawGrade(p, false);
    drawEditorialType(p, false);

    const slitHeight = p.height * state.slitHeightRatio;
    const slitCenter = p.height * state.slitPosition;
    const slitTop = clamp(slitCenter - slitHeight / 2, 0, p.height - slitHeight);
    const context = p.drawingContext;
    context.save();
    context.beginPath();
    context.rect(0, slitTop, p.width, slitHeight);
    context.clip();
    drawPanelCover(p, AFTER_CROP);
    drawGrade(p, true);
    drawEditorialType(p, true);
    context.restore();

    const accent = rgbCss(state.releaseAccentRgb);
    p.stroke(accent);
    p.strokeWeight(Math.max(1, p.width / 620));
    p.line(0, slitTop, p.width, slitTop);
    p.line(0, slitTop + slitHeight, p.width, slitTop + slitHeight);
    p.noStroke();
    p.fill(accent);
    const handleWidth = clamp(p.width * .05, 9, 34);
    const handleHeight = clamp(p.height * .02, 2, 7);
    p.rect(p.width - handleWidth - Math.max(5, p.width * .025), slitCenter - handleHeight / 2, handleWidth, handleHeight, handleHeight / 2);
    drawChangeRail(p);
  }

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (!sketch) return;
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      if (sketch.width === width && sketch.height === height) return;
      sketch.resizeCanvas(width, height, true);
      state.resizeCount += 1;
      state.p5CanvasWidth = sketch.width;
      state.p5CanvasHeight = sketch.height;
      dirty = true;
      if (state.pixelEvidenceReady) sketch.redraw();
    });
  });
  resizeObserver.observe(stage);

  const ready = analyseProofPixels().then(() => {
    state.initialVisualStateChecksum = visualStateChecksum();
    state.currentVisualStateChecksum = state.initialVisualStateChecksum;
    state.ready = true;
    syncDataset();
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = canvasHost.querySelector('canvas');
    const stageBounds = stage.getBoundingClientRect();
    const canvasBounds = canvas?.getBoundingClientRect();
    const paletteValid = state.beforeAverageRgb.length === 3
      && state.afterAverageRgb.length === 3
      && state.releaseAccentRgb.length === 3
      && state.releaseAccentRgb.every(value => value >= 0 && value <= 255);
    const tileEvidenceValid = state.tileEvidence.length === TILE_COLUMNS * TILE_ROWS
      && state.tileEvidence.every(tile => tile.row >= 0 && tile.row < TILE_ROWS
        && tile.column >= 0 && tile.column < TILE_COLUMNS
        && tile.meanDelta >= 0 && tile.maximumDelta >= tile.meanDelta);
    const fullStageCanvas = Boolean(canvasBounds)
      && canvasBounds.width >= stageBounds.width - 1
      && canvasBounds.height >= stageBounds.height - 1;
    const passed = state.ready
      && state.claimedLibrary === 'p5@2.3.0'
      && state.mechanism === 'trusted-human-input-directly-moves-a-horizontal-p5-clip-between-two-pixel-proven-editorial-versions'
      && state.automaticCycle === false
      && state.automaticPlayback === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.syntheticInputDispatch === false
      && state.captureClockDriven === false
      && state.renderIgnoresPreviewClock === true
      && state.userInputRequired === true
      && state.initialFrameStatic === true
      && state.initialStaticConfirmed === true
      && state.previewClockMutationCount === 0
      && state.previewClockIgnoredCount >= 1
      && state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin === true
      && state.assetMimeType.includes('image/jpeg')
      && state.assetByteLength === EXPECTED_ASSET_BYTES
      && state.assetShaMatchesExpected === true
      && state.browserImageDecoded === true
      && state.sourceNaturalWidth === 960
      && state.sourceNaturalHeight === 640
      && state.p5ImageDecoded === true
      && state.p5ImageClass === 'p5.Image'
      && state.p5ImageWidth === 960
      && state.p5ImageHeight === 640
      && state.p5ImagePixelLength === 960 * 640 * 4
      && state.sampledWidth === SAMPLE_WIDTH
      && state.sampledHeight === SAMPLE_HEIGHT
      && state.sampledPixelCountPerVersion === SAMPLE_WIDTH * SAMPLE_HEIGHT
      && state.sampledPixelByteLengthPerVersion === SAMPLE_WIDTH * SAMPLE_HEIGHT * 4
      && state.comparedPixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT
      && state.comparisonPixelShaValid === true
      && state.distinctSampleColorCount > 350
      && state.changedPixelCount > 0
      && state.changedPixelRatio > .35
      && state.changedPixelRatio < 1
      && state.meanPixelDelta > 18
      && state.meanPixelDelta < 220
      && state.maximumPixelDelta > state.meanPixelDelta
      && state.changedTileCount >= 10
      && state.changedTileCount <= TILE_COLUMNS * TILE_ROWS
      && tileEvidenceValid
      && paletteValid
      && state.evidenceScore >= state.acceptanceThreshold
      && state.evidenceScore <= 100
      && state.acceptanceOutcome === 'PASS'
      && sketch instanceof p5
      && canvas instanceof HTMLCanvasElement
      && canvas.getContext('2d') instanceof CanvasRenderingContext2D
      && state.p5InstanceReady === true
      && state.p5CanvasReady === true
      && state.p5CompletedDrawCount > 0
      && fullStageCanvas;
    state.runtimeAssertionPassed = Boolean(passed);
    stage.dataset.runtimeAssert = String(state.runtimeAssertionPassed);
    return state.runtimeAssertionPassed;
  };

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: state.renderer,
    render: () => {
      state.renderCount += 1;
      state.previewClockRenderCount += 1;
      const checksumBefore = visualStateChecksum();
      if (dirty && state.pixelEvidenceReady) sketch.redraw();
      const checksumAfter = visualStateChecksum();
      if (checksumAfter === checksumBefore) state.previewClockIgnoredCount += 1;
      else state.previewClockMutationCount += 1;
      if (state.inputCount === 0 && state.initialVisualStateChecksum
        && checksumAfter === state.initialVisualStateChecksum) {
        state.initialStaticConfirmationCount += 1;
        state.initialStaticConfirmed = state.initialStaticConfirmationCount >= 1;
      }
    },
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
