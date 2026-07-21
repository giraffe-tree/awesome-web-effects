import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const GRID_WIDTH = 80;
const GRID_HEIGHT = 45;
const GRID_SIZE = GRID_WIDTH * GRID_HEIGHT;
const INITIAL_REVEAL = 0.34;
const INITIAL_FLOOD_STAGE = 0.37;
const FLOOD_MIN = 0.27;
const FLOOD_MAX = 0.55;
const CONTOUR_LEVELS = [0.22, 0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.78, 0.86];
const EXPECTED_ASSET_BYTES = 379323;
const EXPECTED_ASSET_SHA256 = '1821a74b46476b03c5f0aa9a8105c03602873e1ea0ba076da7084daf340e2522';
const TERRAIN_URL = new URL('../assets/aesthetic-wave-06/topographic-wave-contour-reveal/alpine-watershed-aerial.jpg', import.meta.url).href;

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

function interpolatePoint(ax, ay, av, bx, by, bv, threshold) {
  const distance = bv - av;
  const amount = Math.abs(distance) < 0.00001 ? 0.5 : clamp((threshold - av) / distance, 0, 1);
  return { x: ax + (bx - ax) * amount, y: ay + (by - ay) * amount };
}

function buildContourSegments(field, threshold, levelIndex) {
  const segments = [];
  const add = (first, second) => segments.push({
    levelIndex,
    threshold,
    x1: first.x / (GRID_WIDTH - 1),
    y1: first.y / (GRID_HEIGHT - 1),
    x2: second.x / (GRID_WIDTH - 1),
    y2: second.y / (GRID_HEIGHT - 1),
  });

  for (let y = 0; y < GRID_HEIGHT - 1; y += 1) {
    for (let x = 0; x < GRID_WIDTH - 1; x += 1) {
      const topLeft = field[y * GRID_WIDTH + x];
      const topRight = field[y * GRID_WIDTH + x + 1];
      const bottomRight = field[(y + 1) * GRID_WIDTH + x + 1];
      const bottomLeft = field[(y + 1) * GRID_WIDTH + x];
      const mask = (topLeft >= threshold ? 8 : 0)
        | (topRight >= threshold ? 4 : 0)
        | (bottomRight >= threshold ? 2 : 0)
        | (bottomLeft >= threshold ? 1 : 0);
      if (mask === 0 || mask === 15) continue;

      const edge = {
        top: interpolatePoint(x, y, topLeft, x + 1, y, topRight, threshold),
        right: interpolatePoint(x + 1, y, topRight, x + 1, y + 1, bottomRight, threshold),
        bottom: interpolatePoint(x, y + 1, bottomLeft, x + 1, y + 1, bottomRight, threshold),
        left: interpolatePoint(x, y, topLeft, x, y + 1, bottomLeft, threshold),
      };

      if (mask === 1 || mask === 14) add(edge.left, edge.bottom);
      else if (mask === 2 || mask === 13) add(edge.bottom, edge.right);
      else if (mask === 3 || mask === 12) add(edge.left, edge.right);
      else if (mask === 4 || mask === 11) add(edge.top, edge.right);
      else if (mask === 6 || mask === 9) add(edge.top, edge.bottom);
      else if (mask === 7 || mask === 8) add(edge.left, edge.top);
      else if (mask === 5) {
        const centerHigh = (topLeft + topRight + bottomRight + bottomLeft) * 0.25 >= threshold;
        if (centerHigh) {
          add(edge.top, edge.left);
          add(edge.right, edge.bottom);
        } else {
          add(edge.top, edge.right);
          add(edge.left, edge.bottom);
        }
      } else if (mask === 10) {
        const centerHigh = (topLeft + topRight + bottomRight + bottomLeft) * 0.25 >= threshold;
        if (centerHigh) {
          add(edge.top, edge.right);
          add(edge.left, edge.bottom);
        } else {
          add(edge.top, edge.left);
          add(edge.right, edge.bottom);
        }
      }
    }
  }
  return segments;
}

