import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL(
  '../assets/aesthetic-wave-08/reaction-diffusion-growth-field/biomaterial-culture-substrate.jpg',
  import.meta.url,
).href;
const EXPECTED_ASSET = Object.freeze({
  bytes: 418008,
  width: 960,
  height: 640,
  sha256: '316ec17368475dafffaba704a2be2b5ecff9a436698f8947263f9e1f47e5f46a',
});
const SOURCE_CROP = Object.freeze({ x: 0, y: 50, width: 960, height: 540 });
const COLUMNS = 80;
const ROWS = 45;
const CELL_COUNT = COLUMNS * ROWS;
const SAMPLE_BYTE_LENGTH = CELL_COUNT * 4;
const EDGE_PAIR_SAMPLE_COUNT = (COLUMNS - 1) * ROWS + COLUMNS * (ROWS - 1);
const STEP_BATCH = 8;
const INITIAL_BIAS = 0;
const ZONE_COLORS = Object.freeze({
  cellulose: '#f4e7bf',
  agar: '#e6a329',
  mineral: '#6fd9cf',
  biofilm: '#9faaa1',
  seam: '#e66c3f',
  mixed: '#d4c081',
});

const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const rounded = (value, digits = 4) => Number(value.toFixed(digits));
const smoothstep = (minimum, maximum, value) => {
  const unit = clamp((value - minimum) / Math.max(0.000001, maximum - minimum));
  return unit * unit * (3 - 2 * unit);
};

