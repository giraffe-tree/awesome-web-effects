import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const SOURCE_WIDTH = 960;
const SOURCE_HEIGHT = 640;
const SOURCE_BYTES = 294954;
const SOURCE_SHA256 = 'cdd11f0c7486999bfeae82de1809f52762be6608fc9521b264f3a89732e638af';
const CROP = { x: 0, y: 50, width: 960, height: 540 };
const SAMPLE_WIDTH = 80;
const SAMPLE_HEIGHT = 45;
const REFERENCE_WIDTH = 320;
const REFERENCE_HEIGHT = 180;
const POISSON_MINIMUM_DISTANCE = 20;
const POISSON_CANDIDATE_ATTEMPTS = 26;
const POISSON_SEED = 11620721;
const SOURCE_URL = new URL('../assets/aesthetic-wave-07/poisson-constellation-bloom/harbor-risk-survey.jpg', import.meta.url).href;

const CATEGORY = Object.freeze({
  RUNOFF: 0,
  WATER: 1,
  UTILITY: 2,
  GROUND: 3
});

const CATEGORY_NAMES = ['RUNOFF', 'WATER', 'UTILITY', 'GROUND'];
const CATEGORY_COLORS = [
  [255, 154, 75],
  [115, 215, 212],
  [243, 228, 198],
  [183, 193, 139]
];

const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function digestHex(buffer) {
  return crypto.subtle.digest('SHA-256', buffer).then(digest => [...new Uint8Array(digest)]
    .map(value => value.toString(16).padStart(2, '0')).join(''));
}

function checksumBytes(bytes) {
  let checksum = 2166136261;
  for (let index = 0; index < bytes.length; index += 8) {
    checksum = Math.imul(checksum ^ bytes[index], 16777619) >>> 0;
  }
  return checksum >>> 0;
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let mixed = value;
    mixed = Math.imul(mixed ^ mixed >>> 15, mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ mixed >>> 7, mixed | 61);
    return ((mixed ^ mixed >>> 14) >>> 0) / 4294967296;
  };
}

function generatePoissonPoints(width, height, minimumDistance, attempts, seed) {
  const random = seededRandom(seed);
  const cellSize = minimumDistance / Math.SQRT2;
  const columns = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const grid = new Int16Array(columns * rows);
  grid.fill(-1);
  const points = [];
  const active = [];

  const add = point => {
    const pointIndex = points.length;
    points.push(point);
    active.push(pointIndex);
    grid[Math.floor(point.y / cellSize) * columns + Math.floor(point.x / cellSize)] = pointIndex;
  };

  const fits = point => {
    const column = Math.floor(point.x / cellSize);
    const row = Math.floor(point.y / cellSize);
    for (let y = Math.max(0, row - 2); y <= Math.min(rows - 1, row + 2); y += 1) {
      for (let x = Math.max(0, column - 2); x <= Math.min(columns - 1, column + 2); x += 1) {
        const neighborIndex = grid[y * columns + x];
        if (neighborIndex >= 0 && distance(point, points[neighborIndex]) < minimumDistance) return false;
      }
    }
    return true;
  };

  add({ x: width * .54, y: height * .51 });
  while (active.length > 0) {
    const activeSlot = Math.floor(random() * active.length);
    const origin = points[active[activeSlot]];
    let accepted = false;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const angle = random() * Math.PI * 2;
      const radius = minimumDistance * (1 + random());
      const candidate = { x: origin.x + Math.cos(angle) * radius, y: origin.y + Math.sin(angle) * radius };
      if (candidate.x < 5 || candidate.x > width - 5 || candidate.y < 5 || candidate.y > height - 5 || !fits(candidate)) continue;
      add(candidate);
      accepted = true;
      break;
    }
    if (!accepted) active.splice(activeSlot, 1);
  }
  return points;
}

