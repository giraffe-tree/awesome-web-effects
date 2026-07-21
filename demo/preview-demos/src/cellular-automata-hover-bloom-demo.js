import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_URL = new URL('../assets/aesthetic-wave-07/cellular-automata-hover-bloom/roof-regeneration-atlas.jpg', import.meta.url).href;
const EXPECTED_ASSET_SHA256 = '1072ce13e2e5c01aa72879efce186a04c2db8bf1dacfdfbc117132d494620c78';
const SOURCE_WIDTH = 960;
const SOURCE_HEIGHT = 640;
const SOURCE_CROP = Object.freeze({ x: 0, y: 50, width: 960, height: 540 });
const SAMPLE_WIDTH = 96;
const SAMPLE_HEIGHT = 54;
const COLUMNS = 48;
const ROWS = 27;
const CELL_COUNT = COLUMNS * ROWS;
const INITIAL_TOLERANCE = 38;
const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const rounded = value => Number(value.toFixed(4));

try {
  const stage = document.querySelector('#bloom-stage');
  const canvasHost = document.querySelector('[data-canvas-host]');
  const generationReading = document.querySelector('[data-reading="generation"]');
  const liveReading = document.querySelector('[data-reading="live"]');
  const recoveryReading = document.querySelector('[data-reading="recovery"]');
  const probeCoordinate = document.querySelector('[data-probe-coordinate]');
  const probeZone = document.querySelector('[data-probe-zone]');
  const probeMoisture = document.querySelector('[data-probe-moisture]');
  const probeHeat = document.querySelector('[data-probe-heat]');
  const toleranceInput = document.querySelector('#tolerance');
  const toleranceOutput = document.querySelector('[data-tolerance-output]');
  const controls = [...document.querySelectorAll('[data-bloom-action]')];
  if (!stage || !canvasHost || !generationReading || !liveReading || !recoveryReading
    || !probeCoordinate || !probeZone || !probeMoisture || !probeHeat
    || !toleranceInput || !toleranceOutput || controls.length !== 3) {
    throw new Error('cellular-automata-hover-bloom: required DOM is incomplete');
  }

  const state = {
    id: 'cellular-automata-hover-bloom',
    task: 'human-operated-image-sampled-green-roof-recovery-lab',
    claimedLibrary: 'p5@2.3.0',
    renderer: 'canvas2d',
    mechanism: 'p5-renders-human-stepped-cellular-life-constrained-by-same-origin-browser-sampled-roof-pixels',
    assetMechanismRole: 'source-pixel-color-determines-each-cell-viability-moisture-heat-risk-and-seed-admission',
    acceptedInputs: ['mouse-hover', 'mouse-drag', 'touch-drag', 'pen-drag', 'keyboard', 'button-control', 'range-control'],
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
    ready: false,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    columns: COLUMNS,
    rows: ROWS,
    cellCount: CELL_COUNT,
    generation: 0,
    initialGeneration: 0,
    tolerance: INITIAL_TOLERANCE,
    initialTolerance: INITIAL_TOLERANCE,
    liveCellCount: 0,
    initialLiveCellCount: 0,
    peakLiveCellCount: 0,
    recoveryRatio: 0,
    viableCellCount: 0,
    heatCellCount: 0,
    dampCellCount: 0,
    laneCellCount: 0,
    visibleCellCount: CELL_COUNT,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerEnterCount: 0,
    hoverMoveCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerUpCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    dragMoveCount: 0,
    keyboardInputCount: 0,
    buttonActivationCount: 0,
    rangeInputCount: 0,
    hoverMutationCount: 0,
    paintMutationCount: 0,
    seededCellCount: 0,
    erasedCellCount: 0,
    rejectedSeedCellCount: 0,
    stepCount: 0,
    undoCount: 0,
    resetCount: 0,
    ruleMutationCount: 0,
    humanMutationCount: 0,
    humanInputCausalityCount: 0,
    historyDepth: 0,
    maximumHistoryDepth: 0,
    lastInputKind: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    unknownPointerInputCount: 0,
    activePointerId: null,
    pointerCaptured: false,
    paintMode: 'seed',
    cursorColumn: Math.floor(COLUMNS / 2),
    cursorRow: Math.floor(ROWS / 2),
    probeZone: 'viable',
    probeMoisture: 0,
    probeHeat: 0,
    probeViability: 0,
    visitedCellCount: 1,
    visitedCells: [],
    sourceAssetUrl: ASSET_URL,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetSameOrigin: false,
    assetMimeType: '',
    assetByteLength: 0,
    assetSha256: '',
    expectedAssetSha256: EXPECTED_ASSET_SHA256,
    assetShaMatchesExpected: false,
    browserImageDecoded: false,
    sourceNaturalWidth: 0,
    sourceNaturalHeight: 0,
    browserCanvasReadback: false,
    sampledWidth: SAMPLE_WIDTH,
    sampledHeight: SAMPLE_HEIGHT,
    sampledPixelCount: 0,
    sampledPixelByteLength: 0,
    sampledPixelSha256: '',
    distinctSampleColorCount: 0,
    sampledLumaMinimum: 255,
    sampledLumaMaximum: 0,
    sampledLumaRange: 0,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5ImageDecoded: false,
    p5ImageWidth: 0,
    p5ImageHeight: 0,
    p5ImagePixelLength: 0,
    p5DrawCount: 0,
    renderRequestCount: 0,
    completedDrawCount: 0,
    visualRevision: 0,
    initialVisualSignature: '',
    repeatedInitialVisualSignature: '',
    initialStillVerified: false,
    initialFieldChecksum: '',
    currentFieldChecksum: '',
    fieldChangedByHuman: false,
    stageWidth: 0,
    stageHeight: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    stageCoverageRatio: 0,
    canvasCoverageRatio: 0,
    resizeCount: 0,
    runtimeAssertionPassed: false,
    interactionRecords: [],
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__CELLULAR_BLOOM_STATE__ = state;

  let sketch;
  let sourceImage;
  let field = new Uint8Array(CELL_COUNT);
  let initialField = new Uint8Array(CELL_COUNT);
  let evidence = [];
  let history = [];
  let dirty = true;
  let resizeFrame = 0;
  let dragSnapshotStored = false;
  const visitedCells = new Set();

  function invariant(condition, message) {
    if (!condition) throw new Error(`cellular-automata-hover-bloom: ${message}`);
  }

  async function sha256(bytes) {
    const buffer = bytes instanceof ArrayBuffer
      ? bytes
      : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function fieldChecksum(values) {
    let signature = 2166136261;
    for (let index = 0; index < values.length; index += 1) {
      signature ^= values[index] + index * 13;
      signature = Math.imul(signature, 16777619) >>> 0;
    }
    return signature.toString(16).padStart(8, '0');
  }

  function visualSignature() {
    return [
      state.generation,
      state.tolerance,
      state.liveCellCount,
      state.currentFieldChecksum,
      state.cursorColumn,
      state.cursorRow,
    ].join(':');
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
    state.humanInputCausalityCount += 1;
    return true;
  }

  function recordInteraction(kind, detail = {}) {
    state.interactionRecords.push({ kind, ...detail });
    if (state.interactionRecords.length > 80) state.interactionRecords.shift();
  }

  function observePointerType(pointerType) {
    state.lastPointerType = pointerType || 'unknown';
    if (state.lastPointerType === 'mouse') state.mouseInputCount += 1;
    else if (state.lastPointerType === 'touch') state.touchInputCount += 1;
    else if (state.lastPointerType === 'pen') state.penInputCount += 1;
    else state.unknownPointerInputCount += 1;
  }

  function markVisited(column, row) {
    const key = `${column}:${row}`;
    visitedCells.add(key);
    state.visitedCellCount = visitedCells.size;
    state.visitedCells = [...visitedCells].slice(-24);
  }

  function updateLayoutEvidence() {
    const stageBounds = stage.getBoundingClientRect();
    const canvasBounds = sketch?.canvas?.getBoundingClientRect();
    state.stageWidth = rounded(stageBounds.width);
    state.stageHeight = rounded(stageBounds.height);
    state.canvasWidth = rounded(canvasBounds?.width || 0);
    state.canvasHeight = rounded(canvasBounds?.height || 0);
    state.stageCoverageRatio = rounded(stageBounds.width * stageBounds.height / Math.max(1, innerWidth * innerHeight));
    state.canvasCoverageRatio = rounded((canvasBounds?.width || 0) * (canvasBounds?.height || 0)
      / Math.max(1, stageBounds.width * stageBounds.height));
  }

  function zoneLabel(zone) {
    if (zone === 'heat') return 'heat-stressed';
    if (zone === 'lane') return 'service lane';
    if (zone === 'damp') return 'damp channel';
    return 'viable moss';
  }

  function syncProbe() {
    const index = state.cursorRow * COLUMNS + state.cursorColumn;
    const cell = evidence[index];
    if (!cell) return;
    state.probeZone = cell.zone;
    state.probeMoisture = rounded(cell.moisture);
    state.probeHeat = rounded(cell.heat);
    state.probeViability = rounded(cell.viability);
    probeCoordinate.textContent = `C${String(state.cursorColumn + 1).padStart(2, '0')} / R${String(state.cursorRow + 1).padStart(2, '0')}`;
    probeZone.textContent = zoneLabel(cell.zone);
    probeMoisture.textContent = `${Math.round(cell.moisture * 100)}%`;
    probeHeat.textContent = `${Math.round(cell.heat * 100)}%`;
    stage.dataset.zone = cell.zone;
  }

  function recountField() {
    let alive = 0;
    for (const value of field) alive += value;
    state.liveCellCount = alive;
    state.peakLiveCellCount = Math.max(state.peakLiveCellCount, alive);
    state.recoveryRatio = rounded(alive / Math.max(1, state.viableCellCount));
    state.currentFieldChecksum = fieldChecksum(field);
    state.fieldChangedByHuman = state.currentFieldChecksum !== state.initialFieldChecksum || state.generation !== 0;
  }

  function syncDataset() {
    stage.dataset.generation = String(state.generation);
    stage.dataset.liveCells = String(state.liveCellCount);
    stage.dataset.tolerance = String(state.tolerance);
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.pointerCaptured = String(state.pointerCaptured);
    stage.dataset.humanMutationCount = String(state.humanMutationCount);
    stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
    stage.dataset.automaticPlayback = String(state.automaticPlayback);
    stage.dataset.captureClockDriven = String(state.captureClockDriven);
  }

  function syncUI() {
    recountField();
    generationReading.textContent = String(state.generation).padStart(2, '0');
    liveReading.textContent = String(state.liveCellCount).padStart(3, '0');
    recoveryReading.textContent = `${Math.round(state.recoveryRatio * 100)}%`;
    toleranceInput.value = String(state.tolerance);
    toleranceOutput.textContent = String(state.tolerance);
    const undoButton = controls.find(button => button.dataset.bloomAction === 'undo');
    if (undoButton) undoButton.disabled = history.length === 0;
    state.historyDepth = history.length;
    state.maximumHistoryDepth = Math.max(state.maximumHistoryDepth, history.length);
    syncProbe();
    syncDataset();
  }

  function requestRender() {
    dirty = true;
    state.renderRequestCount += 1;
    state.visualRevision += 1;
    sketch?.redraw();
  }

  function saveHistory(reason) {
    history.push({
      field: field.slice(),
      generation: state.generation,
      tolerance: state.tolerance,
      reason,
    });
    if (history.length > 24) history.shift();
    syncUI();
  }

  function isSeedable(index) {
    const cell = evidence[index];
    return Boolean(cell && cell.zone !== 'lane' && cell.viability >= state.tolerance / 100);
  }

  function applyBrush(column, row, mode) {
    let changed = 0;
    for (let y = Math.max(0, row - 1); y <= Math.min(ROWS - 1, row + 1); y += 1) {
      for (let x = Math.max(0, column - 1); x <= Math.min(COLUMNS - 1, column + 1); x += 1) {
        const index = y * COLUMNS + x;
        const insideBrush = x === column || y === row || (x - column) * (x - column) + (y - row) * (y - row) <= 2;
        if (!insideBrush) continue;
        if (mode === 'erase') {
          if (field[index]) {
            field[index] = 0;
            state.erasedCellCount += 1;
            changed += 1;
          }
        } else if (isSeedable(index)) {
          if (!field[index]) {
            field[index] = 1;
            state.seededCellCount += 1;
            changed += 1;
          }
        } else {
          state.rejectedSeedCellCount += 1;
        }
      }
    }
    if (changed > 0) {
      state.paintMutationCount += 1;
      state.humanMutationCount += 1;
      syncUI();
      requestRender();
    }
    return changed;
  }

  function countNeighbours(values, column, row) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (!dx && !dy) continue;
        const x = column + dx;
        const y = row + dy;
        if (x >= 0 && x < COLUMNS && y >= 0 && y < ROWS) count += values[y * COLUMNS + x];
      }
    }
    return count;
  }

  function advanceGeneration(kind) {
    saveHistory('step');
    const next = new Uint8Array(CELL_COUNT);
    const threshold = state.tolerance / 100;
    for (let row = 0; row < ROWS; row += 1) {
      for (let column = 0; column < COLUMNS; column += 1) {
        const index = row * COLUMNS + column;
        const cell = evidence[index];
        const neighbours = countNeighbours(field, column, row);
        if (cell.zone === 'lane' || cell.viability < threshold * .72) continue;
        const resilience = cell.viability * .55 + cell.moisture * .45 - cell.heat * .18;
        if (field[index]) {
          next[index] = neighbours >= 1 && neighbours <= 5 && resilience + neighbours * .045 >= threshold * .9 ? 1 : 0;
        } else {
          next[index] = neighbours >= 2 && neighbours <= 4 && resilience + neighbours * .055 >= threshold + .04 ? 1 : 0;
        }
      }
    }
    field = next;
    state.generation += 1;
    state.stepCount += 1;
    state.humanMutationCount += 1;
    recordInteraction(kind, { generation: state.generation });
    syncUI();
    requestRender();
  }

  function undo(kind) {
    const previous = history.pop();
    if (!previous) return false;
    field = previous.field;
    state.generation = previous.generation;
    state.tolerance = previous.tolerance;
    state.undoCount += 1;
    state.humanMutationCount += 1;
    recordInteraction(kind, { restored: previous.reason, generation: state.generation });
    syncUI();
    requestRender();
    return true;
  }

  function reset(kind) {
    saveHistory('reset');
    field = initialField.slice();
    state.generation = 0;
    state.tolerance = INITIAL_TOLERANCE;
    state.resetCount += 1;
    state.humanMutationCount += 1;
    recordInteraction(kind, { generation: 0 });
    syncUI();
    requestRender();
  }

  function cellFromPointer(event) {
    const bounds = stage.getBoundingClientRect();
    return {
      column: Math.max(0, Math.min(COLUMNS - 1, Math.floor((event.clientX - bounds.left) / Math.max(1, bounds.width) * COLUMNS))),
      row: Math.max(0, Math.min(ROWS - 1, Math.floor((event.clientY - bounds.top) / Math.max(1, bounds.height) * ROWS))),
    };
  }

  function updateCursor(column, row, kind) {
    const nextColumn = Math.max(0, Math.min(COLUMNS - 1, column));
    const nextRow = Math.max(0, Math.min(ROWS - 1, row));
    const changed = nextColumn !== state.cursorColumn || nextRow !== state.cursorRow;
    state.cursorColumn = nextColumn;
    state.cursorRow = nextRow;
    markVisited(nextColumn, nextRow);
    syncProbe();
    if (changed) {
      state.hoverMutationCount += 1;
      recordInteraction(kind, { column: nextColumn, row: nextRow });
      requestRender();
    }
  }

  function classifyEvidence(red, green, blue) {
    const luma = .2126 * red + .7152 * green + .0722 * blue;
    const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);
    const moisture = clamp(green / 255 * .48 + blue / 255 * .22 + (255 - luma) / 255 * .3);
    const heat = clamp((red - green + 105) / 205 * .72 + red / 255 * .28);
    const viability = clamp((green - red * .55 - blue * .02) / 150 + moisture * .34 - heat * .18);
    const lane = luma > 145 && chroma < 42;
    let zone = 'viable';
    if (lane) zone = 'lane';
    else if (luma < 95 && green > red * .75) zone = 'damp';
    else if (heat > .63 || viability < .27) zone = 'heat';
    return { red, green, blue, luma, moisture, heat, viability, zone };
  }

  function buildEvidence(pixels) {
    const result = [];
    let viableCellCount = 0;
    let heatCellCount = 0;
    let dampCellCount = 0;
    let laneCellCount = 0;
    for (let row = 0; row < ROWS; row += 1) {
      for (let column = 0; column < COLUMNS; column += 1) {
        let red = 0;
        let green = 0;
        let blue = 0;
        for (let sy = 0; sy < 2; sy += 1) {
          for (let sx = 0; sx < 2; sx += 1) {
            const sampleIndex = ((row * 2 + sy) * SAMPLE_WIDTH + column * 2 + sx) * 4;
            red += pixels[sampleIndex];
            green += pixels[sampleIndex + 1];
            blue += pixels[sampleIndex + 2];
          }
        }
        const cell = classifyEvidence(Math.round(red / 4), Math.round(green / 4), Math.round(blue / 4));
        result.push(cell);
        if (cell.zone === 'lane') laneCellCount += 1;
        else if (cell.zone === 'heat') heatCellCount += 1;
        else if (cell.zone === 'damp') dampCellCount += 1;
        if (cell.zone !== 'lane' && cell.viability >= INITIAL_TOLERANCE / 100) viableCellCount += 1;
      }
    }
    state.viableCellCount = viableCellCount;
    state.heatCellCount = heatCellCount;
    state.dampCellCount = dampCellCount;
    state.laneCellCount = laneCellCount;
    return result;
  }

  function createInitialField() {
    const candidates = [];
    for (let row = 4; row < ROWS - 4; row += 1) {
      for (let column = 12; column < COLUMNS - 10; column += 1) {
        const index = row * COLUMNS + column;
        const cell = evidence[index];
        if (cell.zone !== 'lane' && cell.viability >= .46) {
          const centerBias = 1 - Math.hypot(column / COLUMNS - .52, row / ROWS - .5) * .45;
          candidates.push({ column, row, score: cell.viability * .72 + cell.moisture * .28 + centerBias * .1 });
        }
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    invariant(candidates.length >= 20, 'sampled atlas did not produce enough viable seed candidates');
    const anchor = candidates[0];
    const pattern = [
      [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0],
      [-1, -1], [1, -1], [-1, 1], [1, 1],
    ];
    const next = new Uint8Array(CELL_COUNT);
    for (const [dx, dy] of pattern) {
      const column = Math.max(0, Math.min(COLUMNS - 1, anchor.column + dx));
      const row = Math.max(0, Math.min(ROWS - 1, anchor.row + dy));
      const index = row * COLUMNS + column;
      if (evidence[index].zone !== 'lane' && evidence[index].viability >= .34) next[index] = 1;
    }
    if (next.reduce((sum, value) => sum + value, 0) < 6) {
      for (const candidate of candidates.slice(0, 9)) next[candidate.row * COLUMNS + candidate.column] = 1;
    }
    state.cursorColumn = anchor.column;
    state.cursorRow = anchor.row;
    markVisited(anchor.column, anchor.row);
    return next;
  }

  async function fetchAndSampleAsset() {
    const response = await fetch(ASSET_URL, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    state.assetMimeType = response.headers.get('content-type') || '';
    invariant(response.ok, `roof atlas request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await sha256(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET_SHA256;
    invariant(state.assetSameOrigin, 'roof atlas was not fetched from the preview origin');
    invariant(state.assetShaMatchesExpected, 'roof atlas SHA-256 differs from the committed asset');

    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: state.assetMimeType || 'image/jpeg' }));
    const browserImage = new Image();
    browserImage.src = objectUrl;
    try {
      await browserImage.decode();
      state.browserImageDecoded = true;
      state.sourceNaturalWidth = browserImage.naturalWidth;
      state.sourceNaturalHeight = browserImage.naturalHeight;
      invariant(browserImage.naturalWidth === SOURCE_WIDTH && browserImage.naturalHeight === SOURCE_HEIGHT,
        'browser-decoded roof atlas dimensions are not 960x640');
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = SAMPLE_WIDTH;
      sampleCanvas.height = SAMPLE_HEIGHT;
      const context = sampleCanvas.getContext('2d', { willReadFrequently: true });
      invariant(context, 'sample canvas 2D context is unavailable');
      context.drawImage(
        browserImage,
        SOURCE_CROP.x, SOURCE_CROP.y, SOURCE_CROP.width, SOURCE_CROP.height,
        0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT,
      );
      const pixels = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
      state.browserCanvasReadback = pixels.length === SAMPLE_WIDTH * SAMPLE_HEIGHT * 4;
      state.sampledPixelCount = pixels.length / 4;
      state.sampledPixelByteLength = pixels.length;
      state.sampledPixelSha256 = await sha256(pixels);
      const distinct = new Set();
      let minimumLuma = 255;
      let maximumLuma = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const luma = .2126 * red + .7152 * green + .0722 * blue;
        minimumLuma = Math.min(minimumLuma, luma);
        maximumLuma = Math.max(maximumLuma, luma);
        distinct.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
      }
      state.distinctSampleColorCount = distinct.size;
      state.sampledLumaMinimum = rounded(minimumLuma);
      state.sampledLumaMaximum = rounded(maximumLuma);
      state.sampledLumaRange = rounded(maximumLuma - minimumLuma);
      return new Uint8ClampedArray(pixels);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  const p5Ready = new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
          canvas.parent(canvasHost);
          p.noLoop();
          p.noStroke();
          state.p5InstanceReady = p instanceof p5;
          state.p5CanvasReady = canvas.elt instanceof HTMLCanvasElement && p.drawingContext instanceof CanvasRenderingContext2D;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      p.draw = () => {
        if (!sourceImage || evidence.length !== CELL_COUNT) return;
        const width = p.width;
        const height = p.height;
        p.clear();
        p.image(
          sourceImage,
          0, 0, width, height,
          SOURCE_CROP.x, SOURCE_CROP.y, SOURCE_CROP.width, SOURCE_CROP.height,
        );
        p.noStroke();
        p.fill(4, 15, 12, 112);
        p.rect(0, 0, width, height);
        const cellWidth = width / COLUMNS;
        const cellHeight = height / ROWS;
        for (let row = 0; row < ROWS; row += 1) {
          for (let column = 0; column < COLUMNS; column += 1) {
            const index = row * COLUMNS + column;
            const cell = evidence[index];
            const x = column * cellWidth;
            const y = row * cellHeight;
            if (cell.zone === 'lane') p.fill(239, 235, 214, 13);
            else if (cell.zone === 'heat') p.fill(224, 133, 72, 24 + cell.heat * 16);
            else if (cell.zone === 'damp') p.fill(77, 180, 167, 29);
            else p.fill(126, 205, 140, 16 + cell.viability * 17);
            p.rect(x + .35, y + .35, Math.max(.4, cellWidth - .7), Math.max(.4, cellHeight - .7), Math.min(2, cellWidth * .2));
            if (field[index]) {
              const context = p.drawingContext;
              context.save();
              context.shadowColor = cell.moisture > .58 ? 'rgba(185,255,196,.82)' : 'rgba(222,244,111,.78)';
              context.shadowBlur = Math.max(3, Math.min(9, cellWidth * .72));
              p.fill(cell.moisture > .58 ? '#b9ffc4' : '#def46f');
              p.rect(
                x + Math.max(.5, cellWidth * .15),
                y + Math.max(.5, cellHeight * .15),
                Math.max(1.2, cellWidth * .7),
                Math.max(1.2, cellHeight * .7),
                Math.min(3, cellWidth * .3),
              );
              context.restore();
            }
          }
        }
        const cursorX = state.cursorColumn * cellWidth;
        const cursorY = state.cursorRow * cellHeight;
        p.noFill();
        p.stroke(244, 246, 222, 235);
        p.strokeWeight(Math.max(1, Math.min(2, width / 320)));
        p.rect(cursorX + .3, cursorY + .3, Math.max(1, cellWidth - .6), Math.max(1, cellHeight - .6), Math.min(3, cellWidth * .2));
        p.stroke(216, 243, 122, 155);
        p.strokeWeight(1);
        p.line(cursorX + cellWidth / 2, Math.max(0, cursorY - cellHeight * .65), cursorX + cellWidth / 2, cursorY - 1);
        p.line(cursorX + cellWidth / 2, cursorY + cellHeight + 1, cursorX + cellWidth / 2, Math.min(height, cursorY + cellHeight * 1.65));
        p.noStroke();
        state.p5DrawCount += 1;
        state.completedDrawCount += 1;
        dirty = false;
        updateLayoutEvidence();
      };
    }, canvasHost);
  });

  function loadP5Source() {
    return new Promise((resolve, reject) => {
      sketch.loadImage(ASSET_URL, image => resolve(image), error => reject(new Error(`p5 image decode failed: ${error}`)));
    });
  }

  stage.addEventListener('pointerenter', event => {
    if (event.target.closest('button, input')) return;
    if (!acceptTrustedInput(event, 'pointer-enter')) return;
    state.pointerEnterCount += 1;
    observePointerType(event.pointerType);
    const cell = cellFromPointer(event);
    updateCursor(cell.column, cell.row, 'pointer-enter');
  });

  stage.addEventListener('pointermove', event => {
    if (event.target.closest('button, input') && state.activePointerId === null) return;
    if (!acceptTrustedInput(event, state.activePointerId === event.pointerId ? 'pointer-drag' : 'pointer-hover')) return;
    state.pointerMoveCount += 1;
    observePointerType(event.pointerType);
    const cell = cellFromPointer(event);
    updateCursor(cell.column, cell.row, state.activePointerId === event.pointerId ? 'pointer-drag' : 'pointer-hover');
    if (state.activePointerId === event.pointerId) {
      state.dragMoveCount += 1;
      applyBrush(cell.column, cell.row, state.paintMode);
    } else {
      state.hoverMoveCount += 1;
    }
  });

  stage.addEventListener('pointerdown', event => {
    if (event.target.closest('button, input')) return;
    if (!acceptTrustedInput(event, 'pointer-down')) return;
    event.preventDefault();
    stage.focus({ preventScroll: true });
    state.pointerDownCount += 1;
    observePointerType(event.pointerType);
    state.activePointerId = event.pointerId;
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptureCount += 1;
    state.pointerCaptured = true;
    const cell = cellFromPointer(event);
    updateCursor(cell.column, cell.row, 'pointer-down');
    const index = cell.row * COLUMNS + cell.column;
    state.paintMode = field[index] ? 'erase' : 'seed';
    saveHistory('paint');
    dragSnapshotStored = true;
    if (!applyBrush(cell.column, cell.row, state.paintMode)) {
      history.pop();
      dragSnapshotStored = false;
      syncUI();
    }
    recordInteraction('pointer-down', { pointerType: state.lastPointerType, mode: state.paintMode, ...cell });
  });

  function endPointer(event, cancelled = false) {
    if (state.activePointerId !== event.pointerId) return;
    if (!acceptTrustedInput(event, cancelled ? 'pointer-cancel' : 'pointer-up')) return;
    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.pointerCaptured = false;
    state.activePointerId = null;
    observePointerType(event.pointerType || state.lastPointerType);
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerUpCount += 1;
    if (dragSnapshotStored) state.fieldChangedByHuman = true;
    dragSnapshotStored = false;
    syncDataset();
    recordInteraction(cancelled ? 'pointer-cancel' : 'pointer-up', { pointerType: state.lastPointerType });
  }

  stage.addEventListener('pointerup', event => endPointer(event));
  stage.addEventListener('pointercancel', event => endPointer(event, true));

  stage.addEventListener('keydown', event => {
    if (event.target instanceof HTMLInputElement) return;
    const key = event.key.toLowerCase();
    const handled = ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'enter', 'n', 'z', 'backspace', 'r', '[', ']'].includes(key);
    if (!handled || !acceptTrustedInput(event, `keyboard-${key}`)) return;
    event.preventDefault();
    state.keyboardInputCount += 1;
    if (key === 'arrowleft') updateCursor(state.cursorColumn - 1, state.cursorRow, 'keyboard-cursor');
    else if (key === 'arrowright') updateCursor(state.cursorColumn + 1, state.cursorRow, 'keyboard-cursor');
    else if (key === 'arrowup') updateCursor(state.cursorColumn, state.cursorRow - 1, 'keyboard-cursor');
    else if (key === 'arrowdown') updateCursor(state.cursorColumn, state.cursorRow + 1, 'keyboard-cursor');
    else if (key === ' ' ) {
      const index = state.cursorRow * COLUMNS + state.cursorColumn;
      saveHistory('keyboard-paint');
      if (!applyBrush(state.cursorColumn, state.cursorRow, field[index] ? 'erase' : 'seed')) {
        history.pop();
        syncUI();
      }
    } else if (key === 'enter' || key === 'n') advanceGeneration('keyboard-step');
    else if (key === 'z' || key === 'backspace') undo('keyboard-undo');
    else if (key === 'r') reset('keyboard-reset');
    else {
      state.tolerance = Math.max(22, Math.min(62, state.tolerance + (key === ']' ? 2 : -2)));
      state.ruleMutationCount += 1;
      state.humanMutationCount += 1;
      syncUI();
      requestRender();
      recordInteraction('keyboard-tolerance', { value: state.tolerance });
    }
  });

  controls.forEach(button => {
    button.addEventListener('click', event => {
      if (!acceptTrustedInput(event, `button-${button.dataset.bloomAction}`)) return;
      state.buttonActivationCount += 1;
      const action = button.dataset.bloomAction;
      if (action === 'step') advanceGeneration('button-step');
      else if (action === 'undo') undo('button-undo');
      else reset('button-reset');
    });
  });

  toleranceInput.addEventListener('input', event => {
    if (!acceptTrustedInput(event, 'range-tolerance')) return;
    state.rangeInputCount += 1;
    state.ruleMutationCount += 1;
    state.humanMutationCount += 1;
    state.tolerance = Number(toleranceInput.value);
    syncUI();
    requestRender();
    recordInteraction('range-tolerance', { value: state.tolerance });
  });

  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      state.resizeCount += 1;
      sketch.resizeCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
      requestRender();
    });
  });

  async function bootstrap() {
    await p5Ready;
    const sampledPixels = await fetchAndSampleAsset();
    sourceImage = await loadP5Source();
    sourceImage.loadPixels();
    state.p5ImageDecoded = sourceImage.width === SOURCE_WIDTH && sourceImage.height === SOURCE_HEIGHT;
    state.p5ImageWidth = sourceImage.width;
    state.p5ImageHeight = sourceImage.height;
    state.p5ImagePixelLength = sourceImage.pixels.length;
    evidence = buildEvidence(sampledPixels);
    initialField = createInitialField();
    field = initialField.slice();
    state.initialFieldChecksum = fieldChecksum(initialField);
    state.currentFieldChecksum = state.initialFieldChecksum;
    recountField();
    state.initialLiveCellCount = state.liveCellCount;
    syncUI();
    requestRender();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.initialVisualSignature = visualSignature();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.repeatedInitialVisualSignature = visualSignature();
    state.initialStillVerified = state.initialVisualSignature === state.repeatedInitialVisualSignature;

    invariant(state.p5InstanceReady && state.p5CanvasReady && state.p5ImageDecoded,
      'p5 instance, canvas, or source image did not initialize');
    invariant(state.browserImageDecoded && state.browserCanvasReadback,
      'browser image decode or Canvas pixel readback did not complete');
    invariant(state.sampledPixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT
      && state.sampledPixelByteLength === SAMPLE_WIDTH * SAMPLE_HEIGHT * 4,
    'sampled pixel dimensions are incomplete');
    invariant(state.sampledPixelSha256.length === 64 && !/^0+$/.test(state.sampledPixelSha256),
      'derived sample digest is not a non-zero SHA-256 string');
    invariant(state.distinctSampleColorCount > 350 && state.sampledLumaRange > 130,
      'sampled atlas lacks sufficient color or luminance evidence');
    invariant(state.viableCellCount > 220 && state.viableCellCount < 1000,
      'pixel-derived viable cell range is implausible');
    invariant(state.heatCellCount > 100 && state.dampCellCount > 20 && state.laneCellCount > 50,
      'pixel-derived risk, damp-channel, or service-lane evidence is missing');
    invariant(state.initialLiveCellCount >= 6 && state.initialLiveCellCount <= 12,
      'initial recovery seed is outside the curated finite range');
    invariant(state.initialStillVerified && !state.automaticPlayback && !state.captureClockDriven,
      'initial frame is not a static human-operated state');
    invariant(state.stageCoverageRatio >= .98 && state.canvasCoverageRatio >= .98,
      'stage or p5 canvas does not cover the full preview');
    state.runtimeAssertionPassed = true;
    state.ready = true;
    syncDataset();
  }

  const ready = bootstrap();

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    const canvas = canvasHost.querySelector('canvas');
    const realP5 = sketch instanceof p5
      && state.p5InstanceReady
      && state.p5CanvasReady
      && canvas instanceof HTMLCanvasElement
      && sketch.drawingContext === canvas.getContext('2d')
      && sketch.width === stage.clientWidth
      && sketch.height === stage.clientHeight
      && state.p5DrawCount > 0;
    const honestInteraction = state.task === 'human-operated-image-sampled-green-roof-recovery-lab'
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
      && state.humanInputCausalityCount === state.inputCount
      && state.pointerCaptureReleaseCount <= state.pointerCaptureCount
      && state.lastInputTrusted !== false;
    const realAsset = state.assetFetchCount === 1
      && state.assetResponseStatus === 200
      && state.assetSameOrigin
      && state.assetByteLength === 461364
      && state.assetShaMatchesExpected
      && state.assetSha256 === EXPECTED_ASSET_SHA256
      && state.browserImageDecoded
      && state.sourceNaturalWidth === SOURCE_WIDTH
      && state.sourceNaturalHeight === SOURCE_HEIGHT
      && state.p5ImageDecoded
      && state.p5ImageWidth === SOURCE_WIDTH
      && state.p5ImageHeight === SOURCE_HEIGHT
      && state.p5ImagePixelLength === SOURCE_WIDTH * SOURCE_HEIGHT * 4;
    const pixelEvidence = state.browserCanvasReadback
      && state.sampledPixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT
      && state.sampledPixelByteLength === state.sampledPixelCount * 4
      && typeof state.sampledPixelSha256 === 'string'
      && state.sampledPixelSha256.length === 64
      && state.distinctSampleColorCount > 350
      && state.sampledLumaRange > 130
      && evidence.length === CELL_COUNT
      && state.viableCellCount > 220
      && state.viableCellCount < 1000
      && state.heatCellCount > 100
      && state.dampCellCount > 20
      && state.laneCellCount > 50;
    const humanResult = state.inputCount === 0
      ? state.generation === state.initialGeneration
        && state.liveCellCount === state.initialLiveCellCount
        && state.currentFieldChecksum === state.initialFieldChecksum
      : state.humanMutationCount > 0
        && state.humanInputCausalityCount > 0
        && (state.pointerMoveCount > 0 || state.keyboardInputCount > 0
          || state.buttonActivationCount > 0 || state.rangeInputCount > 0);
    const result = Boolean(state.ready
      && state.runtimeAssertionPassed
      && realP5
      && honestInteraction
      && realAsset
      && pixelEvidence
      && humanResult
      && window.__PREVIEW_META__?.id === state.id
      && window.__PREVIEW_META__?.library === state.claimedLibrary
      && window.__PREVIEW_META__?.renderer === 'canvas2d'
      && window.__PREVIEW_INTERACTION_STATE__ === state);
    stage.dataset.runtimeAssert = String(result);
    syncUI();
    return result;
  };

  installPreviewController({
    id: state.id,
    library: state.claimedLibrary,
    renderer: 'canvas2d',
    ready,
    render() {
      state.previewClockCallCount += 1;
      if (dirty) sketch.redraw();
    },
  });
} catch (error) {
  markPreviewFailure(error);
}
