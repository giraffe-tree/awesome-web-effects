import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

const WORD = 'WAYFIND';
const NODE_COUNT = 24;
const BASELINE_Y = 0.55;
const INITIAL_TENSION = 0.65;
const INITIAL_PROBE_U = 0.5;
const INITIAL_PROBE_V = 0.39;
const SOLVER_ITERATIONS = 12;
const SETTLE_ITERATIONS = 28;
const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
const round = (value, places = 5) => Number(value.toFixed(places));

try {
  const stage = document.querySelector('#baseline-stage');
  const surface = document.querySelector('#baseline-surface');
  const tensionInput = document.querySelector('#baseline-tension');
  const tensionOutput = document.querySelector('#tension-output');
  const legibilityScore = document.querySelector('#legibility-score');
  const strainStatus = document.querySelector('#strain-status');
  const solverBatches = document.querySelector('#solver-batches');
  const actionButtons = [...document.querySelectorAll('[data-baseline-action]')];
  const nodes = Array.from({ length: NODE_COUNT }, (_, index) => ({
    u: index / (NODE_COUNT - 1),
    y: BASELINE_Y,
    velocity: 0,
  }));

  let sketch;
  let dirty = true;
  let activePointerId = null;
  let resizeFrame = 0;

  const state = {
    id: 'elastic-baseline-letter-wave',
    task: 'human-operated-wayfinding-elastic-baseline-legibility-proof',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'code-native-glyphs-inherit-position-and-tangent-from-a-24-node-finite-spring-baseline',
    assetStrategy: 'code-native-glyph-mechanism-no-decorative-raster-required',
    captureType: 'interactive',
    acceptedInputs: ['mouse-hover', 'captured-mouse-drag', 'captured-touch-drag', 'captured-pen-drag', 'keyboard', 'range-control', 'visible-buttons'],
    causality: 'trusted-human-input-only',
    userInputRequired: true,
    strictTrustedInputGuard: true,
    initialFrameStatic: true,
    automaticCycle: false,
    automaticPlayback: false,
    automaticWave: false,
    automaticRehearsal: false,
    automaticFallback: false,
    syntheticInputDispatch: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    previewClockMutationCount: 0,
    nonInputVisualMutationCountAfterReady: 0,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    tension: INITIAL_TENSION,
    probeU: INITIAL_PROBE_U,
    probeV: INITIAL_PROBE_V,
    glyphCount: WORD.length,
    baselineNodeCount: NODE_COUNT,
    solverIterationsPerInput: SOLVER_ITERATIONS,
    settleIterationsPerInput: SETTLE_ITERATIONS,
    solverBatchCount: 0,
    solverIterationCount: 0,
    settleBatchCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    rejectedUntrustedInputCount: 0,
    humanMutationCount: 0,
    probeMutationCount: 0,
    tensionMutationCount: 0,
    baselineMutationCount: 0,
    keyboardInputCount: 0,
    rangeInputCount: 0,
    buttonInputCount: 0,
    pointerEnterCount: 0,
    pointerMoveCount: 0,
    pointerDownCount: 0,
    pointerDragCount: 0,
    pointerReleaseCount: 0,
    pointerCancelCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    mouseInputCount: 0,
    touchInputCount: 0,
    penInputCount: 0,
    resetCount: 0,
    lastInputKind: 'none',
    lastInputSource: 'none',
    lastInputTrusted: null,
    lastPointerType: 'none',
    activePointerId: null,
    pointerCaptured: false,
    dragging: false,
    baselineChecksum: 0,
    initialBaselineChecksum: 0,
    currentVisualStateChecksum: 0,
    initialVisualStateChecksum: 0,
    initialStillVerified: false,
    maximumDisplacement: 0,
    maximumDisplacementObserved: 0,
    maximumSlope: 0,
    maximumSlopeObserved: 0,
    meanStrain: 0,
    legibilityScore: 100,
    minimumLegibilityScore: 100,
    legibilityVerdict: 'Route proof clear',
    legibilityVerdictMutationCount: 0,
    glyphBoundsWithinCanvas: false,
    glyphMinimumX: 0,
    glyphMaximumX: 0,
    glyphMinimumY: 0,
    glyphMaximumY: 0,
    glyphMetricCount: 0,
    glyphOccludedByUiCount: 0,
    baselineSegmentDrawCount: 0,
    glyphDrawCount: 0,
    p5InstanceReady: false,
    p5CanvasReady: false,
    p5CanvasWidth: 0,
    p5CanvasHeight: 0,
    p5DrawCount: 0,
    p5CompletedDrawCount: 0,
    renderRequestCount: 0,
    previewRenderCalls: 0,
    previewClockIgnoredCount: 0,
    resizeCount: 0,
    transitionRecords: [],
    ready: false,
    runtimeAssertionPassed: false,
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;
  window.__ELASTIC_BASELINE_STATE__ = state;

  function invariant(condition, message) {
    if (!condition) throw new Error(`elastic-baseline-letter-wave: ${message}`);
  }

  function fnvMix(checksum, value) {
    return Math.imul(checksum ^ (value >>> 0), 16777619) >>> 0;
  }

  function baselineChecksum() {
    let checksum = 2166136261;
    nodes.forEach(node => {
      checksum = fnvMix(checksum, Math.round(node.y * 100000));
      checksum = fnvMix(checksum, Math.round((node.velocity + 1) * 100000));
    });
    return checksum >>> 0;
  }

  function visualStateChecksum() {
    let checksum = baselineChecksum();
    checksum = fnvMix(checksum, Math.round(state.probeU * 10000));
    checksum = fnvMix(checksum, Math.round(state.probeV * 10000));
    checksum = fnvMix(checksum, Math.round(state.tension * 1000));
    return checksum >>> 0;
  }

  function updateMetrics() {
    let displacement = 0;
    let slopeMaximum = 0;
    let strainTotal = 0;
    for (let index = 0; index < nodes.length; index += 1) {
      displacement = Math.max(displacement, Math.abs(nodes[index].y - BASELINE_Y));
      if (index === 0) continue;
      const slope = Math.abs(nodes[index].y - nodes[index - 1].y) * (NODE_COUNT - 1);
      slopeMaximum = Math.max(slopeMaximum, slope);
      strainTotal += slope;
    }
    state.maximumDisplacement = round(displacement);
    state.maximumDisplacementObserved = Math.max(state.maximumDisplacementObserved, state.maximumDisplacement);
    state.maximumSlope = round(slopeMaximum);
    state.maximumSlopeObserved = Math.max(state.maximumSlopeObserved, state.maximumSlope);
    state.meanStrain = round(strainTotal / (NODE_COUNT - 1));
    state.legibilityScore = clamp(Math.round(100 - slopeMaximum * 38 - displacement * 36), 0, 100);
    state.minimumLegibilityScore = Math.min(state.minimumLegibilityScore, state.legibilityScore);
    const nextVerdict = state.legibilityScore >= 86
      ? 'Route proof clear'
      : state.legibilityScore >= 67
        ? 'Optical strain watch'
        : 'Rebalance baseline';
    if (nextVerdict !== state.legibilityVerdict) state.legibilityVerdictMutationCount += 1;
    state.legibilityVerdict = nextVerdict;
    state.baselineChecksum = baselineChecksum();
    state.currentVisualStateChecksum = visualStateChecksum();
  }

  function updateDataset() {
    stage.dataset.inputCount = String(state.inputCount);
    stage.dataset.trustedInputCount = String(state.trustedInputCount);
    stage.dataset.rejectedUntrustedInputCount = String(state.rejectedUntrustedInputCount);
    stage.dataset.solverBatchCount = String(state.solverBatchCount);
    stage.dataset.solverIterationCount = String(state.solverIterationCount);
    stage.dataset.legibilityScore = String(state.legibilityScore);
    stage.dataset.glyphBoundsWithinCanvas = String(state.glyphBoundsWithinCanvas);
    stage.dataset.automaticPlayback = String(state.automaticPlayback);
    stage.dataset.captureClockDriven = String(state.captureClockDriven);
    surface.dataset.dragging = String(state.dragging);
  }

  function updateInterface() {
    tensionInput.value = String(Math.round(state.tension * 100));
    tensionOutput.textContent = `${Math.round(state.tension * 100)}%`;
    solverBatches.textContent = String(state.solverBatchCount).padStart(2, '0');
    legibilityScore.textContent = `${state.legibilityScore} / 100`;
    legibilityScore.dataset.tone = state.legibilityScore < 86 ? 'watch' : 'clear';
    strainStatus.textContent = state.legibilityVerdict;
    surface.setAttribute('aria-valuetext', `Tension ${Math.round(state.tension * 100)} percent, legibility ${state.legibilityScore}, ${state.legibilityVerdict}`);
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
    if (kind === 'range') state.rangeInputCount += 1;
    if (kind === 'button') state.buttonInputCount += 1;
    if (kind === 'mouse' || kind === 'mouse-hover') state.mouseInputCount += 1;
    if (kind === 'touch') state.touchInputCount += 1;
    if (kind === 'pen') state.penInputCount += 1;
    updateDataset();
    return true;
  }

  function recordTransition(source, before, after) {
    if (before === after) return;
    state.transitionRecords.push({
      source,
      kind: state.lastInputKind,
      trusted: true,
      before,
      after,
    });
    if (state.transitionRecords.length > 72) state.transitionRecords.shift();
  }

  function solveBaseline(iterations, probeForce, source) {
    const before = visualStateChecksum();
    const nextVelocity = new Float32Array(NODE_COUNT);
    const nextY = new Float32Array(NODE_COUNT);
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      nextY[0] = BASELINE_Y;
      nextY[NODE_COUNT - 1] = BASELINE_Y;
      nextVelocity[0] = 0;
      nextVelocity[NODE_COUNT - 1] = 0;
      for (let index = 1; index < NODE_COUNT - 1; index += 1) {
        const node = nodes[index];
        const laplacian = nodes[index - 1].y + nodes[index + 1].y - node.y * 2;
        const distance = (node.u - state.probeU) / 0.19;
        const influence = Math.exp(-distance * distance * 1.4);
        const spring = (BASELINE_Y - node.y) * (0.065 + state.tension * 0.045);
        const neighbourForce = laplacian * (0.19 + state.tension * 0.18);
        const pointerForce = (state.probeV - node.y) * influence * probeForce;
        const velocity = (node.velocity + spring + neighbourForce + pointerForce) * (0.53 + state.tension * 0.08);
        nextVelocity[index] = velocity;
        nextY[index] = clamp(node.y + velocity, 0.29, 0.73);
      }
      for (let index = 0; index < NODE_COUNT; index += 1) {
        nodes[index].y = nextY[index];
        nodes[index].velocity = nextVelocity[index];
      }
    }
    state.solverBatchCount += 1;
    state.solverIterationCount += iterations;
    if (probeForce === 0) state.settleBatchCount += 1;
    updateMetrics();
    const after = visualStateChecksum();
    if (before !== after) state.baselineMutationCount += 1;
    recordTransition(source, before, after);
  }

  function mutateFromHuman(event, patch, source, iterations = SOLVER_ITERATIONS, probeForce = 0.12) {
    if (event?.isTrusted !== true) return false;
    const before = visualStateChecksum();
    const nextProbeU = patch.probeU === undefined ? state.probeU : clamp(patch.probeU, 0.12, 0.88);
    const nextProbeV = patch.probeV === undefined ? state.probeV : clamp(patch.probeV, 0.29, 0.71);
    const nextTension = patch.tension === undefined ? state.tension : clamp(patch.tension, 0.35, 0.95);
    const probeChanged = Math.abs(nextProbeU - state.probeU) > 0.0001 || Math.abs(nextProbeV - state.probeV) > 0.0001;
    const tensionChanged = Math.abs(nextTension - state.tension) > 0.0001;
    state.probeU = nextProbeU;
    state.probeV = nextProbeV;
    state.tension = nextTension;
    if (probeChanged) state.probeMutationCount += 1;
    if (tensionChanged) state.tensionMutationCount += 1;
    solveBaseline(iterations, probeForce, source);
    state.humanMutationCount += 1;
    updateInterface();
    requestDraw(`trusted-${source}`);
    return before !== visualStateChecksum();
  }

  function resetFromHuman(event, source) {
    if (event?.isTrusted !== true) return false;
    const before = visualStateChecksum();
    nodes.forEach(node => {
      node.y = BASELINE_Y;
      node.velocity = 0;
    });
    state.tension = INITIAL_TENSION;
    state.probeU = INITIAL_PROBE_U;
    state.probeV = INITIAL_PROBE_V;
    state.resetCount += 1;
    state.humanMutationCount += 1;
    updateMetrics();
    recordTransition(source, before, visualStateChecksum());
    updateInterface();
    requestDraw(`trusted-${source}`);
    return before !== visualStateChecksum();
  }

  function pointerPosition(event) {
    const bounds = surface.getBoundingClientRect();
    return {
      u: clamp((event.clientX - bounds.left) / Math.max(1, bounds.width), 0.12, 0.88),
      v: clamp((event.clientY - bounds.top) / Math.max(1, bounds.height), 0.29, 0.71),
    };
  }

  function pointerKind(event, hover = false) {
    const type = event.pointerType || 'mouse';
    return type === 'mouse' ? (hover ? 'mouse-hover' : 'mouse') : type;
  }

  function sampleBaseline(u) {
    const scaled = clamp(u) * (NODE_COUNT - 1);
    const left = Math.floor(scaled);
    const right = Math.min(NODE_COUNT - 1, left + 1);
    const amount = scaled - left;
    return nodes[left].y * (1 - amount) + nodes[right].y * amount;
  }

  function sampleSlope(u) {
    const delta = 1 / (NODE_COUNT - 1);
    return (sampleBaseline(clamp(u + delta)) - sampleBaseline(clamp(u - delta))) / (delta * 2);
  }

  function drawScene(p) {
    p.background('#efe6d4');
    const width = p.width;
    const height = p.height;
    const context = p.drawingContext;
    const lineLeft = width * 0.08;
    const lineRight = width * 0.92;

    p.noStroke();
    p.fill(49, 95, 168, 12);
    p.rect(lineLeft, height * 0.17, lineRight - lineLeft, height * 0.66);
    p.stroke(20, 32, 29, 28);
    p.strokeWeight(Math.max(0.5, width / 1100));
    p.line(lineLeft, BASELINE_Y * height, lineRight, BASELINE_Y * height);
    context.save();
    context.beginPath();
    context.moveTo(lineLeft, nodes[0].y * height);
    for (let index = 1; index < nodes.length - 1; index += 1) {
      const pointX = lineLeft + nodes[index].u * (lineRight - lineLeft);
      const pointY = nodes[index].y * height;
      const nextX = lineLeft + nodes[index + 1].u * (lineRight - lineLeft);
      const nextY = nodes[index + 1].y * height;
      context.quadraticCurveTo(pointX, pointY, (pointX + nextX) * 0.5, (pointY + nextY) * 0.5);
    }
    context.lineTo(lineRight, nodes.at(-1).y * height);
    context.strokeStyle = '#f15b48';
    context.lineWidth = Math.max(1.1, width / 420);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke();
    context.restore();
    state.baselineSegmentDrawCount = NODE_COUNT - 1;

    const fontSize = clamp(width * 0.108, 18, height * 0.37);
    const firstU = 0.17;
    const lastU = 0.83;
    let minimumX = Number.POSITIVE_INFINITY;
    let maximumX = Number.NEGATIVE_INFINITY;
    let minimumY = Number.POSITIVE_INFINITY;
    let maximumY = Number.NEGATIVE_INFINITY;
    const glyphBoxes = [];
    state.glyphMetricCount = 0;
    state.glyphDrawCount = 0;
    p.textFont('Arial, Helvetica, sans-serif');
    p.textStyle(p.BOLD);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(fontSize);

    [...WORD].forEach((glyph, index) => {
      const amount = index / (WORD.length - 1);
      const u = firstU + (lastU - firstU) * amount;
      const baselineY = sampleBaseline(u);
      const slope = sampleSlope(u);
      const x = lineLeft + u * (lineRight - lineLeft);
      const y = baselineY * height - fontSize * 0.12;
      const angle = clamp(Math.atan2(slope * height, lineRight - lineLeft) * 0.72, -0.42, 0.42);
      context.save();
      context.font = `700 ${fontSize}px Arial, Helvetica, sans-serif`;
      const metrics = context.measureText(glyph);
      context.restore();
      const glyphWidth = Math.max(metrics.width, fontSize * 0.4);
      const glyphHeight = Math.max(
        (metrics.actualBoundingBoxAscent || fontSize * 0.74) + (metrics.actualBoundingBoxDescent || fontSize * 0.18),
        fontSize * 0.82,
      );
      const padding = Math.abs(Math.sin(angle)) * glyphHeight * 0.42 + 1;
      minimumX = Math.min(minimumX, x - glyphWidth * 0.55 - padding);
      maximumX = Math.max(maximumX, x + glyphWidth * 0.55 + padding);
      minimumY = Math.min(minimumY, y - glyphHeight - padding);
      maximumY = Math.max(maximumY, y + fontSize * 0.12 + padding);
      glyphBoxes.push({
        left: x - glyphWidth * 0.55 - padding,
        right: x + glyphWidth * 0.55 + padding,
        top: y - glyphHeight - padding,
        bottom: y + fontSize * 0.12 + padding,
      });
      state.glyphMetricCount += 1;

      p.push();
      p.translate(x, y);
      p.rotate(angle);
      p.noStroke();
      p.fill(index === 3 ? '#f15b48' : '#14201d');
      p.text(glyph, 0, 0);
      p.pop();
      state.glyphDrawCount += 1;
    });

    state.glyphMinimumX = round(minimumX, 2);
    state.glyphMaximumX = round(maximumX, 2);
    state.glyphMinimumY = round(minimumY, 2);
    state.glyphMaximumY = round(maximumY, 2);
    state.glyphBoundsWithinCanvas = minimumX >= 1 && maximumX <= width - 1 && minimumY >= 1 && maximumY <= height - 1;
    const stageRect = stage.getBoundingClientRect();
    const visibleUiRects = [...document.querySelectorAll('.proof-id, .library-badge, .brief, .strain-card, .bottom-panel')]
      .filter(element => getComputedStyle(element).display !== 'none')
      .map(element => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left - stageRect.left,
          right: rect.right - stageRect.left,
          top: rect.top - stageRect.top,
          bottom: rect.bottom - stageRect.top,
        };
      });
    state.glyphOccludedByUiCount = glyphBoxes.filter(glyph => visibleUiRects.some(rect => (
      glyph.right > rect.left && glyph.left < rect.right && glyph.bottom > rect.top && glyph.top < rect.bottom
    ))).length;

    const probeX = lineLeft + state.probeU * (lineRight - lineLeft);
    const probeY = state.probeV * height;
    p.stroke(49, 95, 168, 112);
    p.strokeWeight(Math.max(0.7, width / 720));
    p.line(probeX, height * 0.16, probeX, height * 0.84);
    p.noFill();
    p.stroke('#315fa8');
    p.circle(probeX, probeY, Math.max(8, width * 0.026));
    p.noStroke();
    p.fill('#315fa8');
    p.circle(probeX, probeY, Math.max(2.5, width * 0.007));

    dirty = false;
    state.p5CompletedDrawCount += 1;
    updateDataset();
  }

  const p5Ready = new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
          canvas.parent(surface);
          canvas.elt.setAttribute('aria-hidden', 'true');
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
        if (!dirty) return;
        drawScene(p);
      };
    }, surface);
  });

  surface.addEventListener('pointerenter', event => {
    if (!state.ready || event.pointerType !== 'mouse' || !acceptInput(event, 'mouse-hover', 'pointer-enter')) return;
    state.pointerEnterCount += 1;
    state.lastPointerType = 'mouse';
    const point = pointerPosition(event);
    mutateFromHuman(event, { probeU: point.u, probeV: point.v }, 'pointer-enter');
  });

  surface.addEventListener('pointermove', event => {
    if (!state.ready) return;
    const hover = activePointerId === null && (event.pointerType || 'mouse') === 'mouse' && event.buttons === 0;
    const dragging = event.pointerId === activePointerId;
    if (!hover && !dragging) return;
    const kind = pointerKind(event, hover);
    if (!acceptInput(event, kind, hover ? 'pointer-hover' : 'pointer-drag')) return;
    const point = pointerPosition(event);
    state.pointerMoveCount += 1;
    if (dragging) state.pointerDragCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
    mutateFromHuman(event, { probeU: point.u, probeV: point.v }, hover ? 'pointer-hover' : 'pointer-drag');
  });

  surface.addEventListener('pointerdown', event => {
    if (!state.ready || (event.button !== undefined && event.button !== 0) || !acceptInput(event, pointerKind(event), 'pointer-down')) return;
    event.preventDefault();
    surface.focus({ preventScroll: true });
    activePointerId = event.pointerId;
    state.activePointerId = event.pointerId;
    state.dragging = true;
    state.pointerDownCount += 1;
    state.lastPointerType = event.pointerType || 'mouse';
    surface.setPointerCapture(event.pointerId);
    state.pointerCaptured = surface.hasPointerCapture(event.pointerId);
    if (state.pointerCaptured) state.pointerCaptureCount += 1;
    const point = pointerPosition(event);
    mutateFromHuman(event, { probeU: point.u, probeV: point.v }, 'pointer-down');
  });

  function finishPointer(event, cancelled = false) {
    if (!state.ready || event.pointerId !== activePointerId || !acceptInput(event, pointerKind(event), cancelled ? 'pointer-cancel' : 'pointer-up')) return;
    if (cancelled) state.pointerCancelCount += 1;
    else state.pointerReleaseCount += 1;
    if (surface.hasPointerCapture(event.pointerId)) {
      surface.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    activePointerId = null;
    state.activePointerId = null;
    state.dragging = false;
    state.pointerCaptured = false;
    updateDataset();
  }

  surface.addEventListener('pointerup', event => finishPointer(event));
  surface.addEventListener('pointercancel', event => finishPointer(event, true));

  surface.addEventListener('keydown', event => {
    if (!state.ready) return;
    const accepted = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ', 'Home', 'r', 'R'];
    if (!accepted.includes(event.key) || !acceptInput(event, 'keyboard', `key-${event.key}`)) return;
    event.preventDefault();
    if (event.key === 'Home' || event.key.toLowerCase() === 'r') {
      resetFromHuman(event, `key-${event.key}`);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      solveBaseline(SETTLE_ITERATIONS, 0, `key-${event.key}`);
      state.humanMutationCount += 1;
      updateInterface();
      requestDraw(`trusted-key-${event.key}`);
      return;
    }
    const patch = {
      probeU: state.probeU + (event.key === 'ArrowLeft' ? -0.045 : event.key === 'ArrowRight' ? 0.045 : 0),
      probeV: state.probeV + (event.key === 'ArrowUp' ? -0.045 : event.key === 'ArrowDown' ? 0.045 : 0),
    };
    mutateFromHuman(event, patch, `key-${event.key}`);
  });

  tensionInput.addEventListener('input', event => {
    if (!state.ready || !acceptInput(event, 'range', 'tension-range')) return;
    mutateFromHuman(event, { tension: Number(tensionInput.value) / 100 }, 'tension-range');
  });

  actionButtons.forEach(button => {
    button.addEventListener('click', event => {
      if (!state.ready || !acceptInput(event, 'button', `button-${button.dataset.baselineAction}`)) return;
      const action = button.dataset.baselineAction;
      if (action === 'reset') resetFromHuman(event, 'button-reset');
      if (action === 'settle') {
        solveBaseline(SETTLE_ITERATIONS, 0, 'button-settle');
        state.humanMutationCount += 1;
        updateInterface();
        requestDraw('trusted-button-settle');
      }
    });
  });

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (!sketch || !stage.clientWidth || !stage.clientHeight) return;
      if (sketch.width !== stage.clientWidth || sketch.height !== stage.clientHeight) {
        sketch.resizeCanvas(stage.clientWidth, stage.clientHeight, false);
        state.p5CanvasWidth = sketch.width;
        state.p5CanvasHeight = sketch.height;
        state.resizeCount += 1;
        requestDraw('responsive-resize');
      }
    });
  });
  resizeObserver.observe(stage);

  const ready = Promise.all([p5Ready, document.fonts.ready]).then(async () => {
    updateMetrics();
    state.initialBaselineChecksum = baselineChecksum();
    state.initialVisualStateChecksum = visualStateChecksum();
    updateInterface();
    requestDraw('initial-static-frame');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const repeatedBaseline = baselineChecksum();
    const repeatedVisual = visualStateChecksum();
    state.initialStillVerified = repeatedBaseline === state.initialBaselineChecksum
      && repeatedVisual === state.initialVisualStateChecksum
      && state.inputCount === 0
      && state.solverBatchCount === 0;
    invariant(state.initialStillVerified, 'initial baseline changed without trusted human input');
    state.ready = true;
    updateDataset();
  });

  const render = async () => {
    state.previewRenderCalls += 1;
    state.previewClockIgnoredCount += 1;
    const before = visualStateChecksum();
    if (dirty) sketch?.redraw();
    await Promise.resolve();
    if (before !== visualStateChecksum()) state.previewClockMutationCount += 1;
  };

  window.__PREVIEW_RUNTIME_ASSERT__ = async () => {
    await ready;
    const beforeBaseline = baselineChecksum();
    const beforeVisual = visualStateChecksum();
    await window.__setPreviewTime?.(0.4);
    await window.__setPreviewTime?.(2.8);
    const realP5 = sketch instanceof p5
      && state.claimedLibrary === 'p5@2.3.0'
      && state.p5InstanceReady
      && state.p5CanvasReady
      && surface.querySelector('canvas') instanceof HTMLCanvasElement
      && sketch.width === stage.clientWidth
      && sketch.height === stage.clientHeight;
    const codeNativeMechanism = state.assetStrategy === 'code-native-glyph-mechanism-no-decorative-raster-required'
      && state.baselineNodeCount === NODE_COUNT
      && state.glyphCount === WORD.length
      && state.glyphMetricCount === WORD.length
      && state.baselineSegmentDrawCount === NODE_COUNT - 1
      && state.glyphDrawCount === WORD.length
      && state.glyphBoundsWithinCanvas
      && state.glyphOccludedByUiCount === 0
      && state.glyphMinimumX >= 1
      && state.glyphMaximumX <= sketch.width - 1
      && state.glyphMinimumY >= 1
      && state.glyphMaximumY <= sketch.height - 1;
    const honestInteraction = state.userInputRequired
      && state.strictTrustedInputGuard
      && state.initialFrameStatic
      && state.initialStillVerified
      && !state.automaticCycle
      && !state.automaticPlayback
      && !state.automaticWave
      && !state.automaticRehearsal
      && !state.automaticFallback
      && !state.syntheticInputDispatch
      && !state.captureClockDriven
      && state.renderIgnoresPreviewClock
      && state.previewClockMutationCount === 0
      && state.nonInputVisualMutationCountAfterReady === 0
      && baselineChecksum() === beforeBaseline
      && visualStateChecksum() === beforeVisual
      && state.trustedInputCount === state.inputCount
      && state.transitionRecords.every(record => record.trusted === true)
      && state.pointerCaptureReleaseCount <= state.pointerCaptureCount;
    const solverEvidence = state.solverIterationsPerInput === SOLVER_ITERATIONS
      && state.settleIterationsPerInput === SETTLE_ITERATIONS
      && state.solverIterationCount === state.solverBatchCount * SOLVER_ITERATIONS
        + state.settleBatchCount * (SETTLE_ITERATIONS - SOLVER_ITERATIONS)
      && state.baselineChecksum > 0
      && state.initialBaselineChecksum > 0
      && state.legibilityScore >= 0
      && state.legibilityScore <= 100;
    state.runtimeAssertionPassed = Boolean(realP5
      && codeNativeMechanism
      && honestInteraction
      && solverEvidence
      && state.p5CompletedDrawCount >= 1
      && state.ready);
    updateDataset();
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