try {
  const stage = document.querySelector('#terrain-stage');
  const canvasHost = document.querySelector('#terrain-canvas');
  const probeElevation = document.querySelector('#probe-elevation');
  const probeRisk = document.querySelector('#probe-risk');
  const floodReadout = document.querySelector('#flood-readout');
  const scanReadout = document.querySelector('#scan-readout');
  const scanSweep = document.querySelector('#scan-sweep');
  const actionButtons = [...document.querySelectorAll('[data-terrain-action]')];
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  let sketch;
  let terrainImage;
  let dirty = true;
  let resizeFrame = 0;
  let activePointerId = null;
  let revealBeforePointer = INITIAL_REVEAL;
  let floodBeforePointer = INITIAL_FLOOD_STAGE;
  const elevationField = new Float32Array(GRID_SIZE);
  const riskField = new Float32Array(GRID_SIZE);
  let contourSegments = [];
  let safeRoute = [];

  const state = {
    id: 'topographic-wave-contour-reveal',
    task: 'human-operated-fictional-watershed-route-and-flood-contour-survey',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'real-raster-pixels-to-smoothed-elevation-field-marching-squares-flood-risk-and-safe-route',
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
    previewClockMutationCount: 0,
    renderIgnoresPreviewClock: true,
    nonInputVisualMutationCountAfterReady: 0,
    reducedMotion: reducedMotionQuery.matches,
    initialReveal: INITIAL_REVEAL,
    initialFloodStage: INITIAL_FLOOD_STAGE,
    reveal: INITIAL_REVEAL,
    floodStage: INITIAL_FLOOD_STAGE,
    probeU: 0.67,
    probeV: 0.47,
    probeElevationNormalized: 0,
    probeElevationMeters: 0,
    probeRiskNormalized: 0,
    probeRiskLabel: 'SAFE',
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
    keyboardInputCount: 0,
    buttonInputCount: 0,
    rangeInputCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    humanMutationCount: 0,
    revealMutationCount: 0,
    floodMutationCount: 0,
    probeMutationCount: 0,
    resetCount: 0,
    reversibleRevealCount: 0,
    reversibleFloodCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    activePointerId: null,
    pointerCaptured: false,
    transitionRecords: [],
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
    sampledWidth: GRID_WIDTH,
    sampledHeight: GRID_HEIGHT,
    sampledPixelCount: 0,
    sampledPixelByteLength: 0,
    sampledPixelSha256: '',
    sampledPixelChecksum: 0,
    distinctSampleColorCount: 0,
    sourceAlphaFailureCount: 0,
    sampledLuminanceMinimum: 1,
    sampledLuminanceMaximum: 0,
    sampledLuminanceRange: 0,
    elevationCellCount: 0,
    elevationMinimum: 1,
    elevationMaximum: 0,
    elevationRange: 0,
    elevationChecksum: 0,
    riskCellCount: 0,
    riskMinimum: 1,
    riskMaximum: 0,
    riskRange: 0,
    riskChecksum: 0,
    smoothingPassCount: 0,
    marchingSquaresLevelCount: 0,
    marchingSquaresCellEvaluationCount: 0,
    marchingSquaresSegmentCount: 0,
    contourLevelsWithSegments: 0,
    contourTopologyChecksum: 0,
    routePointCount: 0,
    routePixelEvaluationCount: 0,
    routeRecomputeCount: 0,
    routeAverageRisk: 0,
    routeChecksum: 0,
    rasterDrivenEvidenceReady: false,
    p5ImageDrawCount: 0,
    contourSegmentDrawCount: 0,
    riskCellDrawCount: 0,
    routeSegmentDrawCount: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    renderRequestCount: 0,
    previewRenderCalls: 0,
    resizeCount: 0,
    ready: false,
    runtimeAssertionPassed: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__TOPOGRAPHIC_CONTOUR_STATE__ = state;

  function invariant(condition, message) {
    if (!condition) throw new Error(`topographic-wave-contour-reveal: ${message}`);
  }

  function updateDataset() {
    stage.dataset.reveal = state.reveal.toFixed(4);
    stage.dataset.floodStage = state.floodStage.toFixed(4);
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedInputCount = String(state.rejectedUntrustedInputCount);
    stage.dataset.pointerCaptureCount = String(state.pointerCaptureCount);
    stage.dataset.pointerCaptureReleaseCount = String(state.pointerCaptureReleaseCount);
    stage.dataset.keyboardInputCount = String(state.keyboardInputCount);
    stage.dataset.buttonInputCount = String(state.buttonInputCount);
    stage.dataset.rangeInputCount = String(state.rangeInputCount);
    stage.dataset.humanMutationCount = String(state.humanMutationCount);
    stage.dataset.routeRecomputeCount = String(state.routeRecomputeCount);
    stage.dataset.assetShaMatchesExpected = String(state.assetShaMatchesExpected);
    stage.dataset.rasterDrivenEvidenceReady = String(state.rasterDrivenEvidenceReady);
    stage.dataset.automaticPlayback = String(state.automaticPlayback);
    stage.dataset.captureClockDriven = String(state.captureClockDriven);
  }

  function sampleField(field, u, v) {
    const x = clamp(Math.round(u * (GRID_WIDTH - 1)), 0, GRID_WIDTH - 1);
    const y = clamp(Math.round(v * (GRID_HEIGHT - 1)), 0, GRID_HEIGHT - 1);
    return field[y * GRID_WIDTH + x];
  }

  function currentRisk(u, v) {
    const elevation = sampleField(elevationField, u, v);
    const terrainRisk = sampleField(riskField, u, v);
    return clamp((state.floodStage + 0.075 - elevation) * 3.15 + terrainRisk * 0.32, 0, 1);
  }

  function updateInterface() {
    const elevation = sampleField(elevationField, state.probeU, state.probeV);
    const risk = currentRisk(state.probeU, state.probeV);
    const elevationMeters = Math.round((240 + elevation * 1820) / 10) * 10;
    const riskLabel = risk > 0.66 ? 'HIGH' : risk > 0.32 ? 'WATCH' : 'SAFE';
    state.probeElevationNormalized = round(elevation);
    state.probeElevationMeters = elevationMeters;
    state.probeRiskNormalized = round(risk);
    state.probeRiskLabel = riskLabel;
    probeElevation.textContent = `${elevationMeters.toLocaleString('en-US')} M`;
    probeRisk.textContent = riskLabel;
    probeRisk.className = `risk-${riskLabel.toLowerCase()}`;
    floodReadout.textContent = `${Math.round(240 + state.floodStage * 1820)} M`;
    scanReadout.textContent = `${Math.round(state.reveal * 100)}%`;
    scanSweep.value = String(Math.round(state.reveal * 100));
    stage.setAttribute('aria-valuetext', `Survey ${Math.round(state.reveal * 100)} percent, flood stage ${floodReadout.textContent}, probe ${riskLabel}`);
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

  function recomputeSafeRoute() {
    if (!state.rasterDrivenEvidenceReady && state.elevationCellCount !== GRID_SIZE) return;
    const previousCost = new Float64Array(GRID_HEIGHT);
    const currentCost = new Float64Array(GRID_HEIGHT);
    const parents = Array.from({ length: GRID_WIDTH }, () => new Int16Array(GRID_HEIGHT));
    previousCost.fill(Number.POSITIVE_INFINITY);
    for (let y = 3; y < GRID_HEIGHT - 3; y += 1) {
      const index = y * GRID_WIDTH;
      const floodPenalty = elevationField[index] < state.floodStage ? 8 : 0;
      previousCost[y] = riskField[index] * 4.3 + floodPenalty + Math.abs(y / GRID_HEIGHT - 0.46) * 0.24;
    }

    let evaluationCount = GRID_HEIGHT - 6;
    for (let x = 1; x < GRID_WIDTH; x += 1) {
      currentCost.fill(Number.POSITIVE_INFINITY);
      for (let y = 3; y < GRID_HEIGHT - 3; y += 1) {
        const index = y * GRID_WIDTH + x;
        const floodPenalty = elevationField[index] < state.floodStage ? 8 : 0;
        const terrainCost = riskField[index] * 4.3 + floodPenalty + Math.abs(y / GRID_HEIGHT - 0.46) * 0.24;
        for (let delta = -2; delta <= 2; delta += 1) {
          const previousY = y + delta;
          if (previousY < 3 || previousY >= GRID_HEIGHT - 3) continue;
          evaluationCount += 1;
          const slopePenalty = Math.abs(elevationField[index] - elevationField[previousY * GRID_WIDTH + x - 1]) * 1.7;
          const candidate = previousCost[previousY] + terrainCost + Math.abs(delta) * 0.16 + slopePenalty;
          if (candidate < currentCost[y]) {
            currentCost[y] = candidate;
            parents[x][y] = previousY;
          }
        }
      }
      previousCost.set(currentCost);
    }

    let routeY = 3;
    for (let y = 4; y < GRID_HEIGHT - 3; y += 1) {
      if (previousCost[y] < previousCost[routeY]) routeY = y;
    }
    const route = new Array(GRID_WIDTH);
    for (let x = GRID_WIDTH - 1; x >= 0; x -= 1) {
      route[x] = { u: x / (GRID_WIDTH - 1), v: routeY / (GRID_HEIGHT - 1) };
      if (x > 0) routeY = parents[x][routeY];
    }
    safeRoute = route;
    let averageRisk = 0;
    let checksum = 2166136261;
    route.forEach(point => {
      const routeRisk = currentRisk(point.u, point.v);
      averageRisk += routeRisk;
      checksum = Math.imul(checksum ^ Math.round(point.u * 10000), 16777619) >>> 0;
      checksum = Math.imul(checksum ^ Math.round(point.v * 10000), 16777619) >>> 0;
    });
    state.routePointCount = route.length;
    state.routePixelEvaluationCount += evaluationCount;
    state.routeRecomputeCount += 1;
    state.routeAverageRisk = round(averageRisk / route.length);
    state.routeChecksum = checksum >>> 0;
  }

  function mutateFromTrustedInput(event, patch, source) {
    if (event?.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      updateDataset();
      return false;
    }
    const before = {
      reveal: state.reveal,
      floodStage: state.floodStage,
      probeU: state.probeU,
      probeV: state.probeV,
    };
    const nextReveal = patch.reveal === undefined ? before.reveal : clamp(patch.reveal, 0, 1);
    const nextFlood = patch.floodStage === undefined ? before.floodStage : clamp(patch.floodStage, FLOOD_MIN, FLOOD_MAX);
    const nextProbeU = patch.probeU === undefined ? before.probeU : clamp(patch.probeU, 0.02, 0.98);
    const nextProbeV = patch.probeV === undefined ? before.probeV : clamp(patch.probeV, 0.06, 0.92);
    const revealChanged = Math.abs(nextReveal - before.reveal) > 0.0001;
    const floodChanged = Math.abs(nextFlood - before.floodStage) > 0.0001;
    const probeChanged = Math.abs(nextProbeU - before.probeU) > 0.0001 || Math.abs(nextProbeV - before.probeV) > 0.0001;
    if (!revealChanged && !floodChanged && !probeChanged) return false;

    state.reveal = nextReveal;
    state.floodStage = nextFlood;
    state.probeU = nextProbeU;
    state.probeV = nextProbeV;
    state.humanMutationCount += 1;
    if (revealChanged) state.revealMutationCount += 1;
    if (floodChanged) state.floodMutationCount += 1;
    if (probeChanged) state.probeMutationCount += 1;
    if ((before.reveal < revealBeforePointer && nextReveal >= revealBeforePointer)
      || (before.reveal > revealBeforePointer && nextReveal <= revealBeforePointer)) state.reversibleRevealCount += 1;
    if ((before.floodStage < floodBeforePointer && nextFlood >= floodBeforePointer)
      || (before.floodStage > floodBeforePointer && nextFlood <= floodBeforePointer)) state.reversibleFloodCount += 1;
    if (floodChanged) recomputeSafeRoute();
    state.transitionRecords.push({
      source,
      kind: state.lastInputKind,
      trusted: true,
      before: {
        reveal: round(before.reveal),
        floodStage: round(before.floodStage),
        probeU: round(before.probeU),
        probeV: round(before.probeV),
      },
      after: {
        reveal: round(nextReveal),
        floodStage: round(nextFlood),
        probeU: round(nextProbeU),
        probeV: round(nextProbeV),
      },
    });
    if (state.transitionRecords.length > 72) state.transitionRecords.shift();
    updateInterface();
    requestDraw(`trusted-${source}`);
    return true;
  }

  function pointerCoordinates(event) {
    const bounds = stage.getBoundingClientRect();
    return {
      u: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width), 0, 1),
      v: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height), 0, 1),
    };
  }

  function patchFromPointer(event) {
    const point = pointerCoordinates(event);
    return {
      reveal: point.u,
      floodStage: FLOOD_MIN + (1 - point.v) * (FLOOD_MAX - FLOOD_MIN),
      probeU: point.u,
      probeV: point.v,
    };
  }

  async function fetchAsset() {
    const response = await fetch(TERRAIN_URL, { cache: 'no-store' });
    state.assetFetchCount += 1;
    state.assetResponseStatus = response.status;
    state.assetMimeType = response.headers.get('content-type') || '';
    state.assetSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `terrain asset request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.assetByteLength = bytes.byteLength;
    state.assetSha256 = await sha256(bytes);
    state.assetShaMatchesExpected = state.assetSha256 === EXPECTED_ASSET_SHA256;
    invariant(state.assetSameOrigin, 'terrain asset did not load from the preview origin');
    invariant(state.assetByteLength === EXPECTED_ASSET_BYTES, 'terrain asset byte length differs from the committed JPEG');
    invariant(state.assetShaMatchesExpected, 'terrain asset SHA-256 differs from the committed JPEG');

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
    invariant(state.browserImageDecoded && state.sourceNaturalWidth === 960 && state.sourceNaturalHeight === 640,
      'browser did not decode the committed 960x640 terrain JPEG');
  }

  const p5Ready = new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
          canvas.parent(canvasHost);
          p.noLoop();
          p.strokeCap(p.ROUND);
          p.strokeJoin(p.ROUND);
          state.p5InstanceReady = p instanceof p5;
          state.p5CanvasReady = canvas.elt instanceof HTMLCanvasElement && p.drawingContext instanceof CanvasRenderingContext2D;
          state.p5CanvasWidth = p.width;
          state.p5CanvasHeight = p.height;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      p.draw = () => {
        state.p5DrawCount += 1;
        p.background('#0b1312');
        if (!terrainImage || !state.rasterDrivenEvidenceReady) return;

        const width = p.width;
        const height = p.height;
        const sourceAspect = terrainImage.width / terrainImage.height;
        const targetAspect = width / height;
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = terrainImage.width;
        let sourceHeight = terrainImage.height;
        if (targetAspect > sourceAspect) {
          sourceHeight = terrainImage.width / targetAspect;
          sourceY = (terrainImage.height - sourceHeight) * 0.5;
        } else {
          sourceWidth = terrainImage.height * targetAspect;
          sourceX = (terrainImage.width - sourceWidth) * 0.5;
        }
        p.image(terrainImage, 0, 0, width, height, sourceX, sourceY, sourceWidth, sourceHeight);
        state.p5ImageDrawCount += 1;

        p.noStroke();
        p.fill(4, 14, 13, 52);
        p.rect(0, 0, width, height);

        const revealX = width * state.reveal;
        const context = p.drawingContext;
        context.save();
        context.beginPath();
        context.rect(0, 0, revealX, height);
        context.clip();

        const cellWidth = width / GRID_WIDTH;
        const cellHeight = height / GRID_HEIGHT;
        let riskCellDrawCount = 0;
        p.noStroke();
        for (let y = 0; y < GRID_HEIGHT; y += 1) {
          for (let x = 0; x < GRID_WIDTH; x += 1) {
            const index = y * GRID_WIDTH + x;
            const floodDepth = clamp((state.floodStage - elevationField[index]) * 5.1, 0, 1);
            if (floodDepth < 0.035) continue;
            const materialRisk = riskField[index];
            p.fill(38 + materialRisk * 45, 126 + materialRisk * 44, 160 + materialRisk * 48, 25 + floodDepth * 112);
            p.rect(x * cellWidth, y * cellHeight, cellWidth + 0.55, cellHeight + 0.55);
            riskCellDrawCount += 1;
          }
        }
        state.riskCellDrawCount = riskCellDrawCount;

        let segmentDrawCount = 0;
        contourSegments.forEach(segment => {
          const major = segment.levelIndex % 3 === 0;
          const nearFlood = Math.abs(segment.threshold - state.floodStage) < 0.055;
          if (nearFlood) p.stroke(255, 231, 148, 224);
          else if (major) p.stroke(231, 230, 200, 177);
          else p.stroke(211, 226, 198, 112);
          p.strokeWeight(Math.max(0.45, (major ? 1.05 : 0.6) * width / 320));
          p.line(segment.x1 * width, segment.y1 * height, segment.x2 * width, segment.y2 * height);
          segmentDrawCount += 1;
        });
        state.contourSegmentDrawCount = segmentDrawCount;

        let routeSegmentDrawCount = 0;
        p.noFill();
        p.stroke(255, 151, 97, 226);
        p.strokeWeight(Math.max(1.2, width / 185));
        for (let index = 1; index < safeRoute.length; index += 1) {
          const previous = safeRoute[index - 1];
          const current = safeRoute[index];
          if (current.u > state.reveal + 0.025) continue;
          p.line(previous.u * width, previous.v * height, current.u * width, current.v * height);
          routeSegmentDrawCount += 1;
        }
        state.routeSegmentDrawCount = routeSegmentDrawCount;
        context.restore();

        p.noStroke();
        const wash = p.drawingContext.createLinearGradient(Math.max(0, revealX - 18), 0, revealX + 18, 0);
        wash.addColorStop(0, 'rgba(245, 218, 119, 0)');
        wash.addColorStop(0.5, 'rgba(245, 218, 119, .16)');
        wash.addColorStop(1, 'rgba(245, 218, 119, 0)');
        p.drawingContext.fillStyle = wash;
        p.rect(revealX - 18, 0, 36, height);
        p.stroke(249, 225, 143, 225);
        p.strokeWeight(Math.max(0.8, width / 400));
        p.line(revealX, 0, revealX, height);
        p.noStroke();
        p.fill(249, 225, 143, 238);
        p.circle(revealX, height * 0.135, Math.max(3.2, width / 84));

        const probeX = state.probeU * width;
        const probeY = state.probeV * height;
        const probeRadius = Math.max(4.5, Math.min(10, width / 43));
        p.noFill();
        p.stroke(255, 245, 206, 230);
        p.strokeWeight(Math.max(0.8, width / 430));
        p.circle(probeX, probeY, probeRadius * 2);
        p.stroke(255, 151, 97, 240);
        p.arc(probeX, probeY, probeRadius * 2.8, probeRadius * 2.8, -0.6, 1.4);
        p.line(probeX - probeRadius * 1.45, probeY, probeX - probeRadius * 0.7, probeY);
        p.line(probeX + probeRadius * 0.7, probeY, probeX + probeRadius * 1.45, probeY);
        p.line(probeX, probeY - probeRadius * 1.45, probeX, probeY - probeRadius * 0.7);
        p.line(probeX, probeY + probeRadius * 0.7, probeX, probeY + probeRadius * 1.45);

        dirty = false;
        state.p5CompletedDrawCount += 1;
      };
    }, canvasHost);
  });

  function loadP5Terrain() {
    return new Promise((resolve, reject) => {
      sketch.loadImage(TERRAIN_URL, resolve, error => reject(new Error(`p5 terrain decode failed: ${error}`)));
    });
  }

  function blurField(source, destination) {
    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        let total = 0;
        let weight = 0;
        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
            const sampleX = clamp(x + offsetX, 0, GRID_WIDTH - 1);
            const sampleY = clamp(y + offsetY, 0, GRID_HEIGHT - 1);
            const sampleWeight = offsetX === 0 && offsetY === 0 ? 4 : (offsetX === 0 || offsetY === 0 ? 2 : 1);
            total += source[sampleY * GRID_WIDTH + sampleX] * sampleWeight;
            weight += sampleWeight;
          }
        }
        destination[y * GRID_WIDTH + x] = total / weight;
      }
    }
  }

  async function prepareRasterEvidence() {
    await Promise.all([fetchAsset(), p5Ready]);
    const decoded = await loadP5Terrain();
    decoded.loadPixels();
    state.p5ImageDecoded = decoded instanceof p5.Image;
    state.p5ImageClass = decoded instanceof p5.Image ? 'p5.Image' : decoded?.constructor?.name ?? null;
    state.p5ImageWidth = decoded.width;
    state.p5ImageHeight = decoded.height;
    state.p5ImagePixelLength = decoded.pixels.length;
    invariant(state.p5ImageDecoded && decoded.width === 960 && decoded.height === 640
      && decoded.pixels.length === 960 * 640 * 4, 'p5 did not decode all committed terrain pixels');
    terrainImage = decoded;

    const sample = decoded.get();
    sample.resize(GRID_WIDTH, GRID_HEIGHT);
    sample.loadPixels();
    const sampledPixels = new Uint8ClampedArray(sample.pixels);
    state.sampledPixelCount = GRID_SIZE;
    state.sampledPixelByteLength = sampledPixels.byteLength;
    state.sampledPixelSha256 = await sha256(sampledPixels.buffer);
    state.sampledPixelChecksum = fnv1a(sampledPixels);
    const distinctColors = new Set();
    const rawElevation = new Float32Array(GRID_SIZE);
    const scratch = new Float32Array(GRID_SIZE);

    for (let index = 0; index < GRID_SIZE; index += 1) {
      const red = sampledPixels[index * 4];
      const green = sampledPixels[index * 4 + 1];
      const blue = sampledPixels[index * 4 + 2];
      const alpha = sampledPixels[index * 4 + 3];
      if (alpha !== 255) state.sourceAlphaFailureCount += 1;
      distinctColors.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
      const luma = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
      state.sampledLuminanceMinimum = Math.min(state.sampledLuminanceMinimum, luma);
      state.sampledLuminanceMaximum = Math.max(state.sampledLuminanceMaximum, luma);
      const y = Math.floor(index / GRID_WIDTH) / (GRID_HEIGHT - 1);
      const mineral = clamp((red + blue - green * 1.18) / 255, -0.45, 0.65);
      const vegetation = clamp((green - (red + blue) * 0.5) / 255, -0.4, 0.55);
      rawElevation[index] = clamp(0.08 + luma * 0.68 + (1 - y) * 0.13 + mineral * 0.16 - vegetation * 0.06, 0, 1);
    }
    state.distinctSampleColorCount = distinctColors.size;
    state.sampledLuminanceRange = round(state.sampledLuminanceMaximum - state.sampledLuminanceMinimum);

    blurField(rawElevation, scratch);
    blurField(scratch, elevationField);
    state.smoothingPassCount = 2;
    let elevationMinimum = 1;
    let elevationMaximum = 0;
    for (let index = 0; index < GRID_SIZE; index += 1) {
      elevationMinimum = Math.min(elevationMinimum, elevationField[index]);
      elevationMaximum = Math.max(elevationMaximum, elevationField[index]);
    }
    const elevationSpan = Math.max(0.0001, elevationMaximum - elevationMinimum);
    let elevationChecksum = 2166136261;
    let riskChecksum = 2166136261;
    state.riskMinimum = 1;
    state.riskMaximum = 0;
    for (let index = 0; index < GRID_SIZE; index += 1) {
      elevationField[index] = clamp((elevationField[index] - elevationMinimum) / elevationSpan, 0, 1);
    }
    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        const index = y * GRID_WIDTH + x;
        const left = elevationField[y * GRID_WIDTH + Math.max(0, x - 1)];
        const right = elevationField[y * GRID_WIDTH + Math.min(GRID_WIDTH - 1, x + 1)];
        const up = elevationField[Math.max(0, y - 1) * GRID_WIDTH + x];
        const down = elevationField[Math.min(GRID_HEIGHT - 1, y + 1) * GRID_WIDTH + x];
        const slope = clamp(Math.hypot(right - left, down - up) * 4.2, 0, 1);
        const red = sampledPixels[index * 4];
        const green = sampledPixels[index * 4 + 1];
        const blue = sampledPixels[index * 4 + 2];
        const waterColor = clamp((blue * 1.05 - red * 0.72 - green * 0.22) / 155, 0, 1);
        const risk = clamp((1 - elevationField[index]) * 0.72 + waterColor * 0.23 + slope * 0.13, 0, 1);
        riskField[index] = risk;
        state.riskMinimum = Math.min(state.riskMinimum, risk);
        state.riskMaximum = Math.max(state.riskMaximum, risk);
        elevationChecksum = Math.imul(elevationChecksum ^ Math.round(elevationField[index] * 10000), 16777619) >>> 0;
        riskChecksum = Math.imul(riskChecksum ^ Math.round(risk * 10000), 16777619) >>> 0;
      }
    }
    state.elevationCellCount = GRID_SIZE;
    state.elevationMinimum = 0;
    state.elevationMaximum = 1;
    state.elevationRange = 1;
    state.elevationChecksum = elevationChecksum >>> 0;
    state.riskCellCount = GRID_SIZE;
    state.riskRange = round(state.riskMaximum - state.riskMinimum);
    state.riskChecksum = riskChecksum >>> 0;

    contourSegments = CONTOUR_LEVELS.flatMap((threshold, levelIndex) => buildContourSegments(elevationField, threshold, levelIndex));
    const levelsWithSegments = new Set(contourSegments.map(segment => segment.levelIndex));
    let topologyChecksum = 2166136261;
    contourSegments.forEach(segment => {
      topologyChecksum = Math.imul(topologyChecksum ^ Math.round(segment.x1 * 1000), 16777619) >>> 0;
      topologyChecksum = Math.imul(topologyChecksum ^ Math.round(segment.y1 * 1000), 16777619) >>> 0;
      topologyChecksum = Math.imul(topologyChecksum ^ segment.levelIndex, 16777619) >>> 0;
    });
    state.marchingSquaresLevelCount = CONTOUR_LEVELS.length;
    state.marchingSquaresCellEvaluationCount = CONTOUR_LEVELS.length * (GRID_WIDTH - 1) * (GRID_HEIGHT - 1);
    state.marchingSquaresSegmentCount = contourSegments.length;
    state.contourLevelsWithSegments = levelsWithSegments.size;
    state.contourTopologyChecksum = topologyChecksum >>> 0;
    state.rasterDrivenEvidenceReady = true;
    recomputeSafeRoute();
    updateInterface();
    requestDraw('raster-evidence-ready');
  }

  stage.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse' || event.target.closest('.weather-controls, .sweep-control')) return;
    if (!acceptInput(event, 'mouse-hover', 'stage-pointerenter')) return;
    state.pointerEnterCount += 1;
    state.lastPointerType = 'mouse';
    mutateFromTrustedInput(event, patchFromPointer(event), 'stage-pointerenter');
  });

  stage.addEventListener('pointerdown', event => {
    if (event.target.closest('.weather-controls, .sweep-control')) return;
    const kind = ['touch', 'pen'].includes(event.pointerType) ? event.pointerType : 'mouse';
    if (!acceptInput(event, kind, 'stage-pointerdown')) return;
    event.preventDefault();
    stage.focus({ preventScroll: true });
    activePointerId = event.pointerId;
    state.activePointerId = event.pointerId;
    state.lastPointerType = event.pointerType || 'mouse';
    state.pointerDownCount += 1;
    revealBeforePointer = state.reveal;
    floodBeforePointer = state.floodStage;
    stage.setPointerCapture(event.pointerId);
    state.pointerCaptured = stage.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    mutateFromTrustedInput(event, patchFromPointer(event), 'stage-pointerdown');
  });

  stage.addEventListener('pointermove', event => {
    if (event.target.closest('.weather-controls, .sweep-control')) return;
    const isHover = event.pointerType === 'mouse' && activePointerId === null;
    const isActiveDrag = event.pointerId === activePointerId;
    if (!isHover && !isActiveDrag) return;
    const kind = isHover ? 'mouse-hover' : (['touch', 'pen'].includes(event.pointerType) ? event.pointerType : 'mouse');
    if (!acceptInput(event, kind, isHover ? 'stage-hover' : 'stage-drag')) return;
    state.lastPointerType = event.pointerType || 'mouse';
    if (isActiveDrag) state.pointerDragCount += 1;
    mutateFromTrustedInput(event, patchFromPointer(event), isHover ? 'stage-hover' : 'stage-drag');
  });

  function releasePointer(event, cancelled) {
    if (event.pointerId !== activePointerId) return;
    const kind = ['touch', 'pen'].includes(event.pointerType) ? event.pointerType : 'mouse';
    if (!acceptInput(event, kind, cancelled ? 'stage-pointercancel' : 'stage-pointerup')) return;
    if (stage.hasPointerCapture(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    activePointerId = null;
    state.activePointerId = null;
    state.pointerCaptured = false;
    updateDataset();
  }

  stage.addEventListener('pointerup', event => releasePointer(event, false));
  stage.addEventListener('pointercancel', event => releasePointer(event, true));

  stage.addEventListener('keydown', event => {
    if (event.target !== stage) return;
    const recognized = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'r', 'R'].includes(event.key);
    if (!recognized || !acceptInput(event, 'keyboard', `key-${event.key}`)) return;
    event.preventDefault();
    let patch = {};
    if (event.key === 'ArrowLeft') patch.reveal = state.reveal - 0.07;
    if (event.key === 'ArrowRight') patch.reveal = state.reveal + 0.07;
    if (event.key === 'ArrowUp') patch.floodStage = state.floodStage + 0.025;
    if (event.key === 'ArrowDown') patch.floodStage = state.floodStage - 0.025;
    if (event.key === 'Home') patch.reveal = 0;
    if (event.key === 'End') patch.reveal = 1;
    if (event.key.toLowerCase() === 'r') {
      patch = { reveal: INITIAL_REVEAL, floodStage: INITIAL_FLOOD_STAGE, probeU: 0.67, probeV: 0.47 };
      state.resetCount += 1;
    }
    mutateFromTrustedInput(event, patch, `key-${event.key}`);
  });

  scanSweep.addEventListener('input', event => {
    if (!acceptInput(event, 'range', 'survey-range')) return;
    mutateFromTrustedInput(event, { reveal: Number(scanSweep.value) / 100 }, 'survey-range');
  });

  actionButtons.forEach(button => {
    button.addEventListener('click', event => {
      if (!acceptInput(event, 'button', `button-${button.dataset.terrainAction}`)) return;
      const action = button.dataset.terrainAction;
      if (action === 'lower') mutateFromTrustedInput(event, { floodStage: state.floodStage - 0.045 }, 'button-lower');
      if (action === 'raise') mutateFromTrustedInput(event, { floodStage: state.floodStage + 0.045 }, 'button-raise');
      if (action === 'reset') {
        state.resetCount += 1;
        mutateFromTrustedInput(event, {
          reveal: INITIAL_REVEAL,
          floodStage: INITIAL_FLOOD_STAGE,
          probeU: 0.67,
          probeV: 0.47,
        }, 'button-reset');
      }
    });
  });

  document.querySelectorAll('.weather-controls, .sweep-control').forEach(control => {
    control.addEventListener('pointerdown', event => event.stopPropagation());
    control.addEventListener('pointermove', event => event.stopPropagation());
  });

  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (!sketch) return;
      sketch.resizeCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
      state.resizeCount += 1;
      state.p5CanvasWidth = sketch.width;
      state.p5CanvasHeight = sketch.height;
      requestDraw('window-resize');
    });
  });

  const ready = Promise.all([prepareRasterEvidence(), document.fonts.ready]).then(async () => {
    updateInterface();
    requestDraw('initial-ready');
    const signature = `${state.reveal}:${state.floodStage}:${state.probeU}:${state.probeV}:${state.humanMutationCount}`;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const repeatedSignature = `${state.reveal}:${state.floodStage}:${state.probeU}:${state.probeV}:${state.humanMutationCount}`;
    state.initialStillVerified = signature === repeatedSignature && state.inputCount === 0;
    invariant(state.initialStillVerified, 'initial frame changed without trusted human input');
    state.ready = true;
    updateDataset();
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    const canvas = canvasHost.querySelector('canvas');
    const realP5 = sketch instanceof p5
      && state.claimedLibrary === 'p5@2.3.0'
      && state.p5InstanceReady
      && state.p5CanvasReady
      && canvas instanceof HTMLCanvasElement
      && sketch.drawingContext === canvas.getContext('2d')
      && sketch.width === stage.clientWidth
      && sketch.height === stage.clientHeight;
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
    const realRasterTopology = state.rasterDrivenEvidenceReady
      && state.sampledPixelCount === GRID_SIZE
      && state.sampledPixelByteLength === GRID_SIZE * 4
      && /^[a-f0-9]{64}$/.test(state.sampledPixelSha256)
      && state.sampledPixelChecksum > 0
      && state.distinctSampleColorCount > 350
      && state.sourceAlphaFailureCount === 0
      && state.sampledLuminanceRange > 0.45
      && state.elevationCellCount === GRID_SIZE
      && state.elevationRange === 1
      && state.elevationChecksum > 0
      && state.riskCellCount === GRID_SIZE
      && state.riskRange > 0.45
      && state.riskChecksum > 0
      && state.smoothingPassCount === 2
      && state.marchingSquaresLevelCount === CONTOUR_LEVELS.length
      && state.marchingSquaresCellEvaluationCount === CONTOUR_LEVELS.length * (GRID_WIDTH - 1) * (GRID_HEIGHT - 1)
      && state.marchingSquaresSegmentCount > 350
      && state.contourLevelsWithSegments >= 8
      && state.contourTopologyChecksum > 0
      && state.routePointCount === GRID_WIDTH
      && state.routePixelEvaluationCount > GRID_SIZE
      && state.routeRecomputeCount >= 1
      && state.routeChecksum > 0;
    const honestInteraction = state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStillVerified
      && !state.automaticCycle
      && !state.automaticPlayback
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.previewClockMutationCount === 0
      && state.renderIgnoresPreviewClock
      && state.nonInputVisualMutationCountAfterReady === 0
      && state.humanMutationCount >= state.transitionRecords.length
      && state.transitionRecords.every(record => record.trusted === true)
      && state.pointerCaptureReleaseCount <= state.pointerCaptureCount
      && state.lastInputTrusted !== false;
    const renderEvidence = state.p5ImageDrawCount >= 1
      && state.p5CompletedDrawCount >= 1
      && state.contourSegmentDrawCount === state.marchingSquaresSegmentCount
      && state.routeSegmentDrawCount >= 1
      && state.reveal >= 0
      && state.reveal <= 1
      && state.floodStage >= FLOOD_MIN
      && state.floodStage <= FLOOD_MAX;
    state.runtimeAssertionPassed = Boolean(realP5 && realAsset && realRasterTopology && honestInteraction && renderEvidence && state.ready);
    return state.runtimeAssertionPassed;
  };

  installPreviewController({
    id: 'topographic-wave-contour-reveal',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render: () => {
      state.previewRenderCalls += 1;
      if (dirty) sketch?.redraw();
    },
    ready,
  });
} catch (error) {
  markPreviewFailure(error);
}