try {
  const stage = document.querySelector('#culture-stage');
  const canvasHost = document.querySelector('#culture-canvas');
  const cultureState = document.querySelector('#culture-state');
  const generationReading = document.querySelector('#generation-reading');
  const inoculumReading = document.querySelector('#inoculum-reading');
  const activeReading = document.querySelector('#active-reading');
  const probeCoordinate = document.querySelector('#probe-coordinate');
  const probeZone = document.querySelector('#probe-zone');
  const probeFeed = document.querySelector('#probe-feed');
  const probeKill = document.querySelector('#probe-kill');
  const nutrientBias = document.querySelector('#nutrient-bias');
  const biasOutput = document.querySelector('#bias-output');
  const actionButtons = [...document.querySelectorAll('[data-culture-action]')];

  if (!stage || !canvasHost || !cultureState || !generationReading || !inoculumReading
    || !activeReading || !probeCoordinate || !probeZone || !probeFeed || !probeKill
    || !nutrientBias || !biasOutput || actionButtons.length !== 3) {
    throw new Error('reaction-diffusion-growth-field: required DOM is incomplete');
  }

  const state = {
    id: 'reaction-diffusion-growth-field',
    task: 'human-operated-image-sampled-biomaterial-reaction-diffusion-assay',
    claimedLibrary: 'p5@2.3.0',
    renderer: 'canvas2d',
    mechanism: 'gray-scott-reaction-diffusion-with-per-cell-feed-kill-and-diffusion-parameters-derived-from-decoded-source-pixels',
    assetMechanismRole: 'source-pixel-luminance-hue-saturation-and-local-edge-strength-determine-substrate-zones-parameters-and-initial-seeds',
    captureType: 'interactive',
    acceptedInputs: [
      'mouse-hover',
      'captured-mouse-drag',
      'captured-touch-drag',
      'captured-pen-drag',
      'keyboard',
      'range-control',
      'visible-buttons',
    ],
    causality: 'trusted-human-input-only',
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
    previewClockCallCount: 0,
    previewClockMutationCount: 0,
    nonInputVisualMutationCountAfterReady: 0,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    sourceAssetUrl: ASSET_URL,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetSameOrigin: false,
    assetMimeType: '',
    assetByteLength: 0,
    assetSha256: '',
    expectedAssetSha256: EXPECTED_ASSET.sha256,
    assetShaMatchesExpected: false,
    browserImageDecoded: false,
    sourceNaturalWidth: 0,
    sourceNaturalHeight: 0,
    sourceCropX: SOURCE_CROP.x,
    sourceCropY: SOURCE_CROP.y,
    sourceCropWidth: SOURCE_CROP.width,
    sourceCropHeight: SOURCE_CROP.height,
    browserCanvasReadback: false,
    sampledWidth: COLUMNS,
    sampledHeight: ROWS,
    sampledPixelCount: 0,
    sampledPixelByteLength: 0,
    sampledPixelSha256: '',
    sampledPixelChecksum: '',
    distinctSampleColorCount: 0,
    sourceAlphaFailureCount: 0,
    sampledLumaMinimum: 1,
    sampledLumaMaximum: 0,
    sampledLumaMean: 0,
    sampledLumaRange: 0,
    sampledSaturationMean: 0,
    edgePairSampleCount: 0,
    edgeStrengthMinimum: 1,
    edgeStrengthMaximum: 0,
    edgeStrengthMean: 0,
    edgeStrengthRange: 0,
    zoneCategoryCounts: {},
    zoneCategoriesPresent: [],
    feedMinimum: 1,
    feedMaximum: 0,
    feedRange: 0,
    killMinimum: 1,
    killMaximum: 0,
    killRange: 0,
    diffusionAMinimum: 1,
    diffusionAMaximum: 0,
    diffusionARange: 0,
    diffusionBMinimum: 1,
    diffusionBMaximum: 0,
    diffusionBRange: 0,
    initialSeedAnchorCount: 0,
    initialSeedCellCount: 0,
    initialSeedEdgeMean: 0,
    initialFieldChecksum: '',
    currentFieldChecksum: '',
    fieldChangedByHuman: false,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    p5ImageDecoded: false,
    p5ImageClass: '',
    p5ImageWidth: 0,
    p5ImageHeight: 0,
    p5ImagePixelLength: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    p5ImageDrawCount: 0,
    reactionCellDrawCount: 0,
    substrateCellDrawCount: 0,
    renderRequestCount: 0,
    previewRenderCalls: 0,
    responsiveResizeCount: 0,
    stageWidth: 0,
    stageHeight: 0,
    stageCoverageRatio: 0,
    canvasCoverageRatio: 0,
    generation: 0,
    solverIterationCount: 0,
    manualStepBatchCount: 0,
    stepButtonCount: 0,
    stepKeyboardCount: 0,
    nutrientBias: INITIAL_BIAS,
    biasMutationCount: 0,
    activeCellCount: 0,
    activeCellRatio: 0,
    inoculatedCellCount: 0,
    inoculationStrokeCount: 0,
    inoculationPointCount: 0,
    depositedCellMutationCount: 0,
    undoCount: 0,
    resetCount: 0,
    historyDepth: 0,
    maximumHistoryDepth: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    humanInputCausalityCount: 0,
    humanMutationCount: 0,
    pointerEnterCount: 0,
    hoverMoveCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerUpCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    dragMoveCount: 0,
    dragDistance: 0,
    keyboardInputCount: 0,
    buttonActivationCount: 0,
    rangeInputCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    unknownPointerInputCount: 0,
    pointerTypesSeen: [],
    activePointerId: null,
    pointerCaptured: false,
    cursorColumn: Math.floor(COLUMNS * 0.5),
    cursorRow: Math.floor(ROWS * 0.5),
    probeZone: 'cellulose',
    probeFeed: 0,
    probeKill: 0,
    probeEdge: 0,
    visitedCellCount: 1,
    visitedCells: [],
    lastPointerType: 'none',
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: null,
    initialVisualSignature: '',
    repeatedInitialVisualSignature: '',
    initialStillVerified: false,
    interactionRecords: [],
    runtimeChecks: {},
    runtimeFailedChecks: [],
    runtimeAssertionPassed: false,
    ready: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__REACTION_DIFFUSION_GROWTH_STATE__ = state;

  let sketch = null;
  let sourceImage = null;
  let sampledPixels = null;
  let evidence = [];
  let fieldA = new Float32Array(CELL_COUNT);
  let fieldB = new Float32Array(CELL_COUNT);
  let initialA = new Float32Array(CELL_COUNT);
  let initialB = new Float32Array(CELL_COUNT);
  let nextA = new Float32Array(CELL_COUNT);
  let nextB = new Float32Array(CELL_COUNT);
  let history = [];
  let dirty = true;
  let resizeFrame = 0;
  let lastDragPoint = null;
  const inoculatedCells = new Set();
  const visitedCells = new Set([`${state.cursorColumn}:${state.cursorRow}`]);

  function invariant(condition, message) {
    if (!condition) throw new Error(`reaction-diffusion-growth-field: ${message}`);
  }

  async function sha256(bytes) {
    const buffer = bytes instanceof ArrayBuffer
      ? bytes
      : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function pixelChecksum(bytes) {
    let signature = 2166136261;
    for (let index = 0; index < bytes.length; index += 1) {
      signature ^= bytes[index] + (index & 255);
      signature = Math.imul(signature, 16777619) >>> 0;
    }
    return signature.toString(16).padStart(8, '0');
  }

  function fieldChecksum(aValues = fieldA, bValues = fieldB) {
    let signature = 2166136261;
    for (let index = 0; index < CELL_COUNT; index += 1) {
      signature ^= Math.round(aValues[index] * 4095) + Math.round(bValues[index] * 8191) + index * 13;
      signature = Math.imul(signature, 16777619) >>> 0;
    }
    return signature.toString(16).padStart(8, '0');
  }

  function canvasSignature() {
    if (!sketch?.drawingContext) return '';
    const pixels = sketch.drawingContext.getImageData(0, 0, sketch.width, sketch.height).data;
    let signature = 2166136261;
    const step = Math.max(4, Math.floor(pixels.length / 4096 / 4) * 4);
    for (let index = 0; index < pixels.length; index += step) {
      signature ^= pixels[index] + pixels[index + 1] * 3 + pixels[index + 2] * 7 + pixels[index + 3] * 11;
      signature = Math.imul(signature, 16777619) >>> 0;
    }
    return signature.toString(16).padStart(8, '0');
  }

  function rgbToHsl(red, green, blue) {
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;
    const maximum = Math.max(r, g, b);
    const minimum = Math.min(r, g, b);
    const delta = maximum - minimum;
    const lightness = (maximum + minimum) * 0.5;
    let hue = 0;
    if (delta > 0) {
      if (maximum === r) hue = ((g - b) / delta) % 6;
      else if (maximum === g) hue = (b - r) / delta + 2;
      else hue = (r - g) / delta + 4;
      hue = ((hue / 6) + 1) % 1;
    }
    const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
    return { hue, saturation, lightness };
  }

  function classifyZone(red, green, blue, luma, saturation) {
    if (luma < .26) return 'biofilm';
    if (red > green * 1.18 && red > blue * 1.48 && saturation > .34) return 'seam';
    if (blue > red * .82 && green > red * .92 && saturation > .17) return 'mineral';
    if (luma > .67 && saturation < .33) return 'cellulose';
    if (red > blue * 1.22 && green > blue * 1.08 && saturation > .25) return 'agar';
    return 'mixed';
  }

  function readPixel(index) {
    const offset = index * 4;
    return [sampledPixels[offset], sampledPixels[offset + 1], sampledPixels[offset + 2], sampledPixels[offset + 3]];
  }

  function localEdge(index, lumas) {
    const x = index % COLUMNS;
    const y = Math.floor(index / COLUMNS);
    const center = lumas[index];
    let total = 0;
    let samples = 0;
    const compare = (column, row) => {
      if (column < 0 || column >= COLUMNS || row < 0 || row >= ROWS) return;
      total += Math.abs(center - lumas[row * COLUMNS + column]);
      samples += 1;
    };
    compare(x - 1, y);
    compare(x + 1, y);
    compare(x, y - 1);
    compare(x, y + 1);
    return samples ? clamp(total / samples * 2.8) : 0;
  }

  function chooseImageSeeds() {
    const ranked = evidence
      .map((cell, index) => ({ index, score: cell.edge * .72 + cell.saturation * .18 + (1 - Math.abs(cell.luma - .48)) * .1 }))
      .sort((left, right) => right.score - left.score);
    const anchors = [];
    for (const candidate of ranked) {
      const x = candidate.index % COLUMNS;
      const y = Math.floor(candidate.index / COLUMNS);
      if (x < 4 || x >= COLUMNS - 4 || y < 4 || y >= ROWS - 4) continue;
      if (anchors.every(anchor => Math.hypot(anchor.x - x, anchor.y - y) >= 11)) {
        anchors.push({ x, y, edge: evidence[candidate.index].edge });
      }
      if (anchors.length === 7) break;
    }
    let seeded = 0;
    const seededSet = new Set();
    anchors.forEach(anchor => {
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          if (dx * dx + dy * dy > 4) continue;
          const x = anchor.x + dx;
          const y = anchor.y + dy;
          const index = y * COLUMNS + x;
          const imageWeight = .72 + evidence[index].edge * .28;
          fieldB[index] = Math.max(fieldB[index], imageWeight);
          fieldA[index] = Math.min(fieldA[index], .16 + (1 - imageWeight) * .14);
          seededSet.add(index);
        }
      }
    });
    seeded = seededSet.size;
    state.initialSeedAnchorCount = anchors.length;
    state.initialSeedCellCount = seeded;
    state.initialSeedEdgeMean = rounded(anchors.reduce((total, anchor) => total + anchor.edge, 0) / Math.max(1, anchors.length));
    state.initialSeedAnchors = anchors.map(anchor => ({ column: anchor.x, row: anchor.y, edge: rounded(anchor.edge) }));
  }

  function analyzePixels() {
    const lumas = new Float32Array(CELL_COUNT);
    const saturations = new Float32Array(CELL_COUNT);
    const hues = new Float32Array(CELL_COUNT);
    const colors = new Set();
    let lumaTotal = 0;
    let saturationTotal = 0;
    let alphaFailures = 0;
    for (let index = 0; index < CELL_COUNT; index += 1) {
      const [red, green, blue, alpha] = readPixel(index);
      const luma = (red * .2126 + green * .7152 + blue * .0722) / 255;
      const { hue, saturation } = rgbToHsl(red, green, blue);
      lumas[index] = luma;
      saturations[index] = saturation;
      hues[index] = hue;
      lumaTotal += luma;
      saturationTotal += saturation;
      if (alpha !== 255) alphaFailures += 1;
      colors.add(`${red >> 2}:${green >> 2}:${blue >> 2}`);
      state.sampledLumaMinimum = Math.min(state.sampledLumaMinimum, luma);
      state.sampledLumaMaximum = Math.max(state.sampledLumaMaximum, luma);
    }

    const zones = { cellulose: 0, agar: 0, mineral: 0, biofilm: 0, seam: 0, mixed: 0 };
    let edgeTotal = 0;
    let feedMinimum = Infinity;
    let feedMaximum = -Infinity;
    let killMinimum = Infinity;
    let killMaximum = -Infinity;
    let diffusionAMinimum = Infinity;
    let diffusionAMaximum = -Infinity;
    let diffusionBMinimum = Infinity;
    let diffusionBMaximum = -Infinity;

    evidence = Array.from({ length: CELL_COUNT }, (_, index) => {
      const [red, green, blue] = readPixel(index);
      const luma = lumas[index];
      const saturation = saturations[index];
      const hue = hues[index];
      const edge = localEdge(index, lumas);
      const zone = classifyZone(red, green, blue, luma, saturation);
      const warm = clamp((red - blue + 86) / 236);
      const cool = clamp((blue + green - red * 1.2) / 310);
      const feed = clamp(.0205 + (1 - luma) * .0115 + saturation * .0105 + warm * .0038 + edge * .0042, .0205, .0515);
      const kill = clamp(.0502 + luma * .0088 - saturation * .0028 + cool * .0034 + edge * .0045, .0475, .0685);
      const diffusionA = clamp(.87 + luma * .24 + edge * .06, .87, 1.17);
      const diffusionB = clamp(.405 + saturation * .16 + (1 - luma) * .055 + edge * .04, .405, .66);
      zones[zone] += 1;
      edgeTotal += edge;
      state.edgeStrengthMinimum = Math.min(state.edgeStrengthMinimum, edge);
      state.edgeStrengthMaximum = Math.max(state.edgeStrengthMaximum, edge);
      feedMinimum = Math.min(feedMinimum, feed);
      feedMaximum = Math.max(feedMaximum, feed);
      killMinimum = Math.min(killMinimum, kill);
      killMaximum = Math.max(killMaximum, kill);
      diffusionAMinimum = Math.min(diffusionAMinimum, diffusionA);
      diffusionAMaximum = Math.max(diffusionAMaximum, diffusionA);
      diffusionBMinimum = Math.min(diffusionBMinimum, diffusionB);
      diffusionBMaximum = Math.max(diffusionBMaximum, diffusionB);
      return { red, green, blue, luma, saturation, hue, edge, zone, feed, kill, diffusionA, diffusionB };
    });

    let edgePairTotal = 0;
    let edgePairs = 0;
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLUMNS; x += 1) {
        const index = y * COLUMNS + x;
        if (x + 1 < COLUMNS) {
          edgePairTotal += Math.abs(lumas[index] - lumas[index + 1]);
          edgePairs += 1;
        }
        if (y + 1 < ROWS) {
          edgePairTotal += Math.abs(lumas[index] - lumas[index + COLUMNS]);
          edgePairs += 1;
        }
      }
    }

    state.sourceAlphaFailureCount = alphaFailures;
    state.distinctSampleColorCount = colors.size;
    state.sampledLumaMinimum = rounded(state.sampledLumaMinimum);
    state.sampledLumaMaximum = rounded(state.sampledLumaMaximum);
    state.sampledLumaMean = rounded(lumaTotal / CELL_COUNT);
    state.sampledLumaRange = rounded(state.sampledLumaMaximum - state.sampledLumaMinimum);
    state.sampledSaturationMean = rounded(saturationTotal / CELL_COUNT);
    state.edgePairSampleCount = edgePairs;
    state.edgeStrengthMinimum = rounded(state.edgeStrengthMinimum);
    state.edgeStrengthMaximum = rounded(state.edgeStrengthMaximum);
    state.edgeStrengthMean = rounded(edgeTotal / CELL_COUNT);
    state.edgeStrengthRange = rounded(state.edgeStrengthMaximum - state.edgeStrengthMinimum);
    state.edgePairDifferenceMean = rounded(edgePairTotal / Math.max(1, edgePairs));
    state.zoneCategoryCounts = zones;
    state.zoneCategoriesPresent = Object.entries(zones).filter(([, count]) => count > 0).map(([zone]) => zone);
    state.feedMinimum = rounded(feedMinimum, 6);
    state.feedMaximum = rounded(feedMaximum, 6);
    state.feedRange = rounded(feedMaximum - feedMinimum, 6);
    state.killMinimum = rounded(killMinimum, 6);
    state.killMaximum = rounded(killMaximum, 6);
    state.killRange = rounded(killMaximum - killMinimum, 6);
    state.diffusionAMinimum = rounded(diffusionAMinimum, 6);
    state.diffusionAMaximum = rounded(diffusionAMaximum, 6);
    state.diffusionARange = rounded(diffusionAMaximum - diffusionAMinimum, 6);
    state.diffusionBMinimum = rounded(diffusionBMinimum, 6);
    state.diffusionBMaximum = rounded(diffusionBMaximum, 6);
    state.diffusionBRange = rounded(diffusionBMaximum - diffusionBMinimum, 6);
  }

  async function fetchAndAnalyzeAsset() {
    const response = await fetch(ASSET_URL, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `asset request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await sha256(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET.sha256;
    invariant(state.assetByteLength === EXPECTED_ASSET.bytes, 'asset byte length mismatch');
    invariant(state.assetShaMatchesExpected, 'asset SHA-256 mismatch');

    const blob = new Blob([bytes], { type: state.assetMimeType || 'image/jpeg' });
    const blobUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.src = blobUrl;
    await image.decode();
    state.browserImageDecoded = true;
    state.sourceNaturalWidth = image.naturalWidth;
    state.sourceNaturalHeight = image.naturalHeight;
    invariant(image.naturalWidth === EXPECTED_ASSET.width && image.naturalHeight === EXPECTED_ASSET.height, 'asset dimensions mismatch');

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = COLUMNS;
    sampleCanvas.height = ROWS;
    const context = sampleCanvas.getContext('2d', { willReadFrequently: true });
    invariant(context, 'sample canvas context unavailable');
    context.drawImage(
      image,
      SOURCE_CROP.x,
      SOURCE_CROP.y,
      SOURCE_CROP.width,
      SOURCE_CROP.height,
      0,
      0,
      COLUMNS,
      ROWS,
    );
    sampledPixels = context.getImageData(0, 0, COLUMNS, ROWS).data;
    state.browserCanvasReadback = true;
    state.sampledPixelCount = sampledPixels.length / 4;
    state.sampledPixelByteLength = sampledPixels.byteLength;
    state.sampledPixelSha256 = await sha256(sampledPixels);
    state.sampledPixelChecksum = pixelChecksum(sampledPixels);
    invariant(state.sampledPixelCount === CELL_COUNT && state.sampledPixelByteLength === SAMPLE_BYTE_LENGTH, 'sample raster mismatch');
    analyzePixels();
    URL.revokeObjectURL(blobUrl);

    fieldA.fill(1);
    fieldB.fill(0);
    chooseImageSeeds();
    initialA = fieldA.slice();
    initialB = fieldB.slice();
    state.initialFieldChecksum = fieldChecksum(initialA, initialB);
    state.currentFieldChecksum = state.initialFieldChecksum;
    updateActivity();
  }

  function cellIndex(column, row) {
    const x = (column + COLUMNS) % COLUMNS;
    const y = (row + ROWS) % ROWS;
    return y * COLUMNS + x;
  }

  function laplacian(field, column, row) {
    const center = field[cellIndex(column, row)];
    return -center
      + .2 * (field[cellIndex(column - 1, row)] + field[cellIndex(column + 1, row)]
        + field[cellIndex(column, row - 1)] + field[cellIndex(column, row + 1)])
      + .05 * (field[cellIndex(column - 1, row - 1)] + field[cellIndex(column + 1, row - 1)]
        + field[cellIndex(column - 1, row + 1)] + field[cellIndex(column + 1, row + 1)]);
  }

  function solveOnce() {
    const bias = state.nutrientBias * .00028;
    for (let row = 0; row < ROWS; row += 1) {
      for (let column = 0; column < COLUMNS; column += 1) {
        const index = row * COLUMNS + column;
        const a = fieldA[index];
        const b = fieldB[index];
        const cell = evidence[index];
        const feed = clamp(cell.feed + bias, .018, .055);
        const reaction = a * b * b;
        nextA[index] = clamp(a + cell.diffusionA * laplacian(fieldA, column, row) - reaction + feed * (1 - a));
        nextB[index] = clamp(b + cell.diffusionB * laplacian(fieldB, column, row) + reaction - (cell.kill + feed) * b);
      }
    }
    [fieldA, nextA] = [nextA, fieldA];
    [fieldB, nextB] = [nextB, fieldB];
  }

  function updateActivity() {
    let active = 0;
    for (let index = 0; index < CELL_COUNT; index += 1) {
      if (fieldB[index] > .075) active += 1;
    }
    state.activeCellCount = active;
    state.activeCellRatio = rounded(active / CELL_COUNT);
    state.inoculatedCellCount = inoculatedCells.size;
    state.currentFieldChecksum = fieldChecksum();
    state.fieldChangedByHuman = state.currentFieldChecksum !== state.initialFieldChecksum;
  }

  function updateLayoutEvidence() {
    const stageBounds = stage.getBoundingClientRect();
    const canvasBounds = sketch?.canvas?.getBoundingClientRect();
    state.stageWidth = rounded(stageBounds.width);
    state.stageHeight = rounded(stageBounds.height);
    state.p5CanvasWidth = sketch?.width || 0;
    state.p5CanvasHeight = sketch?.height || 0;
    state.stageCoverageRatio = rounded(stageBounds.width * stageBounds.height / Math.max(1, innerWidth * innerHeight));
    state.canvasCoverageRatio = rounded((canvasBounds?.width || 0) * (canvasBounds?.height || 0)
      / Math.max(1, stageBounds.width * stageBounds.height));
  }

  function updateReadouts() {
    const index = state.cursorRow * COLUMNS + state.cursorColumn;
    const cell = evidence[index];
    if (cell) {
      state.probeZone = cell.zone;
      state.probeFeed = rounded(clamp(cell.feed + state.nutrientBias * .00028, .018, .055), 5);
      state.probeKill = rounded(cell.kill, 5);
      state.probeEdge = rounded(cell.edge);
      probeCoordinate.textContent = `${String(state.cursorColumn).padStart(2, '0')} / ${String(state.cursorRow).padStart(2, '0')}`;
      probeZone.textContent = cell.zone;
      probeZone.style.setProperty('--zone-color', ZONE_COLORS[cell.zone]);
      probeFeed.textContent = state.probeFeed.toFixed(3);
      probeKill.textContent = state.probeKill.toFixed(3);
      stage.dataset.zone = cell.zone;
    }
    generationReading.textContent = String(state.generation).padStart(3, '0');
    inoculumReading.textContent = String(state.inoculatedCellCount).padStart(3, '0');
    activeReading.textContent = `${Math.round(state.activeCellRatio * 100)}%`;
    biasOutput.value = `${state.nutrientBias >= 0 ? '+' : '−'}${String(Math.abs(state.nutrientBias)).padStart(2, '0')}`;
    nutrientBias.value = String(state.nutrientBias);
    stage.dataset.generation = String(state.generation);
    stage.dataset.pointer = state.lastPointerType;
    stage.dataset.input = state.lastInputKind;
    cultureState.textContent = state.generation === 0
      ? 'Held · human step only'
      : `Held · generation ${state.generation}`;
    state.visitedCellCount = visitedCells.size;
    state.visitedCells = [...visitedCells].slice(-24);
    updateLayoutEvidence();
  }

  function requestDraw(reason) {
    state.renderRequestCount += 1;
    state.lastDrawReason = reason;
    dirty = true;
    if (sketch) sketch.redraw();
  }

  function drawSourceImage() {
    const canvasRatio = sketch.width / Math.max(1, sketch.height);
    const sourceRatio = SOURCE_CROP.width / SOURCE_CROP.height;
    let sx = SOURCE_CROP.x;
    let sy = SOURCE_CROP.y;
    let sw = SOURCE_CROP.width;
    let sh = SOURCE_CROP.height;
    if (canvasRatio > sourceRatio) {
      sh = sw / canvasRatio;
      sy = SOURCE_CROP.y + (SOURCE_CROP.height - sh) * .5;
    } else if (canvasRatio < sourceRatio) {
      sw = sh * canvasRatio;
      sx = SOURCE_CROP.x + (SOURCE_CROP.width - sw) * .5;
    }
    sketch.image(sourceImage, 0, 0, sketch.width, sketch.height, sx, sy, sw, sh);
    state.p5ImageDrawCount += 1;
  }

  function drawField() {
    const cellWidth = sketch.width / COLUMNS;
    const cellHeight = sketch.height / ROWS;
    state.substrateCellDrawCount = 0;
    state.reactionCellDrawCount = 0;
    sketch.noStroke();
    for (let row = 0; row < ROWS; row += 1) {
      for (let column = 0; column < COLUMNS; column += 1) {
        const index = row * COLUMNS + column;
        const cell = evidence[index];
        const concentration = fieldB[index];
        const reaction = smoothstep(.035, .72, concentration);
        const boundary = Math.exp(-Math.abs(concentration - .34) * 18);
        const [zoneRed, zoneGreen, zoneBlue] = cell.zone === 'mineral'
          ? [84, 224, 207]
          : cell.zone === 'seam'
            ? [235, 100, 53]
            : cell.zone === 'biofilm'
              ? [170, 182, 163]
              : cell.zone === 'agar'
                ? [242, 173, 43]
                : [234, 224, 185];
        sketch.fill(zoneRed, zoneGreen, zoneBlue, 7 + cell.edge * 13);
        sketch.rect(column * cellWidth, row * cellHeight, cellWidth + .45, cellHeight + .45);
        state.substrateCellDrawCount += 1;
        if (reaction > .015 && (state.fieldChangedByHuman || state.generation > 0)) {
          const red = 201 + boundary * 44;
          const green = 221 + boundary * 34;
          const blue = 70 + (1 - reaction) * 72;
          sketch.fill(red, green, blue, 10 + reaction * 48 + boundary * 142);
          sketch.rect(column * cellWidth, row * cellHeight, cellWidth + .65, cellHeight + .65);
          state.reactionCellDrawCount += 1;
        }
      }
    }
  }

  function drawInitialAnchors() {
    if (state.fieldChangedByHuman || state.generation > 0 || !state.initialSeedAnchors) return;
    const unit = Math.max(2.4, Math.min(sketch.width / COLUMNS, sketch.height / ROWS));
    state.initialSeedAnchors.forEach(anchor => {
      const x = (anchor.column + .5) / COLUMNS * sketch.width;
      const y = (anchor.row + .5) / ROWS * sketch.height;
      const color = ZONE_COLORS[evidence[anchor.row * COLUMNS + anchor.column].zone] || ZONE_COLORS.mixed;
      sketch.noFill();
      sketch.stroke(color);
      sketch.strokeWeight(Math.max(.65, sketch.width / 850));
      sketch.circle(x, y, unit * 2.5);
      sketch.noStroke();
      sketch.fill(232, 255, 115, 210);
      sketch.circle(x, y, Math.max(1.2, unit * .42));
    });
  }

  function drawProbe() {
    const x = (state.cursorColumn + .5) / COLUMNS * sketch.width;
    const y = (state.cursorRow + .5) / ROWS * sketch.height;
    const radius = Math.max(4, Math.min(sketch.width, sketch.height) * .025);
    const color = ZONE_COLORS[state.probeZone] || ZONE_COLORS.mixed;
    sketch.noFill();
    sketch.stroke(color);
    sketch.strokeWeight(Math.max(.65, sketch.width / 720));
    sketch.circle(x, y, radius * 2);
    sketch.line(x - radius * 1.5, y, x - radius * .65, y);
    sketch.line(x + radius * .65, y, x + radius * 1.5, y);
    sketch.line(x, y - radius * 1.5, x, y - radius * .65);
    sketch.line(x, y + radius * .65, x, y + radius * 1.5);
  }

  function drawScene() {
    if (!sourceImage || !sampledPixels || !dirty) return;
    state.p5DrawCount += 1;
    sketch.clear();
    drawSourceImage();
    sketch.noStroke();
    sketch.fill(8, 12, 8, 58);
    sketch.rect(0, 0, sketch.width, sketch.height);
    drawField();
    drawInitialAnchors();
    drawProbe();
    updateReadouts();
    state.p5CompletedDrawCount += 1;
    dirty = false;
  }

  function recordPointerType(event) {
    const pointerType = event.pointerType || 'unknown';
    state.lastPointerType = pointerType;
    if (!state.pointerTypesSeen.includes(pointerType)) state.pointerTypesSeen.push(pointerType);
    if (pointerType === 'mouse') state.mouseInputCount += 1;
    else if (pointerType === 'touch') state.touchInputCount += 1;
    else if (pointerType === 'pen') state.penInputCount += 1;
    else state.unknownPointerInputCount += 1;
  }

  function acceptTrustedInput(event, kind, source, mutates = false) {
    if (event?.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      state.lastInputKind = `rejected-${kind}`;
      updateReadouts();
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    state.humanInputCausalityCount += 1;
    state.lastInputKind = kind;
    state.lastInputSource = source;
    state.lastInputTrusted = true;
    if (mutates) state.humanMutationCount += 1;
    state.interactionRecords.push({
      kind,
      source,
      pointerType: event.pointerType || null,
      generation: state.generation,
      mutates,
    });
    if (state.interactionRecords.length > 100) state.interactionRecords.shift();
    return true;
  }

  function eventToCell(event) {
    const bounds = sketch.canvas.getBoundingClientRect();
    const u = clamp((event.clientX - bounds.left) / Math.max(1, bounds.width));
    const v = clamp((event.clientY - bounds.top) / Math.max(1, bounds.height));
    return {
      u,
      v,
      column: clamp(Math.floor(u * COLUMNS), 0, COLUMNS - 1),
      row: clamp(Math.floor(v * ROWS), 0, ROWS - 1),
    };
  }

  function setProbe(column, row, reason) {
    state.cursorColumn = clamp(Math.round(column), 0, COLUMNS - 1);
    state.cursorRow = clamp(Math.round(row), 0, ROWS - 1);
    visitedCells.add(`${state.cursorColumn}:${state.cursorRow}`);
    requestDraw(reason);
  }

  function pushHistory(reason) {
    history.push({
      a: fieldA.slice(),
      b: fieldB.slice(),
      generation: state.generation,
      nutrientBias: state.nutrientBias,
      inoculated: [...inoculatedCells],
      reason,
    });
    if (history.length > 18) history.shift();
    state.historyDepth = history.length;
    state.maximumHistoryDepth = Math.max(state.maximumHistoryDepth, history.length);
  }

  function depositAt(column, row, pressure = .5) {
    const radius = pressure > .7 ? 3 : 2;
    let mutations = 0;
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const distance = Math.hypot(dx, dy);
        if (distance > radius) continue;
        const x = clamp(column + dx, 0, COLUMNS - 1);
        const y = clamp(row + dy, 0, ROWS - 1);
        const index = y * COLUMNS + x;
        const materialAcceptance = .68 + evidence[index].saturation * .14 + evidence[index].edge * .18;
        const amount = clamp((1 - distance / (radius + .5)) * materialAcceptance, .18, .98);
        const previous = fieldB[index];
        fieldB[index] = Math.max(fieldB[index], amount);
        fieldA[index] = Math.min(fieldA[index], .12 + (1 - amount) * .2);
        if (fieldB[index] !== previous) mutations += 1;
        inoculatedCells.add(index);
      }
    }
    state.depositedCellMutationCount += mutations;
    state.inoculationPointCount += 1;
    updateActivity();
    return mutations;
  }

  function depositLine(from, to, pressure) {
    const distance = Math.hypot(to.column - from.column, to.row - from.row);
    const segments = Math.max(1, Math.ceil(distance / 1.25));
    let mutations = 0;
    for (let step = 1; step <= segments; step += 1) {
      const progress = step / segments;
      mutations += depositAt(
        Math.round(from.column + (to.column - from.column) * progress),
        Math.round(from.row + (to.row - from.row) * progress),
        pressure,
      );
    }
    return mutations;
  }

  function performManualStep(event, source) {
    pushHistory(`${source}-step`);
    for (let index = 0; index < STEP_BATCH; index += 1) solveOnce();
    state.generation += STEP_BATCH;
    state.solverIterationCount += STEP_BATCH;
    state.manualStepBatchCount += 1;
    if (source === 'button') state.stepButtonCount += 1;
    if (source === 'keyboard') state.stepKeyboardCount += 1;
    updateActivity();
    requestDraw(`trusted-${source}-finite-step`);
  }

  function undo(event, source) {
    const snapshot = history.pop();
    if (!snapshot) return false;
    fieldA = snapshot.a;
    fieldB = snapshot.b;
    nextA = new Float32Array(CELL_COUNT);
    nextB = new Float32Array(CELL_COUNT);
    state.generation = snapshot.generation;
    state.nutrientBias = snapshot.nutrientBias;
    inoculatedCells.clear();
    snapshot.inoculated.forEach(index => inoculatedCells.add(index));
    state.undoCount += 1;
    state.historyDepth = history.length;
    updateActivity();
    requestDraw(`trusted-${source}-undo`);
    return true;
  }

  function reset(event, source) {
    const changed = state.currentFieldChecksum !== state.initialFieldChecksum || state.nutrientBias !== INITIAL_BIAS;
    fieldA = initialA.slice();
    fieldB = initialB.slice();
    nextA = new Float32Array(CELL_COUNT);
    nextB = new Float32Array(CELL_COUNT);
    history = [];
    inoculatedCells.clear();
    state.generation = 0;
    state.solverIterationCount = 0;
    state.nutrientBias = INITIAL_BIAS;
    state.historyDepth = 0;
    state.resetCount += 1;
    if (changed) state.humanMutationCount += 1;
    updateActivity();
    requestDraw(`trusted-${source}-reset`);
  }

  function onPointerEnter(event) {
    if (!acceptTrustedInput(event, 'pointer-enter', 'canvas-hover', false)) return;
    recordPointerType(event);
    state.pointerEnterCount += 1;
    const point = eventToCell(event);
    setProbe(point.column, point.row, 'trusted-pointer-enter-probe');
  }

  function onPointerMove(event) {
    if (!acceptTrustedInput(event, state.activePointerId === event.pointerId ? 'pointer-drag' : 'pointer-hover', 'canvas', true)) return;
    recordPointerType(event);
    const point = eventToCell(event);
    if (state.activePointerId === event.pointerId && lastDragPoint) {
      event.preventDefault();
      state.pointerMoveCount += 1;
      state.dragMoveCount += 1;
      const segmentDistance = Math.hypot(point.u - lastDragPoint.u, point.v - lastDragPoint.v);
      state.dragDistance = rounded(state.dragDistance + segmentDistance);
      depositLine(lastDragPoint, point, event.pressure || .5);
      lastDragPoint = point;
      setProbe(point.column, point.row, 'trusted-captured-drag-inoculation');
      return;
    }
    state.hoverMoveCount += 1;
    setProbe(point.column, point.row, 'trusted-hover-pixel-probe');
  }

  function onPointerDown(event) {
    if (!acceptTrustedInput(event, 'pointer-down', 'canvas-inoculation', true)) return;
    if (state.activePointerId !== null) return;
    event.preventDefault();
    recordPointerType(event);
    const point = eventToCell(event);
    sketch.canvas.focus({ preventScroll: true });
    pushHistory('captured-inoculation-stroke');
    state.pointerDownCount += 1;
    state.inoculationStrokeCount += 1;
    state.activePointerId = event.pointerId;
    state.pointerCaptured = true;
    sketch.canvas.setPointerCapture(event.pointerId);
    state.pointerCaptureCount += 1;
    lastDragPoint = point;
    depositAt(point.column, point.row, event.pressure || .5);
    setProbe(point.column, point.row, 'trusted-pointer-down-inoculation');
  }

  function releasePointer(event, cancelled = false) {
    if (!acceptTrustedInput(event, cancelled ? 'pointer-cancel' : 'pointer-up', 'captured-canvas', false)) return;
    if (state.activePointerId !== event.pointerId) return;
    event.preventDefault();
    recordPointerType(event);
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerUpCount += 1;
    if (sketch.canvas.hasPointerCapture(event.pointerId)) sketch.canvas.releasePointerCapture(event.pointerId);
    state.pointerCaptureReleaseCount += 1;
    state.activePointerId = null;
    state.pointerCaptured = false;
    lastDragPoint = null;
    updateActivity();
    requestDraw(cancelled ? 'trusted-pointer-cancel-held' : 'trusted-pointer-up-held');
  }

  function bindHumanInputs() {
    const canvas = sketch.canvas;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Pixel-sampled biomaterial field. Hover to probe; drag to inoculate; Space advances exactly eight Gray-Scott iterations.');
    canvas.addEventListener('pointerenter', onPointerEnter);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', event => releasePointer(event, false));
    canvas.addEventListener('pointercancel', event => releasePointer(event, true));

    nutrientBias.addEventListener('keydown', event => event.stopPropagation());
    nutrientBias.addEventListener('input', event => {
      if (!acceptTrustedInput(event, 'range-input', 'nutrient-range', true)) return;
      const next = clamp(Math.round(Number(event.currentTarget.value)), -12, 12);
      if (next !== state.nutrientBias) {
        state.nutrientBias = next;
        state.biasMutationCount += 1;
      }
      state.rangeInputCount += 1;
      requestDraw('trusted-range-parameter-change');
    });

    actionButtons.forEach(button => button.addEventListener('click', event => {
      const action = button.dataset.cultureAction;
      if (!acceptTrustedInput(event, `button-${action}`, 'visible-button', true)) return;
      state.buttonActivationCount += 1;
      if (action === 'step') performManualStep(event, 'button');
      if (action === 'undo') undo(event, 'button');
      if (action === 'reset') reset(event, 'button');
    }));

    stage.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ', 'u', 'U', 'r', 'R'].includes(event.key)) return;
      if (!acceptTrustedInput(event, `keyboard-${event.key === ' ' ? 'space' : event.key}`, 'keyboard', true)) return;
      event.preventDefault();
      state.keyboardInputCount += 1;
      if (event.key === 'ArrowLeft') setProbe(state.cursorColumn - 1, state.cursorRow, 'trusted-keyboard-probe');
      if (event.key === 'ArrowRight') setProbe(state.cursorColumn + 1, state.cursorRow, 'trusted-keyboard-probe');
      if (event.key === 'ArrowUp') setProbe(state.cursorColumn, state.cursorRow - 1, 'trusted-keyboard-probe');
      if (event.key === 'ArrowDown') setProbe(state.cursorColumn, state.cursorRow + 1, 'trusted-keyboard-probe');
      if (event.key === 'Enter') {
        pushHistory('keyboard-inoculation');
        state.inoculationStrokeCount += 1;
        depositAt(state.cursorColumn, state.cursorRow, .58);
        requestDraw('trusted-keyboard-inoculation');
      }
      if (event.key === ' ') performManualStep(event, 'keyboard');
      if (event.key === 'u' || event.key === 'U') undo(event, 'keyboard');
      if (event.key === 'r' || event.key === 'R') reset(event, 'keyboard');
    });
  }

  async function createSketch() {
    let resolveSetup;
    const setupReady = new Promise(resolve => { resolveSetup = resolve; });
    sketch = new p5(instance => {
      instance.setup = () => {
        instance.pixelDensity(1);
        const width = Math.max(1, Math.round(canvasHost.clientWidth));
        const height = Math.max(1, Math.round(canvasHost.clientHeight));
        instance.createCanvas(width, height, instance.P2D).parent(canvasHost);
        instance.noLoop();
        state.p5InstanceReady = true;
        state.p5CanvasReady = true;
        state.p5CanvasWidth = width;
        state.p5CanvasHeight = height;
        bindHumanInputs();
        resolveSetup();
      };
      instance.draw = drawScene;
    }, canvasHost);

    await setupReady;
    sourceImage = await new Promise((resolve, reject) => {
      sketch.loadImage(
        ASSET_URL,
        resolve,
        error => reject(new Error(`p5 image decode failed: ${error}`)),
      );
    });
    state.p5ImageDecoded = sourceImage instanceof p5.Image;
    state.p5ImageClass = state.p5ImageDecoded ? 'p5.Image' : '';
    state.p5ImageWidth = sourceImage.width;
    state.p5ImageHeight = sourceImage.height;
    sourceImage.loadPixels();
    state.p5ImagePixelLength = sourceImage.pixels.length;
    requestDraw('p5-source-image-decoded');

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      const width = Math.max(1, Math.round(entry.contentRect.width));
      const height = Math.max(1, Math.round(entry.contentRect.height));
      if (width === sketch.width && height === sketch.height) return;
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        sketch.resizeCanvas(width, height, true);
        state.responsiveResizeCount += 1;
        requestDraw('responsive-resize');
      });
    });
    resizeObserver.observe(canvasHost);
    window.addEventListener('beforeunload', () => resizeObserver.disconnect(), { once: true });
  }

  async function start() {
    await fetchAndAnalyzeAsset();
    await createSketch();
    const ready = Promise.all([document.fonts.ready]);
    const render = () => {
      state.previewRenderCalls += 1;
      state.previewClockCallCount += 1;
      if (dirty) sketch.redraw();
    };

    window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
      render(0);
      const first = canvasSignature();
      render(1.7);
      const second = canvasSignature();
      state.initialVisualSignature ||= first;
      state.repeatedInitialVisualSignature = second;
      if (state.humanMutationCount === 0) state.initialStillVerified = first === second;
      updateLayoutEvidence();
      const checks = {
        p5Runtime: sketch instanceof p5
          && sourceImage instanceof p5.Image
          && state.p5InstanceReady
          && state.p5CanvasReady
          && state.p5CanvasWidth > 0
          && state.p5CanvasHeight > 0,
        exactAsset: state.assetFetchCount === 1
          && state.assetResponseStatus === 200
          && state.assetSameOrigin
          && state.assetMimeType.includes('image/jpeg')
          && state.assetByteLength === EXPECTED_ASSET.bytes
          && state.assetShaMatchesExpected
          && state.assetSha256 === EXPECTED_ASSET.sha256
          && state.browserImageDecoded
          && state.sourceNaturalWidth === EXPECTED_ASSET.width
          && state.sourceNaturalHeight === EXPECTED_ASSET.height,
        p5Decode: state.p5ImageDecoded
          && state.p5ImageClass === 'p5.Image'
          && state.p5ImageWidth === EXPECTED_ASSET.width
          && state.p5ImageHeight === EXPECTED_ASSET.height
          && state.p5ImagePixelLength >= EXPECTED_ASSET.width * EXPECTED_ASSET.height * 4,
        sampledRaster: state.browserCanvasReadback
          && state.sampledPixelCount === CELL_COUNT
          && state.sampledPixelByteLength === SAMPLE_BYTE_LENGTH
          && state.sampledPixelSha256.length === 64
          && !/^0+$/.test(state.sampledPixelSha256)
          && state.sampledPixelChecksum.length === 8
          && state.distinctSampleColorCount > 300
          && state.sourceAlphaFailureCount === 0,
        pixelEvidence: state.sampledLumaMinimum >= 0
          && state.sampledLumaMinimum < .25
          && state.sampledLumaMaximum > .72
          && state.sampledLumaMaximum <= 1
          && state.sampledLumaRange > .55
          && state.sampledSaturationMean > .18
          && state.sampledSaturationMean < .72
          && state.edgePairSampleCount === EDGE_PAIR_SAMPLE_COUNT
          && state.edgeStrengthMaximum > .18
          && state.edgeStrengthRange > .16,
        sourceDrivenZones: state.zoneCategoriesPresent.length >= 5
          && state.zoneCategoryCounts.cellulose > 50
          && state.zoneCategoryCounts.agar > 50
          && state.zoneCategoryCounts.mineral > 50
          && state.zoneCategoryCounts.biofilm > 20
          && state.zoneCategoryCounts.seam > 10,
        sourceDrivenParameters: state.feedMinimum >= .018
          && state.feedMaximum <= .055
          && state.feedRange > .008
          && state.killMinimum >= .047
          && state.killMaximum <= .069
          && state.killRange > .005
          && state.diffusionARange > .1
          && state.diffusionBRange > .08,
        sourceDrivenSeeds: state.initialSeedAnchorCount === 7
          && state.initialSeedCellCount >= 75
          && state.initialSeedCellCount <= 100
          && state.initialSeedEdgeMean > .1
          && state.initialFieldChecksum.length === 8,
        fullStage: state.stageCoverageRatio > .98
          && state.canvasCoverageRatio > .98
          && state.p5ImageDrawCount >= 1
          && state.substrateCellDrawCount === CELL_COUNT,
        staticInitial: state.initialStillVerified,
        humanOnly: state.userInputRequired
          && state.strictTrustedInputGuard
          && state.automaticCycle === false
          && state.automaticPlayback === false
          && state.automaticRehearsal === false
          && state.automaticFallback === false
          && state.syntheticInputDispatch === false
          && state.captureClockDriven === false
          && state.previewClockMutationCount === 0
          && state.renderIgnoresPreviewClock
          && state.nonInputVisualMutationCountAfterReady === 0,
        finiteSolver: state.generation === state.solverIterationCount
          && state.solverIterationCount === state.manualStepBatchCount * STEP_BATCH,
      };
      state.runtimeChecks = checks;
      state.runtimeFailedChecks = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name);
      state.runtimeAssertionPassed = state.runtimeFailedChecks.length === 0;
      return state.runtimeAssertionPassed;
    };

    installPreviewController({
      id: state.id,
      library: state.claimedLibrary,
      renderer: state.renderer,
      render,
      ready,
    });
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.ready = true;
    await window.__PREVIEW_RUNTIME_ASSERT__();
  }

  start().catch(markPreviewFailure);
} catch (error) {
  markPreviewFailure(error);
}