try {
  const stage = document.querySelector('#risk-stage');
  const host = document.querySelector('#graph-host');
  const reachRange = document.querySelector('#reach-range');
  const reachOutput = document.querySelector('#reach-output');
  const pinButton = document.querySelector('#pin-button');
  const resetButton = document.querySelector('#reset-button');
  const nodeCountOutput = document.querySelector('#node-count');
  const edgeCountOutput = document.querySelector('#edge-count');
  const riskCountOutput = document.querySelector('#risk-count');
  const findingOutput = document.querySelector('#finding-output');
  const detailOutput = document.querySelector('#detail-output');
  const statusOutput = document.querySelector('#status-strip');
  const ledger = document.querySelector('#runtime-ledger');
  const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');

  if (!stage || !host || !reachRange || !pinButton || !resetButton) {
    throw new Error('poisson-constellation-bloom: required interface is missing');
  }

  const state = {
    id: 'poisson-constellation-bloom',
    task: 'human-operated-pixel-derived-harbor-risk-relationship-graph',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'committed-image-pixels-classify-poisson-nodes-and-weight-local-risk-relations',
    acceptedInputs: ['mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'keyboard', 'range-control', 'visible-buttons'],
    userInputRequired: true,
    initialFrameStatic: true,
    automaticCycle: false,
    automaticPlayback: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    previewClockMutationCount: 0,
    timerMutationCount: 0,
    reducedMotion: reducedMotionQuery.matches,
    sourceUrl: SOURCE_URL,
    sourceFetchCount: 0,
    sourceResponseStatus: 0,
    sourceSameOrigin: false,
    sourceByteLength: 0,
    sourceSha256: '',
    sourceShaMatchesExpected: false,
    browserImageDecoded: false,
    sourceNaturalWidth: 0,
    sourceNaturalHeight: 0,
    sourcePixelCount: 0,
    p5ImageDecoded: false,
    p5ImageClass: '',
    p5ImageWidth: 0,
    p5ImageHeight: 0,
    p5ImagePixelLength: 0,
    cropSourceX: CROP.x,
    cropSourceY: CROP.y,
    cropSourceWidth: CROP.width,
    cropSourceHeight: CROP.height,
    sampledWidth: SAMPLE_WIDTH,
    sampledHeight: SAMPLE_HEIGHT,
    sampledPixelCount: 0,
    sampledByteLength: 0,
    sampledPixelSha256: '',
    sampledPixelChecksum: 0,
    distinctSampleColorCount: 0,
    meanLuma: 0,
    lumaDeviation: 0,
    edgeDensity: 0,
    edgeSampleCount: 0,
    warmPixelRatio: 0,
    darkPixelRatio: 0,
    poissonSeed: POISSON_SEED,
    poissonMinimumDistance: POISSON_MINIMUM_DISTANCE,
    poissonCandidateAttempts: POISSON_CANDIDATE_ATTEMPTS,
    poissonNodeCount: 0,
    minimumObservedNodeDistance: Infinity,
    relationshipCount: 0,
    crossRiskRelationshipCount: 0,
    highRiskNodeCount: 0,
    categoryCounts: [0, 0, 0, 0],
    categoryRiskTotals: [0, 0, 0, 0],
    highestRiskNodeIndex: -1,
    highestRiskValue: 0,
    evidenceConclusion: '',
    graphChecksum: 0,
    queryActive: false,
    queryPinned: false,
    queryX: REFERENCE_WIDTH * .61,
    queryY: REFERENCE_HEIGHT * .47,
    queryReach: Number(reachRange.value),
    selectedNodeIndex: -1,
    selectedCategory: 'NONE',
    selectedRisk: 0,
    selectedRelationCount: 0,
    selectedCrossRiskCount: 0,
    selectedClusterChecksum: 0,
    inputCount: 0,
    humanInputCausalityCount: 0,
    pointerEnterCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerReleaseCount: 0,
    pointerCaptureCount: 0,
    pointerReleaseCaptureCount: 0,
    hoverMutationCount: 0,
    dragMutationCount: 0,
    mouseDragMutationCount: 0,
    touchDragMutationCount: 0,
    penDragMutationCount: 0,
    keyboardInputCount: 0,
    rangeInputCount: 0,
    buttonActivationCount: 0,
    pinActivationCount: 0,
    resetCount: 0,
    rejectedUntrustedInputCount: 0,
    lastInputTrusted: null,
    lastInputKind: 'none',
    lastPointerType: 'none',
    activePointerId: null,
    pointerCaptured: false,
    dragDistance: 0,
    initialStaticConfirmed: false,
    initialCanvasSignature: 0,
    lastCanvasSignature: 0,
    visualMutationCount: 0,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    renderCount: 0,
    p5DrawCount: 0,
    resizeCount: 0,
    runtimeAssertCount: 0,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__POISSON_CONSTELLATION_BLOOM_STATE__ = state;

  let sketch;
  let sourceImage;
  let graphNodes = [];
  let graphEdges = [];
  let sampledPixels;
  let dirty = true;
  let dragOrigin = null;
  let lastDragPoint = null;
  let lastButtonPointerType = 'mouse';
  let objectUrl = '';

  const invariant = (condition, message) => {
    if (!condition) throw new Error(`poisson-constellation-bloom: ${message}`);
  };

  function recordTrusted(event, kind) {
    if (event.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      state.lastInputTrusted = false;
      return false;
    }
    state.inputCount += 1;
    state.lastInputTrusted = true;
    state.lastInputKind = kind;
    return true;
  }

  function canvasSignature() {
    const canvas = host.querySelector('canvas');
    if (!(canvas instanceof HTMLCanvasElement)) return 0;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const width = canvas.width;
    const height = canvas.height;
    const pixels = context.getImageData(0, 0, width, height).data;
    let signature = 2166136261;
    const stride = Math.max(4, Math.floor(pixels.length / 2048 / 4) * 4);
    for (let index = 0; index < pixels.length; index += stride) {
      signature = Math.imul(signature ^ pixels[index], 16777619) >>> 0;
      signature = Math.imul(signature ^ pixels[index + 1], 16777619) >>> 0;
      signature = Math.imul(signature ^ pixels[index + 2], 16777619) >>> 0;
    }
    return signature >>> 0;
  }

  function syncLedger() {
    ledger.value = JSON.stringify({
      sourceSha256: state.sourceSha256,
      sampledPixelSha256: state.sampledPixelSha256,
      nodes: state.poissonNodeCount,
      relationships: state.relationshipCount,
      crossRiskRelationships: state.crossRiskRelationshipCount,
      categories: state.categoryCounts,
      conclusion: state.evidenceConclusion,
      selected: state.selectedCategory,
      selectedRisk: state.selectedRisk,
      inputCount: state.inputCount,
      dragMutations: state.dragMutationCount,
      keyboardInputs: state.keyboardInputCount,
      rangeInputs: state.rangeInputCount,
      buttonActivations: state.buttonActivationCount
    });
  }

  function nearestNodeTo(point) {
    let bestIndex = -1;
    let bestDistance = Infinity;
    graphNodes.forEach((node, index) => {
      const candidateDistance = distance(point, node);
      if (candidateDistance < bestDistance) {
        bestDistance = candidateDistance;
        bestIndex = index;
      }
    });
    return bestIndex;
  }

  function updateFinding() {
    reachOutput.textContent = String(state.queryReach);
    pinButton.setAttribute('aria-pressed', String(state.queryPinned));
    if (!state.queryActive || state.selectedNodeIndex < 0) {
      findingOutput.textContent = state.evidenceConclusion || 'Move the probe';
      detailOutput.textContent = `${state.poissonNodeCount} sampled nodes · ${state.relationshipCount} weighted relations`;
      statusOutput.textContent = 'Ready · Hover, drag or use arrow keys to inspect';
      syncLedger();
      return;
    }
    const categoryName = state.selectedCategory;
    const finding = state.selectedCrossRiskCount > 0
      ? 'Runoff ↔ utility'
      : categoryName === 'RUNOFF'
        ? 'Plume source'
        : categoryName === 'UTILITY'
          ? 'Utility exposure'
          : categoryName === 'WATER'
            ? 'Water migration'
            : 'Ground context';
    findingOutput.textContent = finding;
    detailOutput.textContent = `${Math.round(state.selectedRisk * 100)} risk · ${state.selectedRelationCount} local links · ${state.queryPinned ? 'pinned' : 'live probe'}`;
    statusOutput.textContent = `${categoryName} node · Pixel-derived relation cluster`;
    syncLedger();
  }

  function updateSelection() {
    if (!state.queryActive || graphNodes.length === 0) {
      state.selectedNodeIndex = -1;
      state.selectedCategory = 'NONE';
      state.selectedRisk = 0;
      state.selectedRelationCount = 0;
      state.selectedCrossRiskCount = 0;
      state.selectedClusterChecksum = 0;
      updateFinding();
      return;
    }
    const focus = { x: state.queryX, y: state.queryY };
    state.selectedNodeIndex = nearestNodeTo(focus);
    const selected = graphNodes[state.selectedNodeIndex];
    state.selectedCategory = CATEGORY_NAMES[selected.category];
    state.selectedRisk = selected.risk;
    let relationCount = 0;
    let crossRiskCount = 0;
    let checksum = 2166136261;
    graphEdges.forEach(edge => {
      const a = graphNodes[edge.a];
      const b = graphNodes[edge.b];
      if (distance(a, focus) <= state.queryReach && distance(b, focus) <= state.queryReach) {
        relationCount += 1;
        if (edge.crossRisk) crossRiskCount += 1;
        checksum = Math.imul(checksum ^ Math.round(edge.weight * 1000), 16777619) >>> 0;
      }
    });
    state.selectedRelationCount = relationCount;
    state.selectedCrossRiskCount = crossRiskCount;
    state.selectedClusterChecksum = checksum >>> 0;
    updateFinding();
  }

  function requestRender({ humanMutation = false } = {}) {
    if (humanMutation) {
      state.humanInputCausalityCount += 1;
      state.visualMutationCount += 1;
    }
    dirty = true;
    updateSelection();
    if (sketch) sketch.redraw();
  }

  function setQuery(x, y, { human = true } = {}) {
    const nextX = clamp(x, 2, REFERENCE_WIDTH - 2);
    const nextY = clamp(y, 2, REFERENCE_HEIGHT - 2);
    const changed = !state.queryActive || Math.abs(nextX - state.queryX) > .05 || Math.abs(nextY - state.queryY) > .05;
    state.queryActive = true;
    state.queryX = nextX;
    state.queryY = nextY;
    if (changed) requestRender({ humanMutation: human });
    return changed;
  }

  function clearQuery({ human = true } = {}) {
    const changed = state.queryActive || state.queryPinned;
    state.queryActive = false;
    state.queryPinned = false;
    state.selectedNodeIndex = -1;
    pinButton.setAttribute('aria-pressed', 'false');
    if (changed) requestRender({ humanMutation: human });
  }

  function pointFromEvent(event) {
    const bounds = host.getBoundingClientRect();
    return {
      x: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width)) * REFERENCE_WIDTH,
      y: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height)) * REFERENCE_HEIGHT
    };
  }

  function classifyPixel(red, green, blue, luma, edge) {
    const warmBias = (red - blue) / 255;
    if (red > 112 && warmBias > .14 && red > green * 1.08) return CATEGORY.RUNOFF;
    if (blue > red + 12 && blue >= green * .78 && luma < .58) return CATEGORY.WATER;
    if (luma < .29 || (edge > .2 && luma < .42)) return CATEGORY.UTILITY;
    return CATEGORY.GROUND;
  }

  function riskForPixel(category, red, green, blue, luma, edge) {
    const warm = clamp((red - blue + 24) / 176);
    const darkness = 1 - luma;
    if (category === CATEGORY.RUNOFF) return clamp(.55 + warm * .31 + edge * .18);
    if (category === CATEGORY.UTILITY) return clamp(.36 + darkness * .34 + edge * .24);
    if (category === CATEGORY.WATER) return clamp(.12 + (green - red + 50) / 510 + edge * .18);
    return clamp(.17 + Math.abs(red - green) / 255 * .26 + edge * .22);
  }

  async function analyseImage(p5Image) {
    const crop = p5Image.get(CROP.x, CROP.y, CROP.width, CROP.height);
    crop.resize(SAMPLE_WIDTH, SAMPLE_HEIGHT);
    crop.loadPixels();
    sampledPixels = new Uint8ClampedArray(crop.pixels);
    invariant(sampledPixels.byteLength === SAMPLE_WIDTH * SAMPLE_HEIGHT * 4, 'sampled pixel buffer has the wrong size');
    state.sampledPixelCount = SAMPLE_WIDTH * SAMPLE_HEIGHT;
    state.sampledByteLength = sampledPixels.byteLength;
    state.sampledPixelSha256 = await digestHex(sampledPixels.buffer.slice(0));
    state.sampledPixelChecksum = checksumBytes(sampledPixels);

    const lumas = new Float32Array(state.sampledPixelCount);
    const edges = new Float32Array(state.sampledPixelCount);
    const colors = new Set();
    let lumaTotal = 0;
    let warmCount = 0;
    let darkCount = 0;
    for (let index = 0; index < state.sampledPixelCount; index += 1) {
      const offset = index * 4;
      const red = sampledPixels[offset];
      const green = sampledPixels[offset + 1];
      const blue = sampledPixels[offset + 2];
      const luma = (red * .2126 + green * .7152 + blue * .0722) / 255;
      lumas[index] = luma;
      lumaTotal += luma;
      if (red > 110 && red > green * 1.08 && red - blue > 32) warmCount += 1;
      if (luma < .29) darkCount += 1;
      colors.add(`${red >> 3}:${green >> 3}:${blue >> 3}`);
    }

    let edgeHits = 0;
    let edgeSamples = 0;
    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      for (let x = 0; x < SAMPLE_WIDTH; x += 1) {
        const index = y * SAMPLE_WIDTH + x;
        let edge = 0;
        if (x > 0) {
          edge = Math.max(edge, Math.abs(lumas[index] - lumas[index - 1]));
          edgeSamples += 1;
        }
        if (y > 0) {
          edge = Math.max(edge, Math.abs(lumas[index] - lumas[index - SAMPLE_WIDTH]));
          edgeSamples += 1;
        }
        edges[index] = clamp(edge * 2.4);
        if (edge > .11) edgeHits += 1;
      }
    }

    const meanLuma = lumaTotal / lumas.length;
    let varianceTotal = 0;
    lumas.forEach(luma => { varianceTotal += (luma - meanLuma) ** 2; });
    state.meanLuma = meanLuma;
    state.lumaDeviation = Math.sqrt(varianceTotal / lumas.length);
    state.edgeDensity = edgeHits / state.sampledPixelCount;
    state.edgeSampleCount = edgeSamples;
    state.warmPixelRatio = warmCount / state.sampledPixelCount;
    state.darkPixelRatio = darkCount / state.sampledPixelCount;
    state.distinctSampleColorCount = colors.size;

    const poissonPoints = generatePoissonPoints(
      REFERENCE_WIDTH,
      REFERENCE_HEIGHT,
      POISSON_MINIMUM_DISTANCE,
      POISSON_CANDIDATE_ATTEMPTS,
      POISSON_SEED
    );

    graphNodes = poissonPoints.map((point, index) => {
      const sampleX = clamp(Math.round(point.x / REFERENCE_WIDTH * (SAMPLE_WIDTH - 1)), 0, SAMPLE_WIDTH - 1);
      const sampleY = clamp(Math.round(point.y / REFERENCE_HEIGHT * (SAMPLE_HEIGHT - 1)), 0, SAMPLE_HEIGHT - 1);
      const sampleIndex = sampleY * SAMPLE_WIDTH + sampleX;
      const offset = sampleIndex * 4;
      const red = sampledPixels[offset];
      const green = sampledPixels[offset + 1];
      const blue = sampledPixels[offset + 2];
      const luma = lumas[sampleIndex];
      const edge = edges[sampleIndex];
      const category = classifyPixel(red, green, blue, luma, edge);
      const risk = riskForPixel(category, red, green, blue, luma, edge);
      state.categoryCounts[category] += 1;
      state.categoryRiskTotals[category] += risk;
      if (risk >= .62) state.highRiskNodeCount += 1;
      if (risk > state.highestRiskValue) {
        state.highestRiskValue = risk;
        state.highestRiskNodeIndex = index;
      }
      return { ...point, sampleX, sampleY, red, green, blue, luma, edge, category, risk };
    });

    let minimumObservedDistance = Infinity;
    for (let first = 0; first < graphNodes.length; first += 1) {
      for (let second = first + 1; second < graphNodes.length; second += 1) {
        const a = graphNodes[first];
        const b = graphNodes[second];
        const nodeDistance = distance(a, b);
        minimumObservedDistance = Math.min(minimumObservedDistance, nodeDistance);
        if (nodeDistance > 47) continue;
        const proximity = 1 - nodeDistance / 47;
        const colorDistance = Math.hypot(a.red - b.red, a.green - b.green, a.blue - b.blue) / 441.673;
        const similarity = 1 - colorDistance;
        const crossRisk = (a.category === CATEGORY.RUNOFF && b.category === CATEGORY.UTILITY)
          || (a.category === CATEGORY.UTILITY && b.category === CATEGORY.RUNOFF);
        const weight = clamp(proximity * .43 + similarity * .24 + Math.max(a.risk, b.risk) * .25 + (crossRisk ? .17 : 0));
        if (weight < .38) continue;
        graphEdges.push({ a: first, b: second, weight, crossRisk });
        if (crossRisk) state.crossRiskRelationshipCount += 1;
      }
    }

    state.poissonNodeCount = graphNodes.length;
    state.minimumObservedNodeDistance = minimumObservedDistance;
    state.relationshipCount = graphEdges.length;
    state.evidenceConclusion = state.crossRiskRelationshipCount >= 2
      ? 'Runoff → utility'
      : state.categoryCounts[CATEGORY.RUNOFF] > 0
        ? 'Plume migration'
        : 'Mixed field review';

    let graphChecksum = 2166136261;
    graphNodes.forEach(node => {
      graphChecksum = Math.imul(graphChecksum ^ Math.round(node.x * 100), 16777619) >>> 0;
      graphChecksum = Math.imul(graphChecksum ^ Math.round(node.y * 100), 16777619) >>> 0;
      graphChecksum = Math.imul(graphChecksum ^ (node.category * 257 + Math.round(node.risk * 1000)), 16777619) >>> 0;
    });
    graphEdges.forEach(edge => {
      graphChecksum = Math.imul(graphChecksum ^ (edge.a * 257 + edge.b), 16777619) >>> 0;
      graphChecksum = Math.imul(graphChecksum ^ Math.round(edge.weight * 1000), 16777619) >>> 0;
    });
    state.graphChecksum = graphChecksum >>> 0;
  }

  function drawGraph(p) {
    state.p5DrawCount += 1;
    p.clear();
    p.push();
    p.scale(p.width / REFERENCE_WIDTH, p.height / REFERENCE_HEIGHT);
    p.image(sourceImage, 0, 0, REFERENCE_WIDTH, REFERENCE_HEIGHT, CROP.x, CROP.y, CROP.width, CROP.height);
    p.noStroke();
    p.fill(3, 12, 17, 126);
    p.rect(0, 0, REFERENCE_WIDTH, REFERENCE_HEIGHT);
    p.fill(2, 9, 13, 46);
    p.rect(0, 0, 118, REFERENCE_HEIGHT);

    const focus = { x: state.queryX, y: state.queryY };
    graphEdges.forEach(edge => {
      const a = graphNodes[edge.a];
      const b = graphNodes[edge.b];
      const localA = state.queryActive && distance(a, focus) <= state.queryReach;
      const localB = state.queryActive && distance(b, focus) <= state.queryReach;
      const local = localA && localB;
      const color = edge.crossRisk ? CATEGORY_COLORS[CATEGORY.RUNOFF] : [207, 225, 216];
      p.stroke(color[0], color[1], color[2], local ? 42 + edge.weight * 170 : 16 + edge.weight * 28);
      p.strokeWeight(local ? .45 + edge.weight * 1.15 : .35);
      p.line(a.x, a.y, b.x, b.y);
    });

    graphNodes.forEach((node, index) => {
      const color = CATEGORY_COLORS[node.category];
      const queryDistance = state.queryActive ? distance(node, focus) : Infinity;
      const bloom = state.queryActive ? clamp(1 - queryDistance / state.queryReach) : 0;
      const selected = index === state.selectedNodeIndex;
      if (bloom > .04) {
        p.noStroke();
        p.fill(color[0], color[1], color[2], 7 + bloom * 28);
        p.circle(node.x, node.y, 9 + bloom * 21 + node.risk * 5);
      }
      p.noStroke();
      p.fill(color[0], color[1], color[2], 118 + bloom * 126);
      p.circle(node.x, node.y, 2 + node.risk * 2.7 + bloom * 4.8);
      p.noFill();
      p.stroke(color[0], color[1], color[2], 38 + bloom * 150);
      p.strokeWeight(selected ? 1.25 : .55);
      p.circle(node.x, node.y, 5.4 + node.risk * 3.8 + bloom * 6.5);
    });

    if (state.queryActive) {
      const selected = graphNodes[state.selectedNodeIndex];
      p.noFill();
      p.stroke(255, 244, 221, state.queryPinned ? 222 : 170);
      p.strokeWeight(.75);
      p.circle(state.queryX, state.queryY, 16);
      p.stroke(255, 154, 75, 150);
      p.strokeWeight(.5);
      p.arc(state.queryX, state.queryY, 23, 23, -.42, 1.55);
      p.line(state.queryX - 12, state.queryY, state.queryX - 7, state.queryY);
      p.line(state.queryX + 7, state.queryY, state.queryX + 12, state.queryY);
      if (selected) {
        p.stroke(255, 244, 221, 88);
        p.line(state.queryX, state.queryY, selected.x, selected.y);
      }
    }

    p.pop();
    state.p5CanvasWidth = p.width;
    state.p5CanvasHeight = p.height;
    state.lastCanvasSignature = canvasSignature();
    if (state.ready && state.initialCanvasSignature === 0 && !state.queryActive && state.inputCount === 0) {
      state.initialCanvasSignature = state.lastCanvasSignature;
      state.initialStaticConfirmed = true;
    }
    dirty = false;
  }

  const p5Ready = new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
          canvas.parent(host);
          p.noLoop();
          state.p5InstanceReady = p instanceof p5;
          state.p5CanvasReady = canvas.elt instanceof HTMLCanvasElement && p.drawingContext instanceof CanvasRenderingContext2D;
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      p.draw = () => {
        if (!state.ready || !sourceImage) return;
        drawGraph(p);
      };
    }, host);
  });

  async function fetchDecodeAndAnalyse() {
    state.sourceFetchCount += 1;
    const response = await fetch(SOURCE_URL, { cache: 'no-store' });
    state.sourceResponseStatus = response.status;
    state.sourceSameOrigin = new URL(response.url).origin === location.origin;
    invariant(response.ok, `source request failed with ${response.status}`);
    const bytes = await response.arrayBuffer();
    state.sourceByteLength = bytes.byteLength;
    state.sourceSha256 = await digestHex(bytes.slice(0));
    state.sourceShaMatchesExpected = state.sourceSha256 === SOURCE_SHA256;
    invariant(state.sourceSameOrigin, 'source asset was not fetched from the preview origin');
    invariant(state.sourceByteLength === SOURCE_BYTES, 'source byte length changed');
    invariant(state.sourceShaMatchesExpected, 'source SHA-256 changed');

    objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
    const browserImage = new Image();
    browserImage.src = objectUrl;
    await browserImage.decode();
    state.browserImageDecoded = true;
    state.sourceNaturalWidth = browserImage.naturalWidth;
    state.sourceNaturalHeight = browserImage.naturalHeight;
    state.sourcePixelCount = browserImage.naturalWidth * browserImage.naturalHeight;
    invariant(state.sourceNaturalWidth === SOURCE_WIDTH && state.sourceNaturalHeight === SOURCE_HEIGHT, 'browser-decoded source dimensions changed');

    await p5Ready;
    sourceImage = await new Promise((resolve, reject) => {
      sketch.loadImage(objectUrl, resolve, error => reject(new Error(`p5 source decode failed: ${error}`)));
    });
    sourceImage.loadPixels();
    state.p5ImageDecoded = sourceImage instanceof p5.Image;
    state.p5ImageClass = state.p5ImageDecoded ? 'p5.Image' : sourceImage?.constructor?.name ?? '';
    state.p5ImageWidth = sourceImage.width;
    state.p5ImageHeight = sourceImage.height;
    state.p5ImagePixelLength = sourceImage.pixels.length;
    invariant(state.p5ImageDecoded && sourceImage.width === SOURCE_WIDTH && sourceImage.height === SOURCE_HEIGHT,
      'p5 did not decode the committed source at 960x640');
    invariant(sourceImage.pixels.length === SOURCE_WIDTH * SOURCE_HEIGHT * 4, 'p5 source pixel buffer is incomplete');
    await analyseImage(sourceImage);
    URL.revokeObjectURL(objectUrl);
    objectUrl = '';

    invariant(state.poissonNodeCount >= 50 && state.poissonNodeCount <= 100, 'poisson node count is outside the expected range');
    invariant(state.minimumObservedNodeDistance >= POISSON_MINIMUM_DISTANCE - .01, 'poisson spacing invariant failed');
    invariant(state.relationshipCount >= 70, 'pixel-weighted relationship graph is too sparse');
    invariant(state.categoryCounts.every(count => count > 0), 'pixel analysis did not produce all four evidence categories');

    nodeCountOutput.textContent = String(state.poissonNodeCount);
    edgeCountOutput.textContent = String(state.relationshipCount);
    riskCountOutput.textContent = String(state.highRiskNodeCount);
    updateFinding();
    state.ready = true;
    dirty = true;
    sketch.redraw();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    if (state.initialCanvasSignature === 0) {
      state.initialCanvasSignature = canvasSignature();
      state.lastCanvasSignature = state.initialCanvasSignature;
      state.initialStaticConfirmed = state.inputCount === 0 && !state.queryActive;
    }
  }

  host.addEventListener('pointerenter', event => {
    if (!recordTrusted(event, 'pointer-enter')) return;
    state.pointerEnterCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
    if ((event.pointerType || 'mouse') === 'mouse' && !state.queryPinned) {
      const point = pointFromEvent(event);
      if (setQuery(point.x, point.y)) state.hoverMutationCount += 1;
    }
  });

  host.addEventListener('pointerdown', event => {
    if (!recordTrusted(event, 'pointer-down')) return;
    event.preventDefault();
    state.pointerDownCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
    state.activePointerId = event.pointerId;
    host.setPointerCapture(event.pointerId);
    state.pointerCaptured = host.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    const point = pointFromEvent(event);
    dragOrigin = point;
    lastDragPoint = point;
    state.queryPinned = false;
    pinButton.setAttribute('aria-pressed', 'false');
    setQuery(point.x, point.y);
  });

  host.addEventListener('pointermove', event => {
    if (!recordTrusted(event, state.pointerCaptured ? 'captured-pointer-drag' : 'pointer-hover')) return;
    state.pointerMoveCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
    const point = pointFromEvent(event);
    if (state.pointerCaptured && event.pointerId === state.activePointerId) {
      if (lastDragPoint) state.dragDistance += distance(lastDragPoint, point);
      lastDragPoint = point;
      if (setQuery(point.x, point.y)) {
        state.dragMutationCount += 1;
        if (event.pointerType === 'touch') state.touchDragMutationCount += 1;
        else if (event.pointerType === 'pen') state.penDragMutationCount += 1;
        else state.mouseDragMutationCount += 1;
      }
      return;
    }
    if ((event.pointerType || 'mouse') === 'mouse' && !state.queryPinned && setQuery(point.x, point.y)) {
      state.hoverMutationCount += 1;
    }
  });

  const releasePointer = event => {
    if (!recordTrusted(event, 'pointer-release')) return;
    if (event.pointerId !== state.activePointerId) return;
    state.pointerReleaseCount += 1;
    if (host.hasPointerCapture(event.pointerId)) {
      host.releasePointerCapture(event.pointerId);
      state.pointerReleaseCaptureCount += 1;
    }
    state.pointerCaptured = false;
    state.activePointerId = null;
    dragOrigin = null;
    lastDragPoint = null;
    updateFinding();
  };

  host.addEventListener('pointerup', releasePointer);
  host.addEventListener('pointercancel', releasePointer);
  host.addEventListener('pointerleave', event => {
    if (state.pointerCaptured || state.queryPinned || (event.pointerType || 'mouse') !== 'mouse') return;
    if (event.relatedTarget instanceof Element && event.relatedTarget.closest('.controls')) return;
    clearQuery({ human: true });
  });

  host.addEventListener('keydown', event => {
    const movement = {
      ArrowLeft: [-10, 0],
      ArrowRight: [10, 0],
      ArrowUp: [0, -10],
      ArrowDown: [0, 10]
    }[event.key];
    if (!movement && !['Enter', ' ', 'Home', 'Escape'].includes(event.key)) return;
    if (!recordTrusted(event, `keyboard-${event.key}`)) return;
    event.preventDefault();
    state.keyboardInputCount += 1;
    if (movement) {
      if (!state.queryActive) {
        const start = graphNodes[state.highestRiskNodeIndex] ?? { x: REFERENCE_WIDTH * .61, y: REFERENCE_HEIGHT * .47 };
        state.queryX = start.x;
        state.queryY = start.y;
      }
      setQuery(state.queryX + movement[0], state.queryY + movement[1]);
    } else if (event.key === 'Home') {
      const highestRisk = graphNodes[state.highestRiskNodeIndex];
      if (highestRisk) setQuery(highestRisk.x, highestRisk.y);
    } else if (event.key === 'Escape') {
      clearQuery({ human: true });
      state.resetCount += 1;
    } else {
      state.queryPinned = !state.queryPinned;
      state.pinActivationCount += 1;
      if (!state.queryActive) {
        const highestRisk = graphNodes[state.highestRiskNodeIndex];
        if (highestRisk) setQuery(highestRisk.x, highestRisk.y);
      }
      requestRender({ humanMutation: true });
    }
  });

  reachRange.addEventListener('input', event => {
    if (!recordTrusted(event, 'range-reach')) return;
    state.rangeInputCount += 1;
    state.queryReach = Number(reachRange.value);
    if (!state.queryActive) {
      const highestRisk = graphNodes[state.highestRiskNodeIndex];
      if (highestRisk) {
        state.queryX = highestRisk.x;
        state.queryY = highestRisk.y;
        state.queryActive = true;
      }
    }
    requestRender({ humanMutation: true });
  });

  [pinButton, resetButton].forEach(button => {
    button.addEventListener('pointerdown', event => { lastButtonPointerType = event.pointerType || 'mouse'; });
  });

  pinButton.addEventListener('click', event => {
    if (!recordTrusted(event, event.detail === 0 ? 'keyboard-pin-button' : `${lastButtonPointerType}-pin-button`)) return;
    state.buttonActivationCount += 1;
    state.pinActivationCount += 1;
    if (!state.queryActive) {
      const highestRisk = graphNodes[state.highestRiskNodeIndex];
      if (highestRisk) {
        state.queryX = highestRisk.x;
        state.queryY = highestRisk.y;
        state.queryActive = true;
      }
    }
    state.queryPinned = !state.queryPinned;
    requestRender({ humanMutation: true });
  });

  resetButton.addEventListener('click', event => {
    if (!recordTrusted(event, event.detail === 0 ? 'keyboard-reset-button' : `${lastButtonPointerType}-reset-button`)) return;
    state.buttonActivationCount += 1;
    state.resetCount += 1;
    clearQuery({ human: true });
  });

  reducedMotionQuery.addEventListener('change', event => { state.reducedMotion = event.matches; });

  const resizeObserver = new ResizeObserver(() => {
    if (!sketch || !state.p5CanvasReady) return;
    const width = Math.max(1, Math.round(stage.clientWidth));
    const height = Math.max(1, Math.round(stage.clientHeight));
    if (sketch.width === width && sketch.height === height) return;
    sketch.resizeCanvas(width, height, false);
    state.resizeCount += 1;
    dirty = true;
    if (state.ready) sketch.redraw();
  });
  resizeObserver.observe(stage);

  const ready = Promise.all([document.fonts.ready, fetchDecodeAndAnalyse()]).then(() => {
    state.ready = true;
    return true;
  });

  const render = () => {
    state.renderCount += 1;
    if (state.ready && dirty) sketch.redraw();
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    state.runtimeAssertCount += 1;
    const canvas = host.querySelector('canvas');
    const stageBounds = stage.getBoundingClientRect();
    const canvasBounds = canvas?.getBoundingClientRect();
    const controlsVisible = [reachRange, pinButton, resetButton].every(control => {
      const bounds = control.getBoundingClientRect();
      return bounds.width > 0 && bounds.height > 0 && bounds.left >= -1 && bounds.top >= -1
        && bounds.right <= innerWidth + 1 && bounds.bottom <= innerHeight + 1;
    });
    return Boolean(
      sketch instanceof p5
      && state.p5InstanceReady
      && state.p5CanvasReady
      && canvas instanceof HTMLCanvasElement
      && Math.abs(canvas.width - Math.round(stage.clientWidth)) <= 1
      && Math.abs(canvas.height - Math.round(stage.clientHeight)) <= 1
      && canvasBounds.width >= innerWidth * .99
      && canvasBounds.height >= innerHeight * .99
      && stageBounds.width >= innerWidth * .99
      && stageBounds.height >= innerHeight * .99
      && controlsVisible
      && state.sourceFetchCount === 1
      && state.sourceResponseStatus === 200
      && state.sourceSameOrigin
      && state.sourceByteLength === SOURCE_BYTES
      && state.sourceShaMatchesExpected
      && state.sourceSha256 === SOURCE_SHA256
      && state.browserImageDecoded
      && state.sourceNaturalWidth === SOURCE_WIDTH
      && state.sourceNaturalHeight === SOURCE_HEIGHT
      && state.sourcePixelCount === SOURCE_WIDTH * SOURCE_HEIGHT
      && state.p5ImageDecoded
      && state.p5ImageClass === 'p5.Image'
      && state.p5ImageWidth === SOURCE_WIDTH
      && state.p5ImageHeight === SOURCE_HEIGHT
      && state.p5ImagePixelLength === SOURCE_WIDTH * SOURCE_HEIGHT * 4
      && state.sampledPixelCount === SAMPLE_WIDTH * SAMPLE_HEIGHT
      && state.sampledByteLength === SAMPLE_WIDTH * SAMPLE_HEIGHT * 4
      && /^[a-f0-9]{64}$/.test(state.sampledPixelSha256)
      && state.sampledPixelChecksum > 0
      && state.distinctSampleColorCount > 250
      && state.meanLuma > .2 && state.meanLuma < .8
      && state.lumaDeviation > .08 && state.lumaDeviation < .36
      && state.edgeDensity > .05 && state.edgeDensity < .75
      && state.edgeSampleCount === (SAMPLE_WIDTH - 1) * SAMPLE_HEIGHT + (SAMPLE_HEIGHT - 1) * SAMPLE_WIDTH
      && state.warmPixelRatio > .01 && state.warmPixelRatio < .3
      && state.darkPixelRatio > .03 && state.darkPixelRatio < .7
      && state.poissonNodeCount >= 50 && state.poissonNodeCount <= 100
      && state.minimumObservedNodeDistance >= POISSON_MINIMUM_DISTANCE - .01
      && state.relationshipCount >= 70
      && state.crossRiskRelationshipCount >= 1
      && state.highRiskNodeCount >= 3
      && state.categoryCounts.length === 4
      && state.categoryCounts.every(count => count > 0)
      && state.highestRiskNodeIndex >= 0
      && state.highestRiskValue >= .62
      && state.graphChecksum > 0
      && state.initialStaticConfirmed
      && state.initialCanvasSignature > 0
      && state.lastCanvasSignature > 0
      && state.automaticCycle === false
      && state.automaticPlayback === false
      && state.automaticRehearsal === false
      && state.automaticFallback === false
      && state.syntheticInputDispatch === false
      && state.captureClockDriven === false
      && state.previewClockMutationCount === 0
      && state.timerMutationCount === 0
      && state.rejectedUntrustedInputCount === 0
      && state.ready
      && state.p5DrawCount >= 1
      && state.renderCount >= 1
      && window.__PREVIEW_INTERACTION_STATE__ === state
    );
  };

  installPreviewController({
    id: 'poisson-constellation-bloom',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render,
    ready
  });

  window.addEventListener('beforeunload', () => {
    resizeObserver.disconnect();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, { once: true });
} catch (error) {
  markPreviewFailure(error);
}
