import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const COLUMNS = 60;
const ROWS = 36;
const CELL_COUNT = COLUMNS * ROWS;
const EXPECTED_ASSET_BYTES = 383665;
const EXPECTED_ASSET_SHA256 = '9f43f0bc952f91ef389e3cfa6ec75bc9ccd32ed8bb9038c122420b3c8980c02d';
const TERRAIN_URL = new URL('../assets/aesthetic-wave-07/seeded-sandpile-avalanche/ridge-12-slope-evidence.jpg', import.meta.url).href;
const MATERIAL_NAMES = ['BASALT', 'DAMP SILT', 'BEDROCK', 'LOOSE SCREE', 'DRY SAND'];
const MATERIAL_RISK = [0.08, 0.82, 0.12, 0.72, 0.44];
const MATERIAL_COLORS = [
  [57, 62, 62],
  [88, 135, 136],
  [224, 208, 166],
  [196, 88, 48],
  [203, 151, 72],
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round = value => Number(value.toFixed(4));

async function sha256(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

function fnv1a(bytes) {
  let value = 2166136261;
  for (let index = 0; index < bytes.length; index += 1) {
    value ^= bytes[index];
    value = Math.imul(value, 16777619) >>> 0;
  }
  return value >>> 0;
}

try {
  const stage = document.querySelector('#sandpile-stage');
  const canvasHost = document.querySelector('#terrain-canvas');
  const grainCount = document.querySelector('#grain-count');
  const toppleCount = document.querySelector('#topple-count');
  const probeZone = document.querySelector('#probe-zone');
  const probeRisk = document.querySelector('#probe-risk');
  const loadSize = document.querySelector('#load-size');
  const loadReadout = document.querySelector('#load-readout');
  const actionButtons = [...document.querySelectorAll('[data-sand-action]')];
  const undoButton = document.querySelector('[data-sand-action="undo"]');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const terrainClass = new Uint8Array(CELL_COUNT);
  const terrainLuma = new Float32Array(CELL_COUNT);
  const terrainRisk = new Float32Array(CELL_COUNT);
  const seedField = new Uint16Array(CELL_COUNT);
  const field = new Uint16Array(CELL_COUNT);
  const nextField = new Uint16Array(CELL_COUNT);
  const sampledBytes = new Uint8Array(CELL_COUNT * 4);
  const undoStack = [];

  let sketch;
  let terrainImage;
  let dirty = true;
  let resizeFrame = 0;
  let activePointerId = null;
  let pointerTransactionOpen = false;
  let lastDepositCell = -1;

  const state = {
    id: 'seeded-sandpile-avalanche',
    task: 'human-operated-fictional-slope-load-and-avalanche-inspection',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'decoded-raster-pixels-seed-material-stability-and-abelian-sandpile-load',
    captureType: 'interactive',
    acceptedInputs: ['mouse-hover', 'mouse-drag', 'touch-drag', 'pen-drag', 'keyboard', 'button', 'range'],
    causality: 'trusted-human-input-only',
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    initialStillVerified: false,
    automaticCycle: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    previewClockMutationCount: 0,
    nonInputVisualMutationCountAfterReady: 0,
    reducedMotion: reducedMotionQuery.matches,
    probeU: 0.68,
    probeV: 0.46,
    initialProbeU: 0.68,
    initialProbeV: 0.46,
    probeCellIndex: 0,
    probeMaterialClass: 0,
    probeMaterial: 'BASALT',
    probeRisk: 0,
    probeRiskLabel: 'STABLE',
    packetSize: Number(loadSize.value),
    initialPacketSize: Number(loadSize.value),
    appliedGrainCount: 0,
    totalToppleCount: 0,
    lastWaveToppleCount: 0,
    toppleWaveCount: 0,
    dissipatedGrainCount: 0,
    unstableCellCount: 0,
    loadedCellCount: 0,
    maximumCellLoad: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerEnterCount: 0,
    pointerDownCount: 0,
    pointerDragCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    hoverProbeCount: 0,
    depositMutationCount: 0,
    stepMutationCount: 0,
    probeMutationCount: 0,
    packetMutationCount: 0,
    undoCount: 0,
    resetCount: 0,
    buttonInputCount: 0,
    keyboardInputCount: 0,
    rangeInputCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    humanMutationCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    activePointerId: null,
    pointerCaptured: false,
    transitionRecords: [],
    undoDepth: 0,
    assetUrl: TERRAIN_URL,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetMimeType: '',
    assetSameOrigin: false,
    assetByteLength: 0,
    assetSha256: '',
    expectedAssetSha256: EXPECTED_ASSET_SHA256,
    assetShaMatchesExpected: false,
    browserImageDecoded: false,
    sourceNaturalWidth: 0,
    sourceNaturalHeight: 0,
    p5ImageDecoded: false,
    p5ImageClass: null,
    p5ImageWidth: 0,
    p5ImageHeight: 0,
    p5ImagePixelLength: 0,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    gridColumns: COLUMNS,
    gridRows: ROWS,
    sampledPixelCount: 0,
    sampledPixelByteLength: 0,
    sampledPixelSha256: '',
    sampledPixelChecksum: 0,
    distinctSampleColorCount: 0,
    sampledLuminanceMinimum: 1,
    sampledLuminanceMaximum: 0,
    sampledLuminanceRange: 0,
    materialCellCounts: [0, 0, 0, 0, 0],
    materialClassCount: 0,
    terrainRiskMinimum: 1,
    terrainRiskMaximum: 0,
    terrainRiskRange: 0,
    terrainRiskChecksum: 0,
    seedCellCount: 0,
    seedGrainCount: 0,
    seedChecksum: 0,
    rasterDrivenEvidenceReady: false,
    p5ImageDrawCount: 0,
    materialCellDrawCount: 0,
    loadedCellDrawCount: 0,
    unstableCellDrawCount: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    renderRequestCount: 0,
    previewRenderCalls: 0,
    resizeCount: 0,
    initialCanvasSignature: 0,
    currentCanvasSignature: 0,
    ready: false,
    runtimeAssertionPassed: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__SEEDED_SANDPILE_STATE__ = state;

  function invariant(condition, message) {
    if (!condition) throw new Error(`seeded-sandpile-avalanche: ${message}`);
  }

  function updateDataset() {
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedInputCount = String(state.rejectedUntrustedInputCount);
    stage.dataset.humanMutationCount = String(state.humanMutationCount);
    stage.dataset.appliedGrainCount = String(state.appliedGrainCount);
    stage.dataset.totalToppleCount = String(state.totalToppleCount);
    stage.dataset.toppleWaveCount = String(state.toppleWaveCount);
    stage.dataset.undoDepth = String(state.undoDepth);
    stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
    stage.dataset.rasterDrivenEvidenceReady = String(state.rasterDrivenEvidenceReady);
    stage.dataset.automaticPlayback = String(state.automaticPlayback);
    stage.dataset.captureClockDriven = String(state.captureClockDriven);
  }

  function riskAt(index) {
    const loadPressure = clamp(field[index] / 5, 0, 1);
    return clamp(terrainRisk[index] * 0.55 + loadPressure * 0.45, 0, 1);
  }

  function updateFieldMetrics() {
    let unstable = 0;
    let loaded = 0;
    let maximum = 0;
    for (let index = 0; index < CELL_COUNT; index += 1) {
      if (field[index] >= 4) unstable += 1;
      if (field[index] > seedField[index]) loaded += 1;
      maximum = Math.max(maximum, field[index]);
    }
    state.unstableCellCount = unstable;
    state.loadedCellCount = loaded;
    state.maximumCellLoad = maximum;
  }

  function updateInterface() {
    const x = clamp(Math.floor(state.probeU * COLUMNS), 0, COLUMNS - 1);
    const y = clamp(Math.floor(state.probeV * ROWS), 0, ROWS - 1);
    const index = y * COLUMNS + x;
    const risk = riskAt(index);
    const riskLabel = risk > 0.72 ? 'RELEASE' : risk > 0.42 ? 'WATCH' : 'STABLE';
    state.probeCellIndex = index;
    state.probeMaterialClass = terrainClass[index];
    state.probeMaterial = MATERIAL_NAMES[terrainClass[index]];
    state.probeRisk = round(risk);
    state.probeRiskLabel = riskLabel;
    probeZone.textContent = state.probeMaterial;
    probeRisk.textContent = riskLabel;
    probeRisk.className = `risk-${riskLabel.toLowerCase()}`;
    grainCount.textContent = String(state.appliedGrainCount).padStart(4, '0');
    toppleCount.textContent = String(state.totalToppleCount).padStart(3, '0');
    loadReadout.textContent = `${state.packetSize} grains`;
    loadSize.value = String(state.packetSize);
    undoButton.disabled = undoStack.length === 0;
    state.undoDepth = undoStack.length;
    stage.setAttribute('aria-valuetext', `${state.probeMaterial}, ${riskLabel} risk, ${state.appliedGrainCount} applied grains, ${state.totalToppleCount} topples`);
    updateFieldMetrics();
    updateDataset();
  }

  function requestDraw(reason) {
    dirty = true;
    state.renderRequestCount += 1;
    state.lastRenderReason = reason;
    sketch?.redraw();
  }

  function rejectUntrusted(event, source) {
    if (event?.isTrusted === true) return false;
    state.rejectedUntrustedInputCount += 1;
    state.lastInputTrusted = false;
    state.lastInputSource = source;
    updateDataset();
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
    if (kind === 'range') state.rangeInputCount += 1;
    if (kind === 'mouse' || kind === 'mouse-hover') state.mouseInputCount += 1;
    if (kind === 'touch') state.touchInputCount += 1;
    if (kind === 'pen') state.penInputCount += 1;
    updateDataset();
    return true;
  }

  function recordTransition(source, before, after) {
    state.transitionRecords.push({
      source,
      kind: state.lastInputKind,
      trusted: true,
      before,
      after,
    });
    if (state.transitionRecords.length > 96) state.transitionRecords.shift();
  }

  function snapshot() {
    return {
      field: field.slice(),
      appliedGrainCount: state.appliedGrainCount,
      totalToppleCount: state.totalToppleCount,
      toppleWaveCount: state.toppleWaveCount,
      dissipatedGrainCount: state.dissipatedGrainCount,
    };
  }

  function pushUndo() {
    undoStack.push(snapshot());
    if (undoStack.length > 20) undoStack.shift();
    state.undoDepth = undoStack.length;
  }

  function restoreSnapshot(saved) {
    field.set(saved.field);
    state.appliedGrainCount = saved.appliedGrainCount;
    state.totalToppleCount = saved.totalToppleCount;
    state.toppleWaveCount = saved.toppleWaveCount;
    state.dissipatedGrainCount = saved.dissipatedGrainCount;
  }

  function applyToppleWave() {
    nextField.set(field);
    let topples = 0;
    let dissipated = 0;
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLUMNS; x += 1) {
        const index = y * COLUMNS + x;
        if (field[index] < 4) continue;
        nextField[index] -= 4;
        topples += 1;
        if (x > 0) nextField[index - 1] += 1; else dissipated += 1;
        if (x < COLUMNS - 1) nextField[index + 1] += 1; else dissipated += 1;
        if (y > 0) nextField[index - COLUMNS] += 1; else dissipated += 1;
        if (y < ROWS - 1) nextField[index + COLUMNS] += 1; else dissipated += 1;
      }
    }
    field.set(nextField);
    state.lastWaveToppleCount = topples;
    state.totalToppleCount += topples;
    state.dissipatedGrainCount += dissipated;
    state.toppleWaveCount += 1;
    return topples;
  }

  function depositAt(u, v, source) {
    const centerX = clamp(Math.floor(u * COLUMNS), 1, COLUMNS - 2);
    const centerY = clamp(Math.floor(v * ROWS), 1, ROWS - 2);
    const centerIndex = centerY * COLUMNS + centerX;
    const packet = state.packetSize;
    const centerLoad = Math.max(2, Math.round(packet * 0.58));
    const axialLoad = Math.max(1, Math.round((packet - centerLoad) / 4));
    field[centerIndex] += centerLoad;
    field[centerIndex - 1] += axialLoad;
    field[centerIndex + 1] += axialLoad;
    field[centerIndex - COLUMNS] += axialLoad;
    field[centerIndex + COLUMNS] += axialLoad;
    const applied = centerLoad + axialLoad * 4;
    state.appliedGrainCount += applied;
    state.depositMutationCount += 1;
    state.humanMutationCount += 1;
    const topples = applyToppleWave();
    recordTransition(source, { cell: centerIndex, applied: state.appliedGrainCount - applied, topples: state.totalToppleCount - topples }, {
      cell: centerIndex,
      applied: state.appliedGrainCount,
      topples: state.totalToppleCount,
    });
    updateInterface();
    requestDraw(`trusted-${source}`);
  }

  function stepWave(source) {
    const before = state.totalToppleCount;
    const topples = applyToppleWave();
    state.stepMutationCount += 1;
    state.humanMutationCount += 1;
    recordTransition(source, { topples: before, wave: state.toppleWaveCount - 1 }, {
      topples: state.totalToppleCount,
      wave: state.toppleWaveCount,
      released: topples,
    });
    updateInterface();
    requestDraw(`trusted-${source}`);
  }

  function resetProof(source) {
    const before = { applied: state.appliedGrainCount, topples: state.totalToppleCount };
    field.set(seedField);
    undoStack.length = 0;
    state.appliedGrainCount = 0;
    state.totalToppleCount = 0;
    state.lastWaveToppleCount = 0;
    state.toppleWaveCount = 0;
    state.dissipatedGrainCount = 0;
    state.probeU = state.initialProbeU;
    state.probeV = state.initialProbeV;
    state.packetSize = state.initialPacketSize;
    state.resetCount += 1;
    state.humanMutationCount += 1;
    recordTransition(source, before, { applied: 0, topples: 0 });
    updateInterface();
    requestDraw(`trusted-${source}`);
  }

  function undoProof(source) {
    if (!undoStack.length) return;
    const before = { applied: state.appliedGrainCount, topples: state.totalToppleCount };
    restoreSnapshot(undoStack.pop());
    state.undoCount += 1;
    state.humanMutationCount += 1;
    recordTransition(source, before, { applied: state.appliedGrainCount, topples: state.totalToppleCount });
    updateInterface();
    requestDraw(`trusted-${source}`);
  }

  function classifyMaterial(red, green, blue) {
    const luma = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const chroma = maximum - minimum;
    if (luma < 0.27) return 0;
    if (blue > red * 1.04 && blue > green * 0.98) return 1;
    if (luma > 0.57 && chroma < 78) return 2;
    if (red > green * 1.15 && red > blue * 1.38) return 3;
    return 4;
  }

  function seedFromRaster() {
    terrainImage.loadPixels();
    invariant(terrainImage.pixels.length === 960 * 640 * 4, 'unexpected decoded p5 pixel length');
    const colors = new Set();
    const classCounts = [0, 0, 0, 0, 0];
    let minimumLuma = 1;
    let maximumLuma = 0;
    let minimumRisk = 1;
    let maximumRisk = 0;
    let riskChecksum = 2166136261;
    let seedChecksum = 2166136261;
    let seedGrainCount = 0;

    for (let y = 0; y < ROWS; y += 1) {
      const sourceY = clamp(Math.floor((y + 0.5) * terrainImage.height / ROWS), 0, terrainImage.height - 1);
      for (let x = 0; x < COLUMNS; x += 1) {
        const sourceX = clamp(Math.floor((x + 0.5) * terrainImage.width / COLUMNS), 0, terrainImage.width - 1);
        const sourceIndex = (sourceY * terrainImage.width + sourceX) * 4;
        const index = y * COLUMNS + x;
        const red = terrainImage.pixels[sourceIndex];
        const green = terrainImage.pixels[sourceIndex + 1];
        const blue = terrainImage.pixels[sourceIndex + 2];
        const alpha = terrainImage.pixels[sourceIndex + 3];
        const byteIndex = index * 4;
        sampledBytes[byteIndex] = red;
        sampledBytes[byteIndex + 1] = green;
        sampledBytes[byteIndex + 2] = blue;
        sampledBytes[byteIndex + 3] = alpha;
        const luma = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
        const material = classifyMaterial(red, green, blue);
        const localRisk = clamp(MATERIAL_RISK[material] + (0.48 - luma) * 0.26, 0.03, 0.94);
        const seed = material === 0 ? 0 : material === 2 ? 1 : material === 1 || material === 3 ? 3 : 2;
        terrainLuma[index] = luma;
        terrainClass[index] = material;
        terrainRisk[index] = localRisk;
        seedField[index] = seed;
        field[index] = seed;
        classCounts[material] += 1;
        seedGrainCount += seed;
        minimumLuma = Math.min(minimumLuma, luma);
        maximumLuma = Math.max(maximumLuma, luma);
        minimumRisk = Math.min(minimumRisk, localRisk);
        maximumRisk = Math.max(maximumRisk, localRisk);
        colors.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
        riskChecksum = Math.imul(riskChecksum ^ Math.round(localRisk * 10000), 16777619) >>> 0;
        seedChecksum = Math.imul(seedChecksum ^ ((index + 1) * (seed + 1)), 16777619) >>> 0;
      }
    }

    state.p5ImagePixelLength = terrainImage.pixels.length;
    state.sampledPixelCount = CELL_COUNT;
    state.sampledPixelByteLength = sampledBytes.length;
    state.sampledPixelChecksum = fnv1a(sampledBytes);
    state.distinctSampleColorCount = colors.size;
    state.sampledLuminanceMinimum = round(minimumLuma);
    state.sampledLuminanceMaximum = round(maximumLuma);
    state.sampledLuminanceRange = round(maximumLuma - minimumLuma);
    state.materialCellCounts = classCounts;
    state.materialClassCount = classCounts.filter(count => count > 0).length;
    state.terrainRiskMinimum = round(minimumRisk);
    state.terrainRiskMaximum = round(maximumRisk);
    state.terrainRiskRange = round(maximumRisk - minimumRisk);
    state.terrainRiskChecksum = riskChecksum >>> 0;
    state.seedCellCount = CELL_COUNT;
    state.seedGrainCount = seedGrainCount;
    state.seedChecksum = seedChecksum >>> 0;
  }

  function drawScene(p) {
    state.p5DrawCount += 1;
    p.clear();
    p.image(terrainImage, 0, 0, p.width, p.height);
    state.p5ImageDrawCount += 1;
    p.noStroke();
    p.fill(16, 13, 9, 52);
    p.rect(0, 0, p.width, p.height);

    const cellWidth = p.width / COLUMNS;
    const cellHeight = p.height / ROWS;
    let materialDraws = 0;
    let loadedDraws = 0;
    let unstableDraws = 0;

    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLUMNS; x += 1) {
        const index = y * COLUMNS + x;
        const material = terrainClass[index];
        const load = field[index];
        const delta = Math.max(0, load - seedField[index]);
        const [red, green, blue] = MATERIAL_COLORS[material];
        const alpha = 25 + seedField[index] * 15;
        p.fill(red, green, blue, alpha);
        p.rect(x * cellWidth + 0.35, y * cellHeight + 0.35, Math.max(0.5, cellWidth - 0.7), Math.max(0.5, cellHeight - 0.7), 0.6);
        materialDraws += 1;

        if (delta > 0 || load >= 4) {
          const hot = load >= 4;
          p.fill(hot ? 255 : 246, hot ? 112 : 206, hot ? 79 : 89, hot ? 230 : clamp(98 + delta * 20, 98, 220));
          const inset = hot ? 0.1 : Math.min(cellWidth, cellHeight) * 0.18;
          p.rect(x * cellWidth + inset, y * cellHeight + inset, Math.max(0.6, cellWidth - inset * 2), Math.max(0.6, cellHeight - inset * 2), 0.8);
          loadedDraws += 1;
          if (hot) unstableDraws += 1;
        }

        if (x < COLUMNS - 1 && terrainClass[index + 1] !== material) {
          p.stroke(255, 240, 199, 42);
          p.strokeWeight(0.55);
          p.line((x + 1) * cellWidth, y * cellHeight, (x + 1) * cellWidth, (y + 1) * cellHeight);
          p.noStroke();
        }
        if (y < ROWS - 1 && terrainClass[index + COLUMNS] !== material) {
          p.stroke(255, 240, 199, 42);
          p.strokeWeight(0.55);
          p.line(x * cellWidth, (y + 1) * cellHeight, (x + 1) * cellWidth, (y + 1) * cellHeight);
          p.noStroke();
        }
      }
    }

    const probeX = state.probeU * p.width;
    const probeY = state.probeV * p.height;
    const probeColor = state.probeRiskLabel === 'RELEASE' ? [255, 116, 84] : state.probeRiskLabel === 'WATCH' ? [245, 207, 98] : [184, 220, 198];
    p.noFill();
    p.stroke(...probeColor, 235);
    p.strokeWeight(1);
    p.circle(probeX, probeY, Math.max(8, Math.min(p.width, p.height) * 0.07));
    p.line(probeX - 7, probeY, probeX + 7, probeY);
    p.line(probeX, probeY - 7, probeX, probeY + 7);
    p.stroke(245, 207, 98, 120);
    p.line(p.width * 0.43, p.height * 0.16, p.width * 0.73, p.height * 0.76);
    p.noStroke();
    p.fill(245, 207, 98, 170);
    p.triangle(p.width * 0.73, p.height * 0.76, p.width * 0.695, p.height * 0.70, p.width * 0.748, p.height * 0.706);

    state.materialCellDrawCount = materialDraws;
    state.loadedCellDrawCount = loadedDraws;
    state.unstableCellDrawCount = unstableDraws;
    state.p5CanvasWidth = p.width;
    state.p5CanvasHeight = p.height;
    state.p5CompletedDrawCount += 1;
    dirty = false;
    state.currentCanvasSignature = canvasSignature();
  }

  const p5Ready = new Promise(resolve => {
    sketch = new p5(p => {
      p.setup = () => {
        const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
        canvas.parent(canvasHost);
        p.pixelDensity(1);
        p.noLoop();
        p.colorMode(p.RGB, 255);
        state.p5InstanceReady = true;
        state.p5CanvasReady = true;
        resolve();
      };
      p.draw = () => {
        if (terrainImage && state.rasterDrivenEvidenceReady) drawScene(p);
      };
    });
  });

  function loadP5Image(url) {
    return new Promise((resolve, reject) => {
      sketch.loadImage(url, resolve, error => reject(new Error(`p5 image decode failed: ${error}`)));
    });
  }

  async function loadEvidence() {
    const response = await fetch(TERRAIN_URL, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `terrain fetch failed (${response.status})`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await sha256(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET_SHA256;
    invariant(state.assetByteLength === EXPECTED_ASSET_BYTES, 'terrain asset byte length changed');
    invariant(state.assetShaMatchesExpected, 'terrain asset digest changed');

    const browserImage = new Image();
    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
    browserImage.src = objectUrl;
    await browserImage.decode();
    state.browserImageDecoded = true;
    state.sourceNaturalWidth = browserImage.naturalWidth;
    state.sourceNaturalHeight = browserImage.naturalHeight;
    URL.revokeObjectURL(objectUrl);
    invariant(state.sourceNaturalWidth === 960 && state.sourceNaturalHeight === 640, 'unexpected evidence dimensions');

    terrainImage = await loadP5Image(TERRAIN_URL);
    state.p5ImageDecoded = true;
    state.p5ImageClass = 'p5.Image';
    state.p5ImageWidth = terrainImage.width;
    state.p5ImageHeight = terrainImage.height;
    invariant(terrainImage.width === 960 && terrainImage.height === 640, 'unexpected p5 image dimensions');
    seedFromRaster();
    state.sampledPixelSha256 = await sha256(sampledBytes);
    state.rasterDrivenEvidenceReady = true;
  }

  function pointerCoordinates(event) {
    const bounds = stage.getBoundingClientRect();
    return {
      u: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width), 0, 1),
      v: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height), 0, 1),
    };
  }

  function isControlTarget(event) {
    return Boolean(event.target.closest('.bottom-panel'));
  }

  function updateProbeFromPointer(event, source) {
    const point = pointerCoordinates(event);
    const changed = Math.abs(point.u - state.probeU) > 0.001 || Math.abs(point.v - state.probeV) > 0.001;
    if (!changed) return;
    state.probeU = point.u;
    state.probeV = point.v;
    state.probeMutationCount += 1;
    state.humanMutationCount += 1;
    state.hoverProbeCount += 1;
    recordTransition(source, { probe: state.probeCellIndex }, { probe: Math.floor(point.v * ROWS) * COLUMNS + Math.floor(point.u * COLUMNS) });
    updateInterface();
    requestDraw(`trusted-${source}`);
  }

  stage.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || isControlTarget(event) || !acceptInput(event, 'mouse-hover', 'mouse-hover-enter')) return;
    state.pointerEnterCount += 1;
    updateProbeFromPointer(event, 'mouse-hover-enter');
  });

  stage.addEventListener('pointermove', event => {
    if (isControlTarget(event)) return;
    if (activePointerId === null) {
      if (event.pointerType !== 'mouse' || !acceptInput(event, 'mouse-hover', 'mouse-hover-move')) return;
      updateProbeFromPointer(event, 'mouse-hover-move');
      return;
    }
    if (event.pointerId !== activePointerId) return;
    const kind = ['touch', 'pen'].includes(event.pointerType) ? event.pointerType : 'mouse';
    if (!acceptInput(event, kind, `${kind}-drag-move`)) return;
    state.pointerDragCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
    const point = pointerCoordinates(event);
    state.probeU = point.u;
    state.probeV = point.v;
    const cell = clamp(Math.floor(point.v * ROWS), 0, ROWS - 1) * COLUMNS + clamp(Math.floor(point.u * COLUMNS), 0, COLUMNS - 1);
    if (cell !== lastDepositCell) {
      lastDepositCell = cell;
      depositAt(point.u, point.v, `${kind}-drag-move`);
    }
  });

  stage.addEventListener('pointerdown', event => {
    if (isControlTarget(event)) return;
    const kind = ['touch', 'pen'].includes(event.pointerType) ? event.pointerType : 'mouse';
    if (!acceptInput(event, kind, `${kind}-drag-start`)) return;
    event.preventDefault();
    stage.focus({ preventScroll: true });
    state.pointerDownCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
    activePointerId = event.pointerId;
    state.activePointerId = event.pointerId;
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptureCount += 1;
    state.pointerCaptured = true;
    pushUndo();
    pointerTransactionOpen = true;
    const point = pointerCoordinates(event);
    state.probeU = point.u;
    state.probeV = point.v;
    lastDepositCell = clamp(Math.floor(point.v * ROWS), 0, ROWS - 1) * COLUMNS + clamp(Math.floor(point.u * COLUMNS), 0, COLUMNS - 1);
    depositAt(point.u, point.v, `${kind}-drag-start`);
  });

  function releasePointer(event, source, cancelled = false) {
    if (activePointerId === null || event.pointerId !== activePointerId) return;
    const kind = ['touch', 'pen'].includes(event.pointerType) ? event.pointerType : 'mouse';
    if (!acceptInput(event, kind, source)) return;
    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    activePointerId = null;
    state.activePointerId = null;
    state.pointerCaptured = false;
    pointerTransactionOpen = false;
    lastDepositCell = -1;
    updateInterface();
  }

  stage.addEventListener('pointerup', event => releasePointer(event, `${event.pointerType || 'mouse'}-drag-end`));
  stage.addEventListener('pointercancel', event => releasePointer(event, `${event.pointerType || 'mouse'}-drag-cancel`, true));

  loadSize.addEventListener('input', event => {
    if (!acceptInput(event, 'range', 'range-packet-size')) return;
    const before = state.packetSize;
    const next = Number(loadSize.value);
    if (next === before) return;
    state.packetSize = next;
    state.packetMutationCount += 1;
    state.humanMutationCount += 1;
    recordTransition('range-packet-size', { packet: before }, { packet: next });
    updateInterface();
    requestDraw('trusted-range-packet-size');
  });

  function runButtonAction(action, source) {
    if (action === 'deposit') {
      pushUndo();
      depositAt(state.probeU, state.probeV, source);
    } else if (action === 'step') {
      pushUndo();
      stepWave(source);
    } else if (action === 'undo') undoProof(source);
    else if (action === 'reset') resetProof(source);
  }

  actionButtons.forEach(button => button.addEventListener('click', event => {
    if (!acceptInput(event, 'button', `button-${button.dataset.sandAction}`)) return;
    runButtonAction(button.dataset.sandAction, `button-${button.dataset.sandAction}`);
    stage.focus({ preventScroll: true });
  }));

  stage.addEventListener('keydown', event => {
    if (event.target !== stage || event.repeat) return;
    const key = event.key.toLowerCase();
    if (!['enter', ' ', 'z', 'r', 'arrowleft', 'arrowright', 'home', 'end'].includes(key)) return;
    if (!acceptInput(event, 'keyboard', `keyboard-${key === ' ' ? 'space' : key}`)) return;
    event.preventDefault();
    if (key === 'enter') runButtonAction('deposit', 'keyboard-enter');
    else if (key === ' ') runButtonAction('step', 'keyboard-space');
    else if (key === 'z') runButtonAction('undo', 'keyboard-z');
    else if (key === 'r') runButtonAction('reset', 'keyboard-r');
    else {
      const before = state.packetSize;
      const next = key === 'home' ? 4 : key === 'end' ? 24 : clamp(before + (key === 'arrowright' ? 1 : -1), 4, 24);
      if (next !== before) {
        state.packetSize = next;
        state.packetMutationCount += 1;
        state.humanMutationCount += 1;
        recordTransition(`keyboard-${key}`, { packet: before }, { packet: next });
        updateInterface();
        requestDraw(`trusted-keyboard-${key}`);
      }
    }
  });

  function canvasSignature() {
    const canvas = canvasHost.querySelector('canvas');
    if (!canvas) return 0;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const points = [
      [0.18, 0.22], [0.36, 0.31], [0.52, 0.28], [0.68, 0.44],
      [0.28, 0.59], [0.47, 0.67], [0.64, 0.71], [0.82, 0.58],
    ];
    let checksum = 2166136261;
    points.forEach(([u, v]) => {
      const pixel = context.getImageData(clamp(Math.floor(u * canvas.width), 0, canvas.width - 1), clamp(Math.floor(v * canvas.height), 0, canvas.height - 1), 1, 1).data;
      for (let channel = 0; channel < 4; channel += 1) checksum = Math.imul(checksum ^ pixel[channel], 16777619) >>> 0;
    });
    return checksum >>> 0;
  }

  function resizeCanvas() {
    if (!sketch || !state.p5InstanceReady) return;
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    if (sketch.width === width && sketch.height === height) return;
    sketch.resizeCanvas(width, height, true);
    state.resizeCount += 1;
    requestDraw('viewport-resize');
  }

  new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(resizeCanvas);
  }).observe(stage);

  function render() {
    state.previewRenderCalls += 1;
    resizeCanvas();
    if (dirty && sketch && state.rasterDrivenEvidenceReady) sketch.redraw();
  }

  const ready = Promise.all([p5Ready, document.fonts.ready]).then(loadEvidence).then(async () => {
    updateInterface();
    requestDraw('evidence-ready');
    render();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.initialCanvasSignature = canvasSignature();
    requestDraw('initial-static-check');
    render();
    state.currentCanvasSignature = canvasSignature();
    state.initialStillVerified = state.initialCanvasSignature === state.currentCanvasSignature;
    state.ready = true;
    updateDataset();
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = canvasHost.querySelector('canvas');
    const realP5 = sketch instanceof p5
      && state.p5InstanceReady
      && state.p5CanvasReady
      && canvas instanceof HTMLCanvasElement
      && sketch.drawingContext === canvas.getContext('2d')
      && sketch.width === stage.clientWidth
      && sketch.height === stage.clientHeight
      && state.p5CompletedDrawCount > 0;
    const realAsset = state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetMimeType.includes('image/jpeg')
      && state.assetSameOrigin
      && state.assetByteLength === EXPECTED_ASSET_BYTES
      && state.assetShaMatchesExpected
      && state.assetSha256 === EXPECTED_ASSET_SHA256
      && state.browserImageDecoded
      && state.sourceNaturalWidth === 960
      && state.sourceNaturalHeight === 640
      && state.p5ImageDecoded
      && state.p5ImageClass === 'p5.Image'
      && state.p5ImageWidth === 960
      && state.p5ImageHeight === 640
      && state.p5ImagePixelLength === 960 * 640 * 4;
    const pixelDriven = state.rasterDrivenEvidenceReady
      && state.gridColumns === COLUMNS
      && state.gridRows === ROWS
      && state.sampledPixelCount === CELL_COUNT
      && state.sampledPixelByteLength === CELL_COUNT * 4
      && /^[a-f0-9]{64}$/.test(state.sampledPixelSha256)
      && state.sampledPixelChecksum > 0
      && state.distinctSampleColorCount > 220
      && state.sampledLuminanceRange > 0.48
      && state.materialClassCount === MATERIAL_NAMES.length
      && state.materialCellCounts.every(count => count > 8)
      && state.materialCellCounts.reduce((sum, count) => sum + count, 0) === CELL_COUNT
      && state.terrainRiskRange > 0.68
      && state.terrainRiskChecksum > 0
      && state.seedCellCount === CELL_COUNT
      && state.seedGrainCount > CELL_COUNT
      && state.seedChecksum > 0;
    const honestInteraction = state.task === 'human-operated-fictional-slope-load-and-avalanche-inspection'
      && state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStillVerified
      && !state.automaticCycle
      && !state.automaticPlayback
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.renderIgnoresPreviewClock
      && state.previewClockMutationCount === 0
      && state.nonInputVisualMutationCountAfterReady === 0
      && state.lastInputTrusted !== false
      && state.pointerCaptureReleaseCount <= state.pointerCaptureCount
      && pointerTransactionOpen === (activePointerId !== null)
      && state.transitionRecords.every(record => record.trusted === true);
    const controlsAndRender = window.__PREVIEW_META__?.id === state.id
      && window.__PREVIEW_META__?.library === 'p5@2.3.0'
      && window.__PREVIEW_META__?.renderer === 'canvas2d'
      && stage.dataset.previewMechanism === 'p5-image-seeded-abelian-sandpile-human-load-inspection'
      && stage.tabIndex === 0
      && getComputedStyle(stage).touchAction === 'none'
      && typeof stage.setPointerCapture === 'function'
      && loadSize instanceof HTMLInputElement
      && actionButtons.length === 4
      && state.p5ImageDrawCount >= 1
      && state.materialCellDrawCount === CELL_COUNT
      && state.loadedCellDrawCount >= 0
      && state.unstableCellDrawCount >= 0;
    const initialOrHumanOwned = state.inputCount === 0
      ? state.humanMutationCount === 0 && state.appliedGrainCount === 0 && state.totalToppleCount === 0
      : state.trustedInputCount === state.inputCount && state.humanMutationCount > 0;
    state.runtimeAssertionPassed = Boolean(realP5 && realAsset && pixelDriven && honestInteraction && controlsAndRender && initialOrHumanOwned && state.ready);
    stage.dataset.runtimeAssert = String(state.runtimeAssertionPassed);
    return state.runtimeAssertionPassed;
  };

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'canvas2d',
    render,
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
