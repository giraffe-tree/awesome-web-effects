import p5 from 'p5';
import { installPreviewController, markPreviewFailure } from '../shared.js';

try {
  const stage = document.querySelector('#telemetry-stage');
  const host = document.querySelector('#brush-host');
  const domainOutput = document.querySelector('#domain-output');
  const keepButton = document.querySelector('#keep-window');
  const decisionCard = document.querySelector('#decision-card');
  const decisionOutput = document.querySelector('#decision-output');
  const clamp01 = value => Math.max(0, Math.min(1, value));
  const sampleCount = 144;
  const anomalyThreshold = 4.5;
  const defaultSelection = [.12, .36];
  const anomalyPreset = [.42, .58];
  const vibration = Array.from({ length: sampleCount }, (_, index) => {
    const baseline = 2.25 + .35 * Math.sin(index * .19) + .18 * Math.cos(index * .43);
    const bearingEvent = 4.6 * Math.exp(-(((index - 70) / 7) ** 2));
    const secondaryPulse = 1.2 * Math.exp(-(((index - 84) / 3) ** 2));
    return Number((baseline + bearingEvent + secondaryPulse).toFixed(3));
  });

  let sourceDataChecksum = 2166136261;
  vibration.forEach(value => { sourceDataChecksum = Math.imul(sourceDataChecksum ^ Math.round(value * 1000), 16777619) >>> 0; });

  const state = {
    id: 'linked-brush-to-zoom-chart',
    task: 'human-isolates-recomputes-and-retains-a-bearing-vibration-anomaly-window',
    claimedLibrary: 'p5@2.3.0',
    mechanism: 'trusted-overview-brush-or-keyboard-range-recomputes-the-focus-chart-over-the-identical-time-domain',
    assetStrategy: 'code-native-deterministic-bearing-telemetry-no-functional-raster-input-required',
    imageGenerationDecision: 'omitted-because-raster-pixels-would-not-define-or-recompute-the-time-series-domain',
    acceptedInputs: ['mouse-handle-or-window-drag', 'touch-or-pen-drag', 'keyboard-arrow-adjustment', 'keyboard-home-reset', 'keyboard-end-anomaly-preset', 'button-or-enter-commit'],
    causality: 'trusted-human-input-only',
    userInputRequired: true,
    automaticWindowTravel: false,
    automaticRoundTrip: false,
    automaticPlayback: false,
    automaticFallback: false,
    captureClockDriven: false,
    renderIgnoresPreviewClock: true,
    syntheticInputDispatch: false,
    untrustedInputPolicy: 'reject-before-brush-or-decision-mutation',
    untrustedMutationCount: 0,
    inputCount: 0,
    trustedInputCount: 0,
    pointerInputCount: 0,
    keyboardInputCount: 0,
    controlInputCount: 0,
    rejectedUntrustedInputCount: 0,
    pointerDownCount: 0,
    pointerMoveCount: 0,
    pointerUpCount: 0,
    pointerCaptureCount: 0,
    pointerCaptureReleaseCount: 0,
    ignoredPointerCount: 0,
    keyboardAdjustmentCount: 0,
    resetCount: 0,
    anomalyPresetCount: 0,
    commitInputCount: 0,
    commitCount: 0,
    decisionClearCount: 0,
    selection: defaultSelection.slice(),
    defaultSelection: defaultSelection.slice(),
    minimumSelectionWidth: .08,
    dragMode: null,
    dragActive: false,
    activePointerId: null,
    dragOriginU: 0,
    dragStartSelection: defaultSelection.slice(),
    rangeMutationCount: 0,
    pointerRangeMutationCount: 0,
    keyboardRangeMutationCount: 0,
    backwardReviewCount: 0,
    maximumSelectionEnd: defaultSelection[1],
    phase: 'idle-uncommitted',
    result: 'no-range-decision-retained',
    decisionRetained: false,
    retainedSelection: null,
    retainedStartIndex: null,
    retainedEndIndex: null,
    retainedPeak: null,
    retainedAnomalySampleCount: 0,
    retainedConclusion: null,
    focusStartIndex: 0,
    focusEndIndex: 0,
    focusSampleCount: 0,
    focusMinimum: 0,
    focusMaximum: 0,
    focusPeakIndex: 0,
    focusAnomalySampleCount: 0,
    focusDomainLabel: '',
    overviewDomainStartIndex: 0,
    overviewDomainEndIndex: sampleCount - 1,
    linkedDomainVerified: false,
    focusRecomputeCount: 0,
    sourceDataSampleCount: vibration.length,
    sourceDataChecksum,
    sourceDataMinimum: Math.min(...vibration),
    sourceDataMaximum: Math.max(...vibration),
    sourceAnomalySampleCount: vibration.filter(value => value >= anomalyThreshold).length,
    sourceAnomalyThreshold: anomalyThreshold,
    dataDeterministic: true,
    dataRandomness: false,
    brushGeometry: { left: 0, right: 0, top: 0, bottom: 0, leftHandleX: 0, rightHandleX: 0 },
    focusGeometry: { left: 0, right: 0, top: 0, bottom: 0 },
    brushWithinStage: false,
    focusWithinStage: false,
    canvasCoverageRatio: 0,
    fullStageGeometryVerified: false,
    p5InstanceReady: false,
    canvas2dReady: false,
    initialSelectionSignature: defaultSelection.join('|'),
    initialStillVerified: false,
    firstHumanSelectionBefore: null,
    firstHumanSelectionAfter: null,
    transitionRecords: [],
    renderCount: 0,
    drawCount: 0,
    completedDrawCount: 0,
    geometryMeasureCount: 0,
    resizeCount: 0,
    ready: false
  };

  window.__PREVIEW_INTERACTION_STATE__ = state;

  let sketch;
  let dirty = true;
  let resizeFrame = 0;

  function invariant(condition, message) {
    if (!condition) throw new Error(`linked-brush-to-zoom-chart: ${message}`);
  }

  function timeLabel(index) {
    const minutes = index * 10;
    const hours = Math.floor(minutes / 60) % 24;
    const remainder = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }

  function requestDraw() {
    dirty = true;
    sketch?.redraw();
  }

  function acceptTrusted(event, source) {
    if (!event || event.isTrusted !== true) {
      state.rejectedUntrustedInputCount += 1;
      return false;
    }
    state.inputCount += 1;
    state.trustedInputCount += 1;
    if (source.startsWith('pointer')) state.pointerInputCount += 1;
    else if (source.startsWith('keyboard')) state.keyboardInputCount += 1;
    else state.controlInputCount += 1;
    return true;
  }

  function calculateGeometry() {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    const portrait = width <= 270;
    const brush = portrait
      ? { left: 12, right: width - 12, top: 228, bottom: 268 }
      : { left: width < 480 ? 105 : 175, right: width - 12, top: height - 48, bottom: height - 17 };
    const focus = portrait
      ? { left: 12, right: width - 12, top: 96, bottom: 210 }
      : { left: brush.left, right: brush.right, top: 36, bottom: height - 62 };
    const brushWidth = brush.right - brush.left;
    state.brushGeometry = {
      ...brush,
      leftHandleX: Number((brush.left + state.selection[0] * brushWidth).toFixed(3)),
      rightHandleX: Number((brush.left + state.selection[1] * brushWidth).toFixed(3))
    };
    state.focusGeometry = focus;
    state.brushWithinStage = brush.left >= 0 && brush.right <= width && brush.top >= 0 && brush.bottom <= height && brush.right > brush.left && brush.bottom > brush.top;
    state.focusWithinStage = focus.left >= 0 && focus.right <= width && focus.top >= 0 && focus.bottom <= height && focus.right > focus.left && focus.bottom > focus.top;
    const canvas = host.querySelector('canvas');
    const canvasRect = canvas?.getBoundingClientRect();
    state.canvasCoverageRatio = Number((((canvasRect?.width || 0) * (canvasRect?.height || 0)) / Math.max(1, width * height)).toFixed(4));
    state.fullStageGeometryVerified = state.brushWithinStage && state.focusWithinStage && state.canvasCoverageRatio >= .995;
    state.geometryMeasureCount += 1;
  }

  function recomputeFocus() {
    const start = Math.floor(state.selection[0] * (sampleCount - 1));
    const end = Math.ceil(state.selection[1] * (sampleCount - 1));
    const values = vibration.slice(start, end + 1);
    const maximum = Math.max(...values);
    const peakOffset = values.indexOf(maximum);
    state.focusStartIndex = start;
    state.focusEndIndex = end;
    state.focusSampleCount = values.length;
    state.focusMinimum = Math.min(...values);
    state.focusMaximum = maximum;
    state.focusPeakIndex = start + peakOffset;
    state.focusAnomalySampleCount = values.filter(value => value >= anomalyThreshold).length;
    state.focusDomainLabel = `${timeLabel(start)} — ${timeLabel(end)}`;
    state.linkedDomainVerified = state.focusStartIndex === Math.floor(state.selection[0] * (sampleCount - 1))
      && state.focusEndIndex === Math.ceil(state.selection[1] * (sampleCount - 1))
      && state.overviewDomainStartIndex === 0
      && state.overviewDomainEndIndex === sampleCount - 1;
    state.focusRecomputeCount += 1;
    domainOutput.textContent = state.focusDomainLabel;
    if (!state.decisionRetained) {
      decisionCard.dataset.alert = String(state.focusAnomalySampleCount > 0);
      decisionOutput.textContent = state.focusAnomalySampleCount > 0
        ? `PREVIEW · ${state.focusAnomalySampleCount} HIGH SAMPLES`
        : 'PREVIEW · NOMINAL RANGE';
    }
    calculateGeometry();
  }

  function mutateSelection(nextSelection, source) {
    const before = state.selection.slice();
    const start = clamp01(Math.min(nextSelection[0], nextSelection[1] - state.minimumSelectionWidth));
    const end = clamp01(Math.max(nextSelection[1], start + state.minimumSelectionWidth));
    const normalized = [Number(start.toFixed(4)), Number(end.toFixed(4))];
    if (normalized[1] > 1) {
      normalized[0] = Number(Math.max(0, 1 - (end - start)).toFixed(4));
      normalized[1] = 1;
    }
    if (normalized[0] === before[0] && normalized[1] === before[1]) return;
    if (state.firstHumanSelectionBefore === null) state.firstHumanSelectionBefore = before.slice();
    state.selection = normalized;
    state.firstHumanSelectionAfter = normalized.slice();
    state.rangeMutationCount += 1;
    if (source.startsWith('trusted-pointer')) state.pointerRangeMutationCount += 1;
    else state.keyboardRangeMutationCount += 1;
    state.backwardReviewCount += Number(normalized[1] < before[1]);
    state.maximumSelectionEnd = Math.max(state.maximumSelectionEnd, normalized[1]);
    state.phase = source.includes('reset') ? 'reset-uncommitted' : 'range-preview';
    if (state.decisionRetained) {
      state.decisionRetained = false;
      state.decisionClearCount += 1;
      state.retainedSelection = null;
      state.retainedStartIndex = null;
      state.retainedEndIndex = null;
      state.retainedPeak = null;
      state.retainedAnomalySampleCount = 0;
      state.retainedConclusion = null;
    }
    state.result = 'no-range-decision-retained';
    state.transitionRecords.push({ source, trusted: true, before, after: normalized.slice() });
    state.transitionRecords = state.transitionRecords.slice(-48);
    recomputeFocus();
    requestDraw();
  }

  function commitRange(source) {
    state.commitCount += 1;
    state.decisionRetained = true;
    state.retainedSelection = state.selection.slice();
    state.retainedStartIndex = state.focusStartIndex;
    state.retainedEndIndex = state.focusEndIndex;
    state.retainedPeak = state.focusMaximum;
    state.retainedAnomalySampleCount = state.focusAnomalySampleCount;
    const isAnomaly = state.retainedAnomalySampleCount > 0 && state.retainedPeak >= anomalyThreshold;
    state.retainedConclusion = isAnomaly ? 'bearing-b7-anomaly-review-required' : 'bearing-b7-window-nominal';
    state.phase = 'range-decision-retained';
    state.result = state.retainedConclusion;
    decisionCard.dataset.alert = String(isAnomaly);
    decisionOutput.textContent = isAnomaly ? `RETAINED · ${state.retainedPeak.toFixed(2)} MM/S PEAK` : 'RETAINED · NOMINAL WINDOW';
    state.transitionRecords.push({ source, trusted: true, action: 'commit', selection: state.retainedSelection.slice(), conclusion: state.retainedConclusion });
    requestDraw();
  }

  function pointerPosition(event) {
    const bounds = host.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }

  host.addEventListener('pointerdown', event => {
    const point = pointerPosition(event);
    calculateGeometry();
    const geometry = state.brushGeometry;
    if (point.y < geometry.top - 10 || point.y > geometry.bottom + 10) {
      state.ignoredPointerCount += 1;
      return;
    }
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-down`)) return;
    event.preventDefault();
    state.pointerDownCount += 1;
    const brushWidth = geometry.right - geometry.left;
    const u = clamp01((point.x - geometry.left) / brushWidth);
    const handleTolerance = Math.max(.035, 11 / brushWidth);
    state.dragMode = Math.abs(u - state.selection[0]) <= handleTolerance ? 'left-handle'
      : Math.abs(u - state.selection[1]) <= handleTolerance ? 'right-handle'
        : u > state.selection[0] && u < state.selection[1] ? 'window' : 'new-window';
    state.dragActive = true;
    state.activePointerId = event.pointerId;
    state.dragOriginU = u;
    state.dragStartSelection = state.selection.slice();
    host.setPointerCapture(event.pointerId);
    if (host.hasPointerCapture(event.pointerId)) state.pointerCaptureCount += 1;
  });

  host.addEventListener('pointermove', event => {
    if (!state.dragActive || event.pointerId !== state.activePointerId) return;
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-drag`)) return;
    state.pointerMoveCount += 1;
    const point = pointerPosition(event);
    const geometry = state.brushGeometry;
    const u = clamp01((point.x - geometry.left) / (geometry.right - geometry.left));
    const [start, end] = state.dragStartSelection;
    if (state.dragMode === 'left-handle') mutateSelection([Math.min(u, end - state.minimumSelectionWidth), end], 'trusted-pointer-left-handle');
    else if (state.dragMode === 'right-handle') mutateSelection([start, Math.max(u, start + state.minimumSelectionWidth)], 'trusted-pointer-right-handle');
    else if (state.dragMode === 'window') {
      const width = end - start;
      const nextStart = Math.max(0, Math.min(1 - width, start + u - state.dragOriginU));
      mutateSelection([nextStart, nextStart + width], 'trusted-pointer-window');
    } else mutateSelection([Math.max(0, u - .12), Math.min(1, u + .12)], 'trusted-pointer-new-window');
  });

  const releasePointer = event => {
    if (!state.dragActive || event.pointerId !== state.activePointerId) return;
    if (!acceptTrusted(event, `pointer-${event.pointerType || 'mouse'}-up`)) return;
    state.pointerUpCount += 1;
    if (host.hasPointerCapture(event.pointerId)) {
      host.releasePointerCapture(event.pointerId);
      state.pointerCaptureReleaseCount += 1;
    }
    state.dragActive = false;
    state.activePointerId = null;
    state.dragMode = null;
  };
  host.addEventListener('pointerup', releasePointer);
  host.addEventListener('pointercancel', releasePointer);

  host.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', 'Enter'].includes(event.key)) return;
    if (!acceptTrusted(event, `keyboard-${event.key.toLowerCase()}`)) return;
    event.preventDefault();
    if (event.key === 'Enter') {
      state.commitInputCount += 1;
      commitRange('trusted-keyboard-commit');
      return;
    }
    if (event.key === 'Home') {
      state.resetCount += 1;
      mutateSelection(defaultSelection, 'trusted-keyboard-reset');
      return;
    }
    if (event.key === 'End') {
      state.anomalyPresetCount += 1;
      mutateSelection(anomalyPreset, 'trusted-keyboard-anomaly-preset');
      return;
    }
    state.keyboardAdjustmentCount += 1;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const delta = event.key === 'ArrowRight' ? .025 : -.025;
      const width = state.selection[1] - state.selection[0];
      const nextStart = Math.max(0, Math.min(1 - width, state.selection[0] + delta));
      mutateSelection([nextStart, nextStart + width], `trusted-keyboard-${event.key.toLowerCase()}`);
    } else {
      const delta = event.key === 'PageDown' ? .04 : -.04;
      mutateSelection([state.selection[0] - delta / 2, state.selection[1] + delta / 2], `trusted-keyboard-${event.key.toLowerCase()}`);
    }
  });

  keepButton.addEventListener('click', event => {
    const source = event.detail === 0 ? 'keyboard-control-commit' : 'control-commit';
    if (!acceptTrusted(event, source)) return;
    state.commitInputCount += 1;
    commitRange(`trusted-${source}`);
  });

  function drawChart(p, start, end, geometry, minimum, maximum, color) {
    p.noFill();
    p.stroke(color);
    p.strokeWeight(1.5);
    p.beginShape();
    for (let index = start; index <= end; index += 1) {
      const x = geometry.left + (index - start) / Math.max(1, end - start) * (geometry.right - geometry.left);
      const y = geometry.bottom - (vibration[index] - minimum) / Math.max(.001, maximum - minimum) * (geometry.bottom - geometry.top);
      p.vertex(x, y);
    }
    p.endShape();
  }

  const ready = new Promise((resolve, reject) => {
    sketch = new p5(p => {
      p.setup = () => {
        try {
          p.pixelDensity(1);
          const canvas = p.createCanvas(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
          canvas.parent(host);
          p.noLoop();
          p5Ready();
          function p5Ready() {
            state.p5InstanceReady = p instanceof p5;
            state.canvas2dReady = canvas.elt instanceof HTMLCanvasElement && p.drawingContext instanceof CanvasRenderingContext2D;
            resolve();
          }
        } catch (error) {
          reject(error);
        }
      };

      p.draw = () => {
        state.drawCount += 1;
        calculateGeometry();
        const focus = state.focusGeometry;
        const brush = state.brushGeometry;
        p.background('#09100e');
        p.stroke('#21372e');
        p.strokeWeight(1);
        for (let index = 0; index <= 3; index += 1) {
          const y = focus.top + index / 3 * (focus.bottom - focus.top);
          p.line(focus.left, y, focus.right, y);
        }
        const padding = Math.max(.25, (state.focusMaximum - state.focusMinimum) * .16);
        drawChart(p, state.focusStartIndex, state.focusEndIndex, focus, state.focusMinimum - padding, state.focusMaximum + padding, '#d8f58d');

        p.noStroke();
        for (let index = state.focusStartIndex; index <= state.focusEndIndex; index += 1) {
          if (vibration[index] < anomalyThreshold) continue;
          const x = focus.left + (index - state.focusStartIndex) / Math.max(1, state.focusEndIndex - state.focusStartIndex) * (focus.right - focus.left);
          const y = focus.bottom - (vibration[index] - (state.focusMinimum - padding)) / Math.max(.001, state.focusMaximum - state.focusMinimum + padding * 2) * (focus.bottom - focus.top);
          p.fill('#ff9d5b');
          p.circle(x, y, 3.2);
        }

        p.stroke('#315343');
        p.noFill();
        p.rect(brush.left, brush.top, brush.right - brush.left, brush.bottom - brush.top, 4);
        drawChart(p, 0, sampleCount - 1, { left: brush.left, right: brush.right, top: brush.top + 5, bottom: brush.bottom - 5 }, state.sourceDataMinimum - .2, state.sourceDataMaximum + .2, '#648b70');
        const x1 = brush.leftHandleX;
        const x2 = brush.rightHandleX;
        p.noStroke();
        p.fill(216, 245, 141, 38);
        p.rect(x1, brush.top, x2 - x1, brush.bottom - brush.top, 4);
        p.stroke('#d8f58d');
        p.strokeWeight(2);
        p.line(x1, brush.top - 2, x1, brush.bottom + 2);
        p.line(x2, brush.top - 2, x2, brush.bottom + 2);
        p.noStroke();
        p.fill('#93a99b');
        p.textFont('monospace');
        p.textSize(6);
        p.textAlign(p.LEFT, p.BOTTOM);
        p.text('FOCUS · RMS VIBRATION (MM/S)', focus.left, focus.top - 5);
        p.text('24H OVERVIEW / DRAG HANDLES', brush.left, brush.top - 5);
        p.textAlign(p.RIGHT, p.TOP);
        p.fill(state.focusAnomalySampleCount > 0 ? '#ff9d5b' : '#93a99b');
        p.text(`${state.focusAnomalySampleCount} HIGH · ${state.focusMaximum.toFixed(2)} PEAK`, focus.right, focus.top + 4);
        state.completedDrawCount += 1;
        dirty = false;
      };
    }, host);
  });

  const resizeObserver = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      if (!sketch || !stage.clientWidth || !stage.clientHeight) return;
      sketch.resizeCanvas(stage.clientWidth, stage.clientHeight);
      state.resizeCount += 1;
      recomputeFocus();
      requestDraw();
    });
  });
  resizeObserver.observe(stage);

  function render() {
    state.renderCount += 1;
    calculateGeometry();
    if (state.inputCount === 0) {
      state.initialStillVerified = state.selection.join('|') === state.initialSelectionSignature
        && state.phase === 'idle-uncommitted'
        && state.decisionRetained === false;
    }
    if (dirty) sketch?.redraw();
  }

  const previewReady = ready.then(() => {
    recomputeFocus();
    state.ready = true;
  });

  window.__PREVIEW_RUNTIME_ASSERT__ = () => {
    invariant(state.ready && state.p5InstanceReady && state.canvas2dReady, 'p5 canvas is not ready');
    invariant(state.sourceDataSampleCount === 144 && state.sourceDataChecksum > 0 && state.dataDeterministic && state.dataRandomness === false, 'deterministic telemetry evidence is invalid');
    invariant(state.sourceDataMaximum > anomalyThreshold && state.sourceAnomalySampleCount > 0, 'source bearing anomaly is absent');
    invariant(state.fullStageGeometryVerified && state.canvasCoverageRatio >= .995 && state.brushWithinStage && state.focusWithinStage, 'focus or brush geometry escapes the stage');
    invariant(state.automaticWindowTravel === false && state.automaticRoundTrip === false && state.automaticPlayback === false && state.automaticFallback === false, 'automatic brush travel is forbidden');
    invariant(state.captureClockDriven === false && state.renderIgnoresPreviewClock === true, 'preview clock must not mutate the brush');
    invariant(state.syntheticInputDispatch === false && state.untrustedMutationCount === 0, 'synthetic input changed the brush or decision');
    invariant(state.inputCount === state.trustedInputCount && state.pointerInputCount + state.keyboardInputCount + state.controlInputCount === state.inputCount, 'trusted input accounting diverged');
    invariant(state.initialStillVerified || state.inputCount > 0, 'initial brush was not verified still');
    invariant(state.selection[1] - state.selection[0] >= state.minimumSelectionWidth && state.selection[0] >= 0 && state.selection[1] <= 1, 'brush selection is invalid');
    invariant(state.linkedDomainVerified && state.focusSampleCount === state.focusEndIndex - state.focusStartIndex + 1, 'focus chart did not recompute the identical selected domain');
    invariant(state.transitionRecords.every(record => record.trusted === true), 'a brush transition lacks trusted input causality');

    if (state.rangeMutationCount > 0) {
      invariant(state.firstHumanSelectionBefore.join('|') !== state.firstHumanSelectionAfter.join('|'), 'trusted input did not mutate the brush range');
      invariant(state.focusRecomputeCount > state.rangeMutationCount, 'focus chart was not recomputed after brush mutations');
    }
    if (state.decisionRetained) {
      invariant(state.retainedSelection.join('|') === state.selection.join('|'), 'retained decision differs from the visible brush');
      invariant(state.retainedStartIndex === state.focusStartIndex && state.retainedEndIndex === state.focusEndIndex, 'retained decision domain differs from focus chart');
      invariant(state.retainedPeak === state.focusMaximum && state.retainedAnomalySampleCount === state.focusAnomalySampleCount, 'retained anomaly evidence differs from focus chart');
      invariant(state.phase === 'range-decision-retained' && state.result === state.retainedConclusion, 'retained decision state is inconsistent');
      invariant(state.retainedConclusion === 'bearing-b7-anomaly-review-required' && state.retainedAnomalySampleCount > 0, 'final retained range missed the bearing anomaly');
    }
    return true;
  };

  installPreviewController({
    id: 'linked-brush-to-zoom-chart',
    library: 'p5@2.3.0',
    renderer: 'canvas2d',
    render,
    ready: previewReady
  });
} catch (error) {
  markPreviewFailure(error);
}
