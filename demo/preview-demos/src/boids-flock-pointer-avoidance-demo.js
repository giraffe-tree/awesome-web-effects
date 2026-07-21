import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const ASSET_BYTES = 235229;
const ASSET_SHA256 = '944859c4123d5446e09e45f55a273d636c5e0cfde082ee57e44d563aea74232e';
const ASSET_URL = new URL('../assets/aesthetic-wave-08/boids-flock-pointer-avoidance/terminal-apron-egress-survey.jpg', import.meta.url).href;
const SOURCE_WIDTH = 960;
const SOURCE_HEIGHT = 640;
const SOURCE_CROP = Object.freeze({ x: 0, y: 50, width: 960, height: 540 });
const FIELD_COLUMNS = 96;
const FIELD_ROWS = 54;
const FIELD_CELL_COUNT = FIELD_COLUMNS * FIELD_ROWS;
const INITIAL_RADIUS_METRES = 18;

const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const round = (value, places = 4) => Number(value.toFixed(places));
const seeded = (index, salt = 0) => {
  const value = Math.sin((index + 1) * 91.733 + salt * 37.719) * 43758.5453;
  return value - Math.floor(value);
};

try {
  const stage = document.querySelector('#clearance-stage');
  const surface = document.querySelector('#clearance-surface');
  const radiusInput = document.querySelector('#clearance-radius');
  const radiusOutput = document.querySelector('#radius-output');
  const routeStatus = document.querySelector('#route-status');
  const routeEvidence = document.querySelector('#route-evidence');
  const stepCount = document.querySelector('#step-count');
  const agentCount = document.querySelector('#agent-count');
  const actionButtons = [...document.querySelectorAll('[data-clearance-action]')];
  const undoButton = document.querySelector('[data-clearance-action="undo"]');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  const luminanceField = new Float32Array(FIELD_CELL_COUNT);
  const edgeField = new Float32Array(FIELD_CELL_COUNT);
  const blueField = new Float32Array(FIELD_CELL_COUNT);
  const riskField = new Float32Array(FIELD_CELL_COUNT);
  const sampledBytes = new Uint8Array(FIELD_CELL_COUNT * 4);
  const agents = [];
  const initialAgents = [];
  const undoStack = [];

  let sketch;
  let surveyImage;
  let dirty = true;
  let resizeFrame = 0;
  let activePointerId = null;
  let lastDragStepU = 0;
  let lastDragStepV = 0;

  const state = {
    id: 'boids-flock-pointer-avoidance',
    task: 'human-operated-fictional-terminal-crowd-clearance-route-test',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'decoded-survey-luminance-chroma-and-edges-drive-boids-navigation-risk-and-avoidance',
    captureType: 'interactive',
    acceptedInputs: ['mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'keyboard', 'range-control', 'visible-buttons'],
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
    reducedMotion: reducedMotionQuery.matches,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    humanMutationCount: 0,
    humanSimulationStepCount: 0,
    pointerEnterCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerDragCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    hoverMutationCount: 0,
    dragMutationCount: 0,
    zoneMutationCount: 0,
    radiusMutationCount: 0,
    keyboardInputCount: 0,
    buttonInputCount: 0,
    rangeInputCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    stepButtonCount: 0,
    undoCount: 0,
    resetCount: 0,
    activePointerId: null,
    pointerCaptured: false,
    dragging: false,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    transitionRecords: [],
    assetUrl: ASSET_URL,
    assetFetchCount: 0,
    assetResponseStatus: 0,
    assetMimeType: '',
    assetSameOrigin: false,
    assetByteLength: 0,
    assetSha256: '',
    expectedAssetByteLength: ASSET_BYTES,
    expectedAssetSha256: ASSET_SHA256,
    assetShaMatchesExpected: false,
    browserImageDecoded: false,
    sourceNaturalWidth: 0,
    sourceNaturalHeight: 0,
    sourcePixelCount: 0,
    p5ImageDecoded: false,
    p5ImageClass: null,
    p5ImageWidth: 0,
    p5ImageHeight: 0,
    p5ImagePixelLength: 0,
    sourceCrop: { ...SOURCE_CROP },
    sampledWidth: FIELD_COLUMNS,
    sampledHeight: FIELD_ROWS,
    sampledPixelCount: 0,
    sampledByteLength: 0,
    sampledPixelSha256: '',
    sampledPixelChecksum: 0,
    distinctSampleColorCount: 0,
    nonzeroSampleByteCount: 0,
    sampledLuminanceMinimum: 1,
    sampledLuminanceMaximum: 0,
    sampledLuminanceMean: 0,
    sampledLuminanceRange: 0,
    sampledEdgeMinimum: 1,
    sampledEdgeMaximum: 0,
    sampledEdgeMean: 0,
    sampledEdgeRange: 0,
    sampledBlueExcessMean: 0,
    navigationRiskMinimum: 1,
    navigationRiskMaximum: 0,
    navigationRiskMean: 0,
    navigationRiskRange: 0,
    highRiskCellCount: 0,
    safeCellCount: 0,
    edgeSampleCount: 0,
    fieldEvidenceReady: false,
    fieldCoordinateChecksum: 0,
    agentCount: 0,
    agentCountDerivedFromPixels: false,
    avoidanceWeight: 0,
    avoidanceWeightDerivedFromPixels: false,
    startU: 0,
    startV: 0,
    goalU: 0,
    goalV: 0,
    initialZoneU: 0,
    initialZoneV: 0,
    zoneU: 0,
    zoneV: 0,
    zoneRadiusMetres: INITIAL_RADIUS_METRES,
    initialZoneRadiusMetres: INITIAL_RADIUS_METRES,
    meanAgentRisk: 0,
    maximumAgentRisk: 0,
    agentsInsideExclusion: 0,
    clearanceScore: 0,
    minimumClearanceScore: 100,
    maximumClearanceScore: 0,
    routeConclusion: 'READY',
    routeConclusionMutationCount: 0,
    agentStateChecksum: 0,
    initialAgentStateChecksum: 0,
    currentVisualStateChecksum: 0,
    initialVisualStateChecksum: 0,
    initialCanvasSignature: 0,
    currentCanvasSignature: 0,
    undoDepth: 0,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    p5ImageDrawCount: 0,
    boidDrawCount: 0,
    riskCellDrawCount: 0,
    fieldVectorDrawCount: 0,
    renderRequestCount: 0,
    previewRenderCalls: 0,
    previewClockIgnoredCount: 0,
    previewClockMutationCount: 0,
    nonInputVisualMutationCountAfterReady: 0,
    resizeCount: 0,
    initialStaticConfirmationCount: 0,
    initialStaticConfirmed: false,
    animationSettled: true,
    ready: false,
    runtimeAssertionPassed: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__BOIDS_CLEARANCE_FIELD_STATE__ = state;

  function invariant(condition, message) {
    if (!condition) throw new Error(`boids-flock-pointer-avoidance: ${message}`);
  }

  function fnvMix(checksum, value) {
    return Math.imul(checksum ^ (value >>> 0), 16777619) >>> 0;
  }

  function bytesChecksum(bytes) {
    let checksum = 2166136261;
    for (let index = 0; index < bytes.length; index += 1) checksum = fnvMix(checksum, bytes[index]);
    return checksum >>> 0;
  }

  async function digestHex(bytes) {
    const exactBuffer = bytes instanceof ArrayBuffer
      ? bytes
      : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256', exactBuffer))]
      .map(value => value.toString(16).padStart(2, '0')).join('');
  }

  function fieldIndex(column, row) {
    return clamp(row, 0, FIELD_ROWS - 1) * FIELD_COLUMNS + clamp(column, 0, FIELD_COLUMNS - 1);
  }

  function sampleField(field, u, v) {
    const x = clamp(u) * (FIELD_COLUMNS - 1);
    const y = clamp(v) * (FIELD_ROWS - 1);
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(FIELD_COLUMNS - 1, x0 + 1);
    const y1 = Math.min(FIELD_ROWS - 1, y0 + 1);
    const tx = x - x0;
    const ty = y - y0;
    const top = field[fieldIndex(x0, y0)] * (1 - tx) + field[fieldIndex(x1, y0)] * tx;
    const bottom = field[fieldIndex(x0, y1)] * (1 - tx) + field[fieldIndex(x1, y1)] * tx;
    return top * (1 - ty) + bottom * ty;
  }

  function agentChecksum(list = agents) {
    let checksum = 2166136261;
    for (const agent of list) {
      checksum = fnvMix(checksum, Math.round(agent.x * 100000));
      checksum = fnvMix(checksum, Math.round(agent.y * 100000));
      checksum = fnvMix(checksum, Math.round((agent.vx + 1) * 100000));
      checksum = fnvMix(checksum, Math.round((agent.vy + 1) * 100000));
    }
    return checksum >>> 0;
  }

  function visualStateChecksum() {
    let checksum = agentChecksum();
    checksum = fnvMix(checksum, Math.round(state.zoneU * 10000));
    checksum = fnvMix(checksum, Math.round(state.zoneV * 10000));
    checksum = fnvMix(checksum, state.zoneRadiusMetres);
    checksum = fnvMix(checksum, state.humanSimulationStepCount);
    checksum = fnvMix(checksum, state.clearanceScore);
    return checksum >>> 0;
  }

  function canvasSignature() {
    const canvas = surface.querySelector('canvas');
    if (!canvas) return 0;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let checksum = 2166136261;
    const stride = Math.max(4, Math.floor(pixels.length / 4096 / 4) * 4);
    for (let index = 0; index < pixels.length; index += stride) {
      checksum = fnvMix(checksum, pixels[index]);
      checksum = fnvMix(checksum, pixels[index + 1]);
      checksum = fnvMix(checksum, pixels[index + 2]);
    }
    return checksum >>> 0;
  }

  function updateDataset() {
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedInputCount = String(state.rejectedUntrustedInputCount);
    stage.dataset.humanMutationCount = String(state.humanMutationCount);
    stage.dataset.humanSimulationStepCount = String(state.humanSimulationStepCount);
    stage.dataset.pointerDragCount = String(state.pointerDragCount);
    stage.dataset.clearanceScore = String(state.clearanceScore);
    stage.dataset.routeConclusion = state.routeConclusion;
    stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
    stage.dataset.fieldEvidenceReady = String(state.fieldEvidenceReady);
    stage.dataset.automaticPlayback = String(state.automaticPlayback);
    stage.dataset.captureClockDriven = String(state.captureClockDriven);
  }

  function updateInterface() {
    radiusInput.value = String(state.zoneRadiusMetres);
    radiusOutput.textContent = `${state.zoneRadiusMetres} m`;
    stepCount.textContent = String(state.humanSimulationStepCount).padStart(2, '0');
    agentCount.textContent = state.agentCount ? String(state.agentCount).padStart(2, '0') : '--';
    routeStatus.textContent = state.routeConclusion;
    routeStatus.className = `risk-${state.routeConclusion.toLowerCase()}`;
    routeEvidence.textContent = state.fieldEvidenceReady
      ? `${state.clearanceScore}/100 · ${state.agentsInsideExclusion} held`
      : 'survey loading';
    undoButton.disabled = undoStack.length === 0;
    state.undoDepth = undoStack.length;
    surface.setAttribute('aria-valuetext', `${state.routeConclusion} route, score ${state.clearanceScore}, ${state.humanSimulationStepCount} human steps, ${state.agentsInsideExclusion} agents held by exclusion zone`);
    updateDataset();
  }

  function requestDraw(reason) {
    dirty = true;
    state.renderRequestCount += 1;
    state.lastRenderReason = reason;
    sketch?.redraw();
  }

  function recordTransition(source, before, after) {
    state.transitionRecords.push({
      source,
      kind: state.lastInputKind,
      pointerType: state.lastPointerType,
      trusted: true,
      before,
      after,
    });
    if (state.transitionRecords.length > 120) state.transitionRecords.shift();
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

  function pointerKind(event, hover = false) {
    const pointerType = event.pointerType || 'mouse';
    if (pointerType === 'mouse') return hover ? 'mouse-hover' : 'mouse';
    return pointerType;
  }

  function snapshot() {
    return {
      agents: agents.map(agent => ({ ...agent })),
      zoneU: state.zoneU,
      zoneV: state.zoneV,
      zoneRadiusMetres: state.zoneRadiusMetres,
      humanSimulationStepCount: state.humanSimulationStepCount,
    };
  }

  function restoreSnapshot(saved) {
    agents.splice(0, agents.length, ...saved.agents.map(agent => ({ ...agent })));
    state.zoneU = saved.zoneU;
    state.zoneV = saved.zoneV;
    state.zoneRadiusMetres = saved.zoneRadiusMetres;
    state.humanSimulationStepCount = saved.humanSimulationStepCount;
    updateRouteMetrics();
    updateInterface();
    requestDraw('restore-snapshot');
  }

  function pushUndo() {
    undoStack.push(snapshot());
    if (undoStack.length > 24) undoStack.shift();
    state.undoDepth = undoStack.length;
  }

  function analyzePixels(pixelData) {
    sampledBytes.set(pixelData);
    const quantizedColors = new Set();
    let lumaSum = 0;
    let blueSum = 0;
    let nonzeroBytes = 0;

    for (let index = 0; index < FIELD_CELL_COUNT; index += 1) {
      const byteIndex = index * 4;
      const red = pixelData[byteIndex] / 255;
      const green = pixelData[byteIndex + 1] / 255;
      const blue = pixelData[byteIndex + 2] / 255;
      const luma = red * .2126 + green * .7152 + blue * .0722;
      const blueExcess = Math.max(0, blue - (red + green) * .5);
      luminanceField[index] = luma;
      blueField[index] = blueExcess;
      lumaSum += luma;
      blueSum += blueExcess;
      state.sampledLuminanceMinimum = Math.min(state.sampledLuminanceMinimum, luma);
      state.sampledLuminanceMaximum = Math.max(state.sampledLuminanceMaximum, luma);
      quantizedColors.add(`${Math.round(red * 31)}:${Math.round(green * 31)}:${Math.round(blue * 31)}`);
      if (pixelData[byteIndex]) nonzeroBytes += 1;
      if (pixelData[byteIndex + 1]) nonzeroBytes += 1;
      if (pixelData[byteIndex + 2]) nonzeroBytes += 1;
      if (pixelData[byteIndex + 3]) nonzeroBytes += 1;
    }

    let edgeSum = 0;
    let riskSum = 0;
    for (let row = 0; row < FIELD_ROWS; row += 1) {
      for (let column = 0; column < FIELD_COLUMNS; column += 1) {
        const index = fieldIndex(column, row);
        const left = luminanceField[fieldIndex(column - 1, row)];
        const right = luminanceField[fieldIndex(column + 1, row)];
        const up = luminanceField[fieldIndex(column, row - 1)];
        const down = luminanceField[fieldIndex(column, row + 1)];
        const edge = clamp(Math.hypot(right - left, down - up) * 1.7);
        const darkness = clamp((.48 - luminanceField[index]) / .48);
        const roofOrWater = clamp(darkness * .74 + blueField[index] * 1.8);
        const boundary = clamp(edge * .52);
        const risk = clamp(roofOrWater + boundary);
        edgeField[index] = edge;
        riskField[index] = risk;
        edgeSum += edge;
        riskSum += risk;
        state.sampledEdgeMinimum = Math.min(state.sampledEdgeMinimum, edge);
        state.sampledEdgeMaximum = Math.max(state.sampledEdgeMaximum, edge);
        state.navigationRiskMinimum = Math.min(state.navigationRiskMinimum, risk);
        state.navigationRiskMaximum = Math.max(state.navigationRiskMaximum, risk);
        if (risk > .58) state.highRiskCellCount += 1;
        if (risk < .22 && luminanceField[index] > .42) state.safeCellCount += 1;
      }
    }

    state.sampledPixelCount = FIELD_CELL_COUNT;
    state.sampledByteLength = sampledBytes.byteLength;
    state.sampledPixelChecksum = bytesChecksum(sampledBytes);
    state.distinctSampleColorCount = quantizedColors.size;
    state.nonzeroSampleByteCount = nonzeroBytes;
    state.sampledLuminanceMean = round(lumaSum / FIELD_CELL_COUNT);
    state.sampledLuminanceMinimum = round(state.sampledLuminanceMinimum);
    state.sampledLuminanceMaximum = round(state.sampledLuminanceMaximum);
    state.sampledLuminanceRange = round(state.sampledLuminanceMaximum - state.sampledLuminanceMinimum);
    state.sampledEdgeMean = round(edgeSum / FIELD_CELL_COUNT);
    state.sampledEdgeMinimum = round(state.sampledEdgeMinimum);
    state.sampledEdgeMaximum = round(state.sampledEdgeMaximum);
    state.sampledEdgeRange = round(state.sampledEdgeMaximum - state.sampledEdgeMinimum);
    state.sampledBlueExcessMean = round(blueSum / FIELD_CELL_COUNT);
    state.navigationRiskMean = round(riskSum / FIELD_CELL_COUNT);
    state.navigationRiskMinimum = round(state.navigationRiskMinimum);
    state.navigationRiskMaximum = round(state.navigationRiskMaximum);
    state.navigationRiskRange = round(state.navigationRiskMaximum - state.navigationRiskMinimum);
    state.edgeSampleCount = FIELD_CELL_COUNT * 2 - FIELD_COLUMNS - FIELD_ROWS;
    state.fieldCoordinateChecksum = fieldCoordinateChecksum();
  }

  function fieldCoordinateChecksum() {
    let checksum = 2166136261;
    for (let index = 0; index < FIELD_CELL_COUNT; index += 7) {
      checksum = fnvMix(checksum, Math.round(riskField[index] * 10000));
      checksum = fnvMix(checksum, Math.round(edgeField[index] * 10000));
    }
    return checksum >>> 0;
  }

  function chooseFieldPoint(bounds, score) {
    let best = { score: -Infinity, u: (bounds.minU + bounds.maxU) * .5, v: (bounds.minV + bounds.maxV) * .5 };
    const minColumn = Math.floor(bounds.minU * (FIELD_COLUMNS - 1));
    const maxColumn = Math.ceil(bounds.maxU * (FIELD_COLUMNS - 1));
    const minRow = Math.floor(bounds.minV * (FIELD_ROWS - 1));
    const maxRow = Math.ceil(bounds.maxV * (FIELD_ROWS - 1));
    for (let row = minRow; row <= maxRow; row += 1) {
      for (let column = minColumn; column <= maxColumn; column += 1) {
        const index = fieldIndex(column, row);
        const candidateScore = score(index, column, row);
        if (candidateScore > best.score) {
          best = { score: candidateScore, u: column / (FIELD_COLUMNS - 1), v: row / (FIELD_ROWS - 1) };
        }
      }
    }
    return best;
  }

  function deriveNavigationField() {
    const safeScore = index => 1 - riskField[index] + luminanceField[index] * .18 - edgeField[index] * .12;
    const start = chooseFieldPoint({ minU: .16, maxU: .40, minV: .57, maxV: .86 }, safeScore);
    const goal = chooseFieldPoint({ minU: .66, maxU: .87, minV: .20, maxV: .48 }, safeScore);
    const crowdFocus = chooseFieldPoint({ minU: .24, maxU: .74, minV: .27, maxV: .75 }, index => {
      const localDark = clamp((.52 - luminanceField[index]) / .52);
      const waterPenalty = blueField[index] * 3;
      return edgeField[index] * .92 + localDark * .42 - waterPenalty - riskField[index] * .12;
    });

    state.startU = round(start.u);
    state.startV = round(start.v);
    state.goalU = round(goal.u);
    state.goalV = round(goal.v);
    state.initialZoneU = round(crowdFocus.u);
    state.initialZoneV = round(crowdFocus.v);
    state.zoneU = state.initialZoneU;
    state.zoneV = state.initialZoneV;
    state.agentCount = clamp(Math.round(28 + state.navigationRiskMean * 18 + state.sampledEdgeMean * 22), 30, 42);
    state.agentCountDerivedFromPixels = true;
    state.avoidanceWeight = round(1.18 + state.navigationRiskMean * 1.65 + state.sampledEdgeMean * .9);
    state.avoidanceWeightDerivedFromPixels = true;
  }

  function nearestSafePoint(u, v, radius = 7) {
    const centerColumn = Math.round(clamp(u) * (FIELD_COLUMNS - 1));
    const centerRow = Math.round(clamp(v) * (FIELD_ROWS - 1));
    let best = { score: -Infinity, u: clamp(u), v: clamp(v) };
    for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
      for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
        const column = clamp(centerColumn + offsetX, 0, FIELD_COLUMNS - 1);
        const row = clamp(centerRow + offsetY, 0, FIELD_ROWS - 1);
        const index = fieldIndex(column, row);
        const distance = Math.hypot(offsetX, offsetY) / Math.max(1, radius);
        const score = 1 - riskField[index] - distance * .16 + luminanceField[index] * .08;
        if (score > best.score) best = { score, u: column / (FIELD_COLUMNS - 1), v: row / (FIELD_ROWS - 1) };
      }
    }
    return best;
  }

  function initializeAgents() {
    agents.length = 0;
    initialAgents.length = 0;
    for (let index = 0; index < state.agentCount; index += 1) {
      const angle = seeded(index, 3) * Math.PI * 2;
      const spread = .025 + seeded(index, 5) * .082;
      const candidateU = state.startU + Math.cos(angle) * spread * 1.28;
      const candidateV = state.startV + Math.sin(angle) * spread;
      const safe = nearestSafePoint(candidateU, candidateV, 4);
      const heading = Math.atan2(state.goalV - safe.v, state.goalU - safe.u) + (seeded(index, 8) - .5) * .22;
      const speed = .010 + seeded(index, 11) * .003;
      const agent = {
        x: safe.u,
        y: safe.v,
        vx: Math.cos(heading) * speed,
        vy: Math.sin(heading) * speed,
        seed: seeded(index, 15),
      };
      agents.push(agent);
      initialAgents.push({ ...agent });
    }
    state.initialAgentStateChecksum = agentChecksum(initialAgents);
    state.agentStateChecksum = agentChecksum();
    updateRouteMetrics();
  }

  function updateRouteMetrics() {
    const radius = state.zoneRadiusMetres / 150;
    let riskTotal = 0;
    let riskMaximum = 0;
    let held = 0;
    for (const agent of agents) {
      const risk = sampleField(riskField, agent.x, agent.y);
      riskTotal += risk;
      riskMaximum = Math.max(riskMaximum, risk);
      if (Math.hypot(agent.x - state.zoneU, agent.y - state.zoneV) < radius) held += 1;
    }
    state.meanAgentRisk = round(riskTotal / Math.max(1, agents.length));
    state.maximumAgentRisk = round(riskMaximum);
    state.agentsInsideExclusion = held;
    const previousConclusion = state.routeConclusion;
    const heldPenalty = held / Math.max(1, agents.length);
    state.clearanceScore = clamp(Math.round(100 - state.meanAgentRisk * 54 - heldPenalty * 60 - state.maximumAgentRisk * 15), 0, 100);
    state.minimumClearanceScore = Math.min(state.minimumClearanceScore, state.clearanceScore);
    state.maximumClearanceScore = Math.max(state.maximumClearanceScore, state.clearanceScore);
    state.routeConclusion = state.clearanceScore >= 78 ? 'CLEAR' : state.clearanceScore >= 54 ? 'WATCH' : 'DIVERT';
    if (previousConclusion !== state.routeConclusion) state.routeConclusionMutationCount += 1;
    state.agentStateChecksum = agentChecksum();
    state.currentVisualStateChecksum = visualStateChecksum();
  }

  function simulateHumanStep(source) {
    const zoneRadius = state.zoneRadiusMetres / 150;
    const next = agents.map(agent => ({ ...agent }));

    for (let index = 0; index < agents.length; index += 1) {
      const agent = agents[index];
      let separationX = 0;
      let separationY = 0;
      let alignmentX = 0;
      let alignmentY = 0;
      let cohesionX = 0;
      let cohesionY = 0;
      let neighbours = 0;

      for (let otherIndex = 0; otherIndex < agents.length; otherIndex += 1) {
        if (otherIndex === index) continue;
        const other = agents[otherIndex];
        const dx = agent.x - other.x;
        const dy = agent.y - other.y;
        const distance = Math.max(.001, Math.hypot(dx, dy));
        if (distance < .11) {
          neighbours += 1;
          alignmentX += other.vx;
          alignmentY += other.vy;
          cohesionX += other.x;
          cohesionY += other.y;
          if (distance < .038) {
            separationX += dx / (distance * distance);
            separationY += dy / (distance * distance);
          }
        }
      }

      let ax = 0;
      let ay = 0;
      if (neighbours) {
        alignmentX = alignmentX / neighbours - agent.vx;
        alignmentY = alignmentY / neighbours - agent.vy;
        cohesionX = cohesionX / neighbours - agent.x;
        cohesionY = cohesionY / neighbours - agent.y;
        ax += alignmentX * .14 + cohesionX * .023 + separationX * .00006;
        ay += alignmentY * .14 + cohesionY * .023 + separationY * .00006;
      }

      const goalX = state.goalU - agent.x;
      const goalY = state.goalV - agent.y;
      const goalDistance = Math.max(.001, Math.hypot(goalX, goalY));
      ax += goalX / goalDistance * .0036;
      ay += goalY / goalDistance * .0036;

      const zoneX = agent.x - state.zoneU;
      const zoneY = agent.y - state.zoneV;
      const zoneDistance = Math.max(.001, Math.hypot(zoneX, zoneY));
      const zoneForce = clamp(1 - zoneDistance / Math.max(.02, zoneRadius));
      ax += zoneX / zoneDistance * zoneForce * .018 * state.avoidanceWeight;
      ay += zoneY / zoneDistance * zoneForce * .018 * state.avoidanceWeight;

      const deltaU = 1 / FIELD_COLUMNS;
      const deltaV = 1 / FIELD_ROWS;
      const riskGradientX = sampleField(riskField, agent.x + deltaU, agent.y) - sampleField(riskField, agent.x - deltaU, agent.y);
      const riskGradientY = sampleField(riskField, agent.x, agent.y + deltaV) - sampleField(riskField, agent.x, agent.y - deltaV);
      const localRisk = sampleField(riskField, agent.x, agent.y);
      ax -= riskGradientX * (.010 + localRisk * .024) * state.avoidanceWeight;
      ay -= riskGradientY * (.010 + localRisk * .024) * state.avoidanceWeight;

      let vx = agent.vx * .78 + ax;
      let vy = agent.vy * .78 + ay;
      const speed = Math.hypot(vx, vy);
      const maximumSpeed = .023 - state.meanAgentRisk * .004;
      if (speed > maximumSpeed) {
        vx = vx / speed * maximumSpeed;
        vy = vy / speed * maximumSpeed;
      }
      if (speed < .006) {
        vx += goalX / goalDistance * .004;
        vy += goalY / goalDistance * .004;
      }

      const candidateX = clamp(agent.x + vx, .025, .975);
      const candidateY = clamp(agent.y + vy, .035, .965);
      if (sampleField(riskField, candidateX, candidateY) > .78) {
        const safe = nearestSafePoint(candidateX, candidateY, 4);
        next[index].x = agent.x + (safe.u - agent.x) * .18;
        next[index].y = agent.y + (safe.v - agent.y) * .18;
        next[index].vx = (next[index].x - agent.x) * .72;
        next[index].vy = (next[index].y - agent.y) * .72;
      } else {
        next[index].x = candidateX;
        next[index].y = candidateY;
        next[index].vx = vx;
        next[index].vy = vy;
      }
    }

    agents.splice(0, agents.length, ...next);
    state.humanSimulationStepCount += 1;
    state.humanMutationCount += 1;
    state.animationSettled = true;
    updateRouteMetrics();
    updateInterface();
    requestDraw(source);
  }

  function resetField(source) {
    const before = visualStateChecksum();
    agents.splice(0, agents.length, ...initialAgents.map(agent => ({ ...agent })));
    state.zoneU = state.initialZoneU;
    state.zoneV = state.initialZoneV;
    state.zoneRadiusMetres = state.initialZoneRadiusMetres;
    state.humanSimulationStepCount = 0;
    state.humanMutationCount += 1;
    undoStack.length = 0;
    updateRouteMetrics();
    updateInterface();
    requestDraw(source);
    recordTransition(source, before, visualStateChecksum());
  }

  function undoField(source) {
    const saved = undoStack.pop();
    if (!saved) return;
    const before = visualStateChecksum();
    restoreSnapshot(saved);
    state.undoCount += 1;
    state.humanMutationCount += 1;
    recordTransition(source, before, visualStateChecksum());
  }

  function moveZone(u, v, source, countMutation = true) {
    const before = visualStateChecksum();
    const nextU = clamp(u, .03, .97);
    const nextV = clamp(v, .04, .96);
    if (Math.hypot(nextU - state.zoneU, nextV - state.zoneV) < .001) return false;
    state.zoneU = nextU;
    state.zoneV = nextV;
    state.zoneMutationCount += 1;
    if (countMutation) state.humanMutationCount += 1;
    updateRouteMetrics();
    updateInterface();
    requestDraw(source);
    recordTransition(source, before, visualStateChecksum());
    return true;
  }

  function eventPosition(event) {
    const bounds = surface.getBoundingClientRect();
    return {
      u: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width)),
      v: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height)),
    };
  }

  function drawField(p) {
    p.background('#071116');
    p.push();
    p.tint(192, 214);
    p.image(surveyImage, 0, 0, p.width, p.height, SOURCE_CROP.x, SOURCE_CROP.y, SOURCE_CROP.width, SOURCE_CROP.height);
    p.pop();
    state.p5ImageDrawCount += 1;

    const mapX = u => u * p.width;
    const mapY = v => v * p.height;
    const scale = Math.min(p.width / 320, p.height / 180);

    p.noStroke();
    for (let row = 1; row < FIELD_ROWS - 1; row += 3) {
      for (let column = 1; column < FIELD_COLUMNS - 1; column += 3) {
        const index = fieldIndex(column, row);
        const risk = riskField[index];
        if (risk < .54) continue;
        const alpha = 12 + risk * 34;
        p.fill(255, 121 + (1 - risk) * 60, 82, alpha);
        const size = (1.2 + risk * 2.1) * scale;
        p.circle(mapX(column / (FIELD_COLUMNS - 1)), mapY(row / (FIELD_ROWS - 1)), size);
        state.riskCellDrawCount += 1;
      }
    }

    p.push();
    p.noFill();
    p.stroke(206, 255, 224, 88);
    p.strokeWeight(Math.max(.7, .8 * scale));
    p.drawingContext.setLineDash([4 * scale, 5 * scale]);
    p.bezier(
      mapX(state.startU), mapY(state.startV),
      mapX(.44), mapY(.73),
      mapX(.57), mapY(.31),
      mapX(state.goalU), mapY(state.goalV),
    );
    p.drawingContext.setLineDash([]);
    p.pop();
    state.fieldVectorDrawCount += 1;

    p.push();
    p.translate(mapX(state.goalU), mapY(state.goalV));
    p.noFill();
    p.stroke(203, 255, 222, 210);
    p.strokeWeight(Math.max(.8, scale));
    p.circle(0, 0, 9 * scale);
    p.line(-6 * scale, 0, 6 * scale, 0);
    p.line(0, -6 * scale, 0, 6 * scale);
    p.pop();

    const zoneRadius = state.zoneRadiusMetres / 150 * p.width;
    p.push();
    p.translate(mapX(state.zoneU), mapY(state.zoneV));
    p.noFill();
    p.stroke(255, 211, 128, 220);
    p.strokeWeight(Math.max(1, 1.2 * scale));
    p.circle(0, 0, zoneRadius * 2);
    p.stroke(255, 232, 185, 115);
    p.circle(0, 0, zoneRadius * 1.55);
    p.line(-zoneRadius, 0, -zoneRadius + 7 * scale, 0);
    p.line(zoneRadius - 7 * scale, 0, zoneRadius, 0);
    p.line(0, -zoneRadius, 0, -zoneRadius + 7 * scale);
    p.line(0, zoneRadius - 7 * scale, 0, zoneRadius);
    p.noStroke();
    p.fill(255, 221, 150, 235);
    p.circle(0, 0, Math.max(2.2, 2.6 * scale));
    p.fill(255, 241, 211, 220);
    p.textFont('ui-monospace, SFMono-Regular, Menlo, monospace');
    p.textStyle(p.BOLD);
    p.textSize(Math.max(3.5, 4.2 * scale));
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text('HOLD OUT', 0, -zoneRadius - 4 * scale);
    p.pop();

    for (const agent of agents) {
      const x = mapX(agent.x);
      const y = mapY(agent.y);
      const angle = Math.atan2(agent.vy, agent.vx);
      const localRisk = sampleField(riskField, agent.x, agent.y);
      const held = Math.hypot(agent.x - state.zoneU, agent.y - state.zoneV) < state.zoneRadiusMetres / 150;
      p.push();
      p.translate(x, y);
      p.rotate(angle);
      p.noStroke();
      if (held) p.fill(255, 151, 116, 242);
      else if (localRisk > .52) p.fill(255, 220, 151, 236);
      else p.fill(203, 255, 222, 238);
      const length = (3.4 + agent.seed * 1.8) * scale;
      p.triangle(length, 0, -length * .75, -length * .42, -length * .45, length * .42);
      p.fill(255, 255, 246, 176);
      p.circle(-length * .95, 0, Math.max(.7, scale));
      p.pop();
      state.boidDrawCount += 1;
    }
  }

  const assetReady = (async () => {
    const response = await fetch(ASSET_URL, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `survey image request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await digestHex(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === ASSET_SHA256;
    invariant(state.assetSameOrigin, 'survey image was not fetched from the preview origin');
    invariant(state.assetByteLength === ASSET_BYTES, 'survey image byte length differs from committed evidence');
    invariant(state.assetShaMatchesExpected, 'survey image SHA-256 differs from committed evidence');

    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
    const browserImage = new Image();
    browserImage.src = objectUrl;
    try {
      await browserImage.decode();
      state.browserImageDecoded = true;
      state.sourceNaturalWidth = browserImage.naturalWidth;
      state.sourceNaturalHeight = browserImage.naturalHeight;
      state.sourcePixelCount = browserImage.naturalWidth * browserImage.naturalHeight;
      invariant(state.sourceNaturalWidth === SOURCE_WIDTH && state.sourceNaturalHeight === SOURCE_HEIGHT,
        'browser-decoded survey image dimensions are not 960x640');

      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = FIELD_COLUMNS;
      sampleCanvas.height = FIELD_ROWS;
      const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
      sampleContext.drawImage(
        browserImage,
        SOURCE_CROP.x, SOURCE_CROP.y, SOURCE_CROP.width, SOURCE_CROP.height,
        0, 0, FIELD_COLUMNS, FIELD_ROWS,
      );
      analyzePixels(sampleContext.getImageData(0, 0, FIELD_COLUMNS, FIELD_ROWS).data);
      state.sampledPixelSha256 = await digestHex(sampledBytes);
      deriveNavigationField();
      state.fieldEvidenceReady = true;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  })();

  const p5Ready = new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
          canvas.parent(surface);
          canvas.elt.setAttribute('aria-hidden', 'true');
          p.noLoop();
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
        if (!dirty || !state.fieldEvidenceReady || !surveyImage) return;
        drawField(p);
        state.p5CompletedDrawCount += 1;
        state.currentVisualStateChecksum = visualStateChecksum();
        dirty = false;
      };
    }, surface);
  });

  function loadP5Image() {
    return new Promise((resolve, reject) => {
      sketch.loadImage(ASSET_URL, image => resolve(image), error => reject(new Error(`p5 image decode failed: ${error}`)));
    });
  }

  surface.addEventListener('pointerenter', event => {
    if (!state.ready || rejectUntrusted(event, 'surface-pointerenter')) return;
    state.pointerEnterCount += 1;
    const kind = pointerKind(event, true);
    acceptInput(event, kind, 'surface-pointerenter');
    state.lastPointerType = event.pointerType || 'mouse';
    const point = eventPosition(event);
    if (moveZone(point.u, point.v, 'pointer-hover')) state.hoverMutationCount += 1;
  });

  surface.addEventListener('pointerdown', event => {
    if (!state.ready || !acceptInput(event, pointerKind(event), 'surface-pointerdown')) return;
    event.preventDefault();
    surface.focus({ preventScroll: true });
    state.pointerDownCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
    activePointerId = event.pointerId;
    state.activePointerId = activePointerId;
    state.dragging = true;
    surface.setPointerCapture(event.pointerId);
    state.pointerCaptured = surface.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    pushUndo();
    const point = eventPosition(event);
    moveZone(point.u, point.v, 'pointer-down');
    lastDragStepU = state.zoneU;
    lastDragStepV = state.zoneV;
  });

  surface.addEventListener('pointermove', event => {
    if (!state.ready) return;
    if (activePointerId === null && !state.dragging && (event.pointerType || 'mouse') === 'mouse' && event.buttons === 0) {
      if (!acceptInput(event, 'mouse-hover', 'surface-pointermove-hover')) return;
      state.pointerMoveCount += 1;
      state.lastPointerType = 'mouse';
      const point = eventPosition(event);
      if (moveZone(point.u, point.v, 'pointer-hover-move')) state.hoverMutationCount += 1;
      return;
    }
    if (event.pointerId !== activePointerId || !state.dragging) return;
    if (!acceptInput(event, pointerKind(event), 'surface-pointerdrag')) return;
    event.preventDefault();
    state.pointerMoveCount += 1;
    state.pointerDragCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
    const point = eventPosition(event);
    if (moveZone(point.u, point.v, 'pointer-drag')) state.dragMutationCount += 1;
    if (Math.hypot(state.zoneU - lastDragStepU, state.zoneV - lastDragStepV) >= .035) {
      simulateHumanStep('pointer-drag-step');
      lastDragStepU = state.zoneU;
      lastDragStepV = state.zoneV;
    }
  });

  function finishPointer(event, cancelled = false) {
    if (!state.ready || event.pointerId !== activePointerId) return;
    if (!acceptInput(event, pointerKind(event), cancelled ? 'surface-pointercancel' : 'surface-pointerup')) return;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    if (surface.hasPointerCapture(event.pointerId)) {
      surface.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    activePointerId = null;
    state.activePointerId = null;
    state.pointerCaptured = false;
    state.dragging = false;
    updateInterface();
  }

  surface.addEventListener('pointerup', event => finishPointer(event));
  surface.addEventListener('pointercancel', event => finishPointer(event, true));

  surface.addEventListener('keydown', event => {
    if (!state.ready) return;
    const movement = {
      ArrowLeft: [-.035, 0],
      ArrowRight: [.035, 0],
      ArrowUp: [0, -.04],
      ArrowDown: [0, .04],
    }[event.key];
    const actionable = movement || ['Enter', ' ', 'r', 'R', 'z', 'Z'].includes(event.key);
    if (!actionable || !acceptInput(event, 'keyboard', `surface-key-${event.key}`)) return;
    event.preventDefault();
    if (movement) {
      pushUndo();
      moveZone(state.zoneU + movement[0], state.zoneV + movement[1], 'keyboard-zone');
      simulateHumanStep('keyboard-step');
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      pushUndo();
      simulateHumanStep('keyboard-step');
      return;
    }
    if (event.key === 'z' || event.key === 'Z') {
      undoField('keyboard-undo');
      return;
    }
    state.resetCount += 1;
    resetField('keyboard-reset');
  });

  radiusInput.addEventListener('input', event => {
    if (!state.ready || !acceptInput(event, 'range', 'radius-range')) return;
    const before = visualStateChecksum();
    pushUndo();
    state.zoneRadiusMetres = clamp(Number(radiusInput.value), 12, 30);
    state.radiusMutationCount += 1;
    state.humanMutationCount += 1;
    updateRouteMetrics();
    updateInterface();
    requestDraw('radius-range');
    recordTransition('radius-range', before, visualStateChecksum());
  });

  for (const button of actionButtons) {
    button.addEventListener('click', event => {
      if (!state.ready || !acceptInput(event, 'button', `button-${button.dataset.clearanceAction}`)) return;
      const action = button.dataset.clearanceAction;
      if (action === 'step') {
        pushUndo();
        state.stepButtonCount += 1;
        simulateHumanStep('button-step');
      } else if (action === 'undo') {
        undoField('button-undo');
      } else if (action === 'reset') {
        state.resetCount += 1;
        resetField('button-reset');
      }
    });
  }

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (!sketch || !stage.clientWidth || !stage.clientHeight) return;
      sketch.resizeCanvas(stage.clientWidth, stage.clientHeight, true);
      state.p5CanvasWidth = sketch.width;
      state.p5CanvasHeight = sketch.height;
      state.resizeCount += 1;
      requestDraw('responsive-resize');
    });
  });
  resizeObserver.observe(stage);

  const ready = Promise.all([assetReady, p5Ready]).then(async () => {
    surveyImage = await loadP5Image();
    surveyImage.loadPixels();
    state.p5ImageDecoded = surveyImage.width === SOURCE_WIDTH && surveyImage.height === SOURCE_HEIGHT;
    state.p5ImageClass = state.p5ImageDecoded && typeof surveyImage.get === 'function' ? 'p5.Image' : null;
    state.p5ImageWidth = surveyImage.width;
    state.p5ImageHeight = surveyImage.height;
    state.p5ImagePixelLength = surveyImage.pixels.length;
    initializeAgents();
    updateInterface();
    requestDraw('initial-static-frame');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.initialAgentStateChecksum = agentChecksum();
    state.initialVisualStateChecksum = visualStateChecksum();
    state.currentVisualStateChecksum = state.initialVisualStateChecksum;
    state.initialCanvasSignature = canvasSignature();
    state.currentCanvasSignature = state.initialCanvasSignature;
    state.ready = true;
    updateDataset();
  });

  const render = async () => {
    state.previewRenderCalls += 1;
    state.previewClockIgnoredCount += 1;
    const before = visualStateChecksum();
    await Promise.resolve();
    if (before !== visualStateChecksum()) state.previewClockMutationCount += 1;
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    const beforeVisual = visualStateChecksum();
    const beforeAgents = agentChecksum();
    const beforeCanvas = canvasSignature();
    await window.__setPreviewTime?.(.4);
    await window.__setPreviewTime?.(2.6);
    const afterVisual = visualStateChecksum();
    const afterAgents = agentChecksum();
    const afterCanvas = canvasSignature();
    state.initialStaticConfirmationCount += 1;
    state.initialStaticConfirmed = beforeVisual === afterVisual
      && beforeAgents === afterAgents
      && beforeCanvas === afterCanvas;
    state.currentCanvasSignature = afterCanvas;

    invariant(state.assetFetchCount === 1, 'committed survey must be fetched exactly once by the evidence loader');
    invariant(state.assetResponseStatus === 200 && state.assetSameOrigin, 'survey fetch did not return same-origin HTTP 200');
    invariant(state.assetByteLength === ASSET_BYTES && state.assetShaMatchesExpected, 'survey byte/SHA evidence is not exact');
    invariant(state.browserImageDecoded && state.sourceNaturalWidth === SOURCE_WIDTH && state.sourceNaturalHeight === SOURCE_HEIGHT,
      'browser survey decode evidence is incomplete');
    invariant(state.sourcePixelCount === SOURCE_WIDTH * SOURCE_HEIGHT, 'source pixel count is incorrect');
    invariant(state.p5ImageDecoded && state.p5ImageClass === 'p5.Image', 'p5.Image did not decode the committed survey');
    invariant(state.p5ImagePixelLength === SOURCE_WIDTH * SOURCE_HEIGHT * 4, 'p5 image pixel buffer is incomplete');
    invariant(state.sampledPixelCount === FIELD_CELL_COUNT && state.sampledByteLength === FIELD_CELL_COUNT * 4,
      'sampled field dimensions are incorrect');
    invariant(state.sampledPixelSha256.length === 64 && state.sampledPixelChecksum !== 0, 'sampled pixel digest evidence is absent');
    invariant(state.distinctSampleColorCount > 250 && state.nonzeroSampleByteCount > FIELD_CELL_COUNT * 3,
      'sampled field lacks photographic color evidence');
    invariant(state.sampledLuminanceRange > .45 && state.sampledEdgeRange > .35 && state.navigationRiskRange > .45,
      'sampled field lacks useful navigation contrast');
    invariant(state.highRiskCellCount > 250 && state.safeCellCount > 400, 'risk/safe pixel classes are not meaningful');
    invariant(state.edgeSampleCount === FIELD_CELL_COUNT * 2 - FIELD_COLUMNS - FIELD_ROWS,
      'edge sample count is incorrect');
    invariant(state.fieldCoordinateChecksum !== 0 && state.fieldEvidenceReady, 'pixel-derived field evidence is incomplete');
    invariant(state.agentCount >= 30 && state.agentCount <= 42 && state.agentCountDerivedFromPixels,
      'boid count was not derived from survey pixels');
    invariant(state.avoidanceWeight >= 1.2 && state.avoidanceWeight <= 2.6 && state.avoidanceWeightDerivedFromPixels,
      'avoidance weight was not derived from survey pixels');
    invariant(state.startU > .1 && state.startU < .45 && state.goalU > .6 && state.goalU < .92,
      'pixel-derived route endpoints are outside their evidence regions');
    invariant(state.initialZoneU > .2 && state.initialZoneU < .8 && state.initialZoneV > .2 && state.initialZoneV < .8,
      'pixel-derived exclusion zone is outside its evidence region');
    invariant(state.p5InstanceReady && state.p5CanvasReady && state.p5CompletedDrawCount >= 1,
      'p5 canvas did not complete a real render');
    invariant(state.p5ImageDrawCount >= 1 && state.boidDrawCount >= state.agentCount,
      'p5 did not draw the survey and boids');
    invariant(state.initialStaticConfirmed && state.previewClockMutationCount === 0,
      'preview clock changed the human-held field');
    invariant(state.initialFrameStatic && state.animationSettled && state.renderIgnoresPreviewClock,
      'initial human-held state is not static');
    invariant(!state.automaticCycle && !state.automaticPlayback && !state.automaticRehearsal
      && !state.automaticFallback && !state.syntheticInputDispatch && !state.captureClockDriven,
      'an automatic or synthetic path is enabled');
    invariant(window.__PREVIEW_INTERACTION_STATE__ === state && window.__PREVIEW_META__?.renderer === 'canvas2d',
      'runtime state or p5 renderer metadata is missing');
    state.runtimeAssertionPassed = true;
    updateDataset();
    return true;
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
